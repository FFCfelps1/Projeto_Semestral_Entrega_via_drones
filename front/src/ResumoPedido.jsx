return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Resumo do pedido</h5>

        {/* Lista com todos os dados do pedido vindos do back */}
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
          {/* precoEstimado e tempoEstimado calculados pelo back */}
          <li className="list-group-item d-flex justify-content-between">
            <span>Preço estimado</span>
            <strong className="text-success">R$ {pedido.precoEstimado}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>Tempo estimado</span>
            <strong>{pedido.tempoEstimado} min</strong>
          </li>
          {/* Badge colorido com o status atual do pedido */}
          <li className="list-group-item d-flex justify-content-between">
            <span>Status</span>
            <StatusPedido status={pedido.status} />
          </li>
        </ul>

        {/* Botão que muda o status de rascunho para confirmado */}
        <button
          className="btn btn-success w-100"
          onClick={handleConfirmar}
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  )