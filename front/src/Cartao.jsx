// rafce
import React from 'react'

const Cartao = (props) => {
  return (
    <div className='card h-100 d-flex flex-column'>
        {/* .card>(car-header+card-body) */}
      <div className="card-header text-muted">{props.cabecalho}</div>
      <div className="card-body d-flex flex-column">
        {props.children}
      </div>
    </div>
  )
}

export default Cartao
