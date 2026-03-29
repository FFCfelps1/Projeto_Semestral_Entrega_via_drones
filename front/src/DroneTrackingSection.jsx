const DroneTrackingSection = () => {
  // Estilos migrados de CSS para JS para manter o componente autocontido.
  const panelBaseStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
    gap: "1rem",
    minHeight: "340px",
    padding: "1.25rem",
    borderRadius: "18px",
    border: "1px solid #2a3344",
    background: "linear-gradient(160deg, #121826 0%, #0e1522 55%, #0a111d 100%)",
    boxShadow: "0 14px 36px rgba(8, 13, 24, 0.45)",
  };

  // Base compartilhada entre a área principal e a área lateral do painel.
  const panelAreaBaseStyle = {
    minHeight: "280px",
    borderRadius: "14px",
    border: "1px solid rgba(89, 109, 140, 0.35)",
    backgroundColor: "rgba(13, 20, 33, 0.55)",
  };

  // Área principal configurada em coluna para comportar busca + mapa mock.
  const mainAreaStyle = {
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  // Campo visual de busca fake (sem funcionalidade real).
  const searchBarStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.55rem 0.75rem",
    borderRadius: "10px",
    border: "1px solid rgba(112, 146, 191, 0.35)",
    backgroundColor: "rgba(8, 15, 29, 0.72)",
  };

  const searchIconStyle = {
    color: "#89acd8",
    fontSize: "0.85rem",
  };

  const searchInputStyle = {
    width: "100%",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#d6e6ff",
    fontSize: "0.9rem",
  };

  // Camada visual simulando "mapa" com gradiente e textura estática.
  const mapMockStyle = {
    width: "100%",
    flex: 1,
    minHeight: "248px",
    position: "relative",
    overflow: "hidden",
    borderRadius: "10px",
    border: "1px solid rgba(116, 148, 189, 0.25)",
    backgroundColor: "#0a1322",
    backgroundImage:
      "radial-gradient(circle at 20% 22%, rgba(45, 95, 178, 0.25), transparent 45%), radial-gradient(circle at 78% 80%, rgba(28, 126, 132, 0.22), transparent 44%), repeating-linear-gradient(90deg, rgba(111, 148, 196, 0.09) 0, rgba(111, 148, 196, 0.09) 1px, transparent 1px, transparent 42px), repeating-linear-gradient(0deg, rgba(111, 148, 196, 0.07) 0, rgba(111, 148, 196, 0.07) 1px, transparent 1px, transparent 42px)",
    boxShadow: "inset 0 0 28px rgba(3, 7, 15, 0.6)",
  };

  // Controles decorativos de zoom posicionados sobre o mapa simulado.
  const zoomControlsStyle = {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  };

  const zoomButtonStyle = {
    width: "2rem",
    height: "2rem",
    border: "1px solid rgba(134, 173, 220, 0.45)",
    borderRadius: "0.5rem",
    backgroundColor: "rgba(6, 14, 26, 0.82)",
    color: "#d5e8ff",
    fontSize: "1.05rem",
    fontWeight: 700,
    lineHeight: 1,
    cursor: "default",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

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
        <div style={panelBaseStyle}>
          {/* mock visual da area de mapa (estatico, sem mapa real). */}
          <div style={{ ...panelAreaBaseStyle, ...mainAreaStyle }}>
            {/* campo de busca fake apenas visual (sem funcionalidade). */}
            <div style={searchBarStyle} aria-hidden="true">
              <i className="fa-solid fa-magnifying-glass" style={searchIconStyle} />
              <input type="text" placeholder="Buscar rota simulada" readOnly style={searchInputStyle} />
            </div>
            {/* Camada visual simulada de mapa/logistica para receber elementos futuros. */}
            <div style={mapMockStyle}>
              {/* Botoes de zoom apenas visuais, sem acao real. */}
              <div style={zoomControlsStyle} aria-hidden="true">
                <button type="button" style={zoomButtonStyle} tabIndex={-1}>
                  +
                </button>
                <button type="button" style={zoomButtonStyle} tabIndex={-1}>
                  -
                </button>
              </div>
            </div>
          </div>
          {/* Coluna lateral (direita): recebera detalhes mockados de entrega nas proximas etapas. */}
          <aside style={panelAreaBaseStyle} />
        </div>
      </div>
    </section>
  );
};

export default DroneTrackingSection;
