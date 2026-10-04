import { useEffect, useState } from 'react'
import { cancelarPedido, confirmarPedido, buscarHistorico, buscarPedido } from './pedidosEntregaService.js'

const mensagemErro = error => error?.response?.data?.erro || 'Nao foi possivel atualizar os pedidos. Tente novamente.'

// A lista continua restrita aos pedidos salvos neste navegador; a API valida seus dados.
const usePedidos = carregarIniciais => {
  const [pedidos, setPedidos] = useState(() => typeof carregarIniciais === 'function' ? carregarIniciais() : [])
  const [erroPedidos, setErroPedidos] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [pedidoHistoricoSelecionado, setPedidoHistoricoSelecionado] = useState(null)
  const [dadosHistorico, setDadosHistorico] = useState(null)

  useEffect(() => {
    let ativo = true
    const iniciais = typeof carregarIniciais === 'function' ? carregarIniciais() : []
    Promise.all(iniciais.map(async pedido => {
      try { return await buscarPedido(pedido.id) }
      catch (error) { if (error?.response?.status === 404) return null; throw error }
    })).then(atualizados => {
      if (ativo) setPedidos(atual => atual.map(pedido => atualizados.find(p => p?.id === pedido.id) ||
        (iniciais.some(p => p.id === pedido.id) ? null : pedido)).filter(Boolean))
    }).catch(error => { if (ativo) setErroPedidos(mensagemErro(error)) })
    return () => { ativo = false }
  }, [carregarIniciais])

  const executar = async action => {
    setErroPedidos('')
    try { await action() } catch (error) { setErroPedidos(mensagemErro(error)) }
  }
  const atualizar = pedido => setPedidos(atual => atual.map(p => p.id === pedido.id ? pedido : p))
  const adicionarPedido = pedido => setPedidos(atual => [pedido, ...atual])
  const removerPedido = id => setPedidos(atual => atual.filter(p => p.id !== id))
  const fecharHistorico = () => { setDadosHistorico(null); setPedidoHistoricoSelecionado(null) }
  const handleConfirmarPedido = id => executar(async () => { atualizar(await confirmarPedido(id)) })
  const handleCancelarPedido = id => executar(async () => {
    atualizar((await cancelarPedido(id)).pedido)
    if (pedidoHistoricoSelecionado === id) fecharHistorico()
  })
  const handleVerHistorico = id => executar(async () => {
    const historico = await buscarHistorico(id)
    setDadosHistorico(historico)
    setPedidoHistoricoSelecionado(id)
    atualizar(await buscarPedido(id))
  })
  return { pedidos, erroPedidos, filtroStatus, setFiltroStatus, dadosHistorico, pedidoHistoricoSelecionado,
    adicionarPedido, removerPedido, handleConfirmarPedido, handleCancelarPedido, handleVerHistorico, fecharHistorico }
}
export default usePedidos
