import React from 'react';
import { Link } from 'react-router-dom';
import TypewriterEffect from './TypewriterEffect';
import './Home.css';
import './TypewriterEffect.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Hello, I am{' '}
            <span className="brand-highlight">
              <TypewriterEffect
                texts={[
                  'Hassan Baig',
                  'A software engineer',
                  'A coffee-addicted, animal loving software nerd'
                ]}
                speed={80}
                deleteSpeed={40}
                delay={2500}
                className="typewriter-text"
              />
            </span>
          </h1>

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
          <div className="about-cards">
            <div className="about-card">
              <span className="card-icon">🤔</span>
              <h3 className="card-title">Curious Thinker</h3>
              <p className="card-description">
                I'm endlessly curious about how things work at their core, diving into the smallest details that make everything tick.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">⚙️</span>
              <h3 className="card-title">Low-Level Enthusiast</h3>
              <p className="card-description">
                Low-level programming fascinates me - understanding the foundation of operating systems and modern languages empowers my coding approach.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">🌐</span>
              <h3 className="card-title">Full-Stack Developer</h3>
              <p className="card-description">
                Building and hosting web applications from scratch, both frontend and backend, gives me the thrill of creating something people can interact with.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">📚</span>
              <h3 className="card-title">Continuous Learner</h3>
              <p className="card-description">
                I constantly experiment with new technologies and frameworks in my free time, pushing my skills further through self-directed learning.
              </p>
            </div>

            <div className="about-card">
              <span className="card-icon">💡</span>
              <h3 className="card-title">Creative Problem Solver</h3>
              <p className="card-description">
                Software engineering allows me to combine creativity and logic, which keeps me excited about the field every day.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="connect-section">
        <h3>Let's Connect</h3>
        <p>I'm always open to interesting conversations and new opportunities</p>
        <div className="social-grid">
          <a href="https://www.linkedin.com/in/mirza-hassan-baig-a33780229/" className="social-card" target="_blank" rel="noopener noreferrer">
            <span className="social-icon">💼</span>
            <span className="social-name">LinkedIn</span>
            <span className="social-desc">Professional network</span>
          </a>
          <a href="https://github.com/MirzaHB" className="social-card" target="_blank" rel="noopener noreferrer">
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
