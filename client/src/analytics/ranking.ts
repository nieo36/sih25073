export type AthleteTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'OLYMPIAN';

export interface AthleteRanking {
  tier: AthleteTier;
  eloRating: number;
  percentile: number;
  nextTierPointsNeeded: number;
}

export function getAthleteTier(eloRating: number): AthleteTier {
  if (eloRating >= 2400) return 'OLYMPIAN';
  if (eloRating >= 2000) return 'DIAMOND';
  if (eloRating >= 1600) return 'PLATINUM';
  if (eloRating >= 1200) return 'GOLD';
  if (eloRating >= 800) return 'SILVER';
  return 'BRONZE';
}

export function calculateEloDelta(
  _currentElo: number,
  sessionScore: number,
  baselineExpected = 75
): number {
  const diff = sessionScore - baselineExpected;
  const kFactor = 24;
  return Math.round((diff / 100) * kFactor);
}

export function calculateAthleteRanking(eloRating: number, totalAthletes = 5000, currentRank = 120): AthleteRanking {
  const tier = getAthleteTier(eloRating);
  const percentile = Math.round(((totalAthletes - currentRank) / totalAthletes) * 100 * 10) / 10;

  const tierThresholds: Record<AthleteTier, number> = {
    BRONZE: 800,
    SILVER: 1200,
    GOLD: 1600,
    PLATINUM: 2000,
    DIAMOND: 2400,
    OLYMPIAN: 3000,
  };

  const nextThreshold = tierThresholds[tier] || 3000;
  const nextTierPointsNeeded = Math.max(0, nextThreshold - eloRating);

  return {
    tier,
    eloRating,
    percentile,
    nextTierPointsNeeded,
  };
}
