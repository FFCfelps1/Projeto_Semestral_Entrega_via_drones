import { useState } from "react"

const pedidoInicial = {
  item: "",
  peso: "",
  origem: "",
  destino: "",
  tipoEntrega: "",
  observacoes: "",
}

const tiposEntrega = {
  padrao: "Padrao",
  expressa: "Expressa",
  prioritaria: "Prioritaria",
}

const multiplicadoresEntrega = {
  padrao: 1,
  expressa: 1.35,
  prioritaria: 1.65,
}

const temposEntrega = {
  padrao: "45 a 60 min",
  expressa: "25 a 35 min",
  prioritaria: "15 a 25 min",
}

const statusInicialPedido = "Aguardando solicitacao"

const PedidoPage = ({ themeMode = "light" }) => {
  const isDarkMode = themeMode === "dark"
  const [pedido, setPedido] = useState(pedidoInicial)
  const [erros, setErros] = useState({})
  const [statusPedido, setStatusPedido] = useState(statusInicialPedido)
  const [pedidoSimulado, setPedidoSimulado] = useState(null)

  const handlePedidoChange = (event) => {
    const { name, value } = event.target

    setPedido((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }))
    setErros((errosAtuais) => ({
      ...errosAtuais,
      [name]: "",
    }))
    setStatusPedido(statusInicialPedido)
  }

  const validarPedido = () => {
    const novosErros = {}

    if (!pedido.item.trim()) {
      novosErros.item = "Informe o item ou a descricao do pacote."
    }

    if (!pedido.peso) {
      novosErros.peso = "Informe o peso aproximado."
    } else if (Number(pedido.peso) <= 0) {
      novosErros.peso = "O peso deve ser maior que zero."
    }

    if (!pedido.origem.trim()) {
      novosErros.origem = "Informe o endereco de retirada."
    }

    if (!pedido.destino.trim()) {
      novosErros.destino = "Informe o endereco de entrega."
    }

    if (!pedido.tipoEntrega) {
      novosErros.tipoEntrega = "Selecione o tipo de entrega."
    }

    return novosErros
  }

  const handlePedidoSubmit = (event) => {
    event.preventDefault()

    const errosValidacao = validarPedido()
    setErros(errosValidacao)

    if (Object.keys(errosValidacao).length > 0) {
      return
    }

    setStatusPedido("Pedido simulado")
    setPedidoSimulado({
      id: `PED-${Date.now()}`,
      ...pedido,
      precoEstimado,
      tempoEstimado: temposEntrega[pedido.tipoEntrega],
      status: "Pedido simulado",
      criadoEm: new Date().toISOString(),
    })
  }

  const pageStyle = {
    minHeight: "calc(100vh - 72px)",
    backgroundColor: isDarkMode ? "#0b1220" : "#eef5ff",
  }

  const panelStyle = {
    borderRadius: "8px",
    border: isDarkMode ? "1px solid #23334d" : "1px solid #d8e4f5",
    backgroundColor: isDarkMode ? "#111a2c" : "#ffffff",
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    boxShadow: isDarkMode ? "0 16px 32px rgba(0,0,0,0.22)" : "0 16px 32px rgba(30,64,175,0.10)",
  }

  const mutedClassName = isDarkMode ? "text-light opacity-75" : "text-secondary"
  const inputClassName = `form-control ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`
  const selectClassName = `form-select ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`
  const summaryItemClassName = `d-flex justify-content-between gap-3 py-2 border-bottom ${isDarkMode ? "border-secondary" : ""}`
  const pesoNumerico = Number(pedido.peso)
  const precoEstimado =
    pesoNumerico > 0
      ? 18 + pesoNumerico * 4.5 * (multiplicadoresEntrega[pedido.tipoEntrega] || 1)
      : 0
  const subtitleStyle = {
    maxWidth: "620px",
    lineHeight: 1.7,
  }

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="p-4 p-md-5" style={panelStyle}>
              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3">
                Pedido de entrega
              </span>

              <div className="mb-4">
                <h1 className="fw-bold mb-3">Solicite sua entrega SkySwift</h1>
                <p className={`fs-5 mb-2 ${mutedClassName}`} style={subtitleStyle}>
                  Simule uma entrega via drone com origem, destino e detalhes do pacote em poucos passos.
                </p>
                <p className={`mb-0 ${mutedClassName}`} style={subtitleStyle}>
                  Esta tela representa o futuro microsservico de pedidos de entrega, preparado para conectar sua solicitacao a uma API dedicada nas proximas evolucoes.
                </p>
              </div>

              <div className="row g-4 align-items-stretch">
                <div className="col-12 col-lg-7">
                  <form className="h-100" onSubmit={handlePedidoSubmit} noValidate>
                    <h2 className="h4 fw-bold mb-3">Detalhes da solicitacao</h2>
                    <p className={`mb-0 ${mutedClassName}`}>
                      Informe os dados do envio para visualizar a simulacao do pedido antes de confirmar.
                    </p>

                    <div className="border rounded p-4 mt-4">
                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-item">
                          Item ou descricao do pacote
                        </label>
                        <input
                          id="pedido-item"
                          name="item"
                          type="text"
                          className={`${inputClassName} ${erros.item ? "is-invalid" : ""}`}
                          value={pedido.item}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: medicamentos, documentos ou pequeno volume"
                          required
                        />
                        {erros.item && <div className="invalid-feedback">{erros.item}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-peso">
                          Peso aproximado
                        </label>
                        <div className="input-group">
                          <input
                            id="pedido-peso"
                            name="peso"
                            type="number"
                            className={`${inputClassName} ${erros.peso ? "is-invalid" : ""}`}
                            min="0"
                            step="0.1"
                            value={pedido.peso}
                            onChange={handlePedidoChange}
                            placeholder="Ex.: 2.5"
                            required
                          />
                          <span className={`input-group-text ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`}>
                            kg
                          </span>
                        </div>
                        {erros.peso && <div className="invalid-feedback d-block">{erros.peso}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-origem">
                          Endereco de retirada
                        </label>
                        <input
                          id="pedido-origem"
                          name="origem"
                          type="text"
                          className={`${inputClassName} ${erros.origem ? "is-invalid" : ""}`}
                          value={pedido.origem}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: Rua das Flores, 120 - Centro"
                          required
                        />
                        {erros.origem && <div className="invalid-feedback">{erros.origem}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-destino">
                          Endereco de entrega
                        </label>
                        <input
                          id="pedido-destino"
                          name="destino"
                          type="text"
                          className={`${inputClassName} ${erros.destino ? "is-invalid" : ""}`}
                          value={pedido.destino}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: Avenida Brasil, 850 - Jardim"
                          required
                        />
                        {erros.destino && <div className="invalid-feedback">{erros.destino}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-tipo-entrega">
                          Tipo de entrega
                        </label>
                        <select
                          id="pedido-tipo-entrega"
                          name="tipoEntrega"
                          className={`${selectClassName} ${erros.tipoEntrega ? "is-invalid" : ""}`}
                          value={pedido.tipoEntrega}
                          onChange={handlePedidoChange}
                          required
                        >
                          <option value="" disabled>
                            Selecione uma modalidade
                          </option>
                          <option value="padrao">Padrao</option>
                          <option value="expressa">Expressa</option>
                          <option value="prioritaria">Prioritaria</option>
                        </select>
                        {erros.tipoEntrega && <div className="invalid-feedback">{erros.tipoEntrega}</div>}
                      </div>

                      <div>
                        <label className="form-label fw-semibold" htmlFor="pedido-observacoes">
                          Observacoes
                        </label>
                        <textarea
                          id="pedido-observacoes"
                          name="observacoes"
                          className={inputClassName}
                          rows="3"
                          value={pedido.observacoes}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: entregar na portaria, pacote fragil ou melhor horario para retirada"
                        ></textarea>
                      </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                      <button type="submit" className="btn btn-primary fw-bold">
                        Simular pedido
                      </button>
                      <button type="button" className="btn btn-outline-secondary fw-bold">
                        Limpar formulario
                      </button>
                    </div>
                  </form>
                </div>

                <div className="col-12 col-lg-5">
                  <div className="border rounded p-4 h-100">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary bg-opacity-10 text-primary"
                        style={{ width: "44px", height: "44px", borderRadius: "8px" }}
                      >
                        <i className="fa fa-clipboard-list" aria-hidden="true"></i>
                      </div>
                      <div>
                        <h2 className="h5 fw-bold mb-1">Resumo do pedido</h2>
                        <p className={`mb-0 ${mutedClassName}`}>Previa da solicitacao de entrega.</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {pedidoSimulado?.id && (
                        <div className={summaryItemClassName}>
                          <span className={mutedClassName}>Identificador</span>
                          <strong className="text-end">{pedidoSimulado.id}</strong>
                        </div>
                      )}
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Status</span>
                        <span className={`badge ${statusPedido === statusInicialPedido ? "bg-warning text-dark" : "bg-success"}`}>
                          {statusPedido}
                        </span>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Item</span>
                        <strong className="text-end">{pedido.item.trim() || "Aguardando item"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Peso</span>
                        <strong className="text-end">{pedido.peso ? `${pedido.peso} kg` : "Aguardando peso"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Origem</span>
                        <strong className="text-end">{pedido.origem.trim() || "Nao informada"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Destino</span>
                        <strong className="text-end">{pedido.destino.trim() || "Nao informado"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Tipo</span>
                        <strong className="text-end">{tiposEntrega[pedido.tipoEntrega] || "Nao selecionado"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Tempo estimado</span>
                        <strong className="text-end">{temposEntrega[pedido.tipoEntrega] || "Aguardando tipo"}</strong>
                      </div>
                      <div className="d-flex justify-content-between gap-3 py-2">
                        <span className={mutedClassName}>Preco estimado</span>
                        <strong className="text-end text-primary">
                          {precoEstimado > 0 ? `R$ ${precoEstimado.toFixed(2).replace(".", ",")}` : "Aguardando dados"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PedidoPage
