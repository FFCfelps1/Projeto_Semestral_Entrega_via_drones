import React from 'react'

const Pedido = (props) => {
	return (
			<div className="d-flex">
				<div className="d-flex align-items-center">
					<i className={`fa fa-${props.icone} fa-2x`}></i>
				</div>
				{/* div>(h4.text-center+p.text-center) */}
				<div className="flex-grow-1 rounded p-3">
					<h4 className="text-center">{props.titulo}</h4>
					<p className="text-center">{props.descricao}</p>
				</div>
			</div>
	)
}


export default Pedido