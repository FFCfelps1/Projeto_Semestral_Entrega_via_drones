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
import axios from "axios"
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet"

const MAP_SERVICE_URL = "http://localhost:3002"
const EMAIL_SERVICE_URL = "http://localhost:3003"

const App = () => {
  const [rota, setRota] = useState(null)
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

  if (isTrackingPage) {
    return (
      <div style={appShellStyle}>
        <TopBar themeMode={themeMode} onToggleTheme={handleToggleTheme} />
        <main>
          <DroneTrackingSection themeMode={themeMode} rota={rota} buscarRota={buscarRota}/>
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  if (isPrecosPage) {
    return (
      <div style={appShellStyle}>
        <TopBar themeMode={themeMode} onToggleTheme={handleToggleTheme} />
        <main>
          <PrecosPage themeMode={themeMode} onContatar={handleContatarVendas} />
        </main>
        <Footer themeMode={themeMode} />
      </div>
    )
  }

  return (
    <div style={appShellStyle}>
      <TopBar themeMode={themeMode} onToggleTheme={handleToggleTheme} />
      <Hero />
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
        funcao1={() => { window.location.href = "/precos" }}
        funcao2={handleContatarVendas}
        onEnviarMensagem={handleEnviarMensagemDireto}
      />
      </div>
      <Footer themeMode={themeMode} />
    </div>
  )
}

export default App
