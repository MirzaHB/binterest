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
  console.log('🔄 MSAL Event:', event.eventType, event);

  if (event.eventType === 'msal:loginSuccess') {
    console.log('✅ Login successful!', event.payload);
  }

  if (event.eventType === 'msal:loginFailure') {
    console.log('❌ Login failed!', event.payload);
  }

  if (event.eventType === 'msal:acquireTokenSuccess') {
    console.log('🎟️ Token acquired!', event.payload);
  }

  if (event.eventType === 'msal:acquireTokenFailure') {
    console.log('❌ Token acquisition failed!', event.payload);
  }
});

// Initialize MSAL and handle redirects
msalInstance.initialize().then(() => {
  console.log('🚀 MSAL initialized successfully');

  // Handle redirect promise
  return msalInstance.handleRedirectPromise();
}).then((response) => {
  if (response) {
    console.log('🔄 Redirect response received:', response);

    if (response.account) {
      console.log('✅ Account from redirect:', response.account);
      console.log('🎭 ID Token Claims:', response.account.idTokenClaims);

      // Set active account
      msalInstance.setActiveAccount(response.account);
      console.log('🎯 Active account set');
    }
  } else {
    console.log('ℹ️ No redirect response (user may not have logged in)');
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
