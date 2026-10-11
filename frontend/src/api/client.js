/**
 * Kivora Centralized API HTTP Client
 * Reads VITE_API_BASE_URL, injects Bearer JWT authentication,
 * normalizes error responses, and handles multipart uploads.
 */

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://kivora-api-n7m1.onrender.com'
    : 'http://localhost:8000')
).trim().replace(/\/+$/, '');

// Strip trailing /api if user specified it in VITE_API_BASE_URL so that endpoint paths like /api/... concatenate properly
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const TOKEN_STORAGE_KEY = 'kivora_access_token';

/**
 * Retrieves the currently stored JWT access token from localStorage.
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Saves the JWT access token to localStorage.
 */
export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to access localStorage:', err);
  }
}

/**
 * Clears stored authentication session tokens.
 */
export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear stored token:', err);
  }
}

/**
 * Resolves a backend-relative media or asset URL (e.g. '/uploads/...' or '/assets/...')
 * to a fully qualified URL for rendering in <img>, <video>, or <a> tags.
 */
export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Standard API error class carrying HTTP status code and backend error details.
 */
export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Core HTTP request dispatcher using native Fetch with timeout, retry, and normalized error responses.
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    params = null,
    headers = {},
    requiresAuth = false,
    isFormData = false,
    timeoutMs = 30000,
    retryCount = 1,
    ...restOptions
  } = options;

  // 1. Build Query Parameters
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // 2. Prepare Headers
  const requestHeaders = new Headers(headers);

  // Set JSON Content-Type only if not sending FormData
  if (!isFormData && data && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Inject Bearer Authorization header if token exists or if explicitly required
  const token = getStoredToken();
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  } else if (requiresAuth && !token) {
    throw new ApiError('Authentication required. Please sign in.', 401);
  }

  // 3. Prepare Request Body
  let body = undefined;
  if (data !== null && data !== undefined) {
    if (isFormData) {
      body = data; // FormData object directly
    } else {
      body = typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  // 4. Helper for Single Attempt with AbortController
  async function executeSingleAttempt() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
        ...restOptions,
      });

      clearTimeout(timer);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Parse Response (JSON or Text)
      const contentType = response.headers.get('content-type') || '';
      let responseData = null;
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textContent = await response.text();
        // If response is HTML, don't dump markup into error details
        responseData = textContent.startsWith('<') ? null : textContent;
      }

      // Handle HTTP Errors
      if (!response.ok) {
        let errorMessage =
          (responseData && typeof responseData === 'object' && responseData.detail) ||
          (typeof responseData === 'string' && responseData);

        if (!errorMessage) {
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            errorMessage = 'The Kivora API server is waking up or temporarily unavailable (cold start). Please retry in a few seconds.';
          } else {
            errorMessage = `Request failed with status ${response.status}`;
          }
        }

        // Dispatch global auth expiration event on 401 if token was present
        if (response.status === 401 && token) {
          clearStoredToken();
          window.dispatchEvent(new CustomEvent('kivora:auth-expired'));
        }

        throw new ApiError(errorMessage, response.status, responseData);
      }

      return responseData;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // 5. Execute with 1-time retry for transient network / cold start errors
  let lastError = null;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await executeSingleAttempt();
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError) {
        // HTTP response received (e.g. 400, 401, 403, 404, 429) - do not retry client errors
        if (err.status >= 400 && err.status < 500) {
          throw err;
        }
      }

      const isNetworkError =
        err.name === 'AbortError' ||
        err.name === 'TypeError' ||
        (typeof err.message === 'string' &&
          (err.message.toLowerCase().includes('failed to fetch') ||
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('connection')));

      // If we have retries left and it was a transient network error, wait briefly and retry
      if (attempt < retryCount && isNetworkError) {
        await new Promise((res) => setTimeout(res, 1200));
        continue;
      }

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiError(
          `Request to Kivora API server timed out after ${Math.round(timeoutMs / 1000)}s. The backend may be starting up from cold sleep; please retry.`,
          0,
          null
        );
      }

      const message = isNetworkError
        ? `Unable to connect to Kivora API server at ${API_BASE_URL}. Please verify that the backend is running and accessible.`
        : err.message || 'Network connection failed';
      throw new ApiError(message, 0, null);
    }
  }

  throw lastError;
}

export default {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', data }),
  put: (endpoint, data, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', data }),
  patch: (endpoint, data, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', data }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', data: formData, isFormData: true }),
  getMediaUrl,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  API_BASE_URL,
};
