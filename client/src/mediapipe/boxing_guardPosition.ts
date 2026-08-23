/**
 * Boxing — Guard Position Analyzer
 * Monitors the quality of the boxing guard:
 * - Wrist/fist height relative to chin (nose landmark)
 * - Elbow tucking (proximity to torso)
 * - Chin protection level
 * - Guard restoration speed after punches
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { AngleSmoother } from './angles';

export type GuardStage = 'EVALUATING' | 'GOOD_GUARD' | 'GUARD_BROKEN' | 'RESTORING';

export interface GuardPositionFeedback {
  detected: boolean;
  stage: GuardStage;
  leftFistHeightScore: number;    // 0-100 (100 = fist at chin height)
  rightFistHeightScore: number;
  elbowTuckScore: number;         // 0-100 (100 = elbows tucked to ribs)
  chinProtectionScore: number;    // 0-100
  overallGuardScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodGuard: boolean;
}

export class GuardPositionAnalyzer {
  private stage: GuardStage = 'EVALUATING';
  private smootherLeftElbow = new AngleSmoother(0.3);
  private smootherRightElbow = new AngleSmoother(0.3);
  private formScores: number[] = [];
  private goodGuardFrames = 0;
  private totalFrames = 0;

  public process(landmarks: NormalizedLandmark[]): GuardPositionFeedback {
    const required = [
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST,
      PoseLandmark.NOSE, PoseLandmark.LEFT_HIP,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Face camera in guard position — show upper body.');
    }

    this.totalFrames++;

    const nose = landmarks[PoseLandmark.NOSE];
    const leftWrist = landmarks[PoseLandmark.LEFT_WRIST];
    const rightWrist = landmarks[PoseLandmark.RIGHT_WRIST];
    const leftElbow = landmarks[PoseLandmark.LEFT_ELBOW];
    const rightElbow = landmarks[PoseLandmark.RIGHT_ELBOW];
    const leftShoulder = landmarks[PoseLandmark.LEFT_SHOULDER];
    const rightShoulder = landmarks[PoseLandmark.RIGHT_SHOULDER];

    // Fist height relative to nose: ideal = wrist.y close to nose.y (same vertical level)
    // In normalized coords, Y decreases toward top of screen
    const chinY = nose.y; // approximate chin
    const noseToWristLeft = chinY - leftWrist.y;  // positive = wrist above nose
    const noseToWristRight = chinY - rightWrist.y;

    // Ideal: wrist slightly below nose (within 0.1 in normalized units)
    const leftFistHeightScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(noseToWristLeft - 0.05) * 500)));
    const rightFistHeightScore = Math.max(0, Math.min(100, Math.round(100 - Math.abs(noseToWristRight - 0.05) * 500)));

    // Elbow tuck: elbows should be close to torso
    // Measure horizontal distance from elbow to shoulder (should be small)
    const torsoWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const leftElbowDrift = Math.abs(leftElbow.x - leftShoulder.x);
    const rightElbowDrift = Math.abs(rightElbow.x - rightShoulder.x);
    const normalizedElbowDrift = torsoWidth > 0 ? (leftElbowDrift + rightElbowDrift) / (2 * torsoWidth) : 1;
    const elbowTuckScore = Math.max(0, Math.round(100 - normalizedElbowDrift * 120));

    // Chin protection: head should be slightly down (nose Y slightly lower than ears)
    const leftEar = landmarks[PoseLandmark.LEFT_EAR] || { x: 0, y: nose.y };
    const chinDown = leftEar.y - nose.y;
    const chinProtectionScore = Math.min(100, Math.max(0, Math.round(50 + chinDown * 500)));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Hold your guard — fists at chin level, elbows tucked.';
    let isGoodGuard = false;

    // Fist height checks
    if (leftWrist.y > chinY + 0.15) {
      currentWarnings.push('Left fist too low — protect your chin!');
      feedbackMessage = 'LEFT hand is too low! Bring it up to chin level immediately!';
    }
    if (rightWrist.y > chinY + 0.15) {
      currentWarnings.push('Right fist too low — protect your chin!');
      feedbackMessage = 'RIGHT hand is too low! Keep both fists at chin height!';
    }
    if (leftWrist.y < chinY - 0.15) {
      currentWarnings.push('Left hand too high — overextended');
      feedbackMessage = 'Left hand too high — return to guard position.';
    }
    if (rightWrist.y < chinY - 0.15) {
      currentWarnings.push('Right hand too high — overextended');
      feedbackMessage = 'Right hand too high — snap back to guard!';
    }

    // Elbow tuck
    if (elbowTuckScore < 50) {
      currentWarnings.push('Elbows flaring out — exposing body');
      if (currentWarnings.length === 1) {
        feedbackMessage = 'Tuck your elbows in! Flared elbows expose your ribs.';
      }
    }

    // Chin protection
    if (chinProtectionScore < 40) {
      currentWarnings.push('Chin exposed — tuck your chin down');
      feedbackMessage = 'Tuck your chin! Lower your head slightly behind your gloves.';
    }

    const overallGuardScore = Math.round(
      leftFistHeightScore * 0.25 + rightFistHeightScore * 0.25 +
      elbowTuckScore * 0.3 + chinProtectionScore * 0.2
    );

    if (overallGuardScore >= 72 && currentWarnings.length === 0) {
      this.stage = 'GOOD_GUARD';
      isGoodGuard = true;
      this.goodGuardFrames++;
      feedbackMessage = 'Excellent guard! Tight defense — eyes on the opponent!';
    } else if (currentWarnings.length > 1) {
      this.stage = 'GUARD_BROKEN';
    } else {
      this.stage = 'EVALUATING';
    }

    this.formScores.push(overallGuardScore);
    if (this.formScores.length > 60) this.formScores.shift();

    return {
      detected: true,
      stage: this.stage,
      leftFistHeightScore,
      rightFistHeightScore,
      elbowTuckScore,
      chinProtectionScore,
      overallGuardScore,
      formScore: overallGuardScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodGuard,
    };
  }

  private noDetection(msg: string): GuardPositionFeedback {
    return {
      detected: false, stage: this.stage, leftFistHeightScore: 0, rightFistHeightScore: 0,
      elbowTuckScore: 0, chinProtectionScore: 0, overallGuardScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodGuard: false,
    };
  }

  public reset(): void {
    this.stage = 'EVALUATING';
    this.formScores = [];
    this.goodGuardFrames = 0;
    this.totalFrames = 0;
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
  }

  public getGuardQualityPercent(): number {
    if (this.totalFrames === 0) return 0;
    return Math.round((this.goodGuardFrames / this.totalFrames) * 100);
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
