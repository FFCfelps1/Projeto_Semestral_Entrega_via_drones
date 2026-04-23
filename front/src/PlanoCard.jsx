import { useState } from "react";

// Componente de card individual para exibicao de um plano de preco
// Recebe themeMode para adaptar cores ao tema claro/escuro
// Recebe plano com: label, nome, preco, sufixoPreco, descricao, textoBotao, funcaoBotao, destaque, recursos, icone
const PlanoCard = ({ themeMode = "light", plano }) => {
  const isDarkMode = themeMode === "dark";
  const destaque = plano.destaque || false;
  const [hover, setHover] = useState(false);

  const cardStyle = {
    backgroundColor: isDarkMode
      ? destaque ? "#131f36" : "#111b2c"
      : destaque ? "#f0f6ff" : "#ffffff",
    border: destaque
      ? "2px solid #256af4"
      : hover
        ? isDarkMode ? "1px solid rgba(37, 106, 244, 0.5)" : "1px solid rgba(37, 106, 244, 0.3)"
        : isDarkMode ? "1px solid rgba(122, 153, 193, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: "16px",
    position: "relative",
    transition: "all 0.3s ease",
    transform: hover ? "translateY(-6px)" : "translateY(0)",
    boxShadow: hover
      ? destaque
        ? "0 20px 40px rgba(37, 106, 244, 0.2)"
        : isDarkMode ? "0 12px 32px rgba(0, 0, 0, 0.4)" : "0 12px 32px rgba(0, 0, 0, 0.08)"
      : destaque
        ? "0 8px 24px rgba(37, 106, 244, 0.12)"
        : "none",
  };

  const labelStyle = {
    color: destaque ? "#256af4" : isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.65rem, 1vw, 0.75rem)",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: "0.08em",
  };

  const nomeStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)",
  };

  const precoStyle = {
    color: isDarkMode ? "#ffffff" : "#1f2937",
    fontSize: "clamp(2.75rem, 5vw, 3.75rem)",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-0.03em",
  };

  const sufixoStyle = {
    color: isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.9rem, 1.3vw, 1rem)",
    fontWeight: 400,
  };

  const descricaoStyle = {
    color: isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
  };

  const itemStyle = {
    color: isDarkMode ? "#abc1d9" : "#4b5563",
    fontSize: "clamp(0.82rem, 1.2vw, 0.92rem)",
  };

  const separadorStyle = {
    border: "none",
    borderTop: isDarkMode ? "1px solid rgba(122, 153, 193, 0.15)" : "1px solid rgba(0, 0, 0, 0.06)",
    margin: "0",
  };

  return (
    <div
      className="h-100 p-4 d-flex flex-column"
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Badge de destaque */}
      {destaque && (
        <span
          className="badge bg-primary px-3 py-2 fw-bold"
          style={{
            fontSize: "clamp(0.6rem, 0.9vw, 0.7rem)",
            letterSpacing: "0.06em",
            position: "absolute",
            top: "-14px",
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "20px",
            boxShadow: "0 4px 12px rgba(37, 106, 244, 0.3)",
          }}
        >
          MAIS POPULAR
        </span>
      )}

      {/* Icone do plano */}
      <div
        className="d-flex align-items-center justify-content-center mb-3"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: destaque
            ? "rgba(37, 106, 244, 0.15)"
            : isDarkMode ? "#1b2a44" : "#e7f3ff",
          borderRadius: "12px",
        }}
      >
        <i className={`fa fa-${plano.icone || "box"} fa-lg text-primary`}></i>
      </div>

      {/* Label do plano */}
      <p className="mb-1" style={labelStyle}>
        {plano.label}
      </p>

      {/* Nome do plano */}
      <h3 className="fw-bold mb-3" style={nomeStyle}>
        {plano.nome}
      </h3>

      {/* Preco */}
      <div className="mb-2 d-flex align-items-baseline gap-1">
        <span style={precoStyle}>{plano.preco}</span>
        <span style={sufixoStyle}>{plano.sufixoPreco}</span>
      </div>

      {/* Descricao */}
      <p className="mb-4" style={descricaoStyle}>
        {plano.descricao}
      </p>

      {/* Botao */}
      <button
        className={`btn w-100 fw-bold mb-4 ${destaque ? "btn-primary" : isDarkMode ? "btn-outline-light" : "btn-outline-primary"}`}
        style={{
          padding: "0.7rem 1rem",
          fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
          borderRadius: "10px",
          transition: "all 0.2s ease",
        }}
        onClick={plano.funcaoBotao}
      >
        {plano.textoBotao}
      </button>

      {/* Separador */}
      <hr style={separadorStyle} />

      {/* Lista de recursos */}
      <ul className="list-unstyled mb-0 mt-3">
        {plano.recursos.map((recurso, index) => (
          <li key={index} className="d-flex align-items-start gap-2 mb-3" style={itemStyle}>
            <i
              className="fa fa-check-circle text-primary mt-1"
              style={{ fontSize: "0.85rem", flexShrink: 0 }}
            ></i>
            <span>{recurso}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanoCard;
