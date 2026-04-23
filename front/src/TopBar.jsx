const TopBar = ({ themeMode = "light", onToggleTheme }) => {
  const isDarkMode = themeMode === "dark";
  const isTrackingPage = typeof window !== "undefined" && window.location.pathname === "/rastreamento";
  const isSubPage = typeof window !== "undefined" && window.location.pathname !== "/";
  const homeHref = isSubPage ? "/" : "#home";

  // O icone e o texto representam o modo atualmente ativo na interface.
  const themeIconClass = isDarkMode ? "fa-moon" : "fa-sun";
  const themeLabel = isDarkMode ? "Modo escuro" : "Modo claro";
  // Usa base de nav-link para manter altura e alinhamento iguais aos demais itens do menu.
  const themeToggleButtonClassName = `nav-link border-0 bg-transparent d-inline-flex align-items-center ${isDarkMode ? "text-light" : "text-dark"}`;

  return (
    <nav className={`navbar navbar-expand-lg shadow-sm ${isDarkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"}`}>
      <div className="container-fluid">
        {/* Logo/Brand */}
        <a className="navbar-brand fw-bold" href="#home">
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
              <a className="nav-link active" aria-current="page" href={homeHref}>
                <i className="fa fa-home me-1"></i>
                Início
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#pedidos">
                <i className="fa fa-box me-1"></i>
                Pedidos
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contato">
                <i className="fa fa-envelope me-1"></i>
                Contato
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/precos">
                <i className="fa fa-tag me-1"></i>
                Preços
              </a>
            </li>
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
