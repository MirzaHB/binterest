import React from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import LoginButton from './LoginButton';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <div>
        <p>You must be logged in to access this page.</p>
        <LoginButton />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;