export interface SessionMetrics {
  durationSeconds: number;
  estimatedCalories: number;
  avgRepDuration: number;
  peakVelocityScore: number;
  timeUnderTension: number;
  strainIndex: number;
}

export function calculateSessionMetrics(params: {
  exerciseType: 'squat' | 'pushup';
  reps: number;
  durationSeconds: number;
  userWeightKg?: number;
}): SessionMetrics {
  const { exerciseType, reps, durationSeconds, userWeightKg = 70 } = params;

  // MET values: Squats ~ 5.0 MET, Pushups ~ 4.0 MET
  const met = exerciseType === 'squat' ? 5.0 : 4.0;
  const durationHours = durationSeconds / 3600;
  const estimatedCalories = Math.round(met * userWeightKg * durationHours * 10) / 10;

  const avgRepDuration = reps > 0 ? Math.round((durationSeconds / reps) * 10) / 10 : 0;
  const timeUnderTension = Math.round(reps * Math.min(avgRepDuration, 3.5));

  // Strain index: 1-10 scale based on intensity & volume
  const strainIndex = Math.min(
    10,
    Math.round(((reps * (exerciseType === 'squat' ? 0.3 : 0.4) + durationSeconds * 0.05) / 10) * 10) / 10
  );

  const peakVelocityScore = Math.min(100, Math.max(40, Math.round(100 - avgRepDuration * 8)));

  return {
    durationSeconds,
    estimatedCalories,
    avgRepDuration,
    peakVelocityScore,
    timeUnderTension,
    strainIndex,
  };
}
