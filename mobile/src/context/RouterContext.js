import React, { createContext, useContext, useState } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [history, setHistory] = useState([{ screen: 'Login', params: {} }]);

  const current = history[history.length - 1];

  function navigate(screen, params = {}) {
    setHistory(h => [...h, { screen, params }]);
  }

  function goBack() {
    setHistory(h => (h.length > 1 ? h.slice(0, -1) : h));
  }

  function reset(screen, params = {}) {
    setHistory([{ screen, params }]);
  }

  return (
    <RouterContext.Provider value={{ current, navigate, goBack, reset }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}
