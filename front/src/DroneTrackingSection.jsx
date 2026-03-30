const DroneTrackingSection = () => {
  // Breakpoints simples para adaptar layout em tablet e mobile.
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const isTabletLayout = viewportWidth <= 1024 && viewportWidth > 640;
  const isMobileLayout = viewportWidth <= 640;

  // Fonte unica de dados mockados para facilitar ajustes sem mexer na estrutura visual.
  const trackingMock = {
    searchPlaceholder: "Buscar rota simulada",
    originLabel: "Origem",
    destinationLabel: "Destino",
    droneLabel: "Drone SW-01",
    trackingId: "SW-TRK-2039",
    packageName: "Kit de Sensores Aereos",
    packageWeight: "Peso: 1.2 kg",
    packageVolume: "Volume: 24 x 18 x 12 cm",
    originIconClass: "fa-location-dot",
    destinationIconClass: "fa-flag-checkered",
    originAddress: "Centro Logistico SkySwift, Bloco B",
    destinationAddress: "Av. das Palmeiras, 245 - Jardim Aurora",
    telemetry: [
      { iconClass: "fa-battery-three-quarters", label: "Bateria", value: "84%" },
      { iconClass: "fa-signal", label: "Sinal", value: "Estavel" },
      { iconClass: "fa-clock", label: "Chegada", value: "Em 12 min" },
    ],
    flightStatus: "Em voo",
    flightStatusIconClass: "fa-plane-departure",
    progressValue: "68%",
    estimatedArrivalIconClass: "fa-clock",
    estimatedArrivalLabel: "Chegada estimada: 19:40",
  };

  // Estilos migrados de CSS para JS para manter o componente autocontido.
  const panelBaseStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "340px",
    padding: isMobileLayout ? "1rem" : "1.25rem",
    borderRadius: "18px",
    border: "1px solid #2a3344",
    background: "linear-gradient(160deg, #121826 0%, #0e1522 55%, #0a111d 100%)",
    boxShadow: "0 14px 36px rgba(8, 13, 24, 0.45)",
  };

  // Grade principal do painel com coluna de mapa e coluna lateral.
  const panelGridStyle = {
    display: "grid",
    gridTemplateColumns: isTabletLayout || isMobileLayout ? "1fr" : "minmax(0, 2fr) minmax(260px, 1fr)",
    gap: isMobileLayout ? "0.75rem" : "1rem",
    minHeight: isTabletLayout || isMobileLayout ? "auto" : "280px",
  };

  // Base compartilhada entre a área principal e a área lateral do painel.
  const panelAreaBaseStyle = {
    minHeight: isMobileLayout ? "220px" : isTabletLayout ? "240px" : "280px",
    borderRadius: "14px",
    border: "1px solid rgba(89, 109, 140, 0.35)",
    backgroundColor: "rgba(13, 20, 33, 0.55)",
  };

  // Área principal configurada em coluna para comportar busca + mapa mock.
  const mainAreaStyle = {
    padding: isMobileLayout ? "0.6rem" : "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: isMobileLayout ? "0.6rem" : "0.75rem",
  };

  // Campo visual de busca fake (sem funcionalidade real).
  const searchBarStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: isMobileLayout ? "0.5rem 0.65rem" : "0.55rem 0.75rem",
    borderRadius: "10px",
    border: "1px solid rgba(112, 146, 191, 0.35)",
    backgroundColor: "rgba(8, 15, 29, 0.72)",
  };

  const searchIconStyle = {
    color: "#89acd8",
    fontSize: isMobileLayout ? "0.8rem" : "0.85rem",
  };

  const searchInputStyle = {
    width: "100%",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#d6e6ff",
    fontSize: isMobileLayout ? "0.82rem" : "0.9rem",
  };

  // Camada visual simulando "mapa" com gradiente e textura estática.
  const mapMockStyle = {
    width: "100%",
    flex: 1,
    minHeight: isMobileLayout ? "190px" : "248px",
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
    top: isMobileLayout ? "0.55rem" : "0.75rem",
    right: isMobileLayout ? "0.55rem" : "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: isMobileLayout ? "0.35rem" : "0.45rem",
  };

  const zoomButtonStyle = {
    width: isMobileLayout ? "1.75rem" : "2rem",
    height: isMobileLayout ? "1.75rem" : "2rem",
    border: "1px solid rgba(134, 173, 220, 0.45)",
    borderRadius: "0.5rem",
    backgroundColor: "rgba(6, 14, 26, 0.82)",
    color: "#d5e8ff",
    fontSize: isMobileLayout ? "0.95rem" : "1.05rem",
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
    gap: isMobileLayout ? "0.35rem" : "0.45rem",
    pointerEvents: "none",
  };

  const droneMarkerIconStyle = {
    width: isMobileLayout ? "2rem" : "2.35rem",
    height: isMobileLayout ? "2rem" : "2.35rem",
    borderRadius: "999px",
    border: "1px solid rgba(161, 209, 255, 0.6)",
    backgroundColor: "rgba(20, 48, 85, 0.86)",
    color: "#d4ebff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 6px rgba(98, 155, 233, 0.14)",
    fontSize: isMobileLayout ? "0.82rem" : "0.95rem",
  };

  const droneMarkerLabelStyle = {
    padding: isMobileLayout ? "0.2rem 0.45rem" : "0.25rem 0.5rem",
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
    width: isMobileLayout ? "0.68rem" : "0.78rem",
    height: isMobileLayout ? "0.68rem" : "0.78rem",
    borderRadius: "999px",
    border: "2px solid rgba(9, 19, 34, 0.9)",
    boxShadow: "0 0 0 3px rgba(167, 213, 255, 0.2)",
  };

  const routePointLabelStyle = {
    padding: isMobileLayout ? "0.18rem 0.36rem" : "0.2rem 0.4rem",
    borderRadius: "999px",
    backgroundColor: "rgba(6, 14, 26, 0.82)",
    border: "1px solid rgba(125, 170, 219, 0.35)",
    color: "#cfe6ff",
    fontSize: isMobileLayout ? "0.62rem" : "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };

  // Estrutura inicial do painel lateral de detalhes.
  // Ajuste de ritmo visual: espacamentos verticais mais consistentes entre os blocos.
  const detailsPanelStyle = {
    ...panelAreaBaseStyle,
    display: "flex",
    flexDirection: "column",
    padding: isMobileLayout ? "0.7rem" : "1rem",
    gap: isMobileLayout ? "0.75rem" : "0.95rem",
  };

  // Refino tipografico: separa melhor titulos, labels e valores na coluna lateral.
  const detailsTitleStyle = {
    margin: 0,
    color: "#d9ecff",
    fontSize: isMobileLayout ? "0.95rem" : "1.05rem",
    fontWeight: 800,
    letterSpacing: "0.01em",
  };

  const detailsDividerStyle = {
    height: "1px",
    border: 0,
    margin: "0.1rem 0 0.15rem 0",
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
    padding: isMobileLayout ? "0.62rem 0.72rem" : "0.7rem 0.8rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.34rem",
  };

  // Refino de contraste nos textos secundarios dos cards para facilitar leitura.
  const trackingIdLabelStyle = {
    margin: 0,
    color: "#b3cbe8",
    fontSize: isMobileLayout ? "0.68rem" : "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const trackingIdValueStyle = {
    margin: 0,
    color: "#e2f2ff",
    fontSize: isMobileLayout ? "0.88rem" : "0.96rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
  };

  // Card com informações estáticas do pacote.
  const packageCardStyle = {
    borderRadius: "0.7rem",
    border: "1px solid rgba(126, 171, 220, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: isMobileLayout ? "0.62rem 0.72rem" : "0.7rem 0.8rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const packageTitleStyle = {
    margin: 0,
    color: "#b3cbe8",
    fontSize: isMobileLayout ? "0.68rem" : "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const packageNameStyle = {
    margin: 0,
    color: "#e2f2ff",
    fontSize: isMobileLayout ? "0.86rem" : "0.94rem",
    fontWeight: 700,
  };

  const packageMetaStyle = {
    margin: 0,
    color: "#c8dcf2",
    fontSize: isMobileLayout ? "0.73rem" : "0.78rem",
    lineHeight: 1.35,
  };

  // Bloco estático de origem e destino da entrega.
  const routeDetailsCardStyle = {
    borderRadius: "0.7rem",
    border: "1px solid rgba(126, 171, 220, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: isMobileLayout ? "0.62rem 0.72rem" : "0.7rem 0.8rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  };

  const routeDetailsTitleStyle = {
    margin: 0,
    color: "#b3cbe8",
    fontSize: isMobileLayout ? "0.68rem" : "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const routeItemLabelStyle = {
    margin: 0,
    color: "#bdd4ec",
    fontSize: isMobileLayout ? "0.64rem" : "0.66rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  };

  // Linha de cabecalho dos itens de rota com iconografia auxiliar.
  const routeItemHeaderStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  };

  const routeItemIconStyle = {
    color: "#9fd4ff",
    fontSize: isMobileLayout ? "0.65rem" : "0.7rem",
  };

  const routeItemValueStyle = {
    margin: "0.12rem 0 0 0",
    color: "#e2f1ff",
    fontSize: isMobileLayout ? "0.74rem" : "0.8rem",
    lineHeight: 1.3,
  };

  // Indicadores visuais de telemetria com dados mockados.
  // Em telas mobile, os cards ficam em duas colunas para preservar legibilidade.
  const telemetrySectionStyle = {
    display: "grid",
    gridTemplateColumns: isMobileLayout ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(88px, 1fr))",
    gap: isMobileLayout ? "0.55rem" : "0.6rem",
  };

  const telemetryCardStyle = {
    borderRadius: "0.65rem",
    border: "1px solid rgba(124, 170, 219, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    padding: isMobileLayout ? "0.5rem" : "0.55rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.34rem",
    minHeight: isMobileLayout ? "3.8rem" : "4.25rem",
  };

  const telemetryIconStyle = {
    color: "#9fd4ff",
    fontSize: "0.78rem",
  };

  const telemetryLabelStyle = {
    margin: 0,
    color: "#b2cce8",
    fontSize: isMobileLayout ? "0.58rem" : "0.62rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  };

  const telemetryValueStyle = {
    margin: 0,
    color: "#e5f4ff",
    fontSize: isMobileLayout ? "0.76rem" : "0.84rem",
    fontWeight: 700,
    lineHeight: 1.2,
  };

  // Botao visual de ação do painel (sem comportamento real).
  const detailsActionButtonStyle = {
    width: "100%",
    border: "1px solid rgba(128, 186, 245, 0.5)",
    borderRadius: "0.65rem",
    background: "linear-gradient(180deg, rgba(30, 94, 163, 0.95) 0%, rgba(16, 67, 121, 0.95) 100%)",
    color: "#ecf6ff",
    fontSize: isMobileLayout ? "0.76rem" : "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    padding: isMobileLayout ? "0.56rem 0.68rem" : "0.62rem 0.75rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    marginTop: isMobileLayout ? "0.05rem" : "0.1rem",
    cursor: "default",
    boxShadow: "0 8px 18px rgba(8, 20, 39, 0.35)",
  };

  // Estrutura base da barra inferior de status.
  // O bloco de status reduz margens e tipografia no mobile para evitar quebra.
  const statusBarWrapStyle = {
    marginTop: isMobileLayout ? "0.7rem" : "0.85rem",
    borderRadius: "0.7rem",
    border: "1px solid rgba(124, 170, 219, 0.35)",
    backgroundColor: "rgba(8, 16, 30, 0.62)",
    minHeight: isMobileLayout ? "2.45rem" : "2.6rem",
    padding: isMobileLayout ? "0.5rem 0.6rem" : "0.55rem 0.7rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
  };

  const statusBarPlaceholderStyle = {
    flex: 1,
    height: "0.6rem",
    borderRadius: "999px",
    backgroundColor: "rgba(123, 160, 205, 0.22)",
    overflow: "hidden",
  };

  const statusProgressFillStyle = {
    width: trackingMock.progressValue,
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #69b8ff 0%, #9ad7ff 100%)",
  };

  const statusProgressRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: isMobileLayout ? "0.45rem" : "0.55rem",
  };

  const statusProgressValueStyle = {
    margin: 0,
    color: "#d6ebff",
    fontSize: isMobileLayout ? "0.7rem" : "0.76rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  };

  const statusEtaTextStyle = {
    margin: 0,
    color: "#c8e0f8",
    fontSize: isMobileLayout ? "0.64rem" : "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
  };

  const statusFlightTitleStyle = {
    margin: 0,
    color: "#d8ecff",
    fontSize: isMobileLayout ? "0.74rem" : "0.82rem",
    fontWeight: 800,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  };

  // Linhas com icones no status para reforcar leitura visual dos dados.
  const statusTitleRowStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  };

  const statusEtaRowStyle = {
    marginTop: isMobileLayout ? "0.34rem" : "0.42rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  };

  const statusInlineIconStyle = {
    color: "#9fd4ff",
    fontSize: isMobileLayout ? "0.68rem" : "0.72rem",
  };

  // Ajuste fino de hierarquia do cabeçalho da página de rastreamento.
  const sectionTitleStyle = {
    margin: 0,
    color: "#1f2937",
    fontSize: "clamp(1.35rem, 2.7vw, 1.75rem)",
    fontWeight: 800,
    letterSpacing: "0.01em",
  };

  const sectionSubtitleStyle = {
    margin: "0.45rem 0 0 0",
    color: "#9fb9d7",
    fontSize: isMobileLayout ? "0.86rem" : "0.94rem",
    lineHeight: 1.5,
    maxWidth: isMobileLayout ? "100%" : "60ch",
  };

  return (
    <section id="drone-tracking-panel" aria-label="Painel de rastreamento por drones">
      <div className="container">
        {/* Cabecalho inicial da pagina de rastreamento*/}
        <header className="py-4">
          <h2 className="h3 mb-2" style={sectionTitleStyle}>
            Painel de Rastreamento Aereo
          </h2>
          <p className="mb-0" style={sectionSubtitleStyle}>
            Acompanhe uma simulacao visual do fluxo logistico das entregas por drones.
          </p>
        </header>
        {/* divisao estrutural do painel em area principal e area lateral. */}
        <div style={panelBaseStyle}>
          <div style={panelGridStyle}>
            {/* mock visual da area de mapa (estatico, sem mapa real). */}
            <div style={{ ...panelAreaBaseStyle, ...mainAreaStyle }}>
              {/* campo de busca fake apenas visual (sem funcionalidade). */}
              <div style={searchBarStyle} aria-hidden="true">
                <i className="fa-solid fa-magnifying-glass" style={searchIconStyle} />
                <input type="text" placeholder={trackingMock.searchPlaceholder} readOnly style={searchInputStyle} />
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
                  <span style={routePointLabelStyle}>{trackingMock.originLabel}</span>
                </div>
                <div style={{ ...routePointWrapBaseStyle, top: "20%", left: "88%" }} aria-hidden="true">
                  <span style={{ ...routePointDotStyle, backgroundColor: "#82f0b3" }} />
                  <span style={routePointLabelStyle}>{trackingMock.destinationLabel}</span>
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
                  <span style={droneMarkerLabelStyle}>{trackingMock.droneLabel}</span>
                </div>
              </div>
            </div>
            {/* Coluna lateral inicial para os detalhes da entrega. */}
            <aside style={detailsPanelStyle}>
              <h3 style={detailsTitleStyle}>Detalhes da Entrega</h3>
              <hr style={detailsDividerStyle} />
              <div style={trackingIdCardStyle}>
                <p style={trackingIdLabelStyle}>Tracking ID</p>
                <p style={trackingIdValueStyle}>{trackingMock.trackingId}</p>
              </div>
              <div style={packageCardStyle}>
                <p style={packageTitleStyle}>Pacote</p>
                <p style={packageNameStyle}>{trackingMock.packageName}</p>
                <p style={packageMetaStyle}>{trackingMock.packageWeight}</p>
                <p style={packageMetaStyle}>{trackingMock.packageVolume}</p>
              </div>
              <div style={routeDetailsCardStyle}>
                <p style={routeDetailsTitleStyle}>Rota</p>
                <div>
                  <div style={routeItemHeaderStyle}>
                    <i className={`fa-solid ${trackingMock.originIconClass}`} style={routeItemIconStyle} />
                    <p style={routeItemLabelStyle}>{trackingMock.originLabel}</p>
                  </div>
                  <p style={routeItemValueStyle}>{trackingMock.originAddress}</p>
                </div>
                <div>
                  <div style={routeItemHeaderStyle}>
                    <i className={`fa-solid ${trackingMock.destinationIconClass}`} style={routeItemIconStyle} />
                    <p style={routeItemLabelStyle}>{trackingMock.destinationLabel}</p>
                  </div>
                  <p style={routeItemValueStyle}>{trackingMock.destinationAddress}</p>
                </div>
              </div>
              <div style={telemetrySectionStyle}>
                {/* Renderizacao dos indicadores com base na lista mock centralizada. */}
                {trackingMock.telemetry.map((metric) => (
                  <div key={metric.label} style={telemetryCardStyle}>
                    <i className={`fa-solid ${metric.iconClass}`} style={telemetryIconStyle} />
                    <p style={telemetryLabelStyle}>{metric.label}</p>
                    <p style={telemetryValueStyle}>{metric.value}</p>
                  </div>
                ))}
              </div>
              <button type="button" style={detailsActionButtonStyle}>
                <i className="fa-solid fa-radar" />
                Painel de voo
              </button>
            </aside>
          </div>
          <div style={statusBarWrapStyle} aria-hidden="true">
            <div style={statusTitleRowStyle}>
              <i className={`fa-solid ${trackingMock.flightStatusIconClass}`} style={statusInlineIconStyle} />
              <p style={statusFlightTitleStyle}>{trackingMock.flightStatus}</p>
            </div>
            <div style={statusProgressRowStyle}>
              <div style={statusBarPlaceholderStyle}>
                <div style={statusProgressFillStyle} />
              </div>
              <p style={statusProgressValueStyle}>{trackingMock.progressValue}</p>
            </div>
            <div style={statusEtaRowStyle}>
              <i className={`fa-solid ${trackingMock.estimatedArrivalIconClass}`} style={statusInlineIconStyle} />
              <p style={statusEtaTextStyle}>{trackingMock.estimatedArrivalLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DroneTrackingSection;
