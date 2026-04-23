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
    recursos: [
      "Rotas de entrega dedicadas",
      "Sem limites de peso ou tamanho",
      "Integração via API customizada",
      "Gerente de conta pessoal",
      "Seguro e responsabilidade avançados",
    ],
  },
];

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
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
  };

  const subtituloStyle = {
    color: isDarkMode ? "#9fb3cb" : "#6c757d",
    fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
  };

  return (
    <div style={sectionStyle}>
      {/* Header da pagina */}
      <section className="py-5 text-center" id="precos">
        <div className="container">
          <h1 className="fw-bold mb-3" style={tituloStyle}>
            Preços Simples e Transparentes
          </h1>
          <p className="mx-auto mb-0" style={{ ...subtituloStyle, maxWidth: "600px" }}>
            Seja para enviar um presente ou gerenciar uma frota global, a SkySwift tem um plano de entrega feito para você.
          </p>
        </div>
      </section>

      {/* Cards de planos */}
      <section className="pb-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {planosComFuncoes.map((plano) => (
              <div key={plano.id} className="col-12 col-md-6 col-lg-4">
                <PlanoCard themeMode={themeMode} plano={plano} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <PerguntasFrequentes themeMode={themeMode} />
    </div>
  );
};

export default PrecosPage;
