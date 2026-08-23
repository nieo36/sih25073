/**
 * Basketball — Agility Analyzer
 * Evaluates lateral movement speed, low defensive hip position,
 * and direction change mechanics during agility drills.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type AgilityStage = 'NEUTRAL' | 'MOVING_LEFT' | 'MOVING_RIGHT' | 'DIRECTION_CHANGE';

export interface AgilityFeedback {
  detected: boolean;
  stage: AgilityStage;
  hipHeight: number;          // Normalized 0-1 (lower = better stance)
  kneeAngle: number;
  lateralSpeed: number;       // Normalized lateral velocity
  directionChanges: number;
  stabilityScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodMovement: boolean;
}

export class AgilityAnalyzer {
  private stage: AgilityStage = 'NEUTRAL';
  private directionChanges = 0;
  private prevHipCenterX = -1;
  private prevDirection = 0;
  private smootherLeftKnee = new AngleSmoother(0.3);
  private smootherRightKnee = new AngleSmoother(0.3);
  private hipYHistory: number[] = [];
  private lateralSpeedHistory: number[] = [];
  private frameCount = 0;
  private formScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): AgilityFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.4)) {
      return this.noDetection('No athlete detected. Ensure full body is visible — camera at waist height.');
    }

    this.frameCount++;

    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    // Hip center position
    const hipCenterX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipCenterY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;

    // Track hip height (higher Y in image = lower person in frame = lower stance)
    this.hipYHistory.push(hipCenterY);
    if (this.hipYHistory.length > 30) this.hipYHistory.shift();
    const avgHipY = this.hipYHistory.reduce((a, b) => a + b, 0) / this.hipYHistory.length;

    // Lateral speed
    let lateralSpeed = 0;
    if (this.prevHipCenterX >= 0) {
      lateralSpeed = Math.abs(hipCenterX - this.prevHipCenterX) * 60; // normalized per second estimate
    }
    this.lateralSpeedHistory.push(lateralSpeed);
    if (this.lateralSpeedHistory.length > 15) this.lateralSpeedHistory.shift();
    const avgLateralSpeed = this.lateralSpeedHistory.reduce((a, b) => a + b, 0) / this.lateralSpeedHistory.length;

    // Direction detection
    const currentDirection = this.prevHipCenterX >= 0 ? Math.sign(hipCenterX - this.prevHipCenterX) : 0;
    if (currentDirection !== 0 && currentDirection !== this.prevDirection && this.prevDirection !== 0) {
      this.directionChanges++;
      this.stage = 'DIRECTION_CHANGE';
    } else if (Math.abs(lateralSpeed) > 0.005) {
      this.stage = currentDirection < 0 ? 'MOVING_LEFT' : 'MOVING_RIGHT';
    } else {
      this.stage = 'NEUTRAL';
    }
    if (currentDirection !== 0) this.prevDirection = currentDirection;
    this.prevHipCenterX = hipCenterX;

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Get into defensive stance — hips low, knees bent.';
    let isGoodMovement = false;

    const isLowStance = avgKnee < 150; // Bent knees = low stance

    if (!isLowStance) {
      currentWarnings.push('Hips too high — bend your knees more');
      feedbackMessage = 'Stay low! Bend your knees and lower your hips.';
    } else if (avgKnee < 100) {
      currentWarnings.push('Overly deep stance — slight inefficiency');
      feedbackMessage = 'Slightly too deep — maintain 110-140° knee bend for agility.';
    } else {
      feedbackMessage = this.stage === 'MOVING_LEFT'
        ? 'Moving left — drive off right foot, stay low!'
        : this.stage === 'MOVING_RIGHT'
        ? 'Moving right — drive off left foot, stay low!'
        : this.stage === 'DIRECTION_CHANGE'
        ? 'Sharp change of direction! Excellent!'
        : 'Good low stance. Shuffle laterally staying in defensive position.';
      isGoodMovement = true;
    }

    const symmetryScore = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 3));
    if (symmetryScore < 65) {
      currentWarnings.push('Weight unevenly distributed between feet');
    }

    const stabilityScore = Math.round((symmetryScore + (isLowStance ? 85 : 55)) / 2);
    const formScore = Math.round(stabilityScore * 0.6 + (Math.min(avgLateralSpeed * 1000, 100)) * 0.4);
    if (isGoodMovement) this.formScores.push(formScore);

    return {
      detected: true,
      stage: this.stage,
      hipHeight: Math.round(avgHipY * 100) / 100,
      kneeAngle: avgKnee,
      lateralSpeed: Math.round(avgLateralSpeed * 1000) / 1000,
      directionChanges: this.directionChanges,
      stabilityScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodMovement,
    };
  }

  private noDetection(msg: string): AgilityFeedback {
    return {
      detected: false, stage: this.stage, hipHeight: 0, kneeAngle: 0,
      lateralSpeed: 0, directionChanges: this.directionChanges,
      stabilityScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodMovement: false,
    };
  }

  public reset(): void {
    this.stage = 'NEUTRAL';
    this.directionChanges = 0;
    this.prevHipCenterX = -1;
    this.prevDirection = 0;
    this.hipYHistory = [];
    this.lateralSpeedHistory = [];
    this.frameCount = 0;
    this.formScores = [];
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
