import { useEffect, useState } from "react"
import Pedido from "./Pedido.jsx"
import Cartao from "./Cartao.jsx"
import TopBar from "./TopBar.jsx"
import Hero from "./Hero.jsx"
import Advantages from "./Advantages.jsx"
import CallToAction from "./CallToAction.jsx"
import Footer from "./Footer.jsx"
import DroneTrackingSection from "./DroneTrackingSection.jsx"
import PrecosPage from "./PrecosPage.jsx"
import SuportePage from "./SuportePage.jsx"
import LoginPage from "./LoginPage.jsx"
import AccountPage from "./AccountPage.jsx"
import axios from "axios"

const MAP_SERVICE_URL =
  import.meta.env.VITE_MAP_SERVICE_URL ||
  (import.meta.env.DEV ? "http://localhost:3002" : "/api/entrega_via_drone")

const EMAIL_SERVICE_URL =
  import.meta.env.VITE_EMAIL_SERVICE_URL ||
  (import.meta.env.DEV ? "http://localhost:3003" : "/api/contato_email")

const AUTH_SERVICE_URL =
  import.meta.env.VITE_AUTH_SERVICE_URL ||
  (import.meta.env.DEV ? "http://localhost:3004" : "/api/cadastro_usuario")

const AUTH_STORAGE_KEY = "skyswift-auth"

