import axios from 'axios';
import Constants from 'expo-constants';
import { getValueFor } from '../utils/secureStorage';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Get auth token from secure storage
    const token = await getValueFor('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error responses
    if (error.response) {
      // The request was made and the server responded with a status code
      // outside of the 2xx range
      console.error('API Error Response:', error.response.data);
      
      // Handle 401 Unauthorized (token expired or invalid)
      if (error.response.status === 401) {
        // Handle logout or token refresh logic
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error - No Response:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
