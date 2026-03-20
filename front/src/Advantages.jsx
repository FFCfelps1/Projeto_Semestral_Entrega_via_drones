const Advantages = () => {
  const advantages = [
    {
      id: 1,
      icon: "fighter-jet",
      title: "Entrega Ultra Rápida",
      description: "Contorne o congestionamento urbano com tempos de entrega médios em menos de 15 minutos."
    },
    {
      id: 2,
      icon: "leaf",
      title: "Operações Ecológicas",
      description: "A frota segura reduz significativamente a pegada de carbono por quilômetro."
    },
    {
      id: 3,
      icon: "shield",
      title: "Segurança de Nível Bancário",
      description: "Rastreamento criptografado em tempo real e compartimentos à prova de violação."
    }
  ];

  return (
    <section className="bg-light py-5">
      <div className="container">
        {/* Heading Section */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="display-5 fw-bold mb-3">A Vantagem SkySwift</h2>
            <p className="lead text-muted">
              Por que milhares de negócios modernos e consumidores estão migrando para a logística de drones.
            </p>
          </div>
        </div>

        {/* Advantages Cards */}
        <div className="row g-4">
          {advantages.map((advantage) => (
            <div key={advantage.id} className="col-sm-12 col-md-6 col-lg-4">
              <div className="d-flex gap-3 p-3 h-100" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                    <i className={`fa fa-${advantage.icon} fa-xl text-primary`}></i>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-2" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
                    {advantage.title}
                  </h5>
                  <p className="text-muted small mb-0" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 0.95rem)' }}>
                    {advantage.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;
