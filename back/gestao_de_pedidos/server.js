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
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", servico: "gestao_pedidos" });
});

app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});
