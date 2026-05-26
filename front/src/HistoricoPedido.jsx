import React from 'react'
import StatusPedido from './StatusPedido'

// Exibe a linha do tempo de status de um pedido
const HistoricoPedido = ({ historico, onFechar }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Histórico do pedido</h5>
          {/* Botão para fechar o histórico */}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onFechar}
          >
            <i className="fas fa-times me-1" />
            Fechar
          </button>
        </div>

        <p className="text-muted mb-1">
          <strong>Item:</strong> {historico.item}
        </p>
        <p className="text-muted mb-3">
          <strong>Status atual:</strong>{' '}
          <StatusPedido status={historico.statusAtual} />
        </p>

        {/* Linha do tempo de status */}
        <ul className="list-group list-group-flush">
          {historico.historico.map((entrada, index) => (
            <li
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {/* Badge com o status */}
              <StatusPedido status={entrada.status} />

              {/* Data e hora formatadas em pt-BR */}
              <small className="text-muted">
                {new Date(entrada.momento).toLocaleString('pt-BR')}
              </small>
            </li>
          ))}
        </ul>

      </div>
    </div>
  )
}

export default HistoricoPedido