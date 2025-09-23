import React from 'react';
import { useMsal } from '@azure/msal-react';

const LogoutButton: React.FC = () => {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <button className="btn btn-secondary" onClick={handleLogout}>
      Logout
    </button>
  );
};
export default LogoutButton;