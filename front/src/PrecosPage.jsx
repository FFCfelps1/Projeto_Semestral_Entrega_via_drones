import PlanoCard from "./PlanoCard.jsx";
import PerguntasFrequentes from "./PerguntasFrequentes.jsx";

const planos = [
  {
    id: 1,
    label: "PARA INDIVÍDUOS",
    nome: "Pessoal",
    preco: "R$0",
    sufixoPreco: " taxa base",
    descricao: "Pague apenas quando enviar.",
    textoBotao: "Começar",
    destaque: false,
    icone: "user",
    recursos: [
      "Taxa fixa por entrega",
      "Peso até 5kg",
      "Velocidade de entrega padrão",
      "Suporte apenas por e-mail",
    ],
  },
  {
    id: 2,
    label: "PARA ESCALAR",
    nome: "Empresarial",
    preco: "R$99",
    sufixoPreco: " / mês",
    descricao: "Perfeito para varejistas de alto volume.",
    textoBotao: "Assinar Agora",
    destaque: true,
    icone: "rocket",
    recursos: [
      "Entregas ilimitadas",
      "Peso até 25kg",
      "Processamento prioritário",
      "Suporte 24/7 via chat",
      "Rastreamento de frota em tempo real",
    ],
  },
  {
    id: 3,
    label: "SOLUÇÕES CUSTOMIZADAS",
    nome: "Corporativo",
    preco: "Sob consulta",
    sufixoPreco: "",
    descricao: "Sob medida para logística global.",
    textoBotao: "Contatar Vendas",
    destaque: false,
    icone: "building",
    recursos: [
      "Rotas de entrega dedicadas",
      "Sem limites de peso ou tamanho",
      "Integração via API customizada",
      "Gerente de conta pessoal",
      "Seguro e responsabilidade avançados",
    ],
  },
];

// Pagina completa de precos com header, cards de planos, banner e FAQ
const PrecosPage = ({ themeMode = "light", onContatar }) => {
  const isDarkMode = themeMode === "dark";

  // Atribui funcoes aos botoes dos planos
  const planosComFuncoes = planos.map((plano) => ({
    ...plano,
    funcaoBotao:
      plano.id === 3 && onContatar
        ? onContatar
        : () => alert(`Plano ${plano.nome} selecionado!`),
  }));

  const sectionStyle = {
    backgroundColor: isDarkMode ? "#0b1220" : "#f8f9fa",
  };

  const tituloStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
    letterSpacing: "-0.02em",
  };

  const subtituloStyle = {
    color: isDarkMode ? "#7a99c1" : "#6c757d",
    fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
    lineHeight: 1.7,
  };

  const bannerStyle = {
    background: "linear-gradient(135deg, #256af4 0%, #1a4fd4 100%)",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
  };

  const bannerOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.07) 1px, transparent 0)",
    backgroundSize: "32px 32px",
    pointerEvents: "none",
  };

  return (
    <div style={sectionStyle}>
      {/* Header da pagina */}
      <section className="pt-5 pb-4 text-center" id="precos">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <span
                className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3 d-inline-block"
                style={{ fontSize: "0.75rem", letterSpacing: "0.06em", borderRadius: "20px" }}
              >
                <i className="fa fa-tag me-1"></i>
                PLANOS E PREÇOS
              </span>
              <h1 className="fw-bold mb-3" style={tituloStyle}>
                Preços Simples e Transparentes
              </h1>
              <p className="mx-auto mb-4" style={{ ...subtituloStyle, maxWidth: "560px" }}>
                Seja para enviar um presente ou gerenciar uma frota global, a SkySwift tem um plano de entrega feito para você.
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap mb-2">
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ fontSize: "0.75rem" }}>
                  <i className="fa fa-check me-1"></i>Sem taxa de adesão
                </span>
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ fontSize: "0.75rem" }}>
                  <i className="fa fa-check me-1"></i>Cancele quando quiser
                </span>
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ fontSize: "0.75rem" }}>
                  <i className="fa fa-check me-1"></i>Suporte incluso
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards de planos */}
      <section className="pb-5">
        <div className="container">
          <div className="row g-4 justify-content-center align-items-stretch">
            {planosComFuncoes.map((plano) => (
              <div key={plano.id} className="col-12 col-md-6 col-lg-4">
                <PlanoCard themeMode={themeMode} plano={plano} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="pb-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="p-4 p-md-5 text-center text-white" style={bannerStyle}>
                <div style={bannerOverlayStyle}></div>
                <div className="position-relative" style={{ zIndex: 1 }}>
                  <h3
                    className="fw-bold mb-3"
                    style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
                  >
                    Não sabe qual plano escolher?
                  </h3>
                  <p
                    className="mb-4 mx-auto"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
                      opacity: 0.85,
                      maxWidth: "480px",
                    }}
                  >
                    Nossa equipe pode ajudar a encontrar a solução ideal para o seu negócio. Fale conosco sem compromisso.
                  </p>
                  <div className="d-flex gap-3 justify-content-center flex-column flex-sm-row">
                    <button
                      className="btn btn-light fw-bold px-4 py-2"
                      style={{ borderRadius: "10px", fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)" }}
                      onClick={onContatar}
                    >
                      <i className="fa fa-envelope me-2"></i>
                      Falar com Vendas
                    </button>
                    <a
                      href="/rastreamento"
                      className="btn btn-outline-light fw-bold px-4 py-2"
                      style={{ borderRadius: "10px", fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)" }}
                    >
                      <i className="fa fa-map-marker me-2"></i>
                      Ver Rastreamento
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <PerguntasFrequentes themeMode={themeMode} />
    </div>
  );
};

export default PrecosPage;
