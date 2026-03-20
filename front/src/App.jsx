import Pedido from "./Pedido.jsx"
import Cartao from "./Cartao.jsx"
import Feedback from "./Feedback.jsx"
import TopBar from "./TopBar.jsx"
import Hero from "./Hero.jsx"
import Advantages from "./Advantages.jsx"
import CallToAction from "./CallToAction.jsx"
import Footer from "./Footer.jsx"


const App = () => {

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
    <>
      <TopBar />
      <Hero />
      <div className="container border mt-4">
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
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
      </div>
      <Advantages />
      <CallToAction />
      </div>
      <Footer />
    </>
  )
}

export default App