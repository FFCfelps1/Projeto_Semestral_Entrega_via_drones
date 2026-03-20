import Pedido from "./Pedido.jsx"
import Cartao from "./Cartao.jsx"
import Feedback from "./Feedback.jsx"
import TopBar from "./TopBar.jsx"
import Hero from "./Hero.jsx"


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
          cabecalho="1. Order">
          <Pedido 
            data="Choose items"
            icone="shopping-cart"
            titulo="Order"
            descricao="Choose your items through the SkySwift app and set your delivery point with GPS precision."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
            </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="2. Flight">
          <Pedido 
            data="In transit"
            icone="plane"
            titulo="Flight"
            descricao="Our autonomous drones calculate the fastest, safest route to your destination, bypassing ground traffic."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="3. Delivery">
          <Pedido
            data="Landing soon"
            icone="map-marker"
            titulo="Delivery"
            descricao="A precise hovering landing ensures your package arrives safely at your doorstep or backyard."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="4. Tracking">
          <Pedido
            data="Real-time"
            icone="location-arrow"
            titulo="Tracking"
            descricao="Monitor your delivery in real-time with live GPS coordinates and estimated arrival time."/>
            <button className="btn btn-primary btn-sm w-100 mt-auto">Clique para ver mais</button>
          </Cartao>
        </div>
      </div>
      </div>
    </>
  )
}

export default App