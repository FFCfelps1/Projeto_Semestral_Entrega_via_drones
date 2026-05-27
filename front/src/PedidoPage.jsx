import { useEffect, useRef, useState } from "react"
import { criarPedidoEntrega, buscarHistorico, cancelarPedido } from "./pedidosEntregaService.js"

// Estado inicial do formulário — todos os campos vazios
const pedidoInicial = {
  item: "",
  peso: "",
  origem: "",
  destino: "",
  tipoEntrega: "",
  observacoes: "",
}

// Mapeamento dos tipos de entrega para exibição na tela
const tiposEntrega = {
  padrao: "Padrao",
  expressa: "Expressa",
  prioritaria: "Prioritaria",
}

// Multiplicadores de preço por tipo de entrega
const multiplicadoresEntrega = {
  padrao: 1,
  expressa: 1.35,
  prioritaria: 1.65,
}

// Tempos estimados por tipo de entrega (exibição local antes do back responder)
const temposEntrega = {
  padrao: "45 a 60 min",
  expressa: "25 a 35 min",
  prioritaria: "15 a 25 min",
}


const statusInicialPedido = "Aguardando solicitacao"
const PEDIDOS_STORAGE_KEY = "skyswift-pedidos-simulados"

const carregarPedidosSalvos = () => {
  if (typeof window === "undefined") return []

  try {
    const pedidosSalvos = window.localStorage.getItem(PEDIDOS_STORAGE_KEY)
    return pedidosSalvos ? JSON.parse(pedidosSalvos) : []
  } catch {
    window.localStorage.removeItem(PEDIDOS_STORAGE_KEY)
    return []
  }
}

