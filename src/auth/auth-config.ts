import { Configuration, LogLevel } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID;
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID || 'common';
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin;

if (!clientId) {
  throw new Error('VITE_MSAL_CLIENT_ID is required');
}

export const apiScopes = [`api://${clientId}/access_as_user`];

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: apiScopes,
};

export const logoutRequest = {
  postLogoutRedirectUri: redirectUri,
};
