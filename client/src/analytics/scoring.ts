export type PerformanceGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface AssessmentScore {
  totalScore: number; // 0 - 100
  formAccuracy: number; // 0 - 100 (40% weight)
  depthScore: number; // 0 - 100 (30% weight)
  cadenceScore: number; // 0 - 100 (15% weight)
  symmetryScore: number; // 0 - 100 (15% weight)
  grade: PerformanceGrade;
  repsCompleted: number;
  validReps: number;
}

export function calculateGrade(score: number): PerformanceGrade {
  if (score >= 93) return 'S';
  if (score >= 80) return 'A';
  if (score >= 68) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

export function computeOverallAssessmentScore(params: {
  repsCompleted: number;
  validReps: number;
  avgFormAccuracy: number;
  avgDepthScore: number;
  cadenceConsistency: number;
  avgSymmetry: number;
}): AssessmentScore {
  const {
    repsCompleted,
    validReps,
    avgFormAccuracy,
    avgDepthScore,
    cadenceConsistency,
    avgSymmetry,
  } = params;

  // Rep completion factor
  const repAccuracyFactor = repsCompleted > 0 ? Math.min(1, validReps / repsCompleted) : 0;

  const rawScore =
    avgFormAccuracy * 0.4 +
    avgDepthScore * 0.3 +
    cadenceConsistency * 0.15 +
    avgSymmetry * 0.15;

  const totalScore = Math.min(
    100,
    Math.max(0, Math.round(rawScore * (repsCompleted > 0 ? (0.7 + 0.3 * repAccuracyFactor) : 0)))
  );

  return {
    totalScore,
    formAccuracy: Math.round(avgFormAccuracy),
    depthScore: Math.round(avgDepthScore),
    cadenceScore: Math.round(cadenceConsistency),
    symmetryScore: Math.round(avgSymmetry),
    grade: calculateGrade(totalScore),
    repsCompleted,
    validReps,
  };
}