// Componente principal da página de pedidos
// themeMode controla o tema claro/escuro
const PedidoPage = ({ themeMode = "light", pedidosEntregaServiceUrl = "" }) => {
  const isDarkMode = themeMode === "dark"
  // Estado do formulário
  const [pedido, setPedido] = useState(pedidoInicial)
  // Estado dos erros de validação
  const [erros, setErros] = useState({})
  // Status exibido no resumo do pedido
  const [statusPedido, setStatusPedido] = useState(statusInicialPedido)
  // Pedido mais recente criado — exibido no resumo
  const [pedidoSimulado, setPedidoSimulado] = useState(null)
  // Lista de pedidos criados na sessão atual
  const [pedidosSimulados, setPedidosSimulados] = useState(carregarPedidosSalvos)
   // Mensagem de sucesso exibida após criar o pedido
  const [mensagemSucesso, setMensagemSucesso] = useState("")
  // Controla o estado de loading durante a requisição
  const [processandoPedido, setProcessandoPedido] = useState(false)
  // Estado do filtro de status — vazio significa "todos"
  const [filtroStatus, setFiltroStatus] = useState("")
  // ID do pedido cujo histórico está sendo exibido — null = nenhum
  const [pedidoHistoricoSelecionado, setPedidoHistoricoSelecionado] = useState(null)
  // Dados do histórico retornados pelo back
  const [dadosHistorico, setDadosHistorico] = useState(null)
  const pedidosJaPersistidos = useRef(false)

  useEffect(() => {
    if (!pedidosJaPersistidos.current) {
      pedidosJaPersistidos.current = true
      return
    }

    window.localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosSimulados))
  }, [pedidosSimulados])

  // Atualiza o campo correspondente no estado do formulário a cada digitação
  const handlePedidoChange = (event) => {
    const { name, value } = event.target

    // Spread operator mantém os outros campos intactos
    setPedido((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value,
    }))
      // Limpa o erro do campo alterado e reseta o resumo
    setErros((errosAtuais) => ({
      ...errosAtuais,
      [name]: "",
      geral: "",
    }))
    setStatusPedido(statusInicialPedido)
    setPedidoSimulado(null)
    setMensagemSucesso("")
  }

  // Valida os campos obrigatórios antes de enviar
  const validarPedido = () => {
    const novosErros = {}

    if (!pedido.item.trim()) {
      novosErros.item = "Informe o item ou a descricao do pacote."
    }

    if (!pedido.peso) {
      novosErros.peso = "Informe o peso aproximado."
    } else if (Number(pedido.peso) <= 0) {
      novosErros.peso = "O peso deve ser maior que zero."
    }

    if (!pedido.origem.trim()) {
      novosErros.origem = "Informe o endereco de retirada."
    }

    if (!pedido.destino.trim()) {
      novosErros.destino = "Informe o endereco de entrega."
    }

    if (!pedido.tipoEntrega) {
      novosErros.tipoEntrega = "Selecione o tipo de entrega."
    }

    return novosErros
  }

  const handlePedidoSubmit = async (event) => {
    // Previne o comportamento padrão do form (recarregar a página)
    event.preventDefault()

    // Valida os campos e exibe erros se houver
    const errosValidacao = validarPedido()
    setErros(errosValidacao)

    // Se houver erros, não envia
    if (Object.keys(errosValidacao).length > 0) {
      return
    }
    // Ativa o estado de loading — desabilita o botão e exibe "Processando..."
    setProcessandoPedido(true)


    // Monta o objeto no formato que o back espera
    // "tipo" em vez de "tipoEntrega" — padrão do microsserviço gestao_pedidos
    // Number(pedido.peso) converte a string do input para número
    const dadosPedido = {
      item: pedido.item,
      peso: Number(pedido.peso),
      origem: pedido.origem,
      destino: pedido.destino,
      tipo: pedido.tipoEntrega,
      observacoes: pedido.observacoes,
    }
    // O handler não pode ser totalmente async por causa do event.preventDefault()
    const aux = async () => {
      // Chama o serviço que faz POST /pedidos no microsserviço gestao_pedidos
      const pedidoCriado = await criarPedidoEntrega(dadosPedido)
      // Atualiza o resumo com os dados reais vindos do back
      // (precoEstimado e tempoEstimado agora vêm do back, não são calculados localmente)
      setStatusPedido("Pedido criado")
      setPedidoSimulado(pedidoCriado)
      // Adiciona o novo pedido no início da lista
      setPedidosSimulados((pedidosAtuais) => [pedidoCriado, ...pedidosAtuais])
      setMensagemSucesso(`Pedido ${pedidoCriado.id} criado com sucesso!`)
    }

    aux()
      .catch((err) => {
        // Exibe o erro real vindo do back se disponível
        // Senão exibe mensagem genérica
        const mensagemErro = err?.response?.data?.erro || "Nao foi possivel criar o pedido agora."
        setErros({ geral: mensagemErro })
      })
      .finally(() => setProcessandoPedido(false))
  }


  const handleLimparFormulario = () => {
    setPedido(pedidoInicial)
    setErros({})
    setStatusPedido(statusInicialPedido)
    setPedidoSimulado(null)
    setMensagemSucesso("")
  }

  const handleRemoverPedido = (pedidoId) => {
    setPedidosSimulados((pedidosAtuais) => pedidosAtuais.filter((pedidoAtual) => pedidoAtual.id !== pedidoId))

    if (pedidoSimulado?.id === pedidoId) {
      setPedidoSimulado(null)
      setStatusPedido(statusInicialPedido)
    }
  }

  // Busca o histórico de status de um pedido pelo id
  const handleVerHistorico = (pedidoId) => {
    const aux = async () => {
      const historico = await buscarHistorico(pedidoId)
      setDadosHistorico(historico)
      setPedidoHistoricoSelecionado(pedidoId)
    }
    aux()
  }

  // Cancela o pedido no back e atualiza o status na lista
  const handleCancelarPedido = (pedidoId) => {
    const aux = async () => {
      const resposta = await cancelarPedido(pedidoId)

      // Atualiza o status do pedido na lista sem recarregar
      setPedidosSimulados((pedidosAtuais) =>
        pedidosAtuais.map((p) =>
          p.id === pedidoId ? { ...p, status: resposta.pedido.status } : p
        )
      )
    }
    aux()
  }

  const pageStyle = {
    minHeight: "calc(100vh - 72px)",
    backgroundColor: isDarkMode ? "#0b1220" : "#eef5ff",
  }

  const panelStyle = {
    borderRadius: "8px",
    border: isDarkMode ? "1px solid #23334d" : "1px solid #d8e4f5",
    backgroundColor: isDarkMode ? "#111a2c" : "#ffffff",
    color: isDarkMode ? "#e6f0ff" : "#1f2937",
    boxShadow: isDarkMode ? "0 16px 32px rgba(0,0,0,0.22)" : "0 16px 32px rgba(30,64,175,0.10)",
  }

  const mutedClassName = isDarkMode ? "text-light opacity-75" : "text-secondary"
  const inputClassName = `form-control ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`
  const selectClassName = `form-select ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`
  const borderedPanelClassName = `border rounded ${isDarkMode ? "border-secondary" : ""}`
  const secondaryButtonClassName = `btn ${isDarkMode ? "btn-outline-light" : "btn-outline-secondary"} fw-bold flex-sm-fill`
  const summaryItemClassName = `d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3 py-2 border-bottom ${isDarkMode ? "border-secondary" : ""}`
  const pesoNumerico = Number(pedido.peso)
  const precoEstimado =
    pesoNumerico > 0
      ? 18 + pesoNumerico * 4.5 * (multiplicadoresEntrega[pedido.tipoEntrega] || 1)
      : 0
  const subtitleStyle = {
    maxWidth: "620px",
    lineHeight: 1.7,
  }

  return (
    <section className="py-5" style={pageStyle}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="p-4 p-md-5" style={panelStyle}>
              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3">
                Pedido de entrega
              </span>

              <div className="mb-4">
                <h1 className="fw-bold mb-3">Solicite uma entrega via drone</h1>
                <p className={`fs-5 mb-2 ${mutedClassName}`} style={subtitleStyle}>
                  Planeje o envio, confira a estimativa e deixe o pedido pronto para a futura operacao SkySwift.
                </p>
                <p className={`mb-0 ${mutedClassName}`} style={subtitleStyle}>
                  Esta experiencia antecipa o microsservico de pedidos de entrega, com fluxo local preparado para futura integracao com a API dedicada.
                </p>
              </div>

              <div className="row g-4 align-items-stretch">
                <div className="col-12 col-lg-7">
                  <form className="h-100" onSubmit={handlePedidoSubmit} noValidate>
                    <h2 className="h4 fw-bold mb-3">Detalhes da solicitacao</h2>
                    <p className={`mb-0 ${mutedClassName}`}>
                      Informe o pacote, os enderecos e a modalidade para receber uma previa da entrega.
                    </p>

                    <div className={`${borderedPanelClassName} p-4 mt-4`}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-item">
                          Item ou descricao do pacote
                        </label>
                        <input
                          id="pedido-item"
                          name="item"
                          type="text"
                          className={`${inputClassName} ${erros.item ? "is-invalid" : ""}`}
                          value={pedido.item}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: medicamentos, documentos ou pequeno volume"
                          aria-describedby={erros.item ? "pedido-item-erro" : undefined}
                          aria-invalid={Boolean(erros.item)}
                          required
                        />
                        {erros.item && <div id="pedido-item-erro" className="invalid-feedback">{erros.item}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-peso">
                          Peso aproximado
                        </label>
                        <div className="input-group">
                          <input
                            id="pedido-peso"
                            name="peso"
                            type="number"
                            className={`${inputClassName} ${erros.peso ? "is-invalid" : ""}`}
                            min="0"
                            step="0.1"
                            value={pedido.peso}
                            onChange={handlePedidoChange}
                            placeholder="Ex.: 2.5"
                            aria-describedby={erros.peso ? "pedido-peso-erro" : undefined}
                            aria-invalid={Boolean(erros.peso)}
                            required
                          />
                          <span className={`input-group-text ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`}>
                            kg
                          </span>
                        </div>
                        {erros.peso && <div id="pedido-peso-erro" className="invalid-feedback d-block">{erros.peso}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-origem">
                          Endereco de retirada
                        </label>
                        <input
                          id="pedido-origem"
                          name="origem"
                          type="text"
                          className={`${inputClassName} ${erros.origem ? "is-invalid" : ""}`}
                          value={pedido.origem}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: Rua das Flores, 120 - Centro"
                          aria-describedby={erros.origem ? "pedido-origem-erro" : undefined}
                          aria-invalid={Boolean(erros.origem)}
                          required
                        />
                        {erros.origem && <div id="pedido-origem-erro" className="invalid-feedback">{erros.origem}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-destino">
                          Endereco de entrega
                        </label>
                        <input
                          id="pedido-destino"
                          name="destino"
                          type="text"
                          className={`${inputClassName} ${erros.destino ? "is-invalid" : ""}`}
                          value={pedido.destino}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: Avenida Brasil, 850 - Jardim"
                          aria-describedby={erros.destino ? "pedido-destino-erro" : undefined}
                          aria-invalid={Boolean(erros.destino)}
                          required
                        />
                        {erros.destino && <div id="pedido-destino-erro" className="invalid-feedback">{erros.destino}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="pedido-tipo-entrega">
                          Tipo de entrega
                        </label>
                        <select
                          id="pedido-tipo-entrega"
                          name="tipoEntrega"
                          className={`${selectClassName} ${erros.tipoEntrega ? "is-invalid" : ""}`}
                          value={pedido.tipoEntrega}
                          onChange={handlePedidoChange}
                          aria-describedby={erros.tipoEntrega ? "pedido-tipo-entrega-erro" : undefined}
                          aria-invalid={Boolean(erros.tipoEntrega)}
                          required
                        >
                          <option value="" disabled>
                            Selecione uma modalidade
                          </option>
                          <option value="padrao">Padrao</option>
                          <option value="expressa">Expressa</option>
                          <option value="prioritaria">Prioritaria</option>
                        </select>
                        {erros.tipoEntrega && <div id="pedido-tipo-entrega-erro" className="invalid-feedback">{erros.tipoEntrega}</div>}
                      </div>

                      <div>
                        <label className="form-label fw-semibold" htmlFor="pedido-observacoes">
                          Observacoes
                        </label>
                        <textarea
                          id="pedido-observacoes"
                          name="observacoes"
                          className={inputClassName}
                          rows="3"
                          value={pedido.observacoes}
                          onChange={handlePedidoChange}
                          placeholder="Ex.: entregar na portaria, pacote fragil ou melhor horario para retirada"
                        ></textarea>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary fw-bold flex-sm-fill" disabled={processandoPedido}>
                      {processandoPedido ? (
                        <>
                          {/* Spinner animado do Bootstrap durante o loading */}
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Processando...
                        </>
                      ) : (
                        "Criar pedido"
                      )}
                    </button>
                    <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                      
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={handleLimparFormulario}
                        disabled={processandoPedido}
                      >
                        Limpar formulario
                      </button>
                    </div>

                    {erros.geral && (
                      <div className="alert alert-danger mt-4 mb-0" role="alert" aria-live="assertive">
                        {erros.geral}
                      </div>
                    )}

                    {mensagemSucesso && (
                      <div className="alert alert-success mt-4 mb-0" role="status" aria-live="polite">
                        {mensagemSucesso}
                      </div>
                    )}
                  </form>
                </div>

                <div className="col-12 col-lg-5">
                  <div className={`${borderedPanelClassName} p-4 h-100`}>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary bg-opacity-10 text-primary"
                        style={{ width: "44px", height: "44px", borderRadius: "8px" }}
                      >
                        <i className="fa fa-clipboard-list" aria-hidden="true"></i>
                      </div>
                      <div>
                        <h2 className="h5 fw-bold mb-1">Resumo do pedido</h2>
                        <p className={`mb-0 ${mutedClassName}`}>Confira a previa antes de simular o pedido.</p>
                      </div>
                    </div>

                    <div className="mt-4" aria-live="polite">
                      {pedidoSimulado?.id && (
                        <div className={summaryItemClassName}>
                          <span className={mutedClassName}>Identificador</span>
                          <strong className="text-sm-end text-break">{pedidoSimulado.id}</strong>
                        </div>
                      )}
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Status</span>
                        <span className={`badge ${statusPedido === statusInicialPedido ? "bg-warning text-dark" : "bg-success"}`}>
                          {statusPedido}
                        </span>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Item</span>
                        <strong className="text-sm-end text-break">{pedido.item.trim() || "Aguardando item"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Peso</span>
                        <strong className="text-sm-end text-break">{pedido.peso ? `${pedido.peso} kg` : "Aguardando peso"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Origem</span>
                        <strong className="text-sm-end text-break">{pedido.origem.trim() || "Nao informada"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Destino</span>
                        <strong className="text-sm-end text-break">{pedido.destino.trim() || "Nao informado"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Tipo</span>
                        <strong className="text-sm-end text-break">{tiposEntrega[pedido.tipoEntrega] || "Nao selecionado"}</strong>
                      </div>
                      <div className={summaryItemClassName}>
                        <span className={mutedClassName}>Tempo estimado</span>
                        {/* Se o pedido foi criado, exibe o tempo real do back. Senão, exibe o estimado local */}
                        <strong className="text-sm-end text-break">
                          {pedidoSimulado?.tempoEstimado
                            ? `${pedidoSimulado.tempoEstimado} min`
                            : temposEntrega[pedido.tipoEntrega] || "Aguardando tipo"}
                        </strong>
                      </div>
                      <div className="d-flex flex-column flex-sm-row justify-content-sm-between gap-1 gap-sm-3 py-2">
                        <span className={mutedClassName}>Preco estimado</span>
                        {/* Se o pedido foi criado, exibe o preço real do back. Senão, exibe o estimado local */}
                        <strong className="text-sm-end text-primary">
                          {pedidoSimulado?.precoEstimado
                            ? `R$ ${Number(pedidoSimulado.precoEstimado).toFixed(2).replace(".", ",")}`
                            : precoEstimado > 0
                            ? `R$ ${precoEstimado.toFixed(2).replace(".", ",")}`
                            : "Aguardando dados"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                  <div>
                    <h2 className="h4 fw-bold mb-1">Pedidos simulados</h2>
                    <p className={`mb-0 ${mutedClassName}`}>Acompanhe as simulacoes salvas neste navegador.</p>
                  </div>
                  <span className="badge bg-primary align-self-md-start">{pedidosSimulados.length} pedidos</span>
                </div>

                {/* Exibe o histórico do pedido selecionado */}
                {dadosHistorico && pedidoHistoricoSelecionado && (
                  <div className={`${borderedPanelClassName} p-4 mb-4`}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0 fw-bold">Histórico do pedido</h5>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setDadosHistorico(null)
                          setPedidoHistoricoSelecionado(null)
                        }}
                      >
                        Fechar
                      </button>
                    </div>
                    <p className={`mb-1 ${mutedClassName}`}><strong>Item:</strong> {dadosHistorico.item}</p>
                    <p className={`mb-3 ${mutedClassName}`}><strong>Status atual:</strong> {dadosHistorico.statusAtual}</p>
                    <ul className="list-group list-group-flush">
                      {dadosHistorico.historico.map((entrada, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="badge bg-primary">{entrada.status}</span>
                          <small className={mutedClassName}>
                            {new Date(entrada.momento).toLocaleString('pt-BR')}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Filtro por status — filtra a lista localmente sem chamar o back */}
                <div className="mb-3">
                  <select
                    className={selectClassName}
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_processamento">Em processamento</option>
                    <option value="em_rota">Em rota</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                {pedidosSimulados.length === 0 ? (
                  <div className={`${borderedPanelClassName} p-4 text-center`}>
                     {/* Ícone de caixa vazia do FontAwesome */}
                     <i className="fa fa-box-open fa-2x mb-3 text-muted" aria-hidden="true"></i>
                    <p className={`mb-0 ${mutedClassName}`}>
                      Nenhum pedido simulado ainda. Preencha os dados do envio para montar a primeira solicitacao.
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {pedidosSimulados
                      .filter((p) => filtroStatus === "" || p.status === filtroStatus)
                      .map((pedidoHistorico) => (
                      <div className="col-12 col-lg-6" key={pedidoHistorico.id}>
                        <div className={`${borderedPanelClassName} p-3 h-100`}>
                          <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-start gap-3 mb-2">
                            <div>
                              <strong className="text-break">{pedidoHistorico.id}</strong>
                              <div>
                                <span className="badge bg-success mt-1">{pedidoHistorico.status}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleVerHistorico(pedidoHistorico.id)}
                            >
                              <i className="fa fa-history me-1" aria-hidden="true"></i>
                              Ver historico
                            </button>
                            {/* Botão cancelar — só aparece se o pedido puder ser cancelado */}
                            {pedidoHistorico.status !== "em_rota" &&
                            pedidoHistorico.status !== "entregue" &&
                            pedidoHistorico.status !== "cancelado" && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleCancelarPedido(pedidoHistorico.id)}
                              >
                                <i className="fa fa-times me-1" aria-hidden="true"></i>
                                Cancelar
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm align-self-start align-self-sm-auto"
                              onClick={() => handleRemoverPedido(pedidoHistorico.id)}
                              aria-label={`Remover pedido ${pedidoHistorico.id}`}
                              title="Remover pedido"
                            >
                              <i className="fa fa-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                          <p className="fw-semibold mb-1 text-break">{pedidoHistorico.item}</p>
                          <p className={`small mb-2 ${mutedClassName}`}>
                            <span className="text-break d-block">{pedidoHistorico.origem} para {pedidoHistorico.destino}</span>
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            {/* tipo vem do back — usa tiposEntrega para exibir o nome amigável */}
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              {tiposEntrega[pedidoHistorico.tipo] || pedidoHistorico.tipo}
                            </span>
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              {pedidoHistorico.peso} kg
                            </span>
                            {/* precoEstimado vem como string do back — converte para número antes do toFixed */}
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              R$ {Number(pedidoHistorico.precoEstimado).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PedidoPage
