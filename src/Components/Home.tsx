import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <div className="greeting-animation">
            <span className="wave">👋</span>
            <h1 className="hero-title">
              Hi, I'm <span className="brand-highlight">Hassan Baig</span>
            </h1>
          </div>

          <p className="hero-subtitle">
            A passionate developer and creative storyteller crafting digital experiences that inspire and connect.
          </p>

          <div className="hero-actions">
            <Link to="/photos" className="action-button primary">
              <span className="button-icon">📸</span>
              Explore Gallery
            </Link>
            <Link to="/blog" className="action-button secondary">
              <span className="button-icon">✍️</span>
              Read Stories
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-elements">
            <div className="float-item code">{'<>'}</div>
            <div className="float-item camera">📷</div>
            <div className="float-item design">✨</div>
            <div className="float-item rocket">🚀</div>
          </div>
        </div>
      </div>

      <div className="about-section">
        <div className="section-header">
          <h2>About Me</h2>
          <div className="section-line"></div>
        </div>

        <div className="about-content">
          <div className="about-text">
            <p className="about-intro">
              Welcome to my corner of the internet! I'm a full-stack developer with a passion for creating meaningful digital experiences.
            </p>

            <p>
              When I'm not coding, you'll find me behind the camera capturing life's beautiful moments, exploring new technologies,
              or writing about the intersection of creativity and technology. I believe that great software isn't just functional—it's elegant,
              intuitive, and tells a story.
            </p>

            <p>
              My journey spans from building scalable cloud applications to crafting pixel-perfect user interfaces.
              I love solving complex problems with simple, elegant solutions, and I'm always excited to learn something new.
            </p>

            <div className="current-focus">
              <h4>Currently exploring:</h4>
              <div className="focus-tags">
                <span className="tag">React & TypeScript</span>
                <span className="tag">Azure Cloud</span>
                <span className="tag">Photography</span>
                <span className="tag">UI/UX Design</span>
              </div>
            </div>
          </div>

          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Years Coding</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Projects Built</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Ideas Brewing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="connect-section">
        <h3>Let's Connect</h3>
        <p>I'm always open to interesting conversations and new opportunities</p>
        <div className="social-grid">
          <a href="https://linkedin.com/in/hassan-baig" className="social-card" target="_blank" rel="noopener noreferrer">
            <span className="social-icon">💼</span>
            <span className="social-name">LinkedIn</span>
            <span className="social-desc">Professional network</span>
          </a>
          <a href="mailto:hassan@example.com" className="social-card">
            <span className="social-icon">📧</span>
            <span className="social-name">Email</span>
            <span className="social-desc">Direct contact</span>
          </a>
          <a href="https://github.com/hassan-baig" className="social-card" target="_blank" rel="noopener noreferrer">
            <span className="social-icon">🐙</span>
            <span className="social-name">GitHub</span>
            <span className="social-desc">Code & projects</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
