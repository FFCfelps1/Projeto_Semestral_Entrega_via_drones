import React from 'react'

// Mapeia cada status para uma classe badge do Bootstrap e um texto
const statusConfig = {
  rascunho:         { classe: 'bg-secondary', texto: 'Rascunho' },
  confirmado:       { classe: 'bg-primary',   texto: 'Confirmado' },
  em_processamento: { classe: 'bg-info',      texto: 'Em processamento' },
  em_rota:          { classe: 'bg-warning',   texto: 'Em rota' },
  entregue:         { classe: 'bg-success',   texto: 'Entregue' },
  cancelado:        { classe: 'bg-danger',    texto: 'Cancelado' },
}

// Exibe um badge colorido com o status atual do pedido
const StatusPedido = ({ status }) => {
  // Se o status não existir no mapa, usa uma configuração padrão
  const config = statusConfig[status] || { classe: 'bg-secondary', texto: status }

  return (
    <span className={`badge ${config.classe}`}>
      {config.texto}
    </span>
  )
}

export default StatusPedido