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

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="p-4 p-md-5" style={panelStyle}>
              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3">
                Pedido de entrega
              </span>

              <div className="row g-4 align-items-stretch">
                <div className="col-12 col-lg-7">
                  <div className="h-100">
                    <h1 className="fw-bold mb-3">Solicitar entrega via drone</h1>
                    <p className={`mb-0 ${mutedClassName}`}>
                      Estrutura inicial da tela do futuro microsservico de pedidos de entrega SkySwift.
                    </p>
                  </div>
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
