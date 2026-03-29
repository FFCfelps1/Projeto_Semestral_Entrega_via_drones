import "./DroneTrackingSection.css";

const DroneTrackingSection = () => {
  return (
    <section id="drone-tracking-panel" aria-label="Painel de rastreamento por drones">
      <div className="container">
        {/* Cabecalho inicial da pagina de rastreamento*/}
        <header className="py-4">
          <h2 className="h3 mb-2">Painel de Rastreamento Aereo</h2>
          <p className="text-body-secondary mb-0">
            Acompanhe uma simulacao visual do fluxo logistico das entregas por drones.
          </p>
        </header>
        {/* container principal escuro do painel (bloco visual base). */}
        <div className="drone-tracking-section-base" />
      </div>
    </section>
  );
};

export default DroneTrackingSection;
