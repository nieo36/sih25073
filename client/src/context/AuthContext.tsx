import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthService,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  RegisterResponse,
  TwoFactorSetupResponse,
} from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  handleOAuthSuccess: (token: string, user: AuthUser) => void;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ message: string; user?: any }>;
  setup2FA: () => Promise<TwoFactorSetupResponse>;
  verify2FA: (code: string) => Promise<{ message: string; twoFactorAuth: boolean }>;
  refreshSession: () => Promise<boolean>;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  saveProfile: (payload: { name?: string; profile?: any; privacy?: any }) => Promise<{ message: string; user: AuthUser }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setAuthData = useCallback((newToken: string | null, newUser: AuthUser | null) => {
    setToken(newToken);
    setUser(newUser);

    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (newUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const updateUser = useCallback((partialUser: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partialUser };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Attempt to refresh the session via refresh token cookie on startup
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await AuthService.refreshToken();
      if (res.accessToken && res.user) {
        setAuthData(res.accessToken, res.user);
        return true;
      }
      return false;
    } catch {
      // If refresh fails and we don't have a valid existing local session, clear
      return false;
    }
  }, [setAuthData]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const res = await AuthService.refreshToken();
        if (isMounted && res.accessToken && res.user) {
          setAuthData(res.accessToken, res.user);
        }
      } catch {
        // If refresh fails and token in storage is stale, clean up
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          setAuthData(null, null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [setAuthData]);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(payload);
      setAuthData(res.accessToken, res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      const res = await AuthService.register(payload);
      if (res.accessToken && res.user) {
        setAuthData(res.accessToken, res.user);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout().catch(() => {});
    } finally {
      setAuthData(null, null);
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = AuthService.getGoogleAuthUrl();
  };

  const handleOAuthSuccess = (newToken: string, oAuthUser: AuthUser) => {
    setAuthData(newToken, oAuthUser);
  };

  const forgotPassword = async (email: string) => {
    return AuthService.forgotPassword(email);
  };

  const resetPassword = async (token: string, pass: string) => {
    return AuthService.resetPassword(token, pass);
  };

  const setup2FA = async () => {
    return AuthService.setup2FA();
  };

  const verify2FA = async (code: string) => {
    const res = await AuthService.verify2FA(code);
    if (res.twoFactorAuth && user) {
      updateUser({ twoFactorEnabled: true });
    }
    return res;
  };

  const saveProfile = async (payload: { name?: string; profile?: any; privacy?: any }) => {
    const res = await AuthService.updateProfile(payload);
    if (res.user) {
      updateUser(res.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        loginWithGoogle,
        handleOAuthSuccess,
        forgotPassword,
        resetPassword,
        setup2FA,
        verify2FA,
        refreshSession,
        updateUser,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
