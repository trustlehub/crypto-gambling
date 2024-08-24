import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Define the interface for the configuration
interface ApiConfig {
  baseURL: string;
  apiKey: string;
}

// Function to create an Axios instance with the API key included in headers
const createApiInstance = (config: ApiConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add a request interceptor to include the API key in the URL for GET requests
  instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      if (requestConfig.method?.toUpperCase() === 'GET') {
        if (requestConfig.params) {
          requestConfig.params['apiKey'] = config.apiKey;
        } else {
          requestConfig.params = { apiKey: config.apiKey };
        }
      }
      return requestConfig;
    },
    (error) => {
      // Handle the error
      return Promise.reject(error);
    }
  );

  return instance;
};

// Example usage:
const api = createApiInstance(
  {
    apiKey:'e28b2f97af9bae21c7ee3d97a12f49e2',
    baseURL:"https://api.the-odds-api.com/v4"
  }
)
export default api
// const api = createApiInstance({ baseURL: 'https://api.example.com', apiKey: 'your_api_key' });
// api.get('/some-endpoint').then(response => console.log(response.data));
