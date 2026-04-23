import { useState } from "react";

const perguntas = [
  {
    id: 1,
    pergunta: "Como funciona o cálculo de 'pagamento por entrega'?",
    resposta:
      "O preço do plano Pessoal é baseado na distância entre os pontos de coleta e entrega, mais o peso do item. Você recebe uma cotação instantânea antes de confirmar sua solicitação.",
  },
  {
    id: 2,
    pergunta: "Posso trocar de plano no meio do mês?",
    resposta:
      "Sim! Você pode fazer upgrade para o plano Empresarial a qualquer momento. Se fizer downgrade, as mudanças entram em vigor no início do próximo ciclo de cobrança.",
  },
  {
    id: 3,
    pergunta: "Vocês oferecem entregas internacionais?",
    resposta:
      "Entregas internacionais estão disponíveis para clientes Empresarial e Corporativo em regiões selecionadas. Entre em contato com nosso suporte para verificar se seu destino é atendido.",
  },
  {
    id: 4,
    pergunta: "O que caracteriza uma solução 'Corporativa'?",
    resposta:
      "Soluções corporativas são para empresas que necessitam de mais de 500 entregas por mês, manuseio especializado (refrigerado, frágil ou alto valor), ou integração profunda via API em suas próprias plataformas.",
  },
];

const PerguntasFrequentes = ({ themeMode = "light" }) => {
  const isDarkMode = themeMode === "dark";
  const [aberta, setAberta] = useState(null);

  const togglePergunta = (id) => {
    setAberta((atual) => (atual === id ? null : id));
  };

  const tituloStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
  };

  const itemStyle = {
    backgroundColor: isDarkMode ? "#111b2c" : "#ffffff",
    border: isDarkMode
      ? "1px solid rgba(122, 153, 193, 0.24)"
      : "1px solid rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    cursor: "pointer",
  };

  const perguntaTextoStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
  };

  const respostaStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
    fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
  };

  return (
    <section className="py-5">
      <div className="container">
        {/* Titulo */}
        <div className="text-center mb-5">
          <h2 className="fw-bold" style={tituloStyle}>
            Perguntas Frequentes
          </h2>
        </div>

        {/* Lista de perguntas */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-column gap-3">
              {perguntas.map((item) => (
                <div
                  key={item.id}
                  style={itemStyle}
                  className="p-3"
                  onClick={() => togglePergunta(item.id)}
                >
                  {/* Pergunta */}
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="mb-0 fw-semibold" style={perguntaTextoStyle}>
                      {item.pergunta}
                    </p>
                    <i
                      className={`fa fa-chevron-down text-muted ms-3`}
                      style={{
                        transition: "transform 0.3s ease",
                        transform: aberta === item.id ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    ></i>
                  </div>

                  {/* Resposta */}
                  {aberta === item.id && (
                    <p className="mb-0 mt-3" style={respostaStyle}>
                      {item.resposta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PerguntasFrequentes;
