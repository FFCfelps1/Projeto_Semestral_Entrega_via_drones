import axios from "axios"

export const criarPedidoEntrega = async ({ baseUrl, pedido }) => {
  if (!baseUrl) {
    return {
      origem: "local",
      pedido,
    }
  }

  const response = await axios.post(`${baseUrl}/pedidos`, pedido)
  return response.data
}
