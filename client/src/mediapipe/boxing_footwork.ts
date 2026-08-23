/**
 * Boxing — Footwork Analyzer
 * Evaluates boxing footwork patterns:
 * - Ankle movement (active feet vs flat-footed)
 * - Weight shift during punch combinations
 * - Balance recovery after movement
 * - Step pattern quality (not crossing feet)
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';

export type FootworkStage = 'NEUTRAL' | 'ADVANCING' | 'RETREATING' | 'CIRCLING_LEFT' | 'CIRCLING_RIGHT' | 'OFF_BALANCE';

export interface FootworkFeedback {
  detected: boolean;
  stage: FootworkStage;
  stepCount: number;
  feetCrossed: boolean;
  activeFootScore: number;    // How well they stay on balls of feet
  balanceScore: number;
  weightShiftScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodFootwork: boolean;
}

export class FootworkAnalyzer {
  private stage: FootworkStage = 'NEUTRAL';
  private stepCount = 0;
  private formScores: number[] = [];

  private leftAnkleHistory: Array<{ x: number; y: number }> = [];
  private rightAnkleHistory: Array<{ x: number; y: number }> = [];
  private hipCenterXHistory: number[] = [];
  private prevLeftAnkleY = -1;
  private prevRightAnkleY = -1;

  public process(landmarks: NormalizedLandmark[]): FootworkFeedback {
    const required = [
      PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_HEEL, PoseLandmark.RIGHT_HEEL,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Show full body including feet — camera at waist height.');
    }

    const leftAnkle = landmarks[PoseLandmark.LEFT_ANKLE];
    const rightAnkle = landmarks[PoseLandmark.RIGHT_ANKLE];
    const leftHeel = landmarks[PoseLandmark.LEFT_HEEL];
    const rightHeel = landmarks[PoseLandmark.RIGHT_HEEL];
    const leftHip = landmarks[PoseLandmark.LEFT_HIP];
    const rightHip = landmarks[PoseLandmark.RIGHT_HIP];

    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    this.hipCenterXHistory.push(hipCenterX);
    if (this.hipCenterXHistory.length > 10) this.hipCenterXHistory.shift();

    this.leftAnkleHistory.push({ x: leftAnkle.x, y: leftAnkle.y });
    this.rightAnkleHistory.push({ x: rightAnkle.x, y: rightAnkle.y });
    if (this.leftAnkleHistory.length > 8) {
      this.leftAnkleHistory.shift();
      this.rightAnkleHistory.shift();
    }

    // Step detection via ankle Y displacement
    let leftStep = false, rightStep = false;
    if (this.prevLeftAnkleY >= 0) {
      leftStep = Math.abs(leftAnkle.y - this.prevLeftAnkleY) > 0.04;
      rightStep = Math.abs(rightAnkle.y - this.prevRightAnkleY) > 0.04;
      if (leftStep || rightStep) this.stepCount++;
    }
    this.prevLeftAnkleY = leftAnkle.y;
    this.prevRightAnkleY = rightAnkle.y;

    // Feet crossed detection
    const feetCrossed = leftAnkle.x > rightAnkle.x;

    // Active foot detection: heel should be slightly off ground (lower heel.y than ankle.y)
    // Higher heel Y relative to ankle = heel raised = on balls of feet
    const leftHeelLift = leftAnkle.y - leftHeel.y;
    const rightHeelLift = rightAnkle.y - rightHeel.y;
    const avgHeelLift = (leftHeelLift + rightHeelLift) / 2;
    const activeFootScore = Math.min(100, Math.max(0, Math.round(50 + avgHeelLift * 300)));

    // Movement direction via hip center velocity
    let movement = 0;
    if (this.hipCenterXHistory.length >= 3) {
      movement = this.hipCenterXHistory[this.hipCenterXHistory.length - 1] - this.hipCenterXHistory[0];
    }
    const absMovement = Math.abs(movement);

    // Stage detection
    if (feetCrossed) {
      this.stage = 'OFF_BALANCE';
    } else if (absMovement < 0.005) {
      this.stage = 'NEUTRAL';
    } else if (movement < 0) {
      this.stage = 'CIRCLING_LEFT';
    } else {
      this.stage = 'CIRCLING_RIGHT';
    }

    // Weight distribution
    const hipCenterFeetCenter = Math.abs(hipCenterX - (leftAnkle.x + rightAnkle.x) / 2);
    const weightShiftScore = Math.max(0, Math.round(100 - hipCenterFeetCenter * 300));

    // Balance: hip shouldn't shift excessively with each step
    const hipVariance = this.hipCenterXHistory.length > 3
      ? this.hipCenterXHistory.reduce((acc, val) => acc + Math.pow(val - hipCenterX, 2), 0) / this.hipCenterXHistory.length
      : 0;
    const balanceScore = Math.max(0, Math.round(100 - hipVariance * 5000));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Stay on balls of feet — light, active footwork!';
    let isGoodFootwork = false;

    if (feetCrossed) {
      currentWarnings.push('Feet crossed — dangerous position!');
      feedbackMessage = 'STOP! Your feet are crossed — you will lose balance. Separate them immediately!';
    } else if (activeFootScore < 40) {
      currentWarnings.push('Flat-footed — stay on balls of feet');
      feedbackMessage = 'Get off your heels! Stay on the balls of your feet to stay mobile.';
    } else if (weightShiftScore < 50) {
      currentWarnings.push('Excessive weight shift — losing balance');
      feedbackMessage = 'Stay centered! Don\'t over-shift your weight on each step.';
    } else {
      feedbackMessage = this.stage === 'NEUTRAL'
        ? 'Good position. Stay active — keep feet light and ready to move.'
        : `Moving ${this.stage.replace('CIRCLING_', '').toLowerCase()} — good footwork! Keep it controlled.`;
      isGoodFootwork = true;
    }

    const formScore = Math.round(activeFootScore * 0.35 + balanceScore * 0.35 + weightShiftScore * 0.3);
    this.formScores.push(formScore);
    if (this.formScores.length > 60) this.formScores.shift();

    return {
      detected: true,
      stage: this.stage,
      stepCount: this.stepCount,
      feetCrossed,
      activeFootScore,
      balanceScore,
      weightShiftScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodFootwork,
    };
  }

  private noDetection(msg: string): FootworkFeedback {
    return {
      detected: false, stage: this.stage, stepCount: this.stepCount,
      feetCrossed: false, activeFootScore: 0, balanceScore: 0,
      weightShiftScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodFootwork: false,
    };
  }

  public reset(): void {
    this.stage = 'NEUTRAL';
    this.stepCount = 0;
    this.formScores = [];
    this.leftAnkleHistory = [];
    this.rightAnkleHistory = [];
    this.hipCenterXHistory = [];
    this.prevLeftAnkleY = -1;
    this.prevRightAnkleY = -1;
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
