/**
 * Weightlifting — Stability Analyzer
 * Monitors lateral torso stability during lifts:
 * - Lateral sway of shoulder midpoint
 * - Shoulder-hip parallelism (no twisting)
 * - Oscillation/wobble detection
 * - Center of mass control
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';

export interface StabilityFeedback {
  detected: boolean;
  lateralSwayScore: number;    // 0-100 (100 = no sway)
  shoulderHipParallelism: number; // Angle diff shoulder vs hip line (0 = perfect)
  oscillationScore: number;    // 0-100 (100 = steady)
  stabilityScore: number;      // Overall 0-100
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isStable: boolean;
}

export class WeightliftingStabilityAnalyzer {
  private shoulderMidXHistory: number[] = [];
  private hipMidXHistory: number[] = [];
  private shoulderAngleHistory: number[] = [];
  private hipAngleHistory: number[] = [];
  private formScores: number[] = [];
  private frameCount = 0;

  private calcAngle(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.round(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI);
  }

  public process(landmarks: NormalizedLandmark[]): StabilityFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Face camera so shoulders and hips are visible.');
    }

    this.frameCount++;

    const leftShoulder = landmarks[PoseLandmark.LEFT_SHOULDER];
    const rightShoulder = landmarks[PoseLandmark.RIGHT_SHOULDER];
    const leftHip = landmarks[PoseLandmark.LEFT_HIP];
    const rightHip = landmarks[PoseLandmark.RIGHT_HIP];

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;

    this.shoulderMidXHistory.push(shoulderMidX);
    this.hipMidXHistory.push(hipMidX);
    if (this.shoulderMidXHistory.length > 30) { this.shoulderMidXHistory.shift(); this.hipMidXHistory.shift(); }

    // Shoulder line angle and hip line angle
    const shoulderAngle = this.calcAngle(leftShoulder, rightShoulder);
    const hipAngle = this.calcAngle(leftHip, rightHip);
    this.shoulderAngleHistory.push(shoulderAngle);
    this.hipAngleHistory.push(hipAngle);
    if (this.shoulderAngleHistory.length > 20) { this.shoulderAngleHistory.shift(); this.hipAngleHistory.shift(); }

    // Shoulder-hip parallelism: angle diff between shoulder and hip lines
    const shoulderHipParallelism = Math.abs(shoulderAngle - hipAngle);

    // Lateral sway: variance of shoulder midX over last 30 frames
    const shoulderMean = this.shoulderMidXHistory.reduce((a, b) => a + b, 0) / this.shoulderMidXHistory.length;
    const shoulderVariance = this.shoulderMidXHistory.reduce((a, b) => a + Math.pow(b - shoulderMean, 2), 0) / this.shoulderMidXHistory.length;
    const lateralSwayScore = Math.max(0, Math.min(100, Math.round(100 - shoulderVariance * 15000)));

    // Oscillation: high-frequency changes in position (wobble)
    let oscillation = 0;
    for (let i = 2; i < this.shoulderMidXHistory.length; i++) {
      const d1 = this.shoulderMidXHistory[i] - this.shoulderMidXHistory[i - 1];
      const d2 = this.shoulderMidXHistory[i - 1] - this.shoulderMidXHistory[i - 2];
      if (Math.sign(d1) !== Math.sign(d2)) oscillation += Math.abs(d1) + Math.abs(d2);
    }
    const oscillationScore = Math.max(0, Math.min(100, Math.round(100 - oscillation * 3000)));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Monitoring stability — stay braced and centered.';
    let isStable = false;

    if (lateralSwayScore < 60) {
      currentWarnings.push('Excessive lateral sway');
      feedbackMessage = 'Your body is swaying side to side! Brace your core harder and grip the ground with your feet.';
    }

    if (shoulderHipParallelism > 12) {
      currentWarnings.push('Torso rotating — shoulder and hip lines not parallel');
      feedbackMessage = `Torso is twisting! Shoulder angle ${shoulderAngle}° vs Hip ${hipAngle}°. Keep them parallel.`;
    }

    if (oscillationScore < 60) {
      currentWarnings.push('Wobbling detected — loss of stability');
      feedbackMessage = 'You\'re wobbling! Slow down, control each phase, and brace your entire torso.';
    }

    const stabilityScore = Math.round(lateralSwayScore * 0.4 + oscillationScore * 0.35 + Math.max(0, 100 - shoulderHipParallelism * 5) * 0.25);

    if (stabilityScore >= 75 && currentWarnings.length === 0) {
      isStable = true;
      feedbackMessage = 'Rock solid stability! Core is engaged, movement is controlled.';
    }

    this.formScores.push(stabilityScore);
    if (this.formScores.length > 60) this.formScores.shift();

    return {
      detected: true,
      lateralSwayScore,
      shoulderHipParallelism: Math.round(shoulderHipParallelism),
      oscillationScore,
      stabilityScore,
      formScore: stabilityScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isStable,
    };
  }

  private noDetection(msg: string): StabilityFeedback {
    return {
      detected: false, lateralSwayScore: 0, shoulderHipParallelism: 0,
      oscillationScore: 0, stabilityScore: 0, formScore: 0,
      feedbackMessage: msg, warnings: [msg], isStable: false,
    };
  }

  public reset(): void {
    this.shoulderMidXHistory = [];
    this.hipMidXHistory = [];
    this.shoulderAngleHistory = [];
    this.hipAngleHistory = [];
    this.formScores = [];
    this.frameCount = 0;
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
