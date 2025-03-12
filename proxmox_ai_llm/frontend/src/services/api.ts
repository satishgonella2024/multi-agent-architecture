import axios, { AxiosResponse, AxiosError } from 'axios';

interface APIErrorResponse {
  message?: string;
  [key: string]: any;
}

// API error types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://192.168.5.199:8000' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout for health checks
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<APIErrorResponse>) => {
    if (error.response) {
      throw new APIError(
        error.response.data?.message || 'An error occurred',
        error.response.status || 500,
        error.response.data
      );
    }
    throw new APIError('Network error', 0);
  }
);

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.DEV ? 'http://192.168.5.199:8000' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'),
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Checks if the backend API is available
 * @returns Promise that resolves to true if the API is available, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health', { 
      timeout: 3000 // Short timeout for health check
    });
    return response.status === 200 && response.data?.status === 'healthy';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Handles API response and extracts data or throws appropriate error
 */
async function handleResponse<T>(response: Response): Promise<T> {
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new APIError('Invalid JSON response', response.status);
  }

  if (!response.ok) {
    throw new APIError(
      data.message || 'API request failed',
      response.status,
      data
    );
  }

  return data as T;
}

/**
 * Makes an API request with retry logic
 */
async function makeRequest<T>(
  url: string,
  config: RequestConfig
): Promise<T> {
  const {
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retries,
    retryDelay = API_CONFIG.retryDelay,
    ...fetchConfig
  } = config;

  // Add base URL if relative path
  const fullUrl = url.startsWith('http')
    ? url
    : `${API_CONFIG.baseURL}${url}`;

  // Add default headers
  const headers = new Headers(fetchConfig.headers);
  if (!headers.has('Content-Type') && config.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(fullUrl, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a 4xx error
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retries - 1) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof APIError) {
    throw lastError;
  }
  throw new NetworkError('Network request failed after retries');
}

/**
 * Makes a GET request to the API
 */
export async function apiGet<T>(
  url: string,
  config: Omit<RequestConfig, 'body' | 'method'> = {}
): Promise<T> {
  return makeRequest<T>(url, {
    ...config,
    method: 'GET',
  });
}

/**
 * Makes a POST request to the API
 */
export async function apiPost<T>(
  url: string,
  data?: any,
  config: Omit<RequestConfig, 'body' | 'method'> = {}
): Promise<T> {
  console.log('API POST request to:', url);
  console.log('With data:', data);
  
  try {
    // Try using axios first
    const response = await api.post(url, data);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Axios error:', error);
    
    // Fall back to fetch
    return makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Makes a PUT request to the API
 */
export async function apiPut<T>(
  url: string,
  data?: any,
  config: Omit<RequestConfig, 'body' | 'method'> = {}
): Promise<T> {
  return makeRequest<T>(url, {
    ...config,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Makes a DELETE request to the API
 */
export async function apiDelete<T>(
  url: string,
  config: Omit<RequestConfig, 'body' | 'method'> = {}
): Promise<T> {
  return makeRequest<T>(url, {
    ...config,
    method: 'DELETE',
  });
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
} 