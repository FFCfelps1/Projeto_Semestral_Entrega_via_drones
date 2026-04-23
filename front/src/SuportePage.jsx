import { useState } from "react";
import TopicoAjuda from "./TopicoAjuda.jsx";

// Dados dos topicos da central de ajuda
const topicos = [
  {
    id: 1,
    icone: "paper-plane",
    titulo: "Primeiros Passos",
    descricao: "Tudo que você precisa para começar a usar o SkySwift.",
    artigos: [
      {
        titulo: "Como criar minha conta",
        conteudo: "Acesse a página inicial e clique em \"Começar\". Preencha seus dados pessoais, confirme seu e-mail e pronto — sua conta estará ativa para solicitar entregas.",
      },
      {
        titulo: "Como solicitar minha primeira entrega",
        conteudo: "Após criar sua conta, acesse o painel principal, insira o endereço de coleta e entrega, selecione o tipo de pacote e confirme. Você receberá uma cotação instantânea antes de finalizar.",
      },
      {
        titulo: "Quais documentos são necessários",
        conteudo: "Para pessoas físicas, basta um documento com foto (RG ou CNH). Para empresas, é necessário CNPJ ativo e comprovante de endereço comercial.",
      },
    ],
  },
  {
    id: 2,
    icone: "map-marker",
    titulo: "Rastreamento e Entregas",
    descricao: "Acompanhe suas entregas em tempo real.",
    artigos: [
      {
        titulo: "Como rastrear minha entrega",
        conteudo: "Acesse a página de Rastreamento pelo menu principal. Digite o endereço de destino e visualize a rota do drone em tempo real no mapa interativo com coordenadas GPS.",
      },
      {
        titulo: "Minha entrega está atrasada",
        conteudo: "Atrasos podem ocorrer por condições climáticas adversas ou alta demanda. Verifique o status no rastreamento. Se o atraso ultrapassar 30 minutos do estimado, entre em contato conosco.",
      },
      {
        titulo: "Área de cobertura disponível",
        conteudo: "Atualmente operamos na Grande São Paulo. Clientes dos planos Empresarial e Corporativo podem solicitar rotas dedicadas para regiões específicas. Consulte a disponibilidade na página de preços.",
      },
    ],
  },
  {
    id: 3,
    icone: "tag",
    titulo: "Planos e Pagamentos",
    descricao: "Informações sobre preços, assinaturas e cobranças.",
    artigos: [
      {
        titulo: "Diferenças entre os planos",
        conteudo: "O plano Pessoal cobra por entrega (ideal para uso esporádico). O Empresarial (R$99/mês) oferece entregas ilimitadas e suporte prioritário. O Corporativo é sob medida para grandes operações.",
      },
      {
        titulo: "Como alterar meu plano",
        conteudo: "Você pode fazer upgrade a qualquer momento. Para downgrade, a mudança entra em vigor no próximo ciclo de cobrança. Acesse a página de Preços para ver as opções disponíveis.",
      },
      {
        titulo: "Formas de pagamento aceitas",
        conteudo: "Aceitamos cartões de crédito (Visa, Mastercard, Elo), PIX e boleto bancário. Clientes Corporativos podem negociar faturamento mensal.",
      },
    ],
  },
  {
    id: 4,
    icone: "shield",
    titulo: "Segurança e Privacidade",
    descricao: "Como protegemos seus dados e pacotes.",
    artigos: [
      {
        titulo: "Como meus dados são protegidos",
        conteudo: "Utilizamos criptografia de ponta a ponta em todas as comunicações. Seus dados pessoais são armazenados em servidores seguros e nunca compartilhados com terceiros sem consentimento.",
      },
      {
        titulo: "Seguro para pacotes",
        conteudo: "Todas as entregas incluem seguro básico contra danos e extravio. Clientes Empresarial e Corporativo contam com cobertura estendida e opções de seguro premium.",
      },
      {
        titulo: "Política de privacidade",
        conteudo: "Nossa política de privacidade segue a LGPD (Lei Geral de Proteção de Dados). Você pode solicitar a exclusão dos seus dados a qualquer momento através do nosso suporte.",
      },
    ],
  },
  {
    id: 5,
    icone: "cog",
    titulo: "Conta e Configurações",
    descricao: "Gerencie seu perfil e preferências.",
    artigos: [
      {
        titulo: "Como alterar meus dados cadastrais",
        conteudo: "Acesse as configurações da sua conta pelo menu do perfil. Você pode atualizar nome, e-mail, telefone e endereço padrão de entrega a qualquer momento.",
      },
      {
        titulo: "Como redefinir minha senha",
        conteudo: "Na tela de login, clique em \"Esqueci minha senha\". Enviaremos um link de redefinição para o e-mail cadastrado. O link expira em 24 horas por segurança.",
      },
      {
        titulo: "Como excluir minha conta",
        conteudo: "Para excluir sua conta, entre em contato com nosso suporte. Seus dados serão removidos em até 30 dias conforme a LGPD. Entregas pendentes devem ser finalizadas antes da exclusão.",
      },
    ],
  },
  {
    id: 6,
    icone: "headphones",
    titulo: "Contato e Suporte",
    descricao: "Fale diretamente com nossa equipe.",
    artigos: [
      {
        titulo: "Canais de atendimento",
        conteudo: "Plano Pessoal: suporte por e-mail (resposta em até 48h). Plano Empresarial: chat ao vivo 24/7. Plano Corporativo: gerente de conta dedicado com linha direta.",
      },
      {
        titulo: "Horário de funcionamento",
        conteudo: "Nosso suporte por e-mail funciona de segunda a sexta, das 8h às 18h. O chat ao vivo para clientes Empresarial opera 24 horas, 7 dias por semana.",
      },
      {
        titulo: "Como reportar um problema",
        conteudo: "Use o botão \"Contatar Vendas\" no menu ou envie uma mensagem pelo formulário na página inicial. Descreva o problema com detalhes e inclua o código de rastreamento se aplicável.",
      },
    ],
  },
];

