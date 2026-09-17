import { useState, useCallback, type ReactNode } from 'react';
import type { AuthState, LoginCredentials, User } from '../types';
import * as authService from '../services/authService';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = authService.getStoredUser();
    return {
      user: stored,
      isAuthenticated: !!stored,
      isLoading: false,
    };
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user: User = await authService.login(credentials);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
