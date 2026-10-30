import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithMicrosoft: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Handle successful authentication
  const handleAuthSuccess = useCallback((response: AuthResponse) => {
    apiClient.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (apiClient.hasTokens()) {
        try {
          // Try to get current user
          const response = await fetch(`${config.apiUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${apiClient.getAccessToken()}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else if (response.status === 401) {
            // Try to refresh token
            const refreshToken = apiClient.getRefreshToken();
            if (refreshToken) {
              const refreshResponse = await fetch(`${config.apiUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });

              if (refreshResponse.ok) {
                const authData: AuthResponse = await refreshResponse.json();
                handleAuthSuccess(authData);
              } else {
                apiClient.clearTokens();
              }
            }
          }
        } catch (error) {
          console.error('Auth init error:', error);
          apiClient.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [handleAuthSuccess]);

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid email or password');
    }

    const data: AuthResponse = await response.json();
    handleAuthSuccess(data);
  };

  const register = async (data: RegisterData) => {
    const response = await fetch(`${config.apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    handleAuthSuccess(authData);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await fetch(`${config.apiUrl}/api/auth/external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', idToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Google login failed' }));
      throw new Error(error.message || 'Google login failed');
    }

    const data: AuthResponse = await response.json();
    handleAuthSuccess(data);
  };

  const loginWithMicrosoft = async (idToken: string) => {
    const response = await fetch(`${config.apiUrl}/api/auth/external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'microsoft', idToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Microsoft login failed' }));
      throw new Error(error.message || 'Microsoft login failed');
    }

    const data: AuthResponse = await response.json();
    handleAuthSuccess(data);
  };

  const logout = async () => {
    try {
      const refreshToken = apiClient.getRefreshToken();
      if (refreshToken) {
        await fetch(`${config.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiClient.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (!apiClient.hasTokens()) return;

    try {
      const response = await apiClient.fetch(`${config.apiUrl}/api/auth/me`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
