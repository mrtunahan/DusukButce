import * as SecureStore from 'expo-secure-store';

// ⚠️  Geliştirme için kendi yerel IP'ni yaz:
//   macOS:   ipconfig getifaddr en0
//   Linux:   hostname -I | awk '{print $1}'
//   Windows: ipconfig | findstr IPv4
const DEV_API_URL = 'http://192.168.1.42:3000';
const PROD_API_URL = 'https://api.senin-domain.com';

export const API_BASE = __DEV__ ? DEV_API_URL : PROD_API_URL;

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveTokens(access_token, refresh_token) {
  await SecureStore.setItemAsync(TOKEN_KEY, access_token);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh_token);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function refreshAccessToken() {
  const refresh_token = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refresh_token) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });

  if (!res.ok) {
    await clearTokens();
    throw new Error('Session expired');
  }

  const data = await res.json();
  await saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

async function request(path, options = {}, retry = true) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    return request(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    }, false);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status });
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const authApi = {
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// Receipts
export const receiptsApi = {
  upload: async (imageUri, mimeType = 'image/jpeg') => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: 'receipt.jpg', type: mimeType });

    const res = await fetch(`${API_BASE}/receipts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error);
    }
    return res.json();
  },
  list: (page = 1) => request(`/receipts?page=${page}&limit=20`),
  getOne: (id) => request(`/receipts/${id}`),
  getStatus: (id) => request(`/receipts/${id}/status`),
  remove: (id) => request(`/receipts/${id}`, { method: 'DELETE' }),
};

// Insights
export const insightsApi = {
  inflation: (months = 6) => request(`/insights/inflation?months=${months}`),
  anomalies: (threshold = 0.2) => request(`/insights/anomalies?threshold=${threshold}`),
  priceTrend: (productId, days = 90) => request(`/products/${productId}/price-history?days=${days}`),
  marketComparison: (productId) => request(`/products/${productId}/markets`),
};
