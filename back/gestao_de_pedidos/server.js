require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;


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
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", servico: "gestao_pedidos" });
});

// ─────────────────────────────────────────
// CRIAR PEDIDO
// ─────────────────────────────────────────
app.post("/pedidos", (req, res) => {
  const { item, peso, origem, destino, tipo, observacoes, usuarioId } = req.body;

   // Validação de campos obrigatórios
  if (!item || !peso || !origem || !destino || !tipo) {
    return res.status(400).json({
      erro: "Campos obrigatórios: item, peso, origem, destino, tipo",
    });
  }

  // Criação do novo pedido
  const novoPedido = {
    id: uuidv4(),
    item,
    peso,
    origem,
    destino,
    tipo,
    observacoes: observacoes || "",
    usuarioId: usuarioId || null,
    status: STATUS.RASCUNHO,
    /*new Date().toISOString() — gera a data/hora atual
    22:25 O new Date() cria um objeto com a data e hora atual. O .toISOString() converte esse objeto para uma string no formato padrão internacional:
    2026-05-19T22:35:10.123Z*/
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  pedidos.push(novoPedido);

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
    ...pedidos[index], // copia TUDO que já estava no pedido
    status: STATUS.CONFIRMADO,  // sobrescreve só o status
    atualizadoEm: new Date().toISOString(), // sobrescreve só o atualizadoEm
  };

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

  const { status } = req.body;

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

  const indexAtual = ordemStatus.indexOf(pedidos[index].status);
  const indexNovo = ordemStatus.indexOf(status);

  // Não permite voltar o status nem pular etapas
  if (indexNovo <= indexAtual && status !== STATUS.CANCELADO) {
    return res.status(400).json({
      erro: "Transição de status inválida",
    });
  }

  // Atualiza o status e registra o horário da mudança
  pedidos[index] = {
    ...pedidos[index],
    status,
    atualizadoEm: new Date().toISOString(),
  };

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
  

  // Retorna mensagem de sucesso com o pedido cancelado
  return res.json({
    mensagem: "Pedido cancelado com sucesso",
    pedido: pedidos[index],
  });
});

app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});
