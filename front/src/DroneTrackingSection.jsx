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
        {/* divisao estrutural do painel em area principal e area lateral. */}
        <div className="drone-tracking-section-base">
          {/* mock visual da area de mapa (estatico, sem mapa real). */}
          <div className="drone-tracking-main-area">
            {/* Camada visual simulada de mapa/logistica para receber elementos futuros. */}
            <div className="drone-tracking-map-mock" />
          </div>
          {/* Coluna lateral (direita): recebera detalhes mockados de entrega nas proximas etapas. */}
          <aside className="drone-tracking-side-area" />
        </div>
      </div>
    </section>
  );
};

export default DroneTrackingSection;
