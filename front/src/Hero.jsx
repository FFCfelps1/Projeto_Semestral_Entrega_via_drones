const Hero = (props) => {
  const titulo = props.titulo || "O Futuro da Entrega Chegou";
  const subtitulo = props.subtitulo || "Experimente a velocidade e eficiência da entrega autônoma por drones. Rápido, confiável e direto para sua porta em minutos.";
  const textoBotao1 = props.textoBotao1 || "Comece a Enviar";
  const textoBotao2 = props.textoBotao2 || "Ver Cobertura";
  const funcao1 = props.funcao1 || (() => alert("Redirecionando para checkout..."));
  const funcao2 = props.funcao2 || (() => alert("Visualizando mapa de cobertura..."));

  return (
    <section className="bg-dark text-white py-5">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-8 mx-auto text-center">
            <h1 className="display-4 fw-bold mb-3" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.5rem)' }}>
              {titulo}
            </h1>
            <p className="lead mb-4" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
              {subtitulo}
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button 
                className="btn btn-primary" 
                onClick={funcao1}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
              >
                {textoBotao1}
              </button>
              <button 
                className="btn btn-outline-light" 
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

export default Hero;
