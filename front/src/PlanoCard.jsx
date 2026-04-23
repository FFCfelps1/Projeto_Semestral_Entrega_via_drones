const PlanoCard = ({ themeMode = "light", plano }) => {
  const isDarkMode = themeMode === "dark";
  const destaque = plano.destaque || false;

  const cardStyle = {
    backgroundColor: isDarkMode ? "#111b2c" : "#ffffff",
    border: destaque
      ? "2px solid #256af4"
      : isDarkMode
        ? "1px solid rgba(122, 153, 193, 0.24)"
        : "1px solid rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    position: "relative",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const labelStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
    fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: "0.05em",
  };

  const nomeStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
  };

  const precoStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 800,
  };

  const sufixoStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
    fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
  };

  const descricaoStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
    fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
  };

  const itemStyle = {
    color: isDarkMode ? "#abc1d9" : "#4b5563",
    fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)",
  };

  return (
    <div className="h-100 p-4 d-flex flex-column" style={cardStyle}>
      {/* Badge de destaque */}
      {destaque && (
        <div className="text-center mb-2">
          <span
            className="badge bg-primary px-3 py-2 fw-bold"
            style={{
              fontSize: "clamp(0.65rem, 1vw, 0.75rem)",
              letterSpacing: "0.05em",
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            MAIS POPULAR
          </span>
        </div>
      )}

      {/* Label do plano */}
      <p className="mb-1" style={labelStyle}>
        {plano.label}
      </p>

      {/* Nome do plano */}
      <h3 className="fw-bold mb-3" style={nomeStyle}>
        {plano.nome}
      </h3>

      {/* Preco */}
      <div className="mb-2">
        <span style={precoStyle}>{plano.preco}</span>
        <span style={sufixoStyle}>{plano.sufixoPreco}</span>
      </div>

      {/* Descricao */}
      <p className="mb-4" style={descricaoStyle}>
        {plano.descricao}
      </p>

      {/* Botao */}
      <button
        className={`btn w-100 fw-bold mb-4 ${destaque ? "btn-primary" : isDarkMode ? "btn-outline-light" : "btn-outline-dark"}`}
        style={{
          padding: "0.6rem 1rem",
          fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
        }}
        onClick={plano.funcaoBotao}
      >
        {plano.textoBotao}
      </button>

      {/* Lista de recursos */}
      <ul className="list-unstyled mb-0 mt-auto">
        {plano.recursos.map((recurso, index) => (
          <li key={index} className="d-flex align-items-center gap-2 mb-2" style={itemStyle}>
            <i className="fa fa-check-circle text-primary"></i>
            {recurso}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanoCard;
