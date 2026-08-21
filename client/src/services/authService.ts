/**
 * AuthService - API client for Express Auth Backend
 * Handles login, register, OAuth, refresh tokens, 2FA, and password recovery.
 */

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${window.location.hostname}:2000/api/v1`;
  }
  return 'http://localhost:2000/api/v1';
};

export interface AthleteProfile {
  age?: number | string;
  gender?: string;
  height?: string;
  weight?: string;
  country?: string;
  state?: string;
  city?: string;
  areaType?: 'urban' | 'rural';
  primarySport?: string;
  secondarySports?: string;
  experienceLevel?: string;
  yearsExperience?: string;
  athleticGoals?: string;
  dominantHand?: 'left' | 'right';
  dominantFoot?: 'left' | 'right';
  organization?: string;
  achievements?: string;
  bio?: string;
  trainingFrequency?: string;
  profilePhoto?: string;
  avatar?: string;
}

export interface PrivacyPreferences {
  movementInsights?: boolean;
  highlightProcessing?: boolean;
  recruiterDiscoverability?: boolean;
  profileVisibility?: 'only_me' | 'coaches' | 'verified';
  guardianConsent?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
  avatar?: string;
  profilePhoto?: string;
  profile?: AthleteProfile;
  privacy?: PrivacyPreferences;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  profile?: AthleteProfile;
  privacy?: PrivacyPreferences;
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
  accessToken?: string;
  user: AuthUser;
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
  public static get BASE_URL(): string {
    return getApiBaseUrl();
  }

  /**
   * Helper to execute fetch with JSON headers, cookies, and 401 silent token refresh
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures refreshToken cookie is sent & received
    });

    // Silent token refresh interceptor on 401 Unauthorized
    if (
      response.status === 401 &&
      !isRetry &&
      endpoint !== '/auth/refresh' &&
      endpoint !== '/auth/login' &&
      endpoint !== '/auth/register'
    ) {
      try {
        const refreshRes = await AuthService.refreshToken();
        if (refreshRes && refreshRes.accessToken) {
          localStorage.setItem('auth_token', refreshRes.accessToken);
          if (refreshRes.user) {
            localStorage.setItem('auth_user', JSON.stringify(refreshRes.user));
          }
          return await AuthService.request<T>(endpoint, options, true);
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

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
    return `${getApiBaseUrl()}/auth/google`;
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

  /**
   * Update user profile & privacy preferences
   */
  public static async updateProfile(payload: { name?: string; profile?: AthleteProfile; privacy?: PrivacyPreferences }): Promise<{ message: string; user: AuthUser }> {
    return this.request<{ message: string; user: AuthUser }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
