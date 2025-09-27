import React from 'react';
import { useAuth } from '../../auth/useAuth';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        {fallback || (
          <div className="protected-route-message">
            <div className="access-card">
              <span className="access-icon">🔐</span>
              <h2>Authentication Required</h2>
              <p>Please sign in to access this feature.</p>
              <div className="access-hint">
                Click the profile icon in the top right corner to sign in.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>
};

export default ProtectedRoute;