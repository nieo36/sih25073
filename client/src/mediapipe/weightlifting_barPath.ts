/**
 * Weightlifting — Bar Path Analyzer
 * Tracks the trajectory of the bar (approximated by wrist landmarks)
 * during lifts. Evaluates:
 * - Horizontal deviation from vertical bar path
 * - Bar drift away from body (deadlift/row coaching)
 * - Path consistency across reps
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { AngleSmoother } from './angles';

export type BarPathStage = 'RESTING' | 'CONCENTRIC' | 'TOP' | 'ECCENTRIC';

export interface BarPathFeedback {
  detected: boolean;
  stage: BarPathStage;
  repCount: number;
  barPositionX: number;       // Normalized x position
  barPositionY: number;       // Normalized y position
  horizontalDeviation: number; // Normalized deviation from ideal vertical path
  barDriftScore: number;      // 0-100 (100 = bar close to body)
  pathConsistencyScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodPath: boolean;
}

export class BarPathAnalyzer {
  private stage: BarPathStage = 'RESTING';
  private repCount = 0;
  private formScores: number[] = [];

  private wristYHistory: number[] = [];
  private wristXHistory: number[] = [];
  private startWristX = -1;     // X position at start of rep
  private maxHorizontalDev = 0;
  private pathXSamples: number[] = [];
  private repXPaths: number[][] = [];
  private prevWristY = -1;

  private smootherWristX = new AngleSmoother(0.3);
  private smootherWristY = new AngleSmoother(0.3);

  public process(landmarks: NormalizedLandmark[]): BarPathFeedback {
    const required = [
      PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Position camera side-on to track bar path.');
    }

    // Average of both wrists = bar position estimate
    const rawBarX = (landmarks[PoseLandmark.LEFT_WRIST].x + landmarks[PoseLandmark.RIGHT_WRIST].x) / 2;
    const rawBarY = (landmarks[PoseLandmark.LEFT_WRIST].y + landmarks[PoseLandmark.RIGHT_WRIST].y) / 2;

    const barX = this.smootherWristX.update(rawBarX);
    const barY = this.smootherWristY.update(rawBarY);

    this.wristXHistory.push(barX);
    this.wristYHistory.push(barY);
    if (this.wristXHistory.length > 10) { this.wristXHistory.shift(); this.wristYHistory.shift(); }

    // Body reference: shoulder X
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const bodyLineX = (shoulderMidX + hipMidX) / 2;

    // Bar drift from body
    const barDrift = Math.abs(barX - bodyLineX);
    const barDriftScore = Math.max(0, Math.round(100 - barDrift * 500));

    // Detect vertical movement direction
    let wristVelocityY = 0;
    if (this.prevWristY >= 0) {
      wristVelocityY = barY - this.prevWristY; // positive = moving down in frame
    }
    this.prevWristY = barY;

    // Horizontal deviation during the rep
    if (this.startWristX < 0) this.startWristX = barX;
    const horizontalDeviation = Math.abs(barX - this.startWristX);
    if (horizontalDeviation > this.maxHorizontalDev) this.maxHorizontalDev = horizontalDeviation;
    this.pathXSamples.push(barX);

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Grip bar with hands shoulder-width apart. Bar should move vertically.';
    let isGoodPath = false;

    // State machine based on wrist Y motion
    switch (this.stage) {
      case 'RESTING':
        feedbackMessage = 'Ready position. Brace core and lift with control.';
        if (wristVelocityY < -0.008) { // wrist moving up
          this.stage = 'CONCENTRIC';
          this.startWristX = barX;
          this.maxHorizontalDev = 0;
          this.pathXSamples = [];
          feedbackMessage = 'Lifting — keep bar close to body!';
        }
        break;

      case 'CONCENTRIC':
        feedbackMessage = 'Concentric phase — bar close to body, breathe out at top!';
        if (barDriftScore < 60) {
          currentWarnings.push('Bar drifting away from body');
          feedbackMessage = 'Bar drifting forward! Keep it skimming your legs — shortest path up!';
        }
        if (Math.abs(wristVelocityY) < 0.003) {
          this.stage = 'TOP';
          feedbackMessage = 'Top of lift — lock out and breathe!';
        }
        break;

      case 'TOP':
        feedbackMessage = 'Lockout achieved. Control the descent — do not drop the bar.';
        if (wristVelocityY > 0.006) { // moving down
          this.stage = 'ECCENTRIC';
          feedbackMessage = 'Lowering — eccentric phase, control the descent!';
        }
        break;

      case 'ECCENTRIC':
        feedbackMessage = 'Lowering — hinge at hips, brace core!';
        if (Math.abs(wristVelocityY) < 0.003) {
          // Rep complete
          this.repCount++;
          const devScore = Math.max(0, Math.round(100 - this.maxHorizontalDev * 800));
          const formScore = Math.round(devScore * 0.5 + barDriftScore * 0.5);
          this.formScores.push(formScore);
          this.repXPaths.push([...this.pathXSamples]);
          if (this.repXPaths.length > 5) this.repXPaths.shift();

          isGoodPath = formScore >= 72;
          feedbackMessage = isGoodPath
            ? 'Clean bar path! Vertical track — excellent technique!'
            : `Bar deviated ${Math.round(this.maxHorizontalDev * 1000)}mm. Focus on a straighter vertical path.`;
          this.stage = 'RESTING';
          this.startWristX = -1;
        }
        break;
    }

    // Path consistency: compare current rep path X variance to previous reps
    const pathConsistencyScore = this.repXPaths.length > 1
      ? Math.min(100, Math.max(0, Math.round(100 - Math.abs(
          (this.repXPaths[this.repXPaths.length - 1]?.reduce((a, b) => a + b, 0) / Math.max(1, this.repXPaths[this.repXPaths.length - 1]?.length || 1)) -
          (this.repXPaths[this.repXPaths.length - 2]?.reduce((a, b) => a + b, 0) / Math.max(1, this.repXPaths[this.repXPaths.length - 2]?.length || 1))
        ) * 500)))
      : 85;

    if (horizontalDeviation > 0.04) {
      currentWarnings.push('Bar swinging horizontally');
    }

    const overallFormScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : Math.round(barDriftScore * 0.6 + pathConsistencyScore * 0.4);

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      barPositionX: Math.round(barX * 1000) / 1000,
      barPositionY: Math.round(barY * 1000) / 1000,
      horizontalDeviation: Math.round(horizontalDeviation * 1000) / 1000,
      barDriftScore,
      pathConsistencyScore,
      formScore: overallFormScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodPath,
    };
  }

  private noDetection(msg: string): BarPathFeedback {
    return {
      detected: false, stage: this.stage, repCount: this.repCount,
      barPositionX: 0, barPositionY: 0, horizontalDeviation: 0,
      barDriftScore: 0, pathConsistencyScore: 0, formScore: 0,
      feedbackMessage: msg, warnings: [msg], isGoodPath: false,
    };
  }

  public reset(): void {
    this.stage = 'RESTING';
    this.repCount = 0;
    this.formScores = [];
    this.wristXHistory = [];
    this.wristYHistory = [];
    this.startWristX = -1;
    this.maxHorizontalDev = 0;
    this.pathXSamples = [];
    this.repXPaths = [];
    this.prevWristY = -1;
    this.smootherWristX.reset();
    this.smootherWristY.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
