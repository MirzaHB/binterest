import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthDropdown from '../auth/AuthDropdown';
import { useAuth } from '../../auth/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { hasCrudRole } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const hamburgerRef = React.useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideMenu = mobileMenuRef.current?.contains(target);
      const clickedHamburger = hamburgerRef.current?.contains(target);

      if (!clickedInsideMenu && !clickedHamburger && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">👨‍💻</span>
        </Link>

        <div ref={mobileMenuRef} className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">👤</span>
            About
          </Link>

          <Link
            to="/projects"
            className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">🛠️</span>
            Projects
          </Link>

          <Link
            to="/photos"
            className={`nav-link ${isActive('/photos') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">🖼️</span>
            Gallery
          </Link>

          <Link
            to="/blog"
            className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">📝</span>
            Blog
          </Link>

          {hasCrudRole() && (
            <Link
              to="/photo-upload"
              className={`nav-link ${isActive('/photo-upload') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">📸</span>
              Photos
            </Link>
          )}

          {hasCrudRole() && (
            <Link
              to="/blog-editor"
              className={`nav-link ${isActive('/blog-editor') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">✍️</span>
              Write
            </Link>
          )}
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle-nav"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="nav-icon">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
          <AuthDropdown />

          {/* Hamburger menu button for mobile - inside nav-actions */}
          <button
            ref={hamburgerRef}
            className={`hamburger-button ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;