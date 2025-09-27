import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MSAL_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [`api://${process.env.REACT_APP_MSAL_CLIENT_ID}/access_as_user`],
};

export const logoutRequest = {
  postLogoutRedirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || window.location.origin,
};