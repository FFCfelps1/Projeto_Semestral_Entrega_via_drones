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
          <i className="fa-solid fa-hippo fa-2x"></i>
        </div>

      </div>
      <div className="row">
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="22/03/2025">
          <Pedido 
            data="22/02/2026"
            icone="camera"
            titulo="Câmera"
            descricao="Uma câmera 4K"/>
            {componenteFeedBack}
            </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="18/03/2025">
          <Pedido 
            data="20/02/2026"
            icone="bicycle"
            titulo="Bicicleta"
            descricao="Uma bicicleta nova"/>
            {componenteFeedBack}
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="16/02/2026">
          <Pedido
            data="18/02/2026"
            icone="hippo"
            titulo="Hipopotaamo"
            descricao="Uma hipopotamo"/>
            {componenteFeedBack}
          </Cartao>
        </div>
        <div className="col-sm-12 col-md-6 col-xl-3">
          <Cartao
          cabecalho="16/05/2025">
          <Pedido
            data="16/02/2026"
            icone="pencil"
            titulo="Lápis"
            descricao="Lápis novo"/>
            {componenteFeedBack}
          </Cartao>
        </div>
      </div>
    </>
  )
}

export default App