import React, { useState } from 'react';
import {
  FaLinkedinIn,
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaMedium,
  FaFacebookF
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [darkMode, setDarkMode] = useState(true);
  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  return (
    <footer className={`site-footer ${darkMode ? '' : 'light-mode'}`}>
      {/* ——— Main flex container ——— */}
      <div className="footer-main">
        {/* ——— Left side: signup + social + acknowledgment ——— */}
        <div className="footer-left">
          <div className="signup-banner">
            <h2>Sign up for updates</h2>
            <p>We wouldn't dream of spamming you or selling your info.</p>
            <form className="signup-form">
              <input
                type="email"
                placeholder="Enter your email address"
                required
              />
              <button type="submit">LET’S GO</button>
            </form>
            <div className="social-row">
              <a href="https://linkedin.com"   target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
              <a href="https://github.com"     target="_blank" rel="noopener noreferrer"><FaGithub /></a>
              <a href="https://twitter.com"    target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com"  target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://youtube.com"    target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
              <a href="https://medium.com"     target="_blank" rel="noopener noreferrer"><FaMedium /></a>
              <a href="https://facebook.com"   target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
            </div>
          </div>

          <div className="acknowledgment">
            <p>
              Plotly is based on Tioh’tia:ke, commonly known in English as Montreal
              Island, in Kanien’kehá:ka, the “Place of the People of the Flint”
              (the Kanien’kehá:ka).
            </p>
            <p>
              Plotly is committed to making the tech industry more accessible to
              people from different cultures, as well as using and encouraging the
              use of our technology for anti-racist efforts. For our complete land
              acknowledgment and resources to learn about settlement and contribute
              to Indigenous activism, visit our <a href="/about">About Us</a> page.
            </p>
          </div>
        </div>

        {/* ——— Right side: six columns of links ——— */}
        <div className="footer-right">
          <div className="links-grid">
            <div>
              <h4>PRODUCT</h4>
              <ul>
                <li>Dash Enterprise</li>
                <li>
                  Plotly AI <span className="badge">New</span>
                </li>
                <li>Plotly App Studio</li>
                <li>New Releases →</li>
              </ul>
            </div>
            <div>
              <h4>DOCS</h4>
              <ul>
                <li>Dash Enterprise</li>
                <li>Dash Open Source</li>
                <li>Graphing Libraries</li>
              </ul>
            </div>
            <div>
              <h4>COMPANY</h4>
              <ul>
                <li>
                  Careers <span className="badge-outlined">WE ARE HIRING</span>
                </li>
                <li>Contact Us</li>
                <li>Press & News</li>
                <li>Brand Guidelines</li>
              </ul>
            </div>
            <div>
              <h4>SERVICES</h4>
              <ul>
                <li>Customer Success</li>
                <li>Professional Services</li>
              </ul>
            </div>
            <div>
              <h4>RESOURCES</h4>
              <ul>
                <li>Videos</li>
                <li>User Stories</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h4>SOLUTIONS</h4>
              <ul>
                <li>Gen AI & ML</li>
                <li>Financial Services</li>
                <li>Healthcare & Life Sciences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ——— Footer bottom bar ——— */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Plotly. All rights reserved.</span>
        <nav>
          <a href="/cookies">Cookie Preferences</a>
          <a href="/privacy">Privacy</a>
          <a href="/security">Security</a>
        </nav>
      </div>

      {/* ——— Fixed light/dark toggle ——— */}
      <button className="theme-toggle" onClick={toggleDark}>
        {darkMode ? '🌙' : '☀️'}
      </button>
    </footer>
  );
};

export default Footer;
