import axios from "axios"

// Lê a URL base do arquivo .env
// Se não encontrar, usa o localhost:3005 como padrão
const BASE_URL = import.meta.env.VITE_PEDIDOS_ENTREGA_SERVICE_URL || "http://localhost:3005"

// Cria um cliente axios com a URL base configurada
// Todas as requisições feitas com "api" já usam essa URL automaticamente
const api = axios.create({
  baseURL: BASE_URL
})

// Envia os dados do pedido para o back via POST /pedidos
// Retorna os dados da resposta (o pedido criado com id, status, preço, etc)
export const criarPedidoEntrega = async (pedido) => {
  const response = await api.post("/pedidos", pedido)
  return response.data
}

// Confirma um pedido existente via POST /pedidos/:id/confirmar
// Muda o status de rascunho para confirmado
export const confirmarPedido = async (id) => {
  const response = await api.post(`/pedidos/${id}/confirmar`)
  return response.data
}

// Lista os pedidos via GET /pedidos
// Aceita filtros opcionais por usuarioId e status
// Exemplo: listarPedidos({ status: "rascunho" })
export const listarPedidos = async (filtros = {}) => {
  const params = new URLSearchParams(filtros)
  const response = await api.get(`/pedidos?${params}`)
  return response.data
}

