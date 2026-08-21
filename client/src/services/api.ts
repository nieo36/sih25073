/**
 * API Service Client for Backend Integration & MediaPipe Offline-to-Cloud Sync
 */
import { StoredAssessment } from '../storage/indexedDB';

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

export interface AthleteStatsResponse {
  overallScore: number;
  completedCount: number;
  totalValidReps: number;
  eloRating: number;
  tier: string;
  percentile: number;
  metrics: {
    speed: number;
    agility: number;
    strength: number;
    endurance: number;
    power: number;
    pushups: number;
    squats: number;
    formPrecision: number;
    bilateralSymmetry: number;
    mobilityRom: number;
  };
  trend: number[];
}

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
    }

    return await response.json();
  }

  public static async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      return await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
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

  public static async syncAssessment(assessment: StoredAssessment): Promise<{ success: boolean; id: string; remoteId?: string }> {
    return await this.request<{ success: boolean; id: string; remoteId?: string }>('/assessment/sync', {
      method: 'POST',
      body: JSON.stringify({
        localId: assessment.id,
        athleteId: assessment.athleteId,
        exerciseType: assessment.exerciseType,
        totalScore: assessment.totalScore,
        grade: assessment.grade,
        repsCompleted: assessment.repsCompleted,
        validReps: assessment.validReps,
        durationSeconds: assessment.durationSeconds,
        caloriesBurned: assessment.caloriesBurned,
        symmetryScore: assessment.symmetryScore,
        depthScore: assessment.depthScore,
        formAccuracy: assessment.formAccuracy,
        cadenceScore: assessment.cadenceScore,
        angles: assessment.angles,
        landmarkSamples: assessment.landmarkSamples,
        createdAt: assessment.createdAt ? new Date(assessment.createdAt).toISOString() : new Date(assessment.date).toISOString(),
      }),
    });
  }

  public static async batchSyncAssessments(assessments: StoredAssessment[]): Promise<{ success: boolean; syncedIds: string[] }> {
    return await this.request<{ success: boolean; syncedIds: string[] }>('/assessment/batch-sync', {
      method: 'POST',
      body: JSON.stringify({
        assessments: assessments.map((a) => ({
          localId: a.id,
          athleteId: a.athleteId,
          exerciseType: a.exerciseType,
          totalScore: a.totalScore,
          grade: a.grade,
          repsCompleted: a.repsCompleted,
          validReps: a.validReps,
          durationSeconds: a.durationSeconds,
          caloriesBurned: a.caloriesBurned,
          symmetryScore: a.symmetryScore,
          depthScore: a.depthScore,
          formAccuracy: a.formAccuracy,
          cadenceScore: a.cadenceScore,
          angles: a.angles,
          landmarkSamples: a.landmarkSamples,
          createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date(a.date).toISOString(),
        })),
      }),
    });
  }

  public static async getAssessmentHistory() {
    try {
      const res = await this.request<{ success: boolean; data: any[] }>('/assessment/history');
      return res.data || [];
    } catch {
      return [];
    }
  }

  public static async getAthleteStats(): Promise<AthleteStatsResponse | null> {
    try {
      const res = await this.request<{ success: boolean; data: AthleteStatsResponse }>('/assessment/stats');
      return res.data;
    } catch {
      return null;
    }
  }

  public static async getLeaderboard(filter: Record<string, string> = {}) {
    try {
      const query = new URLSearchParams(filter).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/leaderboard?${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  }

  public static async getRecruiterCandidates(filter: Record<string, string> = {}) {
    try {
      const query = new URLSearchParams(filter).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/recruiter/candidates?${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  }
}
