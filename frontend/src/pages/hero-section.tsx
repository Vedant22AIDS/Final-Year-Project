import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  return (
    <>
      <section className="hero">
        <div className="hero-content-container">
          <div className="hero-text">
            <span>No-Code AI/ML Data Preprocessing Tool</span>
            <img
              className="hero-ele-1"
              src="/assets/react-native.png"
              alt="React Native logo"
            />
            <h1 className="hero-title">
              No-Code AI/ML Data Preprocessing Tool
            </h1>
            <img
              className="hero-ele-2"
              src="/assets/tensorflow_logo.png"
              alt="TensorFlow logo"
            />
            <p className="hero-description">
              Take your data preprocessing to the next level with our
              cutting-edge tools and analytics. Transform raw data into
              actionable insights.
            </p>
            <div className="cta-buttons">
              <Link to="/EditorApp">
                <button className="cta-btn primary">Start Preprocessing</button>
              </Link>
              <Link to="/preprocessing-info">
                <button className="cta-btn secondary">Learn More</button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-image-container">
          <img
            src="/assets/Hero-img.png"
            alt="Data Preprocessing"
            className="hero-image"
          />
        </div>
      </section>

      {/* Client Company Logos Slider */}
      {/* <section className="client-logo-section">
  <h3 className="client-logo-header">Our Trusted Clients</h3>
  <div className="client-logo-container">
    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="Nike" className="client-logo" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="client-logo" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.png/1200px-Adobe_Corporate_Logo.png" alt="Adobe" className="client-logo" />
    <img src="https://www.victoryxr.com/wp-content/uploads/2023/04/Meta-Logo-1024x576.png.webp" alt="Meta" className="client-logo" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/1200px-Walmart_logo.svg.png" alt="walmart" className="client-logo" />
    <img src="https://brandlogos.net/wp-content/uploads/2025/02/zomato-logo_brandlogos.net_9msh7.png" alt="Zomato" className="client-logo" />
    <img src="https://images.crowdspring.com/blog/wp-content/uploads/2023/07/03162944/amazon-logo-1.png" alt="Amazon" className="client-logo" />
    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/BigBasket_Logo.svg/1200px-BigBasket_Logo.svg.png" alt="bigbasket" className="client-logo" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/512px-Dominos_pizza_logo.svg.png" alt="dominos" className="client-logo" />
    <img src="https://jaykhodiyar.com/wp-content/uploads/2023/03/Adani-Wilmar.png" alt="adani" className="client-logo" />
    <img src="https://e7.pngegg.com/pngimages/230/559/png-clipart-oracle-logo-oracle-corporation-logo-cloud-computing-business-management-oracle-logo-text-service.png" alt="oracle" className="client-logo" />

  </div>
</section> */}
    </>
  );
};

export default Hero;
