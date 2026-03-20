import React from 'react'

const Pedido = (props) => {
	return (
			<div className="d-flex gap-3">
				<div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '60px', height: '60px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
					<i className={`fa fa-${props.icone} fa-xl text-primary`}></i>
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