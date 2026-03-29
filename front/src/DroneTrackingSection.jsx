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

  // Marcador visual fixo do drone no centro do mapa simulado.
  const droneMarkerWrapStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.45rem",
    pointerEvents: "none",
  };

  const droneMarkerIconStyle = {
    width: "2.35rem",
    height: "2.35rem",
    borderRadius: "999px",
    border: "1px solid rgba(161, 209, 255, 0.6)",
    backgroundColor: "rgba(20, 48, 85, 0.86)",
    color: "#d4ebff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 6px rgba(98, 155, 233, 0.14)",
    fontSize: "0.95rem",
  };

  const droneMarkerLabelStyle = {
    padding: "0.25rem 0.5rem",
    borderRadius: "999px",
    backgroundColor: "rgba(6, 14, 27, 0.86)",
    border: "1px solid rgba(141, 186, 236, 0.45)",
    color: "#c9e4ff",
    fontSize: "0.72rem",
    letterSpacing: "0.02em",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  // Rota simulada com linha pontilhada sobre o mapa mock.
  const routeOverlayStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  // Pontos estáticos para marcar origem e destino no traçado visual.
  const routePointWrapBaseStyle = {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    pointerEvents: "none",
  };

  const routePointDotStyle = {
    width: "0.78rem",
    height: "0.78rem",
    borderRadius: "999px",
    border: "2px solid rgba(9, 19, 34, 0.9)",
    boxShadow: "0 0 0 3px rgba(167, 213, 255, 0.2)",
  };

  const routePointLabelStyle = {
    padding: "0.2rem 0.4rem",
    borderRadius: "999px",
    backgroundColor: "rgba(6, 14, 26, 0.82)",
    border: "1px solid rgba(125, 170, 219, 0.35)",
    color: "#cfe6ff",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };

  // Estrutura inicial do painel lateral de detalhes.
  const detailsPanelStyle = {
    ...panelAreaBaseStyle,
    display: "flex",
    flexDirection: "column",
    padding: "0.9rem",
    gap: "0.85rem",
  };

  const detailsTitleStyle = {
    margin: 0,
    color: "#d9ecff",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.01em",
  };

  const detailsDividerStyle = {
    height: "1px",
    border: 0,
    margin: 0,
    backgroundColor: "rgba(124, 159, 204, 0.35)",
  };

  const detailsPlaceholderStyle = {
    minHeight: "3.2rem",
    borderRadius: "0.7rem",
    border: "1px dashed rgba(126, 171, 220, 0.4)",
    backgroundColor: "rgba(8, 16, 30, 0.5)",
  };

  // Bloco de identificação da entrega (mock estático).
  const trackingIdCardStyle = {
    borderRadius: "0.7rem",
    border: "1px solid rgba(126, 171, 220, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: "0.65rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  };

  const trackingIdLabelStyle = {
    margin: 0,
    color: "#9eb8d8",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  const trackingIdValueStyle = {
    margin: 0,
    color: "#e2f2ff",
    fontSize: "0.92rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
  };

  // Card com informações estáticas do pacote.
  const packageCardStyle = {
    borderRadius: "0.7rem",
    border: "1px solid rgba(126, 171, 220, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: "0.65rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  };

  const packageTitleStyle = {
    margin: 0,
    color: "#9eb8d8",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  const packageNameStyle = {
    margin: 0,
    color: "#e2f2ff",
    fontSize: "0.9rem",
    fontWeight: 700,
  };

  const packageMetaStyle = {
    margin: 0,
    color: "#b8cee8",
    fontSize: "0.76rem",
    lineHeight: 1.3,
  };

  // Bloco estático de origem e destino da entrega.
  const routeDetailsCardStyle = {
    borderRadius: "0.7rem",
    border: "1px solid rgba(126, 171, 220, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: "0.65rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
  };

  const routeDetailsTitleStyle = {
    margin: 0,
    color: "#9eb8d8",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  const routeItemLabelStyle = {
    margin: 0,
    color: "#a9c3e2",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  };

  const routeItemValueStyle = {
    margin: "0.12rem 0 0 0",
    color: "#dbeeff",
    fontSize: "0.78rem",
    lineHeight: 1.25,
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
              {/* Linha de rota pontilhada somente visual. */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={routeOverlayStyle} aria-hidden="true">
                <path
                  d="M 11 80 C 26 71, 34 62, 45 52 C 57 41, 69 34, 88 20"
                  stroke="rgba(160, 209, 255, 0.35)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 11 80 C 26 71, 34 62, 45 52 C 57 41, 69 34, 88 20"
                  stroke="#a8d6ff"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="2 5"
                />
              </svg>
              {/* Pontos estáticos de origem e destino para a rota simulada. */}
              <div style={{ ...routePointWrapBaseStyle, top: "80%", left: "11%" }} aria-hidden="true">
                <span style={{ ...routePointDotStyle, backgroundColor: "#67d6ff" }} />
                <span style={routePointLabelStyle}>Origem</span>
              </div>
              <div style={{ ...routePointWrapBaseStyle, top: "20%", left: "88%" }} aria-hidden="true">
                <span style={{ ...routePointDotStyle, backgroundColor: "#82f0b3" }} />
                <span style={routePointLabelStyle}>Destino</span>
              </div>
              {/* Botoes de zoom apenas visuais, sem acao real. */}
              <div style={zoomControlsStyle} aria-hidden="true">
                <button type="button" style={zoomButtonStyle} tabIndex={-1}>
                  +
                </button>
                <button type="button" style={zoomButtonStyle} tabIndex={-1}>
                  -
                </button>
              </div>
              {/* Marcador central estatico para representar o drone em rota. */}
              <div style={droneMarkerWrapStyle} aria-hidden="true">
                <span style={droneMarkerIconStyle}>
                  <i className="fa-solid fa-helicopter" />
                </span>
                <span style={droneMarkerLabelStyle}>Drone SW-01</span>
              </div>
            </div>
          </div>
          {/* Coluna lateral inicial para os detalhes da entrega. */}
          <aside style={detailsPanelStyle}>
            <h3 style={detailsTitleStyle}>Detalhes da Entrega</h3>
            <hr style={detailsDividerStyle} />
            <div style={trackingIdCardStyle}>
              <p style={trackingIdLabelStyle}>Tracking ID</p>
              <p style={trackingIdValueStyle}>SW-TRK-2039</p>
            </div>
            <div style={packageCardStyle}>
              <p style={packageTitleStyle}>Pacote</p>
              <p style={packageNameStyle}>Kit de Sensores Aereos</p>
              <p style={packageMetaStyle}>Peso: 1.2 kg</p>
              <p style={packageMetaStyle}>Volume: 24 x 18 x 12 cm</p>
            </div>
            <div style={routeDetailsCardStyle}>
              <p style={routeDetailsTitleStyle}>Rota</p>
              <div>
                <p style={routeItemLabelStyle}>Origem</p>
                <p style={routeItemValueStyle}>Centro Logistico SkySwift, Bloco B</p>
              </div>
              <div>
                <p style={routeItemLabelStyle}>Destino</p>
                <p style={routeItemValueStyle}>Av. das Palmeiras, 245 - Jardim Aurora</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default DroneTrackingSection;
