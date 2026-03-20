const Advantages = () => {
  const advantages = [
    {
      id: 1,
      icon: "fighter-jet",
      title: "Ultra Fast Shipping",
      description: "Bypass urban congestion with average delivery times under 15 minutes."
    },
    {
      id: 2,
      icon: "leaf",
      title: "Eco-friendly Operations",
      description: "DCS securely fleet significantly reduces carbon footprint per mile."
    },
    {
      id: 3,
      icon: "shield",
      title: "Bank-Level Security",
      description: "Encrypted real-time tracking and tamper-proof package compartments."
    }
  ];

  return (
    <section className="bg-light py-5">
      <div className="container">
        {/* Heading Section */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="display-5 fw-bold mb-3">The SkySwift Advantage</h2>
            <p className="lead text-muted">
              Why thousands of modern businesses and consumers are switching to drone-first logistics.
            </p>
          </div>
        </div>

        {/* Advantages Cards */}
        <div className="row g-4">
          {advantages.map((advantage) => (
            <div key={advantage.id} className="col-md-6 col-lg-4">
              <div className="d-flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className={`fa fa-${advantage.icon} fa-2x text-primary`}></i>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-2">{advantage.title}</h5>
                  <p className="text-muted small">{advantage.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;
