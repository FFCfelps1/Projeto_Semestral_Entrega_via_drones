import React from 'react'
import CardPedido from './CardPedido'

// Exibe a lista de pedidos ou uma mensagem caso não haja nenhum
const ListaPedidos = ({ pedidos, onPedidoCancelado, onVerHistorico }) => {

  // Exibe mensagem quando não há pedidos
  if (pedidos.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <i className="fas fa-box-open fa-3x mb-3" />
        <p>Nenhum pedido encontrado.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Renderiza um CardPedido para cada pedido da lista */}
      {pedidos.map((pedido) => (
        <CardPedido
          key={pedido.id}
          pedido={pedido}
          onPedidoCancelado={onPedidoCancelado}
          onVerHistorico={onVerHistorico}
        />
      ))}
    </div>
  )
}

export default ListaPedidos