const App = () => {
  const [rota, setRota] = useState(null)
  const [authSession, setAuthSession] = useState(() => {
    if (typeof window === "undefined") return null

    try {
      const savedSession = window.localStorage.getItem(AUTH_STORAGE_KEY)
      return savedSession ? JSON.parse(savedSession) : null
    } catch (error) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  })
  const [validandoSessao, setValidandoSessao] = useState(() => Boolean(authSession?.token))

  const salvarSessao = (sessionData) => {
    setValidandoSessao(false)
    setAuthSession(sessionData)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData))
  }

  const handleLogout = () => {
    setValidandoSessao(false)
    setAuthSession(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)

    if (window.location.pathname === "/login") {
      window.location.href = "/"
    }
  }

  useEffect(() => {
    const token = authSession?.token

    if (!token) {
      setValidandoSessao(false)
      return
    }

    let sessaoAtiva = true
    setValidandoSessao(true)

    const validarSessao = async () => {
      try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!sessaoAtiva) return

        setAuthSession((sessaoAtual) => {
          if (sessaoAtual?.token !== token) return sessaoAtual

          const sessaoAtualizada = {
            ...sessaoAtual,
            usuario: response.data.usuario,
          }

          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessaoAtualizada))
          return sessaoAtualizada
        })
      } catch (error) {
        if (!sessaoAtiva) return

        setAuthSession((sessaoAtual) => {
          if (sessaoAtual?.token !== token) return sessaoAtual

          window.localStorage.removeItem(AUTH_STORAGE_KEY)
          return null
        })
      } finally {
        if (sessaoAtiva) {
          setValidandoSessao(false)
        }
      }
    }

    validarSessao()

    return () => {
      sessaoAtiva = false
    }
  }, [authSession?.token])

  const buscarRota = async () =>{
    try {
       const response = await axios.get(`${MAP_SERVICE_URL}/rota`, {
        params: {
          origemLat: -23.5505,
          origemLng: -46.6333,
          destinoLat: -23.5600,
          destinoLng: -46.6500,
        },
      })

      console.log("Resposta da API:", response.data)
      setRota(response.data)
    } catch (error) {
      console.error("Erro ao buscar rota:", error)
    }
  }

  const handleContatarVendas = async () => {
    try {
      const response = await axios.get(`${EMAIL_SERVICE_URL}/email/contato`)
      const mailtoLink = response?.data?.link

      if (!mailtoLink) {
        throw new Error("Resposta sem link de email")
      }

      window.location.href = mailtoLink
    } catch (error) {
      console.error("Erro ao abrir contato por email:", error)
      alert("Não foi possível abrir o e-mail agora. Tente novamente em instantes.")
    }
  }

  const handleEnviarMensagemDireto = async (payload) => {
    try {
      const response = await axios.post(`${EMAIL_SERVICE_URL}/email/enviar`, payload)
      return response.data
    } catch (error) {
      console.error("Erro ao enviar mensagem pelo site:", error)
      const mensagemErro = error?.response?.data?.error || "Não foi possível enviar sua mensagem agora."
      throw new Error(mensagemErro)
    }
  }

  const handleAutenticacao = async ({ modo, dados }) => {
    const endpoint = modo === "cadastro" ? "/auth/cadastro" : "/auth/login"
    const payload = modo === "cadastro"
      ? {
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          senha: dados.senha,
        }
      : {
          email: dados.email.trim().toLowerCase(),
          senha: dados.senha,
        }

    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}${endpoint}`, payload)
      salvarSessao(response.data)
      return response.data
    } catch (error) {
      const mensagemErro = error?.response?.data?.error || "Nao foi possivel concluir a autenticacao."
      throw new Error(mensagemErro)
    }
  }

  const handleAtualizarPerfil = async (dados) => {
    if (!authSession?.token) {
      throw new Error("Sessao expirada. Entre novamente.")
    }

    try {
      const response = await axios.patch(
        `${AUTH_SERVICE_URL}/auth/me`,
        {
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${authSession.token}`,
          },
        },
      )

      const sessaoAtualizada = {
        ...authSession,
        usuario: response.data.usuario,
      }

      salvarSessao(sessaoAtualizada)
      return response.data
    } catch (error) {
      const mensagemErro = error?.response?.data?.error || "Nao foi possivel atualizar o perfil."
      throw new Error(mensagemErro)
    }
  }

  const handleAlterarSenha = async (dados) => {
    if (!authSession?.token) {
      throw new Error("Sessao expirada. Entre novamente.")
    }

    try {
      const response = await axios.patch(`${AUTH_SERVICE_URL}/auth/me/senha`, dados, {
        headers: {
          Authorization: `Bearer ${authSession.token}`,
        },
      })

      return response.data
    } catch (error) {
      const mensagemErro = error?.response?.data?.error || "Nao foi possivel atualizar a senha."
      throw new Error(mensagemErro)
    }
  }

  const handleExcluirConta = async () => {
    if (!authSession?.token) {
      throw new Error("Sessao expirada. Entre novamente.")
    }

    try {
      const response = await axios.delete(`${AUTH_SERVICE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authSession.token}`,
        },
      })

      setValidandoSessao(false)
      setAuthSession(null)
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      window.setTimeout(() => {
        window.location.href = "/"
      }, 600)

      return response.data
    } catch (error) {
      const mensagemErro = error?.response?.data?.error || "Nao foi possivel excluir a conta."
      throw new Error(mensagemErro)
    }
  }

  // Estado global simples de tema para toda a aplicacao (claro/escuro).
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "light"
    const savedTheme = window.localStorage.getItem("theme-mode")
    return savedTheme === "dark" ? "dark" : "light"
  })

  // Sincroniza o tema com Bootstrap e persistencia local.
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", themeMode)
    window.localStorage.setItem("theme-mode", themeMode)
  }, [themeMode])

  // Acao do botao da barra superior para alternar tema.
  const handleToggleTheme = () => {
    setThemeMode((currentTheme) => (currentTheme === "light" ? "dark" : "light"))
  }

  const appShellStyle = {
    minHeight: "100vh",
    backgroundColor: themeMode === "dark" ? "#0b1220" : "#f8f9fa",
    color: themeMode === "dark" ? "#e6f0ff" : "#212529",
  }

  // Roteamento simples por URL sem biblioteca extra:
  // se a rota for "/rastreamento", exibimos a pagina dedicada do painel.
  // se a rota for "/precos", exibimos a pagina de precos.
  const isTrackingPage = window.location.pathname === "/rastreamento"
  const isPrecosPage = window.location.pathname === "/precos"
  const isSuportePage = window.location.pathname === "/suporte"
  const isLoginPage = window.location.pathname === "/login"
  const isContaPage = window.location.pathname === "/conta"
  const topBarProps = {
    themeMode,
    onToggleTheme: handleToggleTheme,
    usuario: validandoSessao ? null : authSession?.usuario,
    onLogout: handleLogout,
  }

  if (isTrackingPage) {
    return (
      <div style={appShellStyle}>
        <TopBar {...topBarProps} />
        <main>
          <DroneTrackingSection
            themeMode={themeMode}
            rota={rota}
            buscarRota={buscarRota}
            mapServiceUrl={MAP_SERVICE_URL}
          />
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  if (isPrecosPage) {
    return (
      <div style={appShellStyle}>
        <TopBar {...topBarProps} />
        <main>
          <PrecosPage themeMode={themeMode} onContatar={handleContatarVendas} />
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  if (isSuportePage) {
    return (
      <div style={appShellStyle}>
        <TopBar {...topBarProps} />
        <main>
          <SuportePage themeMode={themeMode} onContatar={handleContatarVendas} />
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  if (isLoginPage) {
    if (!validandoSessao && authSession?.usuario) {
      window.location.href = "/"
      return null
    }

    return (
      <div style={appShellStyle}>
        <TopBar {...topBarProps} />
        <main>
          <LoginPage
            themeMode={themeMode}
            authServiceUrl={AUTH_SERVICE_URL}
            onAutenticar={handleAutenticacao}
          />
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  if (isContaPage) {
    if (!validandoSessao && !authSession?.usuario) {
      window.location.href = "/login"
      return null
    }

    return (
      <div style={appShellStyle}>
        <TopBar {...topBarProps} />
        <main>
          {validandoSessao ? (
            <section className="py-5" style={{ minHeight: "calc(100vh - 72px)" }}>
              <div className="container">
                <div className="d-flex align-items-center gap-3">
                  <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
                  <p className="mb-0 fw-semibold">Validando sessao...</p>
                </div>
              </div>
            </section>
          ) : (
            <AccountPage
              themeMode={themeMode}
              usuario={authSession.usuario}
              onAtualizarPerfil={handleAtualizarPerfil}
              onAlterarSenha={handleAlterarSenha}
              onExcluirConta={handleExcluirConta}
            />
          )}
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  return (
    <div style={appShellStyle}>
      <TopBar {...topBarProps} />
      <Hero
        funcao1={() => { window.location.href = "/login" }}
        funcao2={() => { window.location.href = "/rastreamento" }}
      />
      <div className={`container border mt-4 ${themeMode === "dark" ? "border-secondary" : ""}`}>
      <div className="row g-4">
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="1. Pedido">
          <Pedido 
            data="Escolha itens"
            icone="shopping-cart"
            titulo="Pedido"
            descricao="Escolha seus itens através do aplicativo SkySwift e defina seu ponto de entrega com precisão GPS."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
            </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="2. Voo">
          <Pedido 
            data="Em trânsito"
            icone="plane"
            titulo="Voo"
            descricao="Nossos drones autônomos calculam a rota mais rápida e segura para o seu destino, contornando o tráfego terrestre."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="3. Entrega">
          <Pedido
            data="Pouso em breve"
            icone="map-marker"
            titulo="Entrega"
            descricao="Um pouso preciso garante que seu pacote chegue com segurança na sua porta ou quintal."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="4. Rastreamento">
          <Pedido
            data="Tempo real"
            icone="location-arrow"
            titulo="Rastreamento"
            descricao="Monitore sua entrega em tempo real com coordenadas GPS ao vivo e hora estimada de chegada."/>
            {/* CTA da home para abrir a pagina dedicada de rastreamento */}
            <a href="/rastreamento" className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</a>
          </Cartao>
        </div>
      </div>
      <Advantages themeMode={themeMode} />
      <CallToAction
        funcao1={() => { window.location.href = "/login" }}
        funcao2={handleContatarVendas}
        onEnviarMensagem={handleEnviarMensagemDireto}
      />
      </div>
      <Footer themeMode={themeMode} />
    </div>
  )
}

export default App
