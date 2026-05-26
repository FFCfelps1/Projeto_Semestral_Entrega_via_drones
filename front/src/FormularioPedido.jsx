import React, { useState } from 'react'
import { criarPedidoEntrega } from './pedidosEntregaService'

// Formulário para criação de um novo pedido de entrega via drone
const FormularioPedido = ({ onPedidoCriado }) => {

  // Estado para armazenar os dados do formulário
  const [formulario, setFormulario] = useState({
    item: '',
    peso: '',
    origem: '',
    destino: '',
    tipo: '',
    observacoes: '',
  })

  // Estado para controlar o loading durante a requisição
  const [carregando, setCarregando] = useState(false)

  // Estado para exibir mensagem de erro
  const [erro, setErro] = useState(null)

  // Atualiza o campo correspondente no estado do formulário
  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  // Envia o formulário para o back via pedidosEntregaService
  const handleSubmit = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const aux = async () => {
      const pedido = await criarPedidoEntrega(formulario)
      // Avisa o componente pai que o pedido foi criado
      onPedidoCriado(pedido)
      // Limpa o formulário após criar o pedido
      setFormulario({ item: '', peso: '', origem: '', destino: '', tipo: '', observacoes: '' })
    }

    aux()
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false))
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Novo pedido</h5>

        {erro && <div className="alert alert-danger">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item</label>
            <input
              type="text"
              className="form-control"
              name="item"
              value={formulario.item}
              onChange={handleChange}
              placeholder="Ex: Medicamentos, documentos"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Peso (kg)</label>
            <input
              type="number"
              className="form-control"
              name="peso"
              value={formulario.peso}
              onChange={handleChange}
              placeholder="Ex: 2.5"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Endereço de retirada</label>
            <input
              type="text"
              className="form-control"
              name="origem"
              value={formulario.origem}
              onChange={handleChange}
              placeholder="Ex: Rua das Flores, 120"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Endereço de entrega</label>
            <input
              type="text"
              className="form-control"
              name="destino"
              value={formulario.destino}
              onChange={handleChange}
              placeholder="Ex: Avenida Brasil, 850"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de entrega</label>
            <select
              className="form-select"
              name="tipo"
              value={formulario.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione uma modalidade</option>
              <option value="expressa">Expressa</option>
              <option value="padrao">Padrão</option>
              <option value="economica">Econômica</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Observações</label>
            <textarea
              className="form-control"
              name="observacoes"
              value={formulario.observacoes}
              onChange={handleChange}
              placeholder="Ex: Entregar na portaria"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={carregando}
          >
            {/* Exibe spinner durante o carregamento */}
            {carregando
              ? <><span className="spinner-border spinner-border-sm me-2" />Criando pedido...</>
              : 'Criar pedido'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default FormularioPedido