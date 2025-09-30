import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { msalConfig } from './auth/auth-config';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Add event callbacks to track authentication
msalInstance.addEventCallback((event) => {
  if (event.eventType === 'msal:loginSuccess') {
    // Login successful - no action needed
  }

  if (event.eventType === 'msal:loginFailure') {
    // Login failed - no action needed
  }

  if (event.eventType === 'msal:acquireTokenSuccess') {
    // Token acquired - no action needed
  }

  if (event.eventType === 'msal:acquireTokenFailure') {
    // Token acquisition failed - no action needed
  }
});

// Initialize MSAL and handle redirects
msalInstance.initialize().then(() => {
  // Handle redirect promise
  return msalInstance.handleRedirectPromise();
}).then((response) => {
  if (response) {
    if (response.account) {
      // Set active account
      msalInstance.setActiveAccount(response.account);
    }
  }
}).catch((error) => {
  console.error('❌ MSAL initialization or redirect handling failed:', error);
});

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
