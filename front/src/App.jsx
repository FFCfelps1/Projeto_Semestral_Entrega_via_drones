import { useEffect, useState } from "react"
import Pedido from "./Pedido.jsx"
import Cartao from "./Cartao.jsx"
import Feedback from "./Feedback.jsx"
import TopBar from "./TopBar.jsx"
import Hero from "./Hero.jsx"
import Advantages from "./Advantages.jsx"
import CallToAction from "./CallToAction.jsx"
import Footer from "./Footer.jsx"
import DroneTrackingSection from "./DroneTrackingSection.jsx"
import axios from "axios"
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet"
const App = () => {
  const [rota, setRota] = useState(null)
  const buscarRota = async () =>{
    try {
       const response = await axios.get("http://localhost:3002/rota", {
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
  // aceita "/rastreamento" e "/rastreamento/".
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/"
  const isTrackingPage = normalizedPath === "/rastreamento"

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

  const textoOK = 'Já recebi'
  const textoNOK = 'Ainda não recebi'
  const funcaoOK = () => alert("Agradecemos o feedback")
  const funcaoNOK = () => alert("Verificamos")
  const componenteFeedBack = (
    <Feedback 
      funcaoOK={funcaoOK}
      funcaoNOK={funcaoNOK}
      textoNOK={textoNOK}
      textoOK={textoOK}
    />
  )

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
      <CallToAction />
      </div>
      <Footer themeMode={themeMode} />
    </div>
  )
}

export default App
