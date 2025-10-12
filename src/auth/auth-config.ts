import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
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
  scopes: [`api://${process.env.REACT_APP_MSAL_CLIENT_ID}/access_as_user`],
};

export const logoutRequest = {
  postLogoutRedirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || window.location.origin,
};