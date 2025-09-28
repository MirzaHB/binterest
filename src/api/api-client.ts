import axios, { AxiosInstance } from 'axios';

// Create API client without auth interceptor - auth will be handled manually
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://bagelb0y-c6gfhyfsheebdzdm.canadacentral-01.azurewebsites.net/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a function to create authenticated requests
export const createAuthenticatedRequest = (token: string) => {
  return axios.create({
    baseURL: 'https://bagelb0y-c6gfhyfsheebdzdm.canadacentral-01.azurewebsites.net/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
};

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