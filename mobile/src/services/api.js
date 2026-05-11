let _SecureStore = null;
async function getSecureStore() {
  if (!_SecureStore) {
    _SecureStore = await import('expo-secure-store');
  }
  return _SecureStore;
}

// ⚠️  Geliştirme için kendi yerel IP'ni yaz:
//   macOS:   ipconfig getifaddr en0
const DEV_API_URL = 'http://192.168.1.200:3000';
const PROD_API_URL = 'https://api.senin-domain.com';

export const API_BASE = __DEV__ ? DEV_API_URL : PROD_API_URL;

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export async function getStoredToken() {
  try {
    const store = await getSecureStore();
    return store.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function getToken() {
  return getStoredToken();
}

export async function saveTokens(access_token, refresh_token) {
  const store = await getSecureStore();
  await store.setItemAsync(TOKEN_KEY, access_token);
  await store.setItemAsync(REFRESH_KEY, refresh_token);
}

export async function clearTokens() {
  try {
    const store = await getSecureStore();
    await store.deleteItemAsync(TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_KEY);
  } catch {}
}

async function refreshAccessToken() {
  const store = await getSecureStore();
  const refresh_token = await store.getItemAsync(REFRESH_KEY);
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
