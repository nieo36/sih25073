/**
 * Boxing — Hip Rotation Analyzer
 * Measures hip rotation during punches (the primary power generator).
 * Tracks: hip rotation angle, timing relative to punch extension,
 * shoulder-hip synchronization, and rotation magnitude.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { AngleSmoother } from './angles';

export type HipRotationStage = 'NEUTRAL' | 'LOADING' | 'ROTATING' | 'FOLLOW_THROUGH';

export interface HipRotationFeedback {
  detected: boolean;
  stage: HipRotationStage;
  rotationCount: number;
  hipRotationAngle: number;     // Degrees of hip rotation relative to neutral
  shoulderRotationAngle: number;
  rotationPower: number;        // 0-100 based on angular velocity
  syncScore: number;            // Hip-shoulder sync timing score
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodRotation: boolean;
}

export class HipRotationAnalyzer {
  private stage: HipRotationStage = 'NEUTRAL';
  private rotationCount = 0;
  private formScores: number[] = [];

  // Smoothers for hip and shoulder positions
  private smootherHipAngle = new AngleSmoother(0.3);
  private smootherShoulderAngle = new AngleSmoother(0.3);

  private hipAngleHistory: number[] = [];
  private shoulderAngleHistory: number[] = [];
  private neutralHipAngle = 0;
  private neutralShoulderAngle = 0;
  private calibrated = false;
  private calibrationFrames = 0;

  private maxRotation = 0;
  private currentFrame = 0;

  // Compute hip rotation angle from hip X positions
  private computeHorizontalAngle(leftPt: NormalizedLandmark, rightPt: NormalizedLandmark): number {
    const dx = rightPt.x - leftPt.x;
    const dy = rightPt.y - leftPt.y;
    return Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
  }

  public process(landmarks: NormalizedLandmark[]): HipRotationFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Stand with hips and shoulders visible to camera.');
    }

    this.currentFrame++;

    const rawHipAngle = this.computeHorizontalAngle(
      landmarks[PoseLandmark.LEFT_HIP],
      landmarks[PoseLandmark.RIGHT_HIP]
    );
    const rawShoulderAngle = this.computeHorizontalAngle(
      landmarks[PoseLandmark.LEFT_SHOULDER],
      landmarks[PoseLandmark.RIGHT_SHOULDER]
    );

    const hipAngle = this.smootherHipAngle.update(rawHipAngle);
    const shoulderAngle = this.smootherShoulderAngle.update(rawShoulderAngle);

    this.hipAngleHistory.push(hipAngle);
    this.shoulderAngleHistory.push(shoulderAngle);
    if (this.hipAngleHistory.length > 8) {
      this.hipAngleHistory.shift();
      this.shoulderAngleHistory.shift();
    }

    // Calibration phase: establish neutral stance
    if (!this.calibrated) {
      this.calibrationFrames++;
      if (this.calibrationFrames === 1) {
        this.neutralHipAngle = hipAngle;
        this.neutralShoulderAngle = shoulderAngle;
      } else {
        this.neutralHipAngle = 0.9 * this.neutralHipAngle + 0.1 * hipAngle;
        this.neutralShoulderAngle = 0.9 * this.neutralShoulderAngle + 0.1 * shoulderAngle;
      }
      if (this.calibrationFrames >= 25) {
        this.calibrated = true;
      }
    }

    // Rotation relative to neutral
    const hipRotation = Math.abs(hipAngle - this.neutralHipAngle);
    const shoulderRotation = Math.abs(shoulderAngle - this.neutralShoulderAngle);

    // Angular velocity (rate of change)
    let hipVelocity = 0;
    if (this.hipAngleHistory.length >= 2) {
      hipVelocity = Math.abs(hipAngle - this.hipAngleHistory[0]) / this.hipAngleHistory.length;
    }
    const rotationPower = Math.min(100, Math.round(hipVelocity * 150));

    if (hipRotation > this.maxRotation) this.maxRotation = hipRotation;

    // Shoulder-hip sync: shoulders should follow hips with slight delay
    // Ideal: shoulder rotation lags hip rotation by ~2-4 frames
    const syncDiff = Math.abs(shoulderRotation - hipRotation);
    const syncScore = Math.max(0, Math.round(100 - syncDiff * 3));

    const currentWarnings: string[] = [];
    let feedbackMessage = !this.calibrated
      ? 'Hold boxing stance still — calibrating hip baseline...'
      : 'Throw a power punch — rotate hips before shoulders!';
    let isGoodRotation = false;

    // State machine
    switch (this.stage) {
      case 'NEUTRAL':
        if (!this.calibrated) {
          feedbackMessage = 'Calibrating... hold position.';
        } else if (hipRotation > 8 && hipVelocity > 0.5) {
          this.stage = 'LOADING';
          feedbackMessage = 'Loading hip rotation — coil and explode!';
        }
        break;

      case 'LOADING':
        feedbackMessage = 'Coil the hips! Load power for the cross!';
        if (hipVelocity > 1.0) {
          this.stage = 'ROTATING';
          feedbackMessage = 'Hip rotation firing! Shoulders follow through!';
        }
        break;

      case 'ROTATING':
        feedbackMessage = 'Hip rotating — drive power through the punch!';
        if (hipRotation >= 15) {
          feedbackMessage = `Strong rotation! ${Math.round(hipRotation)}° of hip drive!`;
        }
        if (hipVelocity < 0.3 && hipRotation > 10) {
          this.stage = 'FOLLOW_THROUGH';
          this.rotationCount++;
          const powerScore = Math.min(100, Math.round(this.maxRotation * 3));
          const formScore = Math.round(powerScore * 0.6 + syncScore * 0.4);
          this.formScores.push(formScore);
          isGoodRotation = formScore >= 65;
          feedbackMessage = isGoodRotation
            ? `Excellent hip drive! ${Math.round(this.maxRotation)}° rotation — great power generation!`
            : 'Good rotation. Work on faster hip snap — think of wringing out a wet towel.';
        }
        break;

      case 'FOLLOW_THROUGH':
        feedbackMessage = 'Follow-through complete — return to guard.';
        if (hipRotation < 8) {
          this.stage = 'NEUTRAL';
          this.maxRotation = 0;
        }
        break;
    }

    // Form warnings
    if (this.calibrated && shoulderRotation > hipRotation + 15) {
      currentWarnings.push('Shoulders rotating before hips — losing power');
      feedbackMessage = 'Rotate HIPS first, then shoulders! Hip-to-shoulder sequence is key.';
    }
    if (this.calibrated && hipRotation < 5 && this.stage === 'ROTATING') {
      currentWarnings.push('Insufficient hip rotation — arm punch only');
      feedbackMessage = 'Not enough hip rotation! Turn your whole torso into the punch.';
    }

    const avgFormScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : Math.round(syncScore * 0.5 + rotationPower * 0.5);

    return {
      detected: true,
      stage: this.stage,
      rotationCount: this.rotationCount,
      hipRotationAngle: Math.round(hipRotation),
      shoulderRotationAngle: Math.round(shoulderRotation),
      rotationPower,
      syncScore,
      formScore: avgFormScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRotation,
    };
  }

  private noDetection(msg: string): HipRotationFeedback {
    return {
      detected: false, stage: this.stage, rotationCount: this.rotationCount,
      hipRotationAngle: 0, shoulderRotationAngle: 0, rotationPower: 0,
      syncScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodRotation: false,
    };
  }

  public reset(): void {
    this.stage = 'NEUTRAL';
    this.rotationCount = 0;
    this.formScores = [];
    this.calibrated = false;
    this.calibrationFrames = 0;
    this.maxRotation = 0;
    this.currentFrame = 0;
    this.hipAngleHistory = [];
    this.shoulderAngleHistory = [];
    this.smootherHipAngle.reset();
    this.smootherShoulderAngle.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
