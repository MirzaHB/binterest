import React from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { Link } from 'react-router-dom';
import LoginButton from './auth/LoginButton';
import LogoutButton from './auth/LogoutButton';
import './Home.css';

const Home: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Hi, I'm <span className="brand-highlight">Hassan Baig</span>
          </h1>
          <p className="hero-subtitle">
            A passionate developer, photographer, and creative storyteller. Welcome to my digital portfolio where I share my journey through code, captures, and thoughts.
          </p>

          <div className="hero-actions">
            <Link to="/photos" className="action-button primary">
              <span className="button-icon">🖼️</span>
              View My Work
            </Link>
            <Link to="/blog" className="action-button secondary">
              <span className="button-icon">📝</span>
              Read My Blog
            </Link>
          </div>

          <div className="skills-section">
            <h3>What I Do</h3>
            <div className="skills-grid">
              <div className="skill-item">
                <span className="skill-icon">💻</span>
                <span>Full-Stack Development</span>
              </div>
              <div className="skill-item">
                <span className="skill-icon">📸</span>
                <span>Photography</span>
              </div>
              <div className="skill-item">
                <span className="skill-icon">🎨</span>
                <span>UI/UX Design</span>
              </div>
              <div className="skill-item">
                <span className="skill-icon">☁️</span>
                <span>Cloud Solutions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <div className="profile-section">
            <div className="profile-placeholder">
              <span className="profile-icon">👨‍💻</span>
              <p>Your photo here</p>
            </div>
            <div className="social-links">
              <a href="#" className="social-link">
                <span>💼</span>
                LinkedIn
              </a>
              <a href="#" className="social-link">
                <span>📧</span>
                Contact
              </a>
              <a href="#" className="social-link">
                <span>📱</span>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-section">
        {isAuthenticated ? (
          <div className="auth-card authenticated">
            <h3>Welcome back!</h3>
            <p className="user-info">
              <span className="user-icon">👤</span>
              {accounts[0]?.username}
            </p>
            <LogoutButton />
          </div>
        ) : (
          <div className="auth-card">
            <h3>Get Started</h3>
            <p>Sign in to upload and manage your photos</p>
            <LoginButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
