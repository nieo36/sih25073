/**
 * LeaderboardService
 * ------------------
 * Provides leaderboard data for the KreedAI National Talent Rankings page.
 * Connects directly to backend /api/v1/leaderboard with offline fallback.
 */

import { ApiService } from './api';

export type Tier = 'OLYMPIAN' | 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
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

const MOCK_ATHLETES: LeaderboardAthlete[] = [
  {
    rank: 1, athleteId: 'ath-001', name: 'Vikramaditya Singh', age: 22, gender: 'Male',
    state: 'Haryana', district: 'Rohtak', sport: 'Athletics', ageGroup: 'U-23',
    overallScore: 98, validReps: 52, tier: 'OLYMPIAN', verificationStatus: 'VERIFIED',
    percentile: 99.8, rankChange: 0,
    metrics: { speed: 97, strength: 95, agility: 96, endurance: 98, power: 99, pushups: 52, squats: 58, sprint: 97 },
  },
  {
    rank: 2, athleteId: 'ath-002', name: 'Priya Narang', age: 20, gender: 'Female',
    state: 'Punjab', district: 'Ludhiana', sport: 'Wrestling', ageGroup: 'U-23',
    overallScore: 96, validReps: 48, tier: 'DIAMOND', verificationStatus: 'VERIFIED',
    percentile: 99.5, rankChange: 2,
    metrics: { speed: 93, strength: 97, agility: 94, endurance: 95, power: 96, pushups: 48, squats: 55, sprint: 93 },
  },
  {
    rank: 3, athleteId: 'ath-003', name: 'Rohan Mehra', age: 21, gender: 'Male',
    state: 'Karnataka', district: 'Bengaluru', sport: 'Kabaddi', ageGroup: 'U-23',
    overallScore: 94, validReps: 45, tier: 'DIAMOND', verificationStatus: 'VERIFIED',
    percentile: 99.1, rankChange: -1,
    metrics: { speed: 92, strength: 93, agility: 95, endurance: 94, power: 93, pushups: 45, squats: 52, sprint: 91 },
  },
  {
    rank: 4, athleteId: 'ath-004', name: 'Ananya Roy', age: 19, gender: 'Female',
    state: 'Maharashtra', district: 'Pune', sport: 'Gymnastics', ageGroup: 'U-20',
    overallScore: 91, validReps: 40, tier: 'PLATINUM', verificationStatus: 'VERIFIED',
    percentile: 98.5, rankChange: 1,
    metrics: { speed: 90, strength: 88, agility: 94, endurance: 91, power: 90, pushups: 40, squats: 46, sprint: 88 },
  },
  {
    rank: 5, athleteId: 'ath-005', name: 'Aarav Sharma', age: 20, gender: 'Male',
    state: 'Delhi', district: 'South Delhi', sport: 'Boxing', ageGroup: 'U-23',
    overallScore: 88, validReps: 36, tier: 'PLATINUM', verificationStatus: 'VERIFIED',
    percentile: 97.8, rankChange: 3,
    metrics: { speed: 88, strength: 90, agility: 87, endurance: 86, power: 91, pushups: 36, squats: 42, sprint: 86 },
  },
  {
    rank: 6, athleteId: 'ath-006', name: 'Kavita Chawla', age: 18, gender: 'Female',
    state: 'Rajasthan', district: 'Jaipur', sport: 'Athletics', ageGroup: 'U-20',
    overallScore: 85, validReps: 34, tier: 'GOLD', verificationStatus: 'PENDING',
    percentile: 96.9, rankChange: 0,
    metrics: { speed: 86, strength: 82, agility: 85, endurance: 84, power: 83, pushups: 34, squats: 40, sprint: 84 },
  },
  {
    rank: 7, athleteId: 'ath-007', name: 'Devendra Joshi', age: 23, gender: 'Male',
    state: 'Uttarakhand', district: 'Dehradun', sport: 'Wrestling', ageGroup: 'Open',
    overallScore: 82, validReps: 30, tier: 'GOLD', verificationStatus: 'VERIFIED',
    percentile: 95.4, rankChange: -2,
    metrics: { speed: 80, strength: 85, agility: 81, endurance: 83, power: 84, pushups: 30, squats: 38, sprint: 79 },
  },
  {
    rank: 8, athleteId: 'ath-008', name: 'Meenakshi Pillai', age: 16, gender: 'Female',
    state: 'Kerala', district: 'Thrissur', sport: 'Badminton', ageGroup: 'U-17',
    overallScore: 79, validReps: 28, tier: 'GOLD', verificationStatus: 'VERIFIED',
    percentile: 94.1, rankChange: 5,
    metrics: { speed: 82, strength: 74, agility: 84, endurance: 80, power: 78, pushups: 28, squats: 32, sprint: 83 },
  },
];

export type MetricKey = 'overallScore' | 'speed' | 'strength' | 'agility' | 'endurance' | 'power' | 'pushups' | 'squats' | 'sprint';

export interface LeaderboardFilters {
  search: string;
  state: string;
  sport: string;
  ageGroup: string;
  gender: string;
  verificationStatus: string;
  metric: MetricKey;
  sortBy: 'rank' | 'score' | 'improvement' | 'percentile';
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  overallScore: 'Overall Index',
  speed: 'Speed',
  strength: 'Strength',
  agility: 'Agility',
  endurance: 'Endurance',
  power: 'Power',
  pushups: 'Push-ups',
  squats: 'Squats',
  sprint: 'Sprint',
};

export const STATES = [
  'All States', 'Haryana', 'Punjab', 'Karnataka', 'Maharashtra', 'Delhi',
  'Rajasthan', 'Uttarakhand', 'Kerala', 'Uttar Pradesh', 'Gujarat',
  'Himachal Pradesh', 'Bihar', 'Tamil Nadu', 'Telangana', 'West Bengal',
  'Andhra Pradesh', 'Assam', 'Odisha', 'Jharkhand', 'Madhya Pradesh',
];

export const SPORTS = [
  'All Sports', 'Athletics', 'Wrestling', 'Kabaddi', 'Gymnastics',
  'Boxing', 'Badminton', 'Football', 'Skiing', 'Hockey', 'Cricket',
  'Swimming', 'Archery', 'Shooting', 'Weightlifting',
];

export const AGE_GROUPS = ['All', 'U-14', 'U-17', 'U-20', 'U-23', 'Open'];

export const MOCK_MY_POSITION: MyPosition = {
  nationalRank: 5,
  stateRank: 1,
  sportRank: 2,
  ageGroupRank: 2,
  percentile: 97.8,
  totalAthletes: 1240,
};

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
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return MOCK_ATHLETES;
  } catch {
    return MOCK_ATHLETES;
  }
}

export async function fetchMyPosition(): Promise<MyPosition> {
  try {
    const res = await ApiService.request<{ success: boolean; data: MyPosition }>('/leaderboard/my-position');
    if (res?.data) {
      return res.data;
    }
    return MOCK_MY_POSITION;
  } catch {
    return MOCK_MY_POSITION;
  }
}

export function getMetricScoreForAthlete(athlete: LeaderboardAthlete, metric: MetricKey): number {
  return getMetricValue(athlete, metric);
}
