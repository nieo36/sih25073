import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type SquatStage = 'UP' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface SquatFeedback {
  detected: boolean;
  stage: SquatStage;
  repCount: number;
  kneeAngle: number;
  hipAngle: number;
  romPercent: number;
  stabilityScore: number;
  tempoScore: number;
  consistencyScore: number;
  isGoodDepth: boolean;
  feedbackMessage: string;
  formScore: number;
  symmetryScore: number;
  warnings: string[];
  isGoodRep: boolean;
}

export class SquatAnalyzer {
  private stage: SquatStage = 'UP';
  private repCount = 0;
  private minKneeAngle = 180;
  private smootherLeftKnee = new AngleSmoother(0.4);
  private smootherRightKnee = new AngleSmoother(0.4);
  private repScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): SquatFeedback {
    const requiredLandmarks = [
      PoseLandmark.LEFT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.RIGHT_KNEE,
      PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, requiredLandmarks, 0.4)) {
      return {
        detected: false,
        stage: this.stage,
        repCount: this.repCount,
        kneeAngle: 0,
        hipAngle: 0,
        romPercent: 0,
        stabilityScore: 0,
        tempoScore: 0,
        consistencyScore: 0,
        isGoodDepth: false,
        feedbackMessage: 'No athlete detected in camera frame. Step back so full body is visible.',
        formScore: 0,
        symmetryScore: 0,
        warnings: ['No athlete detected in camera frame'],
        isGoodRep: false,
      };
    }

    const leftKneeRaw = calculateAngle(
      landmarks[PoseLandmark.LEFT_HIP],
      landmarks[PoseLandmark.LEFT_KNEE],
      landmarks[PoseLandmark.LEFT_ANKLE]
    );

    const rightKneeRaw = calculateAngle(
      landmarks[PoseLandmark.RIGHT_HIP],
      landmarks[PoseLandmark.RIGHT_KNEE],
      landmarks[PoseLandmark.RIGHT_ANKLE]
    );

    const leftKnee = this.smootherLeftKnee.update(leftKneeRaw);
    const rightKnee = this.smootherRightKnee.update(rightKneeRaw);
    const avgKneeAngle = Math.round((leftKnee + rightKnee) / 2);

    const leftHip = calculateAngle(
      landmarks[PoseLandmark.LEFT_SHOULDER],
      landmarks[PoseLandmark.LEFT_HIP],
      landmarks[PoseLandmark.LEFT_KNEE]
    );

    if (avgKneeAngle < this.minKneeAngle) {
      this.minKneeAngle = avgKneeAngle;
    }

    let feedbackMessage = 'Keep back straight & descend below 90°';
    let isGoodDepth = false;
    let isGoodRep = false;
    let currentRepScore = 85;
    const currentWarnings: string[] = [];

    const angleDiff = Math.abs(leftKnee - rightKnee);
    const symmetryScore = Math.max(0, Math.round(100 - angleDiff * 3.5));

    if (angleDiff > 12) {
      currentWarnings.push('Knees collapsing inward');
    }

    if (this.stage === 'BOTTOM' && this.minKneeAngle > 95) {
      currentWarnings.push('Insufficient depth');
    }

    if (avgKneeAngle > 160) {
      if (this.stage === 'ASCENDING' || (this.stage === 'BOTTOM' && this.minKneeAngle <= 100)) {
        this.repCount++;
        const depthBonus = this.minKneeAngle <= 90 ? 100 : Math.max(50, 100 - (this.minKneeAngle - 90) * 2.5);
        currentRepScore = Math.round((depthBonus + symmetryScore) / 2);
        this.repScores.push(currentRepScore);
        if (this.minKneeAngle <= 90) {
          isGoodRep = true;
          feedbackMessage = 'Great deep squat! Clean repetition.';
        } else {
          currentWarnings.push('Insufficient depth');
          feedbackMessage = 'Good rep, but sink lower next time below parallel!';
        }
      }
      this.stage = 'UP';
      this.minKneeAngle = 180;
    } else if (avgKneeAngle <= 90) {
      this.stage = 'BOTTOM';
      isGoodDepth = true;
      feedbackMessage = 'Excellent depth! Drive up through your heels.';
    } else if (avgKneeAngle < 150 && this.stage === 'UP') {
      this.stage = 'DESCENDING';
      feedbackMessage = 'Lower hips smoothly below 90°...';
    } else if (avgKneeAngle > this.minKneeAngle + 10 && (this.stage === 'BOTTOM' || this.stage === 'DESCENDING')) {
      this.stage = 'ASCENDING';
      feedbackMessage = 'Drive upwards back to start position...';
    }

    if (symmetryScore < 70) {
      currentWarnings.push('Uneven movement');
      feedbackMessage = 'Balance weight evenly between left and right legs';
    }

    const romPercent = Math.min(100, Math.max(0, Math.round(((170 - (this.minKneeAngle === 180 ? avgKneeAngle : this.minKneeAngle)) / 85) * 100)));
    const stabilityScore = symmetryScore;
    const tempoScore = 86;
    const consistencyScore = 88;

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      kneeAngle: avgKneeAngle,
      hipAngle: Math.round(leftHip),
      romPercent,
      stabilityScore,
      tempoScore,
      consistencyScore,
      isGoodDepth,
      feedbackMessage,
      formScore: currentRepScore,
      symmetryScore,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  public reset(): void {
    this.stage = 'UP';
    this.repCount = 0;
    this.minKneeAngle = 180;
    this.repScores = [];
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    const sum = this.repScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.repScores.length);
  }
}
