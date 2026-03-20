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
              Revolutionizing the way the world moves goods through autonomous aerial technology.
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
            <h6 className="fw-bold mb-3 text-uppercase">Product</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  How it Works
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Benefits
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-12 col-sm-6 col-md-2 mb-4 mb-md-0 text-center text-sm-start">
            <h6 className="fw-bold mb-3 text-uppercase">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  About Us
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Careers
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Safety
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="col-12 col-sm-6 col-md-2 text-center text-sm-start">
            <h6 className="fw-bold mb-3 text-uppercase">Support</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Help Center
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Terms
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none small">
                  Privacy
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
              © 2024 SkySwift Technologies Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
