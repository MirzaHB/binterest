import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import './index.css';
import App from './App';
import { msalConfig } from './auth/auth-config';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

const renderApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
};

// Initialize MSAL, process any redirect response, then render.
// Must render AFTER handleRedirectPromise resolves so the account
// is set before React components first mount.
msalInstance.initialize().then(() => {
  return msalInstance.handleRedirectPromise();
}).then((response) => {
  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
  }
  renderApp();
}).catch((error) => {
  console.error('❌ MSAL initialization or redirect handling failed:', error);
  // Render anyway so the user isn't stuck on a blank page
  renderApp();
});
