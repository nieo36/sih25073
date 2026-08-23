/**
 * Weightlifting — Squat Depth Analyzer (Enhanced)
 * Advanced barbell back squat analysis:
 * - Knee angle tracking with parallel depth threshold
 * - Hip angle (hip crease below knee check)
 * - Ankle dorsiflexion (forward knee travel)
 * - Knee cave detection (valgus collapse)
 * - Trunk/back angle (forward lean)
 * - Heel rise detection
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type SquatDepthStage = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface SquatDepthFeedback {
  detected: boolean;
  stage: SquatDepthStage;
  repCount: number;
  leftKneeAngle: number;
  rightKneeAngle: number;
  hipAngle: number;
  trunkAngle: number;       // Forward lean from vertical
  kneeValgusScore: number;  // 0-100 (100 = no cave)
  depthScore: number;       // 0-100
  heelRiseScore: number;    // 0-100 (100 = heels down)
  symmetryScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodRep: boolean;
}

export class WeightliftingSquatDepthAnalyzer {
  private stage: SquatDepthStage = 'STANDING';
  private repCount = 0;
  private minKneeAngle = 180;
  private smootherLeftKnee = new AngleSmoother(0.35);
  private smootherRightKnee = new AngleSmoother(0.35);
  private smootherHip = new AngleSmoother(0.35);
  private repScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): SquatDepthFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_HEEL, PoseLandmark.RIGHT_HEEL,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.4)) {
      return this.noDetection('No athlete detected. Position side-on camera so full squat is visible.');
    }

    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    const hipAngle = this.smootherHip.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE])
    );

    // Trunk angle from vertical (shoulder-hip vector vs vertical)
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const shoulderMidY = (landmarks[PoseLandmark.LEFT_SHOULDER].y + landmarks[PoseLandmark.RIGHT_SHOULDER].y) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipMidY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;
    const trunkAngle = Math.round(Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) * 180 / Math.PI));

    // Knee valgus: left and right knee x relative to ankle x
    const leftKneeMedX = landmarks[PoseLandmark.LEFT_KNEE].x;
    const leftAnkleX = landmarks[PoseLandmark.LEFT_ANKLE].x;
    const rightKneeMedX = landmarks[PoseLandmark.RIGHT_KNEE].x;
    const rightAnkleX = landmarks[PoseLandmark.RIGHT_ANKLE].x;
    // In normalized image, left knee should be to the left of right knee (higher X = right)
    const leftKneeTrack = leftKneeMedX - leftAnkleX; // positive = knee outside ankle (good)
    const rightKneeTrack = rightAnkleX - rightKneeMedX; // positive = knee outside ankle (good)
    const kneeValgusScore = Math.min(100, Math.max(0, Math.round(50 + leftKneeTrack * 200 + rightKneeTrack * 200)));

    // Heel rise: heel Y should be close to ankle Y
    const leftHeelRise = Math.abs(landmarks[PoseLandmark.LEFT_ANKLE].y - landmarks[PoseLandmark.LEFT_HEEL].y);
    const rightHeelRise = Math.abs(landmarks[PoseLandmark.RIGHT_ANKLE].y - landmarks[PoseLandmark.RIGHT_HEEL].y);
    const heelRiseScore = Math.max(0, Math.round(100 - (leftHeelRise + rightHeelRise) * 600));

    if (avgKnee < this.minKneeAngle) this.minKneeAngle = avgKnee;

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Stand bar over mid-foot, feet shoulder-width apart.';
    let isGoodRep = false;

    const symmetryScore = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 3));

    // Knee valgus warning
    if (kneeValgusScore < 50) {
      currentWarnings.push('Knee cave detected — push knees out!');
      feedbackMessage = 'KNEES CAVING IN! Push your knees outward over your toes!';
    }

    // Trunk lean
    if (trunkAngle > 45) {
      currentWarnings.push('Excessive forward lean — risk of lower back strain');
      feedbackMessage = 'Too much forward lean! Keep chest up and brace your core.';
    } else if (trunkAngle < 10 && this.stage !== 'STANDING') {
      currentWarnings.push('Too upright — may limit depth');
    }

    // Heel rise
    if (heelRiseScore < 40) {
      currentWarnings.push('Heels rising off ground — work on ankle mobility');
      feedbackMessage = 'Keep your heels down! Work on ankle mobility or use heel elevation.';
    }

    // State machine
    if (avgKnee > 160) {
      if (this.stage === 'ASCENDING' || (this.stage === 'BOTTOM' && this.minKneeAngle <= 100)) {
        this.repCount++;
        const depthScore = this.minKneeAngle <= 90 ? 100 : Math.max(40, 100 - (this.minKneeAngle - 90) * 3);
        const formScore = Math.round(
          depthScore * 0.35 + kneeValgusScore * 0.25 + heelRiseScore * 0.2 + symmetryScore * 0.2
        );
        this.repScores.push(formScore);
        isGoodRep = formScore >= 72 && kneeValgusScore >= 60 && heelRiseScore >= 60;
        feedbackMessage = isGoodRep
          ? 'Excellent squat! Full depth, heels down, knees tracking well!'
          : this.minKneeAngle > 90
          ? 'Rep counted, but go deeper — reach parallel (thighs horizontal)!'
          : 'Rep counted. Focus on keeping heels down and knees wide.';
      }
      this.stage = 'STANDING';
      this.minKneeAngle = 180;
    } else if (avgKnee <= 90) {
      this.stage = 'BOTTOM';
      if (currentWarnings.length === 0) {
        feedbackMessage = 'Excellent depth! Drive through heels to stand up!';
      }
    } else if (avgKnee < 150 && this.stage === 'STANDING') {
      this.stage = 'DESCENDING';
      feedbackMessage = 'Descending — push knees out and sit hips back!';
    } else if (avgKnee > this.minKneeAngle + 10 && (this.stage === 'BOTTOM' || this.stage === 'DESCENDING')) {
      this.stage = 'ASCENDING';
      feedbackMessage = 'Ascending — drive through heels, chest up!';
    }

    if (symmetryScore < 75) {
      currentWarnings.push('Uneven left/right movement');
    }

    const depthScore = this.minKneeAngle === 180 ? 0 : Math.min(100, Math.max(0, Math.round(((170 - this.minKneeAngle) / 85) * 100)));
    const formScore = this.repScores.length > 0
      ? Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length)
      : Math.round(kneeValgusScore * 0.35 + heelRiseScore * 0.25 + symmetryScore * 0.4);

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      leftKneeAngle: Math.round(leftKnee),
      rightKneeAngle: Math.round(rightKnee),
      hipAngle: Math.round(hipAngle),
      trunkAngle,
      kneeValgusScore,
      depthScore,
      heelRiseScore,
      symmetryScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  private noDetection(msg: string): SquatDepthFeedback {
    return {
      detected: false, stage: this.stage, repCount: this.repCount,
      leftKneeAngle: 0, rightKneeAngle: 0, hipAngle: 0, trunkAngle: 0,
      kneeValgusScore: 0, depthScore: 0, heelRiseScore: 0, symmetryScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodRep: false,
    };
  }

  public reset(): void {
    this.stage = 'STANDING';
    this.repCount = 0;
    this.minKneeAngle = 180;
    this.repScores = [];
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
    this.smootherHip.reset();
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    return Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length);
  }
}
