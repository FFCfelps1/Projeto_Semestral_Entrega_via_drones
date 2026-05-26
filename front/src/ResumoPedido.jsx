import React from 'react'
import StatusPedido from './StatusPedido'
import { confirmarPedido } from './pedidosEntregaService'

// Exibe o resumo do pedido recém criado com preço e tempo estimado
const ResumoPedido = ({ pedido, onPedidoConfirmado }) => {

  // Confirma o pedido chamando o back e avisa o componente pai
  const handleConfirmar = async () => {
    const aux = async () => {
      const pedidoConfirmado = await confirmarPedido(pedido.id)
      onPedidoConfirmado(pedidoConfirmado)
    }
    aux()
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Resumo do pedido</h5>

        <ul className="list-group list-group-flush mb-3">
          <li className="list-group-item d-flex justify-content-between">
            <span>Item</span>
            <strong>{pedido.item}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Peso</span>
            <strong>{pedido.peso} kg</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Origem</span>
            <strong>{pedido.origem}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Destino</span>
            <strong>{pedido.destino}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Tipo</span>
            <strong>{pedido.tipo}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Preço estimado</span>
            <strong className="text-success">R$ {pedido.precoEstimado}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Tempo estimado</span>
            <strong>{pedido.tempoEstimado} min</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Status</span>
            <StatusPedido status={pedido.status} />
          </li>
        </ul>

        <button
          className="btn btn-success w-100"
          onClick={handleConfirmar}
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  )
}

export default ResumoPedido