/**
 * Auth Context
 *
 * Provides authentication state and actions to admin components.
 * On mount: reads token from localStorage and verifies with backend.
 * Exposes: { token, isAuthenticated, isLoading, login, logout }
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, apiLogout, apiVerify, getToken, clearToken } from '@/lib/admin-api';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: (redirectTo?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: verify existing token
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await apiVerify();
      if (response.ok) {
        setToken(storedToken);
      } else {
        // Token invalid/expired, clear it
        clearToken();
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    if (response.ok && response.data?.token) {
      setToken(response.data.token);
      return { ok: true };
    }
    return { ok: false, error: response.error || 'Login failed' };
  };

  const logout = async (redirectTo: string = '/admin/login') => {
    await apiLogout();
    setToken(null);
    // Use window.location for external navigation (outside admin routes)
    if (redirectTo.startsWith('/admin')) {
      navigate(redirectTo);
    } else {
      window.location.href = redirectTo;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
