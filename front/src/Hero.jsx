const Hero = (props) => {
  const titulo = props.titulo || "O Futuro da Entrega Chegou";
  const subtitulo = props.subtitulo || "Experimente a velocidade e eficiência da entrega autônoma por drones. Rápido, confiável e direto para sua porta em minutos.";
  const textoBotao1 = props.textoBotao1 || "Comece a Enviar";
  const textoBotao2 = props.textoBotao2 || "Ver Cobertura";
  const funcao1 = props.funcao1 || (() => alert("Redirecionando para checkout..."));
  const funcao2 = props.funcao2 || (() => alert("Visualizando mapa de cobertura..."));

  return (
    <section 
      className="text-white py-5 position-relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuDyS7yPTxGGENxAQV1hUCCJPLi7u54eZKGRdNPNQpgZ_fN9C_tBnbQ8L3a3VN8qEedIlNypSdL-lfTI3u7eDi5bksNTgoixwXOsNUgQDAedyWm491MaDT5PIjsMC_HydvLdyLljNybR70f5cnul6OAEYfkFOHZFtLOMAS5SDDxRzLtq9fuGuwWpWmyFQll8SIpXuBAgBtcYq0nwV9nYM7nlnR7C5A2h0NO3ZQYsivY44IsXnoDU-XzTlPtiirXDGglcX5kJeC-SLROX)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Overlay escuro para melhorar legibilidade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1
        }}
      />
      
      <div className="container position-relative" style={{ zIndex: 2 }}>
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
