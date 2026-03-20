const CallToAction = (props) => {
  const titulo = props.titulo || "Pronto para decolar com SkySwift?";
  const subtitulo = props.subtitulo || "Cadastre-se hoje e receba sua primeira entrega gratuitamente. Junte-se ao futuro da logística autônoma.";
  const textoBotao1 = props.textoBotao1 || "Começar Gratuitamente";
  const textoBotao2 = props.textoBotao2 || "Contatar Vendas";
  const funcao1 = props.funcao1 || (() => alert("Redirecionando para cadastro..."));
  const funcao2 = props.funcao2 || (() => alert("Entrando em contato com vendas..."));

  return (
    <section className="bg-primary text-white py-3 py-md-5">
      <div className="container">
        <div className="row">
          <div className="col-12 col-lg-8 mx-auto text-center px-3 px-md-0">
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>
              {titulo}
            </h2>
            <p className="mb-4" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
              {subtitulo}
            </p>
            <div className="d-flex gap-2 gap-md-3 justify-content-center flex-column flex-sm-row">
              <button
                className="btn btn-light fw-bold w-100 w-sm-auto"
                onClick={funcao1}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: '0.5rem 1.5rem' }}
              >
                {textoBotao1}
              </button>
              <button
                className="btn btn-outline-light fw-bold w-100 w-sm-auto"
                onClick={funcao2}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: '0.5rem 1.5rem' }}
              >
                {textoBotao2}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
