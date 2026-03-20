const CallToAction = (props) => {
  const titulo = props.titulo || "Ready to take flight with SkySwift?";
  const subtitulo = props.subtitulo || "Sign up today and get your first delivery completely free. Join the future of autonomous logistics.";
  const textoBotao1 = props.textoBotao1 || "Get Started Free";
  const textoBotao2 = props.textoBotao2 || "Contact Sales";
  const funcao1 = props.funcao1 || (() => alert("Redirecionando para cadastro..."));
  const funcao2 = props.funcao2 || (() => alert("Entrando em contato com vendas..."));

  return (
    <section className="bg-primary text-white py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="display-5 fw-bold mb-3" style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)' }}>
              {titulo}
            </h2>
            <p className="lead mb-4" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
              {subtitulo}
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button
                className="btn btn-light btn-lg fw-bold"
                onClick={funcao1}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
              >
                {textoBotao1}
              </button>
              <button
                className="btn btn-outline-light btn-lg fw-bold"
                onClick={funcao2}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
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
