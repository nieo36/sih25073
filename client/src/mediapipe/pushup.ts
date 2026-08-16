import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type PushupStage = 'PLANK' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface PushupFeedback {
  stage: PushupStage;
  repCount: number;
  elbowAngle: number;
  bodyAlignmentAngle: number;
  isGoodAlignment: boolean;
  feedbackMessage: string;
  formScore: number;
  symmetryScore: number;
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
        stage: this.stage,
        repCount: this.repCount,
        elbowAngle: 180,
        bodyAlignmentAngle: 180,
        isGoodAlignment: false,
        feedbackMessage: 'Position side profile towards camera for pushup tracking',
        formScore: 0,
        symmetryScore: 100,
      };
    }

    // Elbow angle: Shoulder -> Elbow -> Wrist
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

    // Spine/Body Alignment: Shoulder -> Hip -> Ankle (ideally ~ 170-180 deg)
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

    const angleDiff = Math.abs(leftElbow - rightElbow);
    const symmetryScore = Math.max(0, Math.round(100 - angleDiff * 3));

    // Pushup state machine
    if (elbowAngle > 155) {
      if (this.stage === 'ASCENDING' || (this.stage === 'BOTTOM' && this.minElbowAngle <= 105)) {
        this.repCount++;
        const depthBonus = this.minElbowAngle <= 90 ? 100 : Math.max(50, 100 - (this.minElbowAngle - 90) * 2);
        const alignmentPenalty = isGoodAlignment ? 0 : 25;
        currentRepScore = Math.max(10, Math.round((depthBonus + symmetryScore) / 2 - alignmentPenalty));
        this.repScores.push(currentRepScore);
        feedbackMessage = isGoodAlignment ? 'Crisp pushup form!' : 'Rep counted, but keep your hips from sagging!';
      }
      this.stage = 'PLANK';
      this.minElbowAngle = 180;
    } else if (elbowAngle <= 90) {
      this.stage = 'BOTTOM';
      feedbackMessage = 'Great chest depth! Push the floor away';
    } else if (elbowAngle < 145 && this.stage === 'PLANK') {
      this.stage = 'DESCENDING';
      feedbackMessage = 'Lower chest with controlled tempo';
    } else if (elbowAngle > this.minElbowAngle + 12 && (this.stage === 'BOTTOM' || this.stage === 'DESCENDING')) {
      this.stage = 'ASCENDING';
      feedbackMessage = 'Press back up to lock out';
    }

    if (!isGoodAlignment) {
      feedbackMessage = bodyAlignment < 155 ? 'Do not let your hips sag!' : 'Keep your hips down in plank line!';
    }

    return {
      stage: this.stage,
      repCount: this.repCount,
      elbowAngle,
      bodyAlignmentAngle: Math.round(bodyAlignment),
      isGoodAlignment,
      feedbackMessage,
      formScore: currentRepScore,
      symmetryScore,
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
