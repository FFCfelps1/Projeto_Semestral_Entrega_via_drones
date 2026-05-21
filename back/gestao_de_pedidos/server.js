require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;
const BARRAMENTO_URL = process.env.BARRAMENTO_URL || "http://localhost:3001";

// Banco em memória (substituir por DB futuramente)
let pedidos = [];

// Status possíveis de um pedido
const STATUS = {
  RASCUNHO: "rascunho",
  CONFIRMADO: "confirmado",
  EM_PROCESSAMENTO: "em_processamento",
  EM_ROTA: "em_rota",
  ENTREGUE: "entregue",
  CANCELADO: "cancelado",
};

// ─────────────────────────────────────────
// CÁLCULO DE PREÇO
// ─────────────────────────────────────────
const calcularPreco = (peso, tipo) => {
  // Preço base fixo para qualquer entrega
  const precoBase = 10.00;

  // Taxa adicional por kg
  const taxaPorKg = 5.00;

  // Multiplicador por tipo de entrega:
  // expressa = 2x mais caro, padrão = preço normal, econômica = metade do preço
  const taxaTipo = {
    expressa: 2.0,
    padrao: 1.0,
    economica: 0.5,
  };

  // Se o tipo não existir, usa 1.0 como padrão (sem multiplicador)
  const multiplicador = taxaTipo[tipo] || 1.0;

  // Fórmula: (precoBase + peso * taxaPorKg) * multiplicador
  // .toFixed(2) garante que o resultado tenha 2 casas decimais (ex: 15.00)
  return ((precoBase + peso * taxaPorKg) * multiplicador).toFixed(2);
};

// ─────────────────────────────────────────
// CÁLCULO DE TEMPO ESTIMADO
// ─────────────────────────────────────────
const calcularTempo = (tipo) => {
  // Tempo estimado em minutos por tipo de entrega
  const tempoPorTipo = {
    expressa: 15,   // drone prioritário, entrega rápida
    padrao: 45,     // entrega normal
    economica: 90,  // entrega agendada, menor prioridade
  };

  // Se o tipo não existir, usa 45 minutos como padrão
  return tempoPorTipo[tipo] || 45;
};

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  // Retorna status ok e nome do serviço
  res.json({ status: "ok", servico: "gestao_pedidos" });
});

// ─────────────────────────────────────────
// CRIAR PEDIDO
// ─────────────────────────────────────────
app.post("/pedidos", (req, res) => {
  // Desestrutura os campos enviados pelo front no body da requisição
  const { item, peso, origem, destino, tipo, observacoes, usuarioId } = req.body;

  // Validação de campos obrigatórios — retorna 400 se algum estiver faltando
  if (!item || !peso || !origem || !destino || !tipo) {
    return res.status(400).json({
      erro: "Campos obrigatórios: item, peso, origem, destino, tipo",
    });
  }

  // Monta o objeto do novo pedido com todos os campos
  const novoPedido = {
    id: uuidv4(),                          // ID único gerado automaticamente
    item,
    peso,
    origem,
    destino,
    tipo,
    observacoes: observacoes || "",        // campo opcional, padrão vazio
    usuarioId: usuarioId || null,          // campo opcional, padrão null
    status: STATUS.RASCUNHO,              // todo pedido começa como rascunho
    precoEstimado: calcularPreco(peso, tipo), // calcula o preço com base no peso e tipo
    tempoEstimado: calcularTempo(tipo),   // calcula o tempo com base no tipo
     // Inicia o histórico com o status rascunho
    statusHistorico: [
      {
        status: STATUS.RASCUNHO,
        momento: new Date().toISOString(),
      },
    ],
    criadoEm: new Date().toISOString(),   // data/hora de criação
    atualizadoEm: new Date().toISOString(), // data/hora da última atualização
  };

  // Adiciona o pedido ao array em memória
  pedidos.push(novoPedido);

  // Notifica o barramento que um novo pedido foi criado
  axios.post(`${BARRAMENTO_URL}/eventos`, {
    tipo: "PEDIDO_CRIADO",
    payload: novoPedido,
 });


  // Retorna o pedido criado com status 201 (Created)
  return res.status(201).json(novoPedido);
});

// ─────────────────────────────────────────
// CONFIRMAR PEDIDO
// ─────────────────────────────────────────
app.post("/pedidos/:id/confirmar", (req, res) => {
  // Procura o índice do pedido no array pelo id passado na URL
  const index = pedidos.findIndex((p) => p.id === req.params.id);

  // Se não encontrou, retorna 404
  if (index === -1) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  // Só confirma se o pedido ainda estiver em rascunho
  // Evita confirmar um pedido que já foi confirmado, cancelado, etc.
  if (pedidos[index].status !== STATUS.RASCUNHO) {
    return res.status(400).json({ erro: "Apenas pedidos em rascunho podem ser confirmados" });
  }

  // Atualiza o status para confirmado e registra o horário da mudança
  // O ...pedidos[index] mantém todos os outros campos intactos
  pedidos[index] = {
    ...pedidos[index],
    status: STATUS.CONFIRMADO,
     // Adiciona o novo status ao histórico
    statusHistorico: [
      ...pedidos[index].statusHistorico,
      { status: STATUS.CONFIRMADO, momento: new Date().toISOString() },
    ],
    atualizadoEm: new Date().toISOString(),
  };

    // Notifica o barramento que o pedido foi confirmado
    axios.post(`${BARRAMENTO_URL}/eventos`, {
        tipo: "PEDIDO_CONFIRMADO",
        payload: pedidos[index],
    });

  // Retorna o pedido atualizado
  return res.json(pedidos[index]);
});

