import { useEffect, useState } from "react";

const CallToAction = (props) => {
  const titulo = props.titulo || "Pronto para decolar com SkySwift?";
  const subtitulo = props.subtitulo || "Cadastre-se hoje e receba sua primeira entrega gratuitamente. Junte-se ao futuro da logística autônoma.";
  const textoBotao1 = props.textoBotao1 || "Começar Gratuitamente";
  const textoBotao2 = props.textoBotao2 || "Contatar Vendas";
  const funcao1 = props.funcao1 || (() => alert("Redirecionando para cadastro..."));
  const funcao2 = props.funcao2 || (() => alert("Entrando em contato com vendas..."));
  const onEnviarMensagem = props.onEnviarMensagem;

  const [mostrarFormulario, setMostrarFormulario] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#mensagem-direta";
  });
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState(null);
  const [dadosFormulario, setDadosFormulario] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    mensagem: "",
  });

  const handleMudancaCampo = (event) => {
    const { name, value } = event.target;
    setDadosFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value,
    }));
  };

  const handleEnviarMensagem = async (event) => {
    event.preventDefault();

    if (!onEnviarMensagem) {
      setStatus({ tipo: "erro", texto: "Envio direto indisponível no momento." });
      return;
    }

    try {
      setEnviando(true);
      setStatus(null);

      const resposta = await onEnviarMensagem(dadosFormulario);

      setStatus({
        tipo: "sucesso",
        texto: resposta?.message || "Mensagem enviada com sucesso para o time comercial.",
      });

      setDadosFormulario({
        nome: "",
        email: "",
        empresa: "",
        telefone: "",
        mensagem: "",
      });
    } catch (error) {
      setStatus({ tipo: "erro", texto: error.message || "Falha ao enviar mensagem." });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#mensagem-direta") {
        setMostrarFormulario(true);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <section className="bg-primary text-white py-3 py-md-5">
      <div className="container">
        <div className="row">
          <div className="col-12 col-lg-8 mx-auto text-center px-3 px-md-0">
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>
              {titulo}
            </h2>
            <p className="mb-4" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
              {subtitulo}
            </p>
            <div className="d-flex gap-2 gap-md-3 justify-content-center flex-column flex-sm-row">
              <button
                className="btn btn-light fw-bold w-100 w-sm-auto"
                onClick={funcao1}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: '0.5rem 1.5rem' }}
              >
                {textoBotao1}
              </button>
              <button
                className="btn btn-outline-light fw-bold w-100 w-sm-auto"
                onClick={funcao2}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: '0.5rem 1.5rem' }}
              >
                {textoBotao2}
              </button>
              <button
                className="btn btn-warning fw-bold w-100 w-sm-auto"
                onClick={() => setMostrarFormulario((estadoAtual) => !estadoAtual)}
                style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: '0.5rem 1.5rem' }}
              >
                {mostrarFormulario ? "Fechar Formulário" : "Enviar Mensagem no Site"}
              </button>
            </div>

            {mostrarFormulario && (
              <div id="mensagem-direta" className="bg-white text-dark rounded-3 p-3 p-md-4 mt-4 text-start shadow-sm">
                <h3 className="h5 fw-bold mb-3">Fale com nosso time comercial</h3>
                <form onSubmit={handleEnviarMensagem}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" htmlFor="contato-nome">Nome</label>
                      <input
                        id="contato-nome"
                        name="nome"
                        className="form-control"
                        value={dadosFormulario.nome}
                        onChange={handleMudancaCampo}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" htmlFor="contato-email">E-mail</label>
                      <input
                        id="contato-email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={dadosFormulario.email}
                        onChange={handleMudancaCampo}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" htmlFor="contato-empresa">Empresa</label>
                      <input
                        id="contato-empresa"
                        name="empresa"
                        className="form-control"
                        value={dadosFormulario.empresa}
                        onChange={handleMudancaCampo}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" htmlFor="contato-telefone">Telefone</label>
                      <input
                        id="contato-telefone"
                        name="telefone"
                        className="form-control"
                        value={dadosFormulario.telefone}
                        onChange={handleMudancaCampo}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" htmlFor="contato-mensagem">Mensagem</label>
                      <textarea
                        id="contato-mensagem"
                        name="mensagem"
                        className="form-control"
                        rows="5"
                        value={dadosFormulario.mensagem}
                        onChange={handleMudancaCampo}
                        required
                      />
                    </div>
                  </div>

                  {status && (
                    <div className={`alert ${status.tipo === "sucesso" ? "alert-success" : "alert-danger"} mt-3 mb-0`} role="alert">
                      {status.texto}
                    </div>
                  )}

                  <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary fw-bold" disabled={enviando}>
                      {enviando ? "Enviando..." : "Enviar Mensagem"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
