const TopBar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        {/* Logo/Brand */}
        <a className="navbar-brand fw-bold" href="#home">
          <i className="fas fa-box-open me-2"></i>
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
              <a className="nav-link active" aria-current="page" href="#home">
                <i className="fas fa-home me-1"></i>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#pedidos">
                <i className="fas fa-box me-1"></i>
                Pedidos
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contato">
                <i className="fas fa-envelope me-1"></i>
                Contato
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
