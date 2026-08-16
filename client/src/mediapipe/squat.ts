import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type SquatStage = 'UP' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface SquatFeedback {
  stage: SquatStage;
  repCount: number;
  kneeAngle: number;
  hipAngle: number;
  isGoodDepth: boolean;
  feedbackMessage: string;
  formScore: number; // 0 - 100 for current rep
  symmetryScore: number; // 0 - 100
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
        stage: this.stage,
        repCount: this.repCount,
        kneeAngle: 180,
        hipAngle: 180,
        isGoodDepth: false,
        feedbackMessage: 'Step back to ensure full body is visible in camera',
        formScore: 0,
        symmetryScore: 100,
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

    // Track minimum knee angle achieved during descent
    if (avgKneeAngle < this.minKneeAngle) {
      this.minKneeAngle = avgKneeAngle;
    }

    let feedbackMessage = 'Keep your back straight and push your hips back';
    let isGoodDepth = false;
    let currentRepScore = 85;

    // Symmetry check
    const angleDiff = Math.abs(leftKnee - rightKnee);
    const symmetryScore = Math.max(0, Math.round(100 - angleDiff * 3));

    // State Machine
    // Standing: > 160 deg
    // Descending: 160 -> 100 deg
    // Bottom: <= 90 deg (good parallel/sub-parallel squat)
    // Ascending: returning back
    if (avgKneeAngle > 160) {
      if (this.stage === 'ASCENDING' || (this.stage === 'BOTTOM' && this.minKneeAngle <= 100)) {
        this.repCount++;
        // Calculate rep score based on depth achieved
        const depthBonus = this.minKneeAngle <= 90 ? 100 : Math.max(60, 100 - (this.minKneeAngle - 90) * 2);
        currentRepScore = Math.round((depthBonus + symmetryScore) / 2);
        this.repScores.push(currentRepScore);
        feedbackMessage = this.minKneeAngle <= 90 ? 'Great squat depth!' : 'Good rep! Try sinking slightly deeper';
      }
      this.stage = 'UP';
      this.minKneeAngle = 180;
    } else if (avgKneeAngle <= 90) {
      this.stage = 'BOTTOM';
      isGoodDepth = true;
      feedbackMessage = 'Excellent depth! Drive up through your heels';
    } else if (avgKneeAngle < 150 && this.stage === 'UP') {
      this.stage = 'DESCENDING';
      feedbackMessage = 'Lower hips down smoothly';
    } else if (avgKneeAngle > this.minKneeAngle + 10 && (this.stage === 'BOTTOM' || this.stage === 'DESCENDING')) {
      this.stage = 'ASCENDING';
      feedbackMessage = 'Drive upwards to starting position';
    }

    if (symmetryScore < 70) {
      feedbackMessage = 'Balance weight evenly between both legs';
    }

    return {
      stage: this.stage,
      repCount: this.repCount,
      kneeAngle: avgKneeAngle,
      hipAngle: Math.round(leftHip),
      isGoodDepth,
      feedbackMessage,
      formScore: currentRepScore,
      symmetryScore,
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
