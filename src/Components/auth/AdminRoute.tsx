import React from 'react';
import { useAuth } from '../../auth/useAuth';
import './ProtectedRoute.css';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, hasCrudRole, isLoadingUserInfo } = useAuth();

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

  if (isLoadingUserInfo) {
    return (
      <div className="protected-route-message">
        <div className="access-card">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!hasCrudRole()) {
    return (
      <div>
        {fallback || (
          <div className="protected-route-message">
            <div className="access-card">
              <span className="access-icon">🚫</span>
              <h2>CRUD Access Required</h2>
              <p>You don't have permission to access this feature.</p>
              <div className="access-hint">
                This feature requires CRUD permissions.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;