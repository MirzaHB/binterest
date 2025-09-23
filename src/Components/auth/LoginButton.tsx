import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../auth/auth-config';

const LoginButton: React.FC = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <button className="btn btn-primary" onClick={handleLogin}>
      Log in with Microsoft
    </button>
  );
};
export default LoginButton;