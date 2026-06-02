const TopBar = ({ themeMode = "light", onToggleTheme, usuario, onLogout, notificacoesNaoLidas = 0 }) => {
  const isDarkMode = themeMode === "dark";
  const isSubPage = typeof window !== "undefined" && window.location.pathname !== "/";
  const isPrecosPage = typeof window !== "undefined" && window.location.pathname === "/precos";
  const isPedidoPage = typeof window !== "undefined" && window.location.pathname === "/pedido";
  const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
  const isContaPage = typeof window !== "undefined" && window.location.pathname === "/conta";
  const isNotificacoesPage = typeof window !== "undefined" && window.location.pathname === "/notificacoes";
  const isHomePage = !isSubPage;
  const homeHref = isSubPage ? "/" : "#home";
  const totalNotificacoes = Number(notificacoesNaoLidas) || 0;
  const badgeNotificacoes = totalNotificacoes > 99 ? "99+" : String(totalNotificacoes);

  // O icone e o texto representam o modo atualmente ativo na interface.
  const themeIconClass = isDarkMode ? "fa-moon" : "fa-sun";
  const themeLabel = isDarkMode ? "Modo escuro" : "Modo claro";
  // Usa base de nav-link para manter altura e alinhamento iguais aos demais itens do menu.
  const themeToggleButtonClassName = `nav-link border-0 bg-transparent d-inline-flex align-items-center ${isDarkMode ? "text-light" : "text-dark"}`;

  return (
    <nav className={`navbar navbar-expand-lg shadow-sm ${isDarkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"}`}>
      <div className="container-fluid">
        {/* Logo/Brand */}
        <a className="navbar-brand fw-bold" href={homeHref}>
          <i className="fa-solid fa-jet-fighter"></i>
          Entrega via Drones
        </a>

        {/* Hamburger Button (Mobile) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className={`nav-link ${isHomePage ? "active" : ""}`} aria-current={isHomePage ? "page" : undefined} href={homeHref}>
                <i className="fa fa-home me-1"></i>
                Início
              </a>
            </li>
            <li className="nav-item">
              <a className={`nav-link ${isPedidoPage ? "active" : ""}`} aria-current={isPedidoPage ? "page" : undefined} href="/pedido">
                <i className="fa fa-box me-1"></i>
                Pedidos
              </a>
            </li>
            <li className="nav-item">
              {/* CORREÇÃO: o link apontava para "#contato", âncora que não existe.
                  O formulário de contato fica na CallToAction (home) com id
                  "mensagem-direta" e abre ao detectar esse hash. Usamos
                  "/#mensagem-direta" para funcionar a partir de qualquer página. */}
              <a className="nav-link" href="/#mensagem-direta">
                <i className="fa fa-envelope me-1"></i>
                Contato
              </a>
            </li>
            <li className="nav-item">
              <a className={`nav-link ${isPrecosPage ? "active" : ""}`} aria-current={isPrecosPage ? "page" : undefined} href="/precos">
                <i className="fa fa-tag me-1"></i>
                Preços
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link position-relative d-inline-flex align-items-center ${isNotificacoesPage ? "active" : ""}`}
                aria-current={isNotificacoesPage ? "page" : undefined}
                aria-label={
                  totalNotificacoes > 0
                    ? `${totalNotificacoes} notificacoes nao lidas`
                    : "Notificacoes"
                }
                href="/notificacoes"
              >
                <i className="fa-solid fa-bell me-1" aria-hidden="true"></i>
                Notificações
                {totalNotificacoes > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ minWidth: "1.25rem", fontSize: "0.65rem" }}
                  >
                    {badgeNotificacoes}
                    <span className="visually-hidden">notificacoes nao lidas</span>
                  </span>
                )}
              </a>
            </li>
            {usuario ? (
              <>
                <li className="nav-item">
                  <a
                    className={`nav-link ${isContaPage ? "active" : ""}`}
                    aria-current={isContaPage ? "page" : undefined}
                    href="/conta"
                  >
                    <i className="fa fa-user-circle me-1"></i>
                    {usuario.nome || usuario.email}
                  </a>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link border-0 bg-transparent ${isDarkMode ? "text-light" : "text-dark"}`}
                    onClick={onLogout}
                  >
                    <i className="fa fa-right-from-bracket me-1"></i>
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <a className={`nav-link ${isLoginPage ? "active" : ""}`} aria-current={isLoginPage ? "page" : undefined} href="/login">
                  <i className="fa fa-right-to-bracket me-1"></i>
                  Entrar
                </a>
              </li>
            )}
            <li className="nav-item ms-lg-2">
              {/* Botao para alternar claro/escuro com icone do modo atual. */}
              <button
                type="button"
                className={themeToggleButtonClassName}
                onClick={onToggleTheme}
                aria-label={isDarkMode ? "Trocar para modo claro" : "Trocar para modo escuro"}
              >
                <i className={`fa-solid ${themeIconClass} me-1`} aria-hidden="true"></i>
                {themeLabel}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
