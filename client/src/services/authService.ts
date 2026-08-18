/**
 * AuthService - API client for Express Auth Backend
 * Handles login, register, OAuth, refresh tokens, 2FA, and password recovery.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000/api/v1';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: {
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export interface TwoFactorSetupResponse {
  message: string;
  optAuthUrl: string;
  secret: string;
  issuer: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, any>;
  error?: string;
  status?: number;
}

export class AuthService {
  public static readonly BASE_URL = API_BASE_URL;

  /**
   * Helper to execute fetch with JSON headers and cookies
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures refreshToken cookie is sent & received
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err: ApiError = {
        message: data.message || data.error || `HTTP error ${response.status}`,
        errors: data.errors || data.error,
        error: data.error,
        status: response.status,
      };
      throw err;
    }

    return data as T;
  }

  /**
   * Register a new user account
   */
  public static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Login with email and password (with optional 2FA code)
   */
  public static async login(payload: LoginPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Refresh JWT access token using httpOnly refreshToken cookie
   */
  public static async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
  }

  /**
   * Logout user and invalidate session cookie
   */
  public static async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Verify email token
   */
  public static async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  }

  /**
   * Send password reset email
   */
  public static async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token from email link
   */
  public static async resetPassword(token: string, password: string): Promise<{ message: string; user?: any }> {
    return this.request<{ message: string; user?: any }>(`/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  /**
   * Returns Google OAuth entrypoint URL
   */
  public static getGoogleAuthUrl(): string {
    return `${API_BASE_URL}/auth/google`;
  }

  /**
   * Setup 2FA for logged in user (returns QR otpauth url and secret)
   */
  public static async setup2FA(): Promise<TwoFactorSetupResponse> {
    return this.request<TwoFactorSetupResponse>('/auth/2fa/setup', {
      method: 'POST',
    });
  }

  /**
   * Verify 2FA code to enable 2FA on user account
   */
  public static async verify2FA(code: string): Promise<{ message: string; twoFactorAuth: boolean }> {
    return this.request<{ message: string; twoFactorAuth: boolean }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }
}
