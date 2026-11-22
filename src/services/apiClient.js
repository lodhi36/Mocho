import { ENV_CONFIG } from '../constants/config.js';

const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem('portway_auth_token') || '';
  } catch {
    return '';
  }
}

export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body = null, headers = {}, timeout = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  const token = getStoredToken();
  const mergedHeaders = {
    Accept: 'application/json',
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await fetch(`${ENV_CONFIG.apiBaseUrl}${endpoint}`, {
      method,
      headers: mergedHeaders,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '');

    if (!response.ok) {
      throw new ApiError(
        (payload && payload.message) || `Request failed with status ${response.status}`,
        response.status,
        payload
      );
    }

    return payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server request timed out. Please check your connection.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Unable to reach the configured API endpoint. Verify VITE_API_BASE_URL or switch to Demo Mode.',
      0,
      err
    );
  } finally {
    clearTimeout(timerId);
  }
}

export const apiClient = {
  get: (endpoint, opts) => apiRequest(endpoint, { ...opts, method: 'GET' }),
  post: (endpoint, body, opts) => apiRequest(endpoint, { ...opts, method: 'POST', body }),
  put: (endpoint, body, opts) => apiRequest(endpoint, { ...opts, method: 'PUT', body }),
  patch: (endpoint, body, opts) => apiRequest(endpoint, { ...opts, method: 'PATCH', body }),
  delete: (endpoint, opts) => apiRequest(endpoint, { ...opts, method: 'DELETE' }),
};
