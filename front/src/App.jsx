import Pedido from "./Pedido.jsx"
import Cartao from "./Cartao.jsx"
import Feedback from "./Feedback.jsx"
import TopBar from "./TopBar.jsx"


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
      <div className="container border mt-4">
      <div className="row">

        <div className="col-12">
          {/* i.fa-solid.fa-hippo */}
          <i className="fa fa-hippo fa-2x"></i>
        </div>

      </div>
      <div className="row">
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="1. Order">
          <Pedido 
            data="Choose items"
            icone="shopping-cart"
            titulo="Order"
            descricao="Choose your items through the SkySwift app and set your delivery point with GPS precision."/>
            {componenteFeedBack}
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
            {componenteFeedBack}
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
            {componenteFeedBack}
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
            {componenteFeedBack}
          </Cartao>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-12 text-center">
          <button className="btn btn-primary btn-lg">Clique para ver mais</button>
        </div>
      </div>
      </div>
    </>
  )
}

export default App