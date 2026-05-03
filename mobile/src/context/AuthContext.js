import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, saveTokens, clearTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('access_token').then((token) => {
      setUser(token ? { token } : null);
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    const data = await authApi.login({ email, password });
    await saveTokens(data.access_token, data.refresh_token);
    setUser({ token: data.access_token });
  }

  async function register(name, email, password) {
    await authApi.register({ name, email, password });
    await login(email, password);
  }

  async function logout() {
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
