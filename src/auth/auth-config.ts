import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID!, // Your Azure App Registration Client ID
    authority: 'https://login.microsoftonline.com/common', // or your tenant ID
    redirectUri: window.location.origin, // Usually http://localhost:3000 in dev
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read'], // Adjust based on what your API needs
};

export const apiRequest = {
  scopes: [`api://${process.env.REACT_APP_API_CLIENT_ID}/access_as_user`], // Your API scope
};