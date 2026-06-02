import { useCallback, useEffect, useState } from "react"
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from "./notificacoesService.js"

const formatarData = (valor) => {
  if (!valor) return "Data indisponivel"

  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return "Data indisponivel"

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data)
}

const NotificacoesPage = ({ themeMode = "light", onAtualizarContagem }) => {
  const isDarkMode = themeMode === "dark"
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [status, setStatus] = useState(null)
  const [processandoId, setProcessandoId] = useState(null)
  const [marcandoTodas, setMarcandoTodas] = useState(false)

  const carregarNotificacoes = useCallback(async () => {
    try {
      setCarregando(true)
      setStatus(null)
      const dados = await listarNotificacoes()
      setNotificacoes(Array.isArray(dados) ? dados : [])
      await onAtualizarContagem?.()
    } catch (error) {
      console.error("Erro ao buscar notificacoes:", error)
      setStatus({
        tipo: "erro",
        texto: "Nao foi possivel carregar as notificacoes.",
      })
    } finally {
      setCarregando(false)
    }
  }, [onAtualizarContagem])

  useEffect(() => {
    carregarNotificacoes()
  }, [carregarNotificacoes])

  const handleMarcarComoLida = async (id) => {
    try {
      setProcessandoId(id)
      const notificacaoAtualizada = await marcarNotificacaoComoLida(id)

      setNotificacoes((listaAtual) =>
        listaAtual.map((notificacao) =>
          notificacao.id === id ? notificacaoAtualizada : notificacao,
        ),
      )
      setStatus({
        tipo: "sucesso",
        texto: "Notificacao marcada como lida.",
      })
      await onAtualizarContagem?.()
    } catch (error) {
      console.error("Erro ao marcar notificacao como lida:", error)
      setStatus({
        tipo: "erro",
        texto: "Nao foi possivel marcar a notificacao como lida.",
      })
    } finally {
      setProcessandoId(null)
    }
  }

  const handleMarcarTodasComoLidas = async () => {
    try {
      setMarcandoTodas(true)
      await marcarTodasNotificacoesComoLidas()
      setNotificacoes((listaAtual) =>
        listaAtual.map((notificacao) => ({
          ...notificacao,
          lida: true,
          lidaEm: notificacao.lidaEm || new Date().toISOString(),
        })),
      )
      setStatus({
        tipo: "sucesso",
        texto: "Todas as notificacoes foram marcadas como lidas.",
      })
      await onAtualizarContagem?.()
    } catch (error) {
      console.error("Erro ao marcar todas as notificacoes como lidas:", error)
      setStatus({
        tipo: "erro",
        texto: "Nao foi possivel marcar todas como lidas.",
      })
    } finally {
      setMarcandoTodas(false)
    }
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
  const unreadCount = notificacoes.filter((notificacao) => !notificacao.lida).length
  const alertClassName = status?.tipo === "sucesso" ? "alert-success" : "alert-danger"

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3">
              Central de notificacoes
            </span>
            <h1 className="fw-bold mb-2">Notificacoes</h1>
            <p className={`mb-0 ${mutedClassName}`}>
              Acompanhe os eventos recentes gerados pelos pedidos da SkySwift.
            </p>
          </div>

          <button
            type="button"
            className={`btn ${isDarkMode ? "btn-outline-light" : "btn-outline-primary"} fw-bold`}
            onClick={handleMarcarTodasComoLidas}
            disabled={marcandoTodas || unreadCount === 0}
          >
            {marcandoTodas ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Atualizando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check-double me-2" aria-hidden="true"></i>
                Marcar todas como lidas
              </>
            )}
          </button>
        </div>

        {status && (
          <div className={`alert ${alertClassName}`} role="status">
            {status.texto}
          </div>
        )}

        <div className="p-4 p-md-5" style={panelStyle}>
          {carregando ? (
            <div className="d-flex align-items-center gap-3">
              <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
              <p className="mb-0 fw-semibold">Carregando notificacoes...</p>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="text-center py-5">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary mb-3"
                style={{ width: "56px", height: "56px", borderRadius: "8px" }}
              >
                <i className="fa-solid fa-bell-slash fa-lg" aria-hidden="true"></i>
              </div>
              <h2 className="h4 fw-bold mb-2">Nenhuma notificacao recebida</h2>
              <p className={`mb-0 ${mutedClassName}`}>Quando um pedido for criado, ele aparecera aqui.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notificacoes.map((notificacao) => {
                const cardClassName = `border rounded p-3 p-md-4 ${
                  isDarkMode ? "border-secondary" : notificacao.lida ? "border-light" : "border-primary"
                }`
                const cardStyle = {
                  backgroundColor: notificacao.lida
                    ? isDarkMode
                      ? "#101827"
                      : "#ffffff"
                    : isDarkMode
                      ? "#15213a"
                      : "#f4f8ff",
                }

                return (
                  <article key={notificacao.id} className={cardClassName} style={cardStyle}>
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                      <div className="d-flex gap-3">
                        <div
                          className={`d-flex align-items-center justify-content-center flex-shrink-0 ${
                            notificacao.lida ? mutedClassName : "bg-primary bg-opacity-10 text-primary"
                          }`}
                          style={{ width: "44px", height: "44px", borderRadius: "8px" }}
                        >
                          <i className={`fa-solid ${notificacao.lida ? "fa-envelope-open" : "fa-bell"}`} aria-hidden="true"></i>
                        </div>

                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <h2 className="h5 fw-bold mb-0">{notificacao.titulo}</h2>
                            {!notificacao.lida && <span className="badge bg-primary">Nova</span>}
                          </div>
                          <p className="mb-2">{notificacao.mensagem}</p>
                          <div className={`d-flex flex-wrap gap-3 small ${mutedClassName}`}>
                            <span>
                              <i className="fa-solid fa-clock me-1" aria-hidden="true"></i>
                              {formatarData(notificacao.criadoEm)}
                            </span>
                            {notificacao.pedidoId && (
                              <span className="text-break">
                                <i className="fa-solid fa-box me-1" aria-hidden="true"></i>
                                {notificacao.pedidoId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start justify-content-lg-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${isDarkMode ? "btn-outline-light" : "btn-outline-primary"} fw-bold`}
                          onClick={() => handleMarcarComoLida(notificacao.id)}
                          disabled={notificacao.lida || processandoId === notificacao.id}
                        >
                          {processandoId === notificacao.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          ) : (
                            <>
                              <i className="fa-solid fa-check me-1" aria-hidden="true"></i>
                              Marcar como lida
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default NotificacoesPage
