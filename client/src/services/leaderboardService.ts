/**
 * LeaderboardService
 * ------------------
 * Provides genuine talent ranking data from database assessments.
 * Strict No-Fake-Data compliance: returns actual records or empty state.
 */

import { ApiService } from './api';

export type Tier = 'OLYMPIAN' | 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'UNASSESSED';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
export type Gender = 'Male' | 'Female' | 'Other';
export type AgeGroup = 'U-14' | 'U-17' | 'U-20' | 'U-23' | 'Open';

export interface LeaderboardAthlete {
  rank: number;
  athleteId: string;
  name: string;
  age: number;
  gender: Gender;
  state: string;
  district: string;
  sport: string;
  overallScore: number;
  metrics: {
    speed: number;
    strength: number;
    agility: number;
    endurance: number;
    power: number;
    pushups: number;
    squats: number;
    sprint: number;
  };
  tier: Tier;
  verificationStatus: VerificationStatus;
  percentile: number;
  rankChange: number;
  ageGroup: AgeGroup;
  validReps: number;
  avatar?: string;
}

export interface MyPosition {
  nationalRank: number;
  stateRank: number;
  sportRank: number;
  ageGroupRank: number;
  percentile: number;
  totalAthletes: number;
}

export type MetricKey =
  | 'overallScore'
  | 'speed'
  | 'strength'
  | 'agility'
  | 'endurance'
  | 'power'
  | 'pushups'
  | 'squats'
  | 'sprint';

export interface LeaderboardFilters {
  search: string;
  state: string;
  sport: string;
  ageGroup: string;
  gender: string;
  metric: MetricKey;
  verificationStatus: string;
  sortBy: 'score' | 'improvement' | 'percentile';
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  overallScore: 'Overall Index',
  speed: 'Speed & Cadence',
  strength: 'Strength & Power',
  agility: 'Agility & ROM',
  endurance: 'Endurance',
  power: 'Explosive Power',
  pushups: 'Push-up Reps',
  squats: 'Squat Reps',
  sprint: 'Sprint Speed',
};

export const STATES = [
  'All States',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const SPORTS = [
  'All Sports',
  'Athletics',
  'Basketball',
  'Boxing',
  'Weightlifting',
  'Football',
  'Badminton',
  'Volleyball',
  'Wrestling',
  'Kabaddi',
];

export const AGE_GROUPS = ['All', 'U-14', 'U-17', 'U-20', 'U-23', 'Open'];

function getMetricValue(athlete: LeaderboardAthlete, metric: MetricKey): number {
  if (metric === 'overallScore') return athlete.overallScore;
  return athlete.metrics[metric as keyof typeof athlete.metrics] || athlete.overallScore;
}

export function filterAndSortAthletes(
  athletes: LeaderboardAthlete[],
  filters: LeaderboardFilters
): LeaderboardAthlete[] {
  let result = athletes.filter((a) => {
    const search = filters.search.toLowerCase().trim();
    if (search) {
      const match =
        a.name.toLowerCase().includes(search) ||
        a.state.toLowerCase().includes(search) ||
        a.district.toLowerCase().includes(search) ||
        a.sport.toLowerCase().includes(search);
      if (!match) return false;
    }
    if (filters.state && filters.state !== 'All States' && a.state !== filters.state) return false;
    if (filters.sport && filters.sport !== 'All Sports' && a.sport !== filters.sport) return false;
    if (filters.ageGroup && filters.ageGroup !== 'All' && a.ageGroup !== filters.ageGroup) return false;
    if (filters.gender && filters.gender !== 'All' && a.gender !== filters.gender) return false;
    if (
      filters.verificationStatus &&
      filters.verificationStatus !== 'All' &&
      a.verificationStatus !== filters.verificationStatus
    ) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'improvement':
        return b.rankChange - a.rankChange;
      case 'percentile':
        return b.percentile - a.percentile;
      case 'score':
      default:
        return getMetricValue(b, filters.metric) - getMetricValue(a, filters.metric);
    }
  });

  return result;
}

export async function fetchLeaderboard(): Promise<LeaderboardAthlete[]> {
  try {
    const data = await ApiService.getLeaderboard();
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchMyPosition(): Promise<MyPosition | null> {
  try {
    const res = await ApiService.request<{ success: boolean; data: MyPosition }>('/leaderboard/my-position');
    if (res?.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getMetricScoreForAthlete(athlete: LeaderboardAthlete, metric: MetricKey): number {
  return getMetricValue(athlete, metric);
}
