import axios from 'axios';

// Create axios instance with interceptors
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Log all requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Axios Request]', {
          url: config.url,
          method: config.method,
          headers: config.headers
        });
      }
      return config;
    },
    (error) => {
      console.error('[Axios Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Log successful responses in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Axios Response]', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
      }
      return response;
    },
    (error) => {
      // Enhanced error logging
      console.error('[Axios Response Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        code: error.code,
        data: error.response?.data
      });

      // Handle specific error codes
      if (error.code === 'ERR_NETWORK') {
        console.error('🔴 Network Error - Request failed to reach server:', {
          url: error.config?.url,
          headers: error.config?.headers,
          data: error.config?.data
        });
      }

      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request Timeout:', error.config?.url);
      }

      if (error.response?.status === 401) {
        console.error('🔐 Unauthorized - Redirect to login');
        // Optionally redirect to login
        // window.location.href = '/login';
      }

      if (error.response?.status === 413) {
        console.error('📦 Payload Too Large');
      }

      if (error.response?.status >= 500) {
        console.error('🔥 Server Error:', error.response?.status);
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
