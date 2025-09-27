import axios, { AxiosInstance } from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../auth/auth-config';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api', // Proxy will redirect to your backend
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const msalInstance = new PublicClientApplication(msalConfig);

// Add request interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const response = await msalInstance.acquireTokenSilent({
        scopes: [`api://${process.env.REACT_APP_MSAL_CLIENT_ID}/access_as_user`],
        account: accounts[0],
      });

      if (response.accessToken) {
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      }
    }
  } catch (error) {
    console.warn('Failed to acquire access token:', error);
  }
  return config;
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle 403 Forbidden responses from OID-based authorization
    if (error.response?.status === 403) {
      const errorText = await error.response.text?.() || error.response.data;
      if (errorText === "Admin access required") {
        console.error('Admin privileges required for this action');
        error.message = "Admin privileges required for this action";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient