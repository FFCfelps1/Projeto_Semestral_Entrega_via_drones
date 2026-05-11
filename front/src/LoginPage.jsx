import { useState } from "react"

const LoginPage = ({ themeMode = "light" }) => {
  const isDarkMode = themeMode === "dark"
  const [modo, setModo] = useState("login")
  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    senha: "",
  })
  const isCadastro = modo === "cadastro"

  const pageStyle = {
    minHeight: "calc(100vh - 72px)",
    backgroundColor: isDarkMode ? "#0b1220" : "#eef5ff",
  }

  const panelStyle = {
    borderRadius: "8px",
    border: isDarkMode ? "1px solid #23334d" : "1px solid #d8e4f5",
    backgroundColor: isDarkMode ? "#111a2c" : "#ffffff",
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    boxShadow: isDarkMode ? "0 18px 40px rgba(0,0,0,0.24)" : "0 18px 40px rgba(30,64,175,0.12)",
  }

  const asideStyle = {
    borderRadius: "8px",
    backgroundImage:
      "linear-gradient(rgba(13, 110, 253, 0.82), rgba(8, 47, 73, 0.88)), url(https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80)",
    backgroundPosition: "center",
    backgroundSize: "cover",
    minHeight: "100%",
  }

  const inputClassName = `form-control ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }))
  }

  const trocarModo = (novoModo) => {
    setModo(novoModo)
  }

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="row justify-content-center align-items-stretch g-4">
          <div className="col-12 col-lg-5">
            <div className="h-100 p-4 p-md-5 text-white d-flex flex-column justify-content-end" style={asideStyle}>
              <span className="badge bg-light text-primary align-self-start mb-3">SkySwift</span>
              <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Acesse sua conta de entregas
              </h1>
              <p className="mb-0" style={{ maxWidth: "420px" }}>
                Entre para acompanhar pedidos, configurar entregas e manter seus dados conectados ao sistema.
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="p-4 p-md-5 h-100" style={panelStyle}>
              <div className="d-flex gap-2 mb-4" role="group" aria-label="Alternar entre login e cadastro">
                <button
                  type="button"
                  className={`btn flex-fill ${!isCadastro ? "btn-primary" : isDarkMode ? "btn-outline-light" : "btn-outline-primary"}`}
                  onClick={() => trocarModo("login")}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={`btn flex-fill ${isCadastro ? "btn-primary" : isDarkMode ? "btn-outline-light" : "btn-outline-primary"}`}
                  onClick={() => trocarModo("cadastro")}
                >
                  Cadastrar-se
                </button>
              </div>

              <h2 className="fw-bold mb-2">{isCadastro ? "Crie sua conta" : "Bem-vindo de volta"}</h2>
              <p className={isDarkMode ? "text-light opacity-75" : "text-secondary"}>
                {isCadastro ? "Informe seus dados para criar um novo acesso." : "Use seu email e senha para continuar."}
              </p>

              <form className="mt-4">
                {isCadastro && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="auth-nome">
                      Nome
                    </label>
                    <input
                      id="auth-nome"
                      name="nome"
                      className={inputClassName}
                      value={formulario.nome}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="auth-email">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    className={inputClassName}
                    value={formulario.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="auth-senha">
                    Senha
                  </label>
                  <input
                    id="auth-senha"
                    name="senha"
                    type="password"
                    className={inputClassName}
                    value={formulario.senha}
                    onChange={handleChange}
                    autoComplete={isCadastro ? "new-password" : "current-password"}
                    minLength="6"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-bold py-2">
                  {isCadastro ? "Criar conta" : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
