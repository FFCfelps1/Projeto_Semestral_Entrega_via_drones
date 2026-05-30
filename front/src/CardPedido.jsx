import React from 'react'
import StatusPedido from './StatusPedido'
import { cancelarPedido } from './pedidosEntregaService'

// Exibe os dados de um pedido em um card com opção de cancelar
const CardPedido = ({ pedido, onPedidoCancelado, onVerHistorico }) => {

  // Cancela o pedido chamando o back e avisa o componente pai
  const handleCancelar = () => {
    const aux = async () => {
      await cancelarPedido(pedido.id)
      onPedidoCancelado(pedido.id)
    }
    aux()
  }

  // Verifica se o pedido pode ser cancelado
  const podeCancelar =
    pedido.status !== 'em_rota' &&
    pedido.status !== 'entregue' &&
    pedido.status !== 'cancelado'

  return (
    <div className="card mb-3">
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="card-title mb-0">{pedido.item}</h6>
          {/* Badge colorido com o status atual */}
          <StatusPedido status={pedido.status} />
        </div>

        <ul className="list-group list-group-flush mb-3">
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
            <span>Preço estimado</span>
            <strong className="text-success">R$ {pedido.precoEstimado}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Tempo estimado</span>
            <strong>{pedido.tempoEstimado} min</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Criado em</span>
            <strong>{new Date(pedido.criadoEm).toLocaleString('pt-BR')}</strong>
          </li>
        </ul>

        <div className="d-flex gap-2">
          {/* Botão para ver o histórico de status */}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => onVerHistorico(pedido.id)}
          >
            <i className="fas fa-history me-1" />
            Ver histórico
          </button>

          {/* Botão cancelar — só aparece se o pedido puder ser cancelado */}
          {podeCancelar && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleCancelar}
            >
              <i className="fas fa-times me-1" />
              Cancelar
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default CardPedido