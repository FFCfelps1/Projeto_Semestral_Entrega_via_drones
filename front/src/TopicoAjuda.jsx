import { useState } from "react";

// Componente de card para topico da central de ajuda
// Exibe icone, titulo, descricao e lista de artigos clicaveis
const TopicoAjuda = ({ themeMode = "light", topico }) => {
  const isDarkMode = themeMode === "dark";
  const [hover, setHover] = useState(false);
  const [artigoAberto, setArtigoAberto] = useState(null);

  const toggleArtigo = (index) => {
    setArtigoAberto((atual) => (atual === index ? null : index));
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? "#111b2c" : "#ffffff",
    border: hover
      ? isDarkMode ? "1px solid rgba(37, 106, 244, 0.4)" : "1px solid rgba(37, 106, 244, 0.3)"
      : isDarkMode ? "1px solid rgba(122, 153, 193, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
    transform: hover ? "translateY(-4px)" : "translateY(0)",
    boxShadow: hover
      ? isDarkMode ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "0 8px 24px rgba(0, 0, 0, 0.06)"
      : "none",
  };

  const tituloStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
  };

  const descricaoStyle = {
    color: isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.82rem, 1.2vw, 0.9rem)",
  };

  const artigoStyle = {
    color: isDarkMode ? "#abc1d9" : "#4b5563",
    fontSize: "clamp(0.82rem, 1.2vw, 0.9rem)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const respostaStyle = {
    color: isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.8rem, 1.1vw, 0.85rem)",
    lineHeight: 1.7,
  };

  return (
    <div
      className="p-4 d-flex flex-column"
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Icone */}
      <div
        className="d-flex align-items-center justify-content-center mb-3"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: isDarkMode ? "#1b2a44" : "#e7f3ff",
          borderRadius: "12px",
        }}
      >
        <i className={`fa fa-${topico.icone} fa-lg text-primary`}></i>
      </div>

      {/* Titulo */}
      <h4 className="fw-bold mb-2" style={tituloStyle}>
        {topico.titulo}
      </h4>

      {/* Descricao */}
      <p className="mb-3" style={descricaoStyle}>
        {topico.descricao}
      </p>

      {/* Lista de artigos */}
      <ul className="list-unstyled mb-0 mt-auto">
        {topico.artigos.map((artigo, index) => {
          const estaAberto = artigoAberto === index;
          return (
            <li key={index} className="mb-2">
              <div
                className="d-flex align-items-center gap-2 py-1"
                style={artigoStyle}
                onClick={(e) => { e.stopPropagation(); toggleArtigo(index); }}
              >
                <i
                  className={`fa fa-chevron-right ${estaAberto ? "text-primary" : ""}`}
                  style={{
                    fontSize: "0.65rem",
                    transition: "transform 0.2s ease",
                    transform: estaAberto ? "rotate(90deg)" : "rotate(0deg)",
                    flexShrink: 0,
                  }}
                ></i>
                <span className={estaAberto ? "text-primary fw-semibold" : ""}>
                  {artigo.titulo}
                </span>
              </div>
              {estaAberto && (
                <p className="mb-0 ms-4 mt-1" style={respostaStyle}>
                  {artigo.conteudo}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TopicoAjuda;
