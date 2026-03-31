const Advantages = ({ themeMode = "light" }) => {
  const isDarkMode = themeMode === "dark";

  // Paleta local da secao para manter contraste adequado em claro e escuro.
  const sectionStyle = {
    backgroundColor: isDarkMode ? "#0f172a" : "#f8f9fa",
  };

  const headingTitleStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
  };

  const headingSubtitleStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? "rgba(17, 27, 44, 0.92)" : "#ffffff",
    borderRadius: "8px",
    boxShadow: isDarkMode ? "0 1px 3px rgba(0, 0, 0, 0.32)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: isDarkMode ? "1px solid rgba(122, 153, 193, 0.24)" : "1px solid rgba(0, 0, 0, 0.05)",
  };

  const iconWrapStyle = {
    width: "60px",
    height: "60px",
    backgroundColor: isDarkMode ? "#1b2a44" : "#e7f3ff",
    borderRadius: "8px",
  };

  const cardTitleStyle = {
    fontSize: "clamp(1rem, 2vw, 1.125rem)",
    color: isDarkMode ? "#e6f1ff" : "#1f2937",
  };

  const cardDescriptionStyle = {
    fontSize: "clamp(0.875rem, 1.5vw, 0.95rem)",
    color: isDarkMode ? "#abc1d9" : "#6c757d",
  };

  const advantages = [
    {
      id: 1,
      icon: "fighter-jet",
      title: "Entrega Ultra Rápida",
      description: "Contorne o congestionamento urbano com tempos de entrega médios em menos de 15 minutos.",
    },
    {
      id: 2,
      icon: "leaf",
      title: "Operações Ecológicas",
      description: "A frota segura reduz significativamente a pegada de carbono por quilômetro.",
    },
    {
      id: 3,
      icon: "shield",
      title: "Segurança de Nível Bancário",
      description: "Rastreamento criptografado em tempo real e compartimentos à prova de violação.",
    },
  ];

  return (
    <section className="py-5" style={sectionStyle}>
      <div className="container">
        {/* Heading Section */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="display-5 fw-bold mb-3" style={headingTitleStyle}>A Vantagem SkySwift</h2>
            <p className="lead mb-0" style={headingSubtitleStyle}>
              Por que milhares de negócios modernos e consumidores estão migrando para a logística de drones.
            </p>
          </div>
        </div>

        {/* Advantages Cards */}
        <div className="row g-4">
          {advantages.map((advantage) => (
            <div key={advantage.id} className="col-sm-12 col-md-6 col-lg-4">
              <div className="d-flex gap-3 p-3 h-100" style={cardStyle}>
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="d-flex align-items-center justify-content-center" style={iconWrapStyle}>
                    <i className={`fa fa-${advantage.icon} fa-xl text-primary`}></i>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-2" style={cardTitleStyle}>
                    {advantage.title}
                  </h5>
                  <p className="small mb-0" style={cardDescriptionStyle}>
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
