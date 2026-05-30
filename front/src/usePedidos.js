import { useState } from "react"
import { cancelarPedido, buscarHistorico } from "./pedidosEntregaService.js"

// Custom hook que centraliza a lógica de manipulação da lista de pedidos
// Separa a lógica de negócio da interface visual do PedidoPage
const usePedidos = () => {

  // Lista de pedidos da sessão
  const [pedidos, setPedidos] = useState([])

  // Filtro de status aplicado na lista
  const [filtroStatus, setFiltroStatus] = useState("")

  // ID do pedido com histórico aberto — null = nenhum
  const [pedidoHistoricoSelecionado, setPedidoHistoricoSelecionado] = useState(null)

  // Dados do histórico retornados pelo back
  const [dadosHistorico, setDadosHistorico] = useState(null)

  // Adiciona um novo pedido no início da lista
  const adicionarPedido = (pedido) => {
    setPedidos((atual) => [pedido, ...atual])
  }

  // Remove um pedido da lista pelo id
  const removerPedido = (pedidoId) => {
    setPedidos((atual) => atual.filter((p) => p.id !== pedidoId))
  }

  // Cancela o pedido no back e atualiza o status na lista
  const handleCancelarPedido = (pedidoId) => {
    const aux = async () => {
      const resposta = await cancelarPedido(pedidoId)

      // Atualiza o status na lista sem recarregar a página
      setPedidos((atual) =>
        atual.map((p) =>
          p.id === pedidoId ? { ...p, status: resposta.pedido.status } : p
        )
      )

      // Fecha o histórico se estiver aberto para esse pedido
      if (pedidoHistoricoSelecionado === pedidoId) {
        setDadosHistorico(null)
        setPedidoHistoricoSelecionado(null)
      }
    }
    aux()
  }

  // Busca o histórico de status de um pedido pelo id
  const handleVerHistorico = (pedidoId) => {
    const aux = async () => {
      const historico = await buscarHistorico(pedidoId)
      setDadosHistorico(historico)
      setPedidoHistoricoSelecionado(pedidoId)
    }
    aux()
  }

  // Fecha o histórico aberto
  const fecharHistorico = () => {
    setDadosHistorico(null)
    setPedidoHistoricoSelecionado(null)
  }

  // Retorna tudo que o PedidoPage precisa usar
  return {
    pedidos,
    filtroStatus,
    setFiltroStatus,
    dadosHistorico,
    pedidoHistoricoSelecionado,
    adicionarPedido,
    removerPedido,
    handleCancelarPedido,
    handleVerHistorico,
    fecharHistorico,
  }
}

export default usePedidos