// Pagina completa da central de ajuda / suporte
const SuportePage = ({ themeMode = "light", onContatar }) => {
  const isDarkMode = themeMode === "dark";
  const [busca, setBusca] = useState("");

  // Filtra topicos e artigos pela busca
  const topicosFiltrados = busca.trim()
    ? topicos
        .map((topico) => ({
          ...topico,
          artigos: topico.artigos.filter(
            (artigo) =>
              artigo.titulo.toLowerCase().includes(busca.toLowerCase()) ||
              artigo.conteudo.toLowerCase().includes(busca.toLowerCase())
          ),
        }))
        .filter(
          (topico) =>
            topico.artigos.length > 0 ||
            topico.titulo.toLowerCase().includes(busca.toLowerCase())
        )
    : topicos;

  const sectionStyle = {
    backgroundColor: isDarkMode ? "#0b1220" : "#f8f9fa",
  };

  const heroStyle = {
    background: isDarkMode
      ? "linear-gradient(135deg, #0f1a2e 0%, #162240 100%)"
      : "linear-gradient(135deg, #256af4 0%, #1a4fd4 100%)",
    borderRadius: "0 0 24px 24px",
    position: "relative",
    overflow: "hidden",
  };

  const heroOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
    backgroundSize: "32px 32px",
    pointerEvents: "none",
  };

  const tituloStyle = {
    color: "#ffffff",
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    letterSpacing: "-0.02em",
  };

  const subtituloStyle = {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
    lineHeight: 1.7,
  };

  const inputStyle = {
    backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.95)",
    border: "none",
    borderRadius: "12px",
    padding: "0.85rem 1.25rem 0.85rem 3rem",
    fontSize: "clamp(0.9rem, 1.3vw, 1rem)",
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    width: "100%",
  };

  const secaoTituloStyle = {
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
  };

  const bannerStyle = {
    background: "linear-gradient(135deg, #256af4 0%, #1a4fd4 100%)",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div style={sectionStyle}>
      {/* Hero com busca */}
      <section style={heroStyle} className="py-5 text-center text-white">
        <div style={heroOverlayStyle}></div>
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="mb-3">
                <span
                  className="badge px-3 py-2 fw-bold"
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.06em",
                    borderRadius: "20px",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                  }}
                >
                  <i className="fa fa-life-ring me-1"></i>
                  CENTRAL DE AJUDA
                </span>
              </div>
              <h1 className="fw-bold mb-3" style={tituloStyle}>
                Como podemos ajudar?
              </h1>
              <p className="mx-auto mb-4" style={{ ...subtituloStyle, maxWidth: "480px" }}>
                Encontre respostas rápidas sobre entregas, planos, rastreamento e muito mais.
              </p>

              {/* Campo de busca */}
              <div className="d-flex justify-content-center position-relative">
                <i
                  className="fa fa-search position-absolute"
                  style={{
                    left: "calc(50% - 235px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: isDarkMode ? "rgba(255,255,255,0.4)" : "#9ca3af",
                    fontSize: "0.95rem",
                    zIndex: 2,
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Buscar artigos de ajuda..."
                  style={inputStyle}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topicos de ajuda */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={secaoTituloStyle}>
              {busca.trim() ? `Resultados para "${busca}"` : "Tópicos de Ajuda"}
            </h2>
            {!busca.trim() && (
              <p style={{ color: isDarkMode ? "#7a99c1" : "#6c757d", fontSize: "clamp(0.9rem, 1.3vw, 1rem)" }}>
                Selecione um tópico para explorar os artigos disponíveis.
              </p>
            )}
          </div>

          {topicosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-search fa-3x text-muted mb-3 d-block"></i>
              <p style={{ color: isDarkMode ? "#7a99c1" : "#6c757d", fontSize: "1.1rem" }}>
                Nenhum resultado encontrado para "{busca}".
              </p>
              <button
                className="btn btn-outline-primary mt-2"
                onClick={() => setBusca("")}
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {topicosFiltrados.map((topico) => (
                <div key={topico.id}>
                  <TopicoAjuda themeMode={themeMode} topico={topico} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner de contato */}
      <section className="pb-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="p-4 p-md-5 text-center text-white" style={bannerStyle}>
                <div style={heroOverlayStyle}></div>
                <div className="position-relative" style={{ zIndex: 1 }}>
                  <i className="fa fa-headphones fa-2x mb-3" style={{ opacity: 0.8 }}></i>
                  <h3
                    className="fw-bold mb-3"
                    style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
                  >
                    Não encontrou o que procurava?
                  </h3>
                  <p
                    className="mb-4 mx-auto"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
                      opacity: 0.85,
                      maxWidth: "480px",
                    }}
                  >
                    Nossa equipe está pronta para ajudar. Entre em contato e responderemos o mais rápido possível.
                  </p>
                  <div className="d-flex gap-3 justify-content-center flex-column flex-sm-row">
                    <button
                      className="btn btn-light fw-bold px-4 py-2"
                      style={{ borderRadius: "10px", fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)" }}
                      onClick={onContatar}
                    >
                      <i className="fa fa-envelope me-2"></i>
                      Enviar E-mail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuportePage;
