import React from 'react';
import ReactDOM from 'react-dom/client';
import { EventType, PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import './index.css';
import App from './App';
import { msalConfig } from './auth/auth-config';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Signing out clears the local session, then leaves for Microsoft's sign-out
// page. Coming back with the Back button restores this page from the
// back/forward cache with MSAL's "sign-out in progress" flag still set, and
// every later sign-in fails with interaction_in_progress. MSAL clears that flag
// on startup, so start up again.
let signOutStarted = false;
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGOUT_START) signOutStarted = true;
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted && signOutStarted) window.location.reload();
});

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
