let _SecureStore = null;
async function getSecureStore() {
  if (!_SecureStore) {
    _SecureStore = await import('expo-secure-store');
  }
  return _SecureStore;
}

// ⚠️ Geliştirme için kendi yerel IP'ni yaz:
const DEV_API_URL = 'http://10.49.56.178:3000';
const PROD_API_URL = 'https://api.senin-domain.com';

export const API_BASE = __DEV__ ? DEV_API_URL : PROD_API_URL;

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

/**
 * image_e33dac.png dosyasındaki hatayı çözen kritik kısım burasıdır.
 * Gelen değerlerin string olduğundan emin olur.
 */
export async function saveTokens(access_token, refresh_token) {
  try {
    const store = await getSecureStore();

    // Eğer veriler null/undefined gelirse boş string ata, nesne gelirse string'e çevir
    const cleanAccess = typeof access_token === 'object' ? JSON.stringify(access_token) : String(access_token || "");
    const cleanRefresh = typeof refresh_token === 'object' ? JSON.stringify(refresh_token) : String(refresh_token || "");

    await store.setItemAsync(TOKEN_KEY, cleanAccess);
    await store.setItemAsync(REFRESH_KEY, cleanRefresh);
  } catch (error) {
    console.error("Token kaydedilirken hata oluştu:", error);
  }
}

export async function getStoredToken() {
  try {
    const store = await getSecureStore();
    return await store.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function getToken() {
  return getStoredToken();
}

export async function clearTokens() {
  try {
    const store = await getSecureStore();
    await store.deleteItemAsync(TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_KEY);
  } catch { }
}

async function refreshAccessToken() {
  const store = await getSecureStore();

  // Ekran Resmi 2026-05-12 13.54.13.jpg dosyasındaki hatalı referanslar temizlendi.
  const currentRefreshToken = await store.getItemAsync(REFRESH_KEY);

  if (!currentRefreshToken) {
    await clearTokens();
    throw new Error('No refresh token');
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: currentRefreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    throw new Error('Session expired');
  }

  const data = await res.json();
  // saveTokens artık kendi içinde veriyi temizlediği için burada doğrudan gönderebiliriz.
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
    try {
      const newToken = await refreshAccessToken();
      return request(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      }, false);
    } catch (e) {
      throw e;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status });
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth API
export const authApi = {
  register: async (data) => {
    const res = await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    // Eğer kayıt başarılı olduğunda token dönüyorsa kaydet
    if (res && res.access_token) {
      await saveTokens(res.access_token, res.refresh_token);
    }
    return res;
  },
  login: async (data) => {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    if (res && res.access_token) {
      await saveTokens(res.access_token, res.refresh_token);
    }
    return res;
  },
};

// Receipts API
export const receiptsApi = {
  upload: async (imageUri, mimeType = 'image/jpeg') => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'receipt.jpg',
      type: mimeType
    });

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

// Insights API
export const insightsApi = {
  inflation: (months = 6) => request(`/insights/inflation?months=${months}`),
  anomalies: (threshold = 0.2) => request(`/insights/anomalies?threshold=${threshold}`),
  priceTrend: (productId, days = 90) => request(`/products/${productId}/price-history?days=${days}`),
  marketComparison: (productId) => request(`/products/${productId}/markets`),
};
