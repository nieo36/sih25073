import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type PushupStage = 'PLANK' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface PushupFeedback {
  detected: boolean;
  stage: PushupStage;
  repCount: number;
  elbowAngle: number;
  bodyAlignmentAngle: number;
  romPercent: number;
  stabilityScore: number;
  tempoScore: number;
  consistencyScore: number;
  isGoodAlignment: boolean;
  feedbackMessage: string;
  formScore: number;
  symmetryScore: number;
  warnings: string[];
  isGoodRep: boolean;
}

export class PushupAnalyzer {
  private stage: PushupStage = 'PLANK';
  private repCount = 0;
  private minElbowAngle = 180;
  private smootherLeftElbow = new AngleSmoother(0.4);
  private smootherRightElbow = new AngleSmoother(0.4);
  private repScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): PushupFeedback {
    const requiredLandmarks = [
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.LEFT_WRIST,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.LEFT_ANKLE,
    ];

    if (!areLandmarksVisible(landmarks, requiredLandmarks, 0.4)) {
      return {
        detected: false,
        stage: this.stage,
        repCount: this.repCount,
        elbowAngle: 0,
        bodyAlignmentAngle: 0,
        romPercent: 0,
        stabilityScore: 0,
        tempoScore: 0,
        consistencyScore: 0,
        isGoodAlignment: false,
        feedbackMessage: 'No athlete detected in camera frame. Position side profile towards camera.',
        formScore: 0,
        symmetryScore: 0,
        warnings: ['No athlete detected in camera frame'],
        isGoodRep: false,
      };
    }

    const leftElbowRaw = calculateAngle(
      landmarks[PoseLandmark.LEFT_SHOULDER],
      landmarks[PoseLandmark.LEFT_ELBOW],
      landmarks[PoseLandmark.LEFT_WRIST]
    );

    const rightElbowRaw = calculateAngle(
      landmarks[PoseLandmark.RIGHT_SHOULDER],
      landmarks[PoseLandmark.RIGHT_ELBOW],
      landmarks[PoseLandmark.RIGHT_WRIST]
    );

    const leftElbow = this.smootherLeftElbow.update(leftElbowRaw);
    const rightElbow = this.smootherRightElbow.update(rightElbowRaw);
    const elbowAngle = Math.round((leftElbow + rightElbow) / 2);

    const bodyAlignment = calculateAngle(
      landmarks[PoseLandmark.LEFT_SHOULDER],
      landmarks[PoseLandmark.LEFT_HIP],
      landmarks[PoseLandmark.LEFT_ANKLE]
    );

    const isGoodAlignment = bodyAlignment >= 155 && bodyAlignment <= 195;

    if (elbowAngle < this.minElbowAngle) {
      this.minElbowAngle = elbowAngle;
    }

    let feedbackMessage = 'Hold a straight plank core line';
    let currentRepScore = 85;
    let isGoodRep = false;
    const currentWarnings: string[] = [];

    const angleDiff = Math.abs(leftElbow - rightElbow);
    const symmetryScore = Math.max(0, Math.round(100 - angleDiff * 3.5));

    if (bodyAlignment < 155) {
      currentWarnings.push('Hips sagging');
    } else if (bodyAlignment > 195) {
      currentWarnings.push('Hips too high');
    }

    if (elbowAngle > 155) {
      if (this.stage === 'ASCENDING' || (this.stage === 'BOTTOM' && this.minElbowAngle <= 105)) {
        this.repCount++;
        const depthBonus = this.minElbowAngle <= 90 ? 100 : Math.max(50, 100 - (this.minElbowAngle - 90) * 2.5);
        const alignmentPenalty = isGoodAlignment ? 0 : 25;
        currentRepScore = Math.max(10, Math.round((depthBonus + symmetryScore) / 2 - alignmentPenalty));
        this.repScores.push(currentRepScore);

        if (this.minElbowAngle > 90) {
          currentWarnings.push('Insufficient depth');
        }

        if (isGoodAlignment && this.minElbowAngle <= 90) {
          isGoodRep = true;
          feedbackMessage = 'Crisp pushup form!';
        } else {
          feedbackMessage = isGoodAlignment ? 'Rep counted, but lower chest down to 90°!' : 'Rep counted, but keep your hips from sagging!';
        }
      }
      this.stage = 'PLANK';
      this.minElbowAngle = 180;
    } else if (elbowAngle <= 90) {
      this.stage = 'BOTTOM';
      feedbackMessage = 'Great chest depth! Push the floor away';
    } else if (elbowAngle < 145 && this.stage === 'PLANK') {
      this.stage = 'DESCENDING';
      feedbackMessage = 'Lower chest with controlled tempo...';
    } else if (elbowAngle > this.minElbowAngle + 12 && (this.stage === 'BOTTOM' || this.stage === 'DESCENDING')) {
      this.stage = 'ASCENDING';
      feedbackMessage = 'Press back up to lock out plank...';
    }

    if (!isGoodAlignment) {
      feedbackMessage = bodyAlignment < 155 ? 'Do not let your hips sag!' : 'Keep your hips down in plank line!';
    }

    const romPercent = Math.min(100, Math.max(0, Math.round(((165 - (this.minElbowAngle === 180 ? elbowAngle : this.minElbowAngle)) / 85) * 100)));
    const stabilityScore = isGoodAlignment ? 92 : 65;
    const tempoScore = 85;
    const consistencyScore = 88;

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      elbowAngle,
      bodyAlignmentAngle: Math.round(bodyAlignment),
      romPercent,
      stabilityScore,
      tempoScore,
      consistencyScore,
      isGoodAlignment,
      feedbackMessage,
      formScore: currentRepScore,
      symmetryScore,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  public reset(): void {
    this.stage = 'PLANK';
    this.repCount = 0;
    this.minElbowAngle = 180;
    this.repScores = [];
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    const sum = this.repScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.repScores.length);
  }
}
