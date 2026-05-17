const PedidoPage = ({ themeMode = "light" }) => {
  const isDarkMode = themeMode === "dark"

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
                  <form className="h-100">
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
                          className={inputClassName}
                          placeholder="Ex.: medicamentos, documentos ou pequeno volume"
                        />
                      </div>

                      <div>
                        <label className="form-label fw-semibold" htmlFor="pedido-peso">
                          Peso aproximado
                        </label>
                        <div className="input-group">
                          <input
                            id="pedido-peso"
                            name="peso"
                            type="number"
                            className={inputClassName}
                            min="0"
                            step="0.1"
                            placeholder="Ex.: 2.5"
                          />
                          <span className={`input-group-text ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`}>
                            kg
                          </span>
                        </div>
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
                    <h2 className="h5 fw-bold mb-2">Resumo do pedido</h2>
                    <p className={`mb-0 ${mutedClassName}`}>
                      O formulario e a simulacao do pedido serao adicionados nas proximas etapas.
                    </p>
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
