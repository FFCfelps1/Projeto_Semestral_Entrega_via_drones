const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 py-md-5">
      <div className="container">
        {/* Top Section - Logo & Description */}
        <div className="row mb-4 mb-md-5">
          <div className="col-12 col-sm-6 col-md-4 mb-4 mb-md-0 text-center text-sm-start">
            <h5 className="fw-bold mb-3">
              <i className="fa fa-paper-plane me-2 text-primary"></i>
              SkySwift
            </h5>
            <p className="text-muted small">
              Revolucionando a forma como o mundo move bens através de tecnologia aérea autônoma.
            </p>
            {/* Social Icons */}
            <div className="d-flex gap-3 mt-3 justify-content-center justify-content-sm-start">
              <a href="#" className="text-muted text-decoration-none">
                <i className="fa fa-globe"></i>
              </a>
              <a href="#" className="text-muted text-decoration-none">
                <i className="fa fa-linkedin"></i>
              </a>
              <a href="#" className="text-muted text-decoration-none">
                <i className="fa fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="col-12 col-sm-6 col-md-2 mb-4 mb-md-0 text-center text-sm-start">
            <h6 className="fw-bold mb-3 text-uppercase">Produto</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Como Funciona
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Benefícios
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-12 col-sm-6 col-md-2 mb-4 mb-md-0 text-center text-sm-start">
            <h6 className="fw-bold mb-3 text-uppercase">Empresa</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Sobre Nós
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Carreira
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Segurança
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="col-12 col-sm-6 col-md-2 text-center text-sm-start">
            <h6 className="fw-bold mb-3 text-uppercase">Suporte</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Central de Ajuda
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Termos
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="bg-secondary" />

        {/* Bottom Section - Copyright */}
        <div className="row">
          <div className="col-12 text-center">
            <p className="text-muted small mb-0">
              © 2024 SkySwift Tecnologias Inc. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
