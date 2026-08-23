/**
 * Boxing — Stance Analyzer
 * Evaluates boxing stance quality:
 * foot separation (shoulder-width+ ideal), hip-foot positioning,
 * weight distribution, and orthodox vs southpaw detection.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { AngleSmoother } from './angles';

export type BoxingStanceType = 'ORTHODOX' | 'SOUTHPAW' | 'SQUARE' | 'UNKNOWN';
export type StanceStage = 'ASSESSING' | 'GOOD_STANCE' | 'ADJUSTING';

export interface BoxingStanceFeedback {
  detected: boolean;
  stage: StanceStage;
  stanceType: BoxingStanceType;
  footSeparationScore: number;   // 0-100
  weightDistributionScore: number;
  stanceDepthScore: number;      // Knee bend
  kneeAngle: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodStance: boolean;
}

export class BoxingStanceAnalyzer {
  private stage: StanceStage = 'ASSESSING';
  private stanceType: BoxingStanceType = 'UNKNOWN';
  private smootherLeftKnee = new AngleSmoother(0.4);
  private smootherRightKnee = new AngleSmoother(0.4);
  private formScores: number[] = [];
  private frameCount = 0;

  // Import calculateAngle inline to avoid circular deps
  private calcAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return Math.round(angle * 10) / 10;
  }

  public process(landmarks: NormalizedLandmark[]): BoxingStanceFeedback {
    const required = [
      PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Stand facing camera so full body including feet is visible.');
    }

    this.frameCount++;

    const leftKnee = this.smootherLeftKnee.update(
      this.calcAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      this.calcAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    const leftAnkle = landmarks[PoseLandmark.LEFT_ANKLE];
    const rightAnkle = landmarks[PoseLandmark.RIGHT_ANKLE];
    const leftShoulder = landmarks[PoseLandmark.LEFT_SHOULDER];
    const rightShoulder = landmarks[PoseLandmark.RIGHT_SHOULDER];
    const leftHip = landmarks[PoseLandmark.LEFT_HIP];
    const rightHip = landmarks[PoseLandmark.RIGHT_HIP];

    // Foot separation relative to shoulder width
    const footSeparation = Math.abs(leftAnkle.x - rightAnkle.x);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const footSeparationRatio = shoulderWidth > 0 ? footSeparation / shoulderWidth : 0;

    // Stance type detection: front foot leads toward camera (closer Z or further in X)
    // Orthodox: left foot forward (lead foot) => left ankle further in X toward opponent
    // Southpaw: right foot forward
    // Use Y to detect angled stance
    const leftAnkleForward = leftAnkle.y < rightAnkle.y; // In image coords, lower Y = further back
    const angleDiff = Math.abs(leftAnkle.y - rightAnkle.y);

    if (angleDiff < 0.03) {
      this.stanceType = 'SQUARE';
    } else if (leftAnkleForward) {
      this.stanceType = 'SOUTHPAW';
    } else {
      this.stanceType = 'ORTHODOX';
    }

    // Weight distribution via hip centering between feet
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const footCenterX = (leftAnkle.x + rightAnkle.x) / 2;
    const weightOffset = Math.abs(hipCenterX - footCenterX);
    const weightDistributionScore = Math.max(0, Math.round(100 - weightOffset * 400));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Adopt your boxing stance — one foot forward, knees slightly bent.';
    let isGoodStance = false;

    // Foot separation: ideal 1.2-1.8x shoulder width
    let footSeparationScore: number;
    if (footSeparationRatio >= 1.2 && footSeparationRatio <= 1.8) {
      footSeparationScore = 100;
    } else if (footSeparationRatio < 1.2) {
      footSeparationScore = Math.round(footSeparationRatio / 1.2 * 100);
      currentWarnings.push('Feet too close together');
      feedbackMessage = 'Widen your stance! Feet should be shoulder-width or slightly wider.';
    } else {
      footSeparationScore = Math.round(Math.max(0, 100 - (footSeparationRatio - 1.8) * 100));
      currentWarnings.push('Feet too wide — reduces mobility');
      feedbackMessage = 'Stance too wide. Narrow slightly for better balance and mobility.';
    }

    // Knee bend: ideal 140-160° (slight bend, not deep squat)
    let stanceDepthScore: number;
    if (avgKnee >= 140 && avgKnee <= 165) {
      stanceDepthScore = 100;
      if (feedbackMessage === 'Adopt your boxing stance — one foot forward, knees slightly bent.') {
        feedbackMessage = 'Good stance! Knees slightly bent, ready to move.';
      }
    } else if (avgKnee < 140) {
      stanceDepthScore = Math.round(80 - (140 - avgKnee) * 2);
      currentWarnings.push('Knees too bent — too deep for boxing stance');
      feedbackMessage = 'Straighten up slightly — boxing stance is a soft bend, not a squat.';
    } else {
      stanceDepthScore = Math.round(80 - (avgKnee - 165) * 3);
      currentWarnings.push('Legs too straight — add a soft knee bend');
      feedbackMessage = 'Bend your knees slightly! Stay springy on your feet.';
    }

    // Stance type feedback
    if (this.stanceType === 'SQUARE') {
      currentWarnings.push('Square stance — vulnerable to counter attacks');
      feedbackMessage = 'Turn sideways! Stagger your feet — lead foot forward, rear foot back.';
    }

    if (weightDistributionScore < 60) {
      currentWarnings.push('Weight shifted off center');
      feedbackMessage = 'Center your weight evenly over both feet.';
    }

    const formScore = Math.round(footSeparationScore * 0.35 + stanceDepthScore * 0.35 + weightDistributionScore * 0.3);
    this.formScores.push(formScore);
    if (this.formScores.length > 60) this.formScores.shift();

    if (formScore >= 72 && this.stanceType !== 'SQUARE') {
      this.stage = 'GOOD_STANCE';
      isGoodStance = true;
      feedbackMessage = `Excellent ${this.stanceType.toLowerCase()} stance! Active feet, eyes up!`;
    } else if (currentWarnings.length > 0) {
      this.stage = 'ADJUSTING';
    }

    return {
      detected: true,
      stage: this.stage,
      stanceType: this.stanceType,
      footSeparationScore,
      weightDistributionScore,
      stanceDepthScore,
      kneeAngle: avgKnee,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodStance,
    };
  }

  private noDetection(msg: string): BoxingStanceFeedback {
    return {
      detected: false, stage: this.stage, stanceType: this.stanceType,
      footSeparationScore: 0, weightDistributionScore: 0, stanceDepthScore: 0,
      kneeAngle: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodStance: false,
    };
  }

  public reset(): void {
    this.stage = 'ASSESSING';
    this.stanceType = 'UNKNOWN';
    this.formScores = [];
    this.frameCount = 0;
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
