import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { loginRequest, logoutRequest } from '../../auth/auth-config';
import './AuthDropdown.css';

const AuthDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, currentUser, instance } = useAuth();

  const handleLogin = async () => {
    console.log('🔐 Login button clicked!');
    console.log('🔧 MSAL instance:', instance);
    console.log('📝 Login request:', loginRequest);

    try {
      console.log('🚀 Attempting login redirect...');
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect(logoutRequest);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="auth-dropdown" ref={dropdownRef}>
      <button
        className={`auth-button ${isAuthenticated ? 'authenticated' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isAuthenticated ? 'Account menu' : 'Login'}
      >
        {isAuthenticated ? (
          <div className="user-avatar">
            <span className="avatar-icon">👤</span>
          </div>
        ) : (
          <span className="login-icon">🔐</span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {isAuthenticated ? (
            <>
              <div className="user-info">
                <div className="user-name">{currentUser?.name}</div>
                <div className="user-email">{currentUser?.email}</div>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout-button"
                onClick={handleLogout}
              >
                <span className="item-icon">🚪</span>
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="dropdown-item login-button"
              onClick={handleLogin}
            >
              <span className="item-icon">🔐</span>
              Sign In with Microsoft
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDropdown;