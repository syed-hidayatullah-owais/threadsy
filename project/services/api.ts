import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://127.0.0.1:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network request failed' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return { data };
}

export const api = {
  setToken(token: string) {
    this.token = token;
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('API GET Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('API POST Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('API PUT Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('API DELETE Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },

  async uploadImage(endpoint: string, imageUri: string): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      return handleResponse(response);
    } catch (error) {
      console.error('API Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },

  token: '',
};