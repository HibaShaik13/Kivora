/**
 * Kivora Centralized API HTTP Client
 * Reads VITE_API_BASE_URL, injects Bearer JWT authentication,
 * normalizes error responses, and handles multipart uploads.
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
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
 * Core HTTP request dispatcher using native Fetch.
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    params = null,
    headers = {},
    requiresAuth = false,
    isFormData = false,
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

  // 4. Execute Fetch
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
      ...restOptions,
    });

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
      responseData = await response.text();
    }

    // Handle HTTP Errors
    if (!response.ok) {
      const errorMessage =
        (responseData && typeof responseData === 'object' && responseData.detail) ||
        (typeof responseData === 'string' && responseData) ||
        `Request failed with status ${response.status}`;

      // Dispatch global auth expiration event on 401 if token was present
      if (response.status === 401 && token) {
        clearStoredToken();
        window.dispatchEvent(new CustomEvent('kivora:auth-expired'));
      }

      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed', 0, null);
  }
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
