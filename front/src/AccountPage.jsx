import { useEffect, useState } from "react"

const AccountPage = ({ themeMode = "light", usuario, onAtualizarPerfil, onAlterarSenha }) => {
  const isDarkMode = themeMode === "dark"
  const [perfil, setPerfil] = useState({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
  })
  const [senha, setSenha] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  })
  const [statusPerfil, setStatusPerfil] = useState(null)
  const [statusSenha, setStatusSenha] = useState(null)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    setPerfil({
      nome: usuario?.nome || "",
      email: usuario?.email || "",
    })
  }, [usuario])

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

  const inputClassName = `form-control ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`
  const mutedClassName = isDarkMode ? "text-light opacity-75" : "text-secondary"

  const handlePerfilChange = (event) => {
    const { name, value } = event.target
    setPerfil((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }))
  }

  const handleSenhaChange = (event) => {
    const { name, value } = event.target
    setSenha((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }))
  }

  const handlePerfilSubmit = async (event) => {
    event.preventDefault()

    try {
      setSalvandoPerfil(true)
      setStatusPerfil(null)

      const resposta = await onAtualizarPerfil(perfil)

      setStatusPerfil({
        tipo: "sucesso",
        texto: resposta?.message || "Perfil atualizado com sucesso.",
      })
    } catch (error) {
      setStatusPerfil({
        tipo: "erro",
        texto: error.message || "Nao foi possivel atualizar o perfil.",
      })
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const handleSenhaSubmit = async (event) => {
    event.preventDefault()

    if (senha.novaSenha !== senha.confirmarNovaSenha) {
      setStatusSenha({
        tipo: "erro",
        texto: "As senhas nao coincidem.",
      })
      return
    }

    try {
      setSalvandoSenha(true)
      setStatusSenha(null)

      const resposta = await onAlterarSenha({
        senhaAtual: senha.senhaAtual,
        novaSenha: senha.novaSenha,
      })

      setSenha({
        senhaAtual: "",
        novaSenha: "",
        confirmarNovaSenha: "",
      })
      setStatusSenha({
        tipo: "sucesso",
        texto: resposta?.message || "Senha atualizada com sucesso.",
      })
    } catch (error) {
      setStatusSenha({
        tipo: "erro",
        texto: error.message || "Nao foi possivel atualizar a senha.",
      })
    } finally {
      setSalvandoSenha(false)
    }
  }

  const alertClassName = (status) =>
    `alert ${status?.tipo === "sucesso" ? "alert-success" : "alert-danger"}`

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="mb-4">
          <h1 className="fw-bold mb-2">Minha conta</h1>
          <p className={mutedClassName}>Gerencie seus dados de acesso da SkySwift.</p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <form className="p-4 h-100" style={panelStyle} onSubmit={handlePerfilSubmit}>
              <h2 className="h4 fw-bold mb-3">Dados do perfil</h2>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="conta-nome">
                  Nome
                </label>
                <input
                  id="conta-nome"
                  name="nome"
                  className={inputClassName}
                  value={perfil.nome}
                  onChange={handlePerfilChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="conta-email">
                  Email
                </label>
                <input
                  id="conta-email"
                  name="email"
                  type="email"
                  className={inputClassName}
                  value={perfil.email}
                  onChange={handlePerfilChange}
                  autoComplete="email"
                  required
                />
              </div>

              {statusPerfil && (
                <div className={alertClassName(statusPerfil)} role="alert">
                  {statusPerfil.texto}
                </div>
              )}

              <button type="submit" className="btn btn-primary fw-bold" disabled={salvandoPerfil}>
                {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>
          </div>

          <div className="col-12 col-lg-6">
            <form className="p-4 h-100" style={panelStyle} onSubmit={handleSenhaSubmit}>
              <h2 className="h4 fw-bold mb-3">Senha</h2>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="conta-senha-atual">
                  Senha atual
                </label>
                <input
                  id="conta-senha-atual"
                  name="senhaAtual"
                  type="password"
                  className={inputClassName}
                  value={senha.senhaAtual}
                  onChange={handleSenhaChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="conta-nova-senha">
                  Nova senha
                </label>
                <input
                  id="conta-nova-senha"
                  name="novaSenha"
                  type="password"
                  className={inputClassName}
                  value={senha.novaSenha}
                  onChange={handleSenhaChange}
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="conta-confirmar-nova-senha">
                  Confirmar nova senha
                </label>
                <input
                  id="conta-confirmar-nova-senha"
                  name="confirmarNovaSenha"
                  type="password"
                  className={inputClassName}
                  value={senha.confirmarNovaSenha}
                  onChange={handleSenhaChange}
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
              </div>

              {statusSenha && (
                <div className={alertClassName(statusSenha)} role="alert">
                  {statusSenha.texto}
                </div>
              )}

              <button type="submit" className="btn btn-primary fw-bold" disabled={salvandoSenha}>
                {salvandoSenha ? "Atualizando..." : "Atualizar senha"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountPage
