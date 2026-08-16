/**
 * API Service Client for Backend Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface LoginPayload {
  email: string;
  role: 'athlete' | 'recruiter';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'athlete' | 'recruiter';
    sport?: string;
  };
}

export interface AssessmentPayload {
  exerciseType: 'squat' | 'pushup';
  repsCompleted: number;
  validReps: number;
  totalScore: number;
  grade: string;
  metrics: {
    durationSeconds: number;
    caloriesBurned: number;
    symmetryScore: number;
    depthScore: number;
  };
}

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Fallback for API endpoint ${endpoint}:`, err);
      // Graceful fallback for demo/offline environments
      throw err;
    }
  }

  public static async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      return await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      // Mock auth fallback for development / offline use
      return {
        token: 'demo-jwt-token-xyz',
        user: {
          id: 'ath-001',
          name: payload.email.split('@')[0] || 'Aarav Sharma',
          email: payload.email,
          role: payload.role,
          sport: 'Athletics & Track',
        },
      };
    }
  }

  public static async uploadAssessment(payload: AssessmentPayload): Promise<{ success: boolean; id: string }> {
    try {
      return await this.request<{ success: boolean; id: string }>('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return { success: true, id: `assm-${Date.now()}` };
    }
  }

  public static async getLeaderboard(filter: { exercise?: string; region?: string } = {}) {
    try {
      const query = new URLSearchParams(filter as Record<string, string>).toString();
      return await this.request(`/leaderboard?${query}`);
    } catch {
      // Demo mock data
      return [
        { rank: 1, name: 'Vikramaditya Singh', score: 98, reps: 45, tier: 'OLYMPIAN', state: 'Haryana', verified: true },
        { rank: 2, name: 'Priya Narang', score: 96, reps: 42, tier: 'DIAMOND', state: 'Punjab', verified: true },
        { rank: 3, name: 'Rohan Mehra', score: 94, reps: 40, tier: 'DIAMOND', state: 'Karnataka', verified: true },
        { rank: 4, name: 'Ananya Roy', score: 91, reps: 38, tier: 'PLATINUM', state: 'Maharashtra', verified: true },
        { rank: 5, name: 'Aarav Sharma (You)', score: 88, reps: 36, tier: 'PLATINUM', state: 'Delhi', verified: true },
        { rank: 6, name: 'Kavita Chawla', score: 85, reps: 34, tier: 'GOLD', state: 'Rajasthan', verified: false },
      ];
    }
  }
}
