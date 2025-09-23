import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">👨‍💻</span>
          <span className="brand-text">Portfolio</span>
        </Link>

        <div className="nav-menu">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">👤</span>
            About
          </Link>

          <Link
            to="/photos"
            className={`nav-link ${isActive('/photos') ? 'active' : ''}`}
          >
            <span className="nav-icon">🖼️</span>
            Gallery
          </Link>

          <Link
            to="/blog"
            className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            Blog
          </Link>

          <Link
            to="/photo-upload"
            className={`nav-link ${isActive('/photo-upload') ? 'active' : ''}`}
          >
            <span className="nav-icon">📸</span>
            Photos
          </Link>

          <Link
            to="/blog-upload"
            className={`nav-link ${isActive('/blog-upload') ? 'active' : ''}`}
          >
            <span className="nav-icon">✍️</span>
            Write
          </Link>
        </div>

        <div className="nav-actions">
          <button className="nav-button">
            <span className="nav-icon">👤</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;