// ─────────────────────────────────────────
// LISTAR PEDIDOS
// ─────────────────────────────────────────
app.get("/pedidos", (req, res) => {
  // Pega os parâmetros passados na URL após o "?"
  // Exemplo: GET /pedidos?usuarioId=f47ac10b&status=em_rota
  const { usuarioId, status } = req.query;

  // Começa com todos os pedidos
  let resultado = pedidos;

  // Se passou usuarioId, filtra só os pedidos daquele usuário
  if (usuarioId) {
    resultado = resultado.filter((p) => p.usuarioId === usuarioId);
  }

  // Se passou status, filtra só os pedidos com aquele status
  if (status) {
    resultado = resultado.filter((p) => p.status === status);
  }

  // Retorna o resultado para o front
  return res.json(resultado);
});

// ─────────────────────────────────────────
// BUSCAR PEDIDO POR ID
// ─────────────────────────────────────────
app.get("/pedidos/:id", (req, res) => {
  // Procura o pedido no array pelo id passado na URL
  const pedido = pedidos.find((p) => p.id === req.params.id);

  // Se não encontrou, retorna 404
  if (!pedido) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  // Retorna o pedido encontrado
  return res.json(pedido);
});

// ─────────────────────────────────────────
// ATUALIZAR STATUS DO PEDIDO
// ─────────────────────────────────────────
app.patch("/pedidos/:id", (req, res) => {
  // Procura a posição do pedido no array pelo id passado na URL
  const index = pedidos.findIndex((p) => p.id === req.params.id);

  // Se não encontrou, retorna 404
  if (index === -1) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  const { status, observacoes } = req.body;

  // Valida se o status informado é um dos status permitidos
  const statusPermitidos = Object.values(STATUS);
  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({
      erro: `Status inválido. Use: ${statusPermitidos.join(", ")}`,
    });
  }

  // Define a ordem válida de transição de status
  const ordemStatus = [
    STATUS.RASCUNHO,
    STATUS.CONFIRMADO,
    STATUS.EM_PROCESSAMENTO,
    STATUS.EM_ROTA,
    STATUS.ENTREGUE,
  ];

  // Pega a posição do status atual e do novo status na ordem
  const indexAtual = ordemStatus.indexOf(pedidos[index].status);
  const indexNovo = ordemStatus.indexOf(status);

  // Não permite voltar o status nem pular etapas
  // Exceção: cancelado pode ser aplicado de qualquer status
  if (indexNovo <= indexAtual && status !== STATUS.CANCELADO) {
    return res.status(400).json({
      erro: "Transição de status inválida",
    });
  }

  // Atualiza o status e registra o horário da mudança
  pedidos[index] = {
    ...pedidos[index],
    status,
     // Adiciona o novo status ao histórico
    statusHistorico: [
      ...pedidos[index].statusHistorico,
      { status, momento: new Date().toISOString() },
    ],
    atualizadoEm: new Date().toISOString(),
  };

  // Notifica o barramento que o pedido foi atualizado
    axios.post(`${BARRAMENTO_URL}/eventos`, {
        tipo: "PEDIDO_ATUALIZADO",
        payload: pedidos[index],
    });


  // Retorna o pedido atualizado
  return res.json(pedidos[index]);
});

// ─────────────────────────────────────────
// CANCELAR PEDIDO
// ─────────────────────────────────────────
app.delete("/pedidos/:id", (req, res) => {
  // Procura a posição do pedido no array pelo id passado na URL
  const index = pedidos.findIndex((p) => p.id === req.params.id);

  // Se não encontrou, retorna 404
  if (index === -1) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  // Não permite cancelar pedido que já está em rota ou entregue
  if (
    pedidos[index].status === STATUS.EM_ROTA ||
    pedidos[index].status === STATUS.ENTREGUE
  ) {
    return res.status(400).json({
      erro: "Não é possível cancelar um pedido que já está em rota ou entregue",
    });
  }

  // Cancela o pedido atualizando o status
  pedidos[index] = {
    ...pedidos[index],
    status: STATUS.CANCELADO,
     // Registra o cancelamento no histórico
    statusHistorico: [
      ...pedidos[index].statusHistorico,
      { status: STATUS.CANCELADO, momento: new Date().toISOString() },
    ],
    atualizadoEm: new Date().toISOString(),
  };

  // Notifica o barramento que o pedido foi cancelado
    axios.post(`${BARRAMENTO_URL}/eventos`, {
        tipo: "PEDIDO_CANCELADO",
        payload: pedidos[index],
    });

  // Retorna mensagem de sucesso com o pedido cancelado
  return res.json({
    mensagem: "Pedido cancelado com sucesso",
    pedido: pedidos[index],
  });
});

// ─────────────────────────────────────────
// HISTÓRICO DE STATUS DO PEDIDO
// ─────────────────────────────────────────
app.get("/pedidos/:id/historico", (req, res) => {
  // Procura o pedido no array pelo id passado na URL
  const pedido = pedidos.find((p) => p.id === req.params.id);

  // Se não encontrou, retorna 404
  if (!pedido) {
    return res.status(404).json({ erro: "Pedido não encontrado" });
  }

  // Retorna apenas o histórico de status do pedido
  return res.json({
    pedidoId: pedido.id,
    item: pedido.item,
    statusAtual: pedido.status,
    historico: pedido.statusHistorico,
  });
});

// Inicia o servidor na porta definida no .env (ou 3005 como padrão)
// Quando o servidor estiver pronto, exibe uma mensagem no terminal confirmando
app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});