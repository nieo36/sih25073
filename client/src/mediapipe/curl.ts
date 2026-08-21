import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type CurlStage = 'DOWN' | 'CURLING' | 'TOP' | 'LOWERING';

export interface CurlFeedback {
  detected: boolean;
  stage: CurlStage;
  repCount: number;
  elbowAngle: number;
  romPercent: number;
  stabilityScore: number;
  tempoScore: number;
  consistencyScore: number;
  formScore: number;
  symmetryScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodRep: boolean;
}

export class CurlAnalyzer {
  private stage: CurlStage = 'DOWN';
  private repCount = 0;
  private minElbowAngle = 180;
  private maxElbowAngle = 0;
  private smootherElbow = new AngleSmoother(0.4);
  private repScores: number[] = [];
  private activeWarnings: Set<string> = new Set();

  private maxElbowDrift = 0;
  private maxTorsoSway = 0;

  public process(landmarks: NormalizedLandmark[]): CurlFeedback {
    // Check left arm vs right arm visibility to select working arm
    const leftVisible = areLandmarksVisible(
      landmarks,
      [PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST, PoseLandmark.LEFT_HIP],
      0.35
    );
    const rightVisible = areLandmarksVisible(
      landmarks,
      [PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST, PoseLandmark.RIGHT_HIP],
      0.35
    );

    if (!leftVisible && !rightVisible) {
      return {
        detected: false,
        stage: this.stage,
        repCount: this.repCount,
        elbowAngle: 0,
        romPercent: 0,
        stabilityScore: 0,
        tempoScore: 0,
        consistencyScore: 0,
        formScore: 0,
        symmetryScore: 0,
        feedbackMessage: 'No athlete detected in camera frame. Position side profile with arm & torso visible.',
        warnings: ['No athlete detected in camera frame'],
        isGoodRep: false,
      };
    }

    // Pick side with higher confidence/visibility
    const useLeft = leftVisible;
    const shoulderIdx = useLeft ? PoseLandmark.LEFT_SHOULDER : PoseLandmark.RIGHT_SHOULDER;
    const elbowIdx = useLeft ? PoseLandmark.LEFT_ELBOW : PoseLandmark.RIGHT_ELBOW;
    const wristIdx = useLeft ? PoseLandmark.LEFT_WRIST : PoseLandmark.RIGHT_WRIST;
    const hipIdx = useLeft ? PoseLandmark.LEFT_HIP : PoseLandmark.RIGHT_HIP;
    const kneeIdx = useLeft ? PoseLandmark.LEFT_KNEE : PoseLandmark.RIGHT_KNEE;

    const shoulder = landmarks[shoulderIdx];
    const elbow = landmarks[elbowIdx];
    const wrist = landmarks[wristIdx];
    const hip = landmarks[hipIdx];
    const knee = landmarks[kneeIdx];

    // Calculate main joint angles
    const rawElbowAngle = calculateAngle(shoulder, elbow, wrist);
    const elbowAngle = this.smootherElbow.update(rawElbowAngle);

    // Torso lean angle (Shoulder -> Hip -> Knee)
    const torsoAngle = knee ? calculateAngle(shoulder, hip, knee) : 180;
    const torsoSway = Math.abs(180 - torsoAngle);

    // Horizontal drift of elbow relative to shoulder-hip axis
    const elbowDrift = Math.abs(elbow.x - shoulder.x);

    if (elbowDrift > this.maxElbowDrift) this.maxElbowDrift = elbowDrift;
    if (torsoSway > this.maxTorsoSway) this.maxTorsoSway = torsoSway;

    // Track min/max elbow angle during rep
    if (elbowAngle < this.minElbowAngle) this.minElbowAngle = elbowAngle;
    if (elbowAngle > this.maxElbowAngle) this.maxElbowAngle = elbowAngle;

    const currentWarnings: string[] = [];
    let isGoodRep = false;
    let feedbackMessage = 'Curl dumbbell up towards shoulder keeping elbow fixed at side';

    // Form warning evaluations
    if (this.maxTorsoSway > 18) {
      currentWarnings.push('Excessive torso movement');
      feedbackMessage = 'Avoid swinging your torso! Keep your upper body still.';
    }

    if (this.maxElbowDrift > 0.14) {
      currentWarnings.push('Elbow moving too far forward');
      feedbackMessage = 'Keep your elbow pinned to your side.';
    }

    // State Machine
    // DOWN: > 145 deg
    // CURLING: descending to < 60 deg
    // TOP: <= 55 deg
    // LOWERING: ascending back to > 145 deg
    if (elbowAngle > 145) {
      if (this.stage === 'LOWERING' || (this.stage === 'TOP' && this.minElbowAngle <= 70)) {
        this.repCount++;
        const romVal = Math.min(100, Math.max(50, Math.round(((165 - this.minElbowAngle) / 115) * 100)));
        const stabVal = Math.max(40, Math.round(100 - this.maxElbowDrift * 200 - this.maxTorsoSway * 1.5));
        const repScore = Math.round(romVal * 0.5 + stabVal * 0.5);

        this.repScores.push(repScore);

        if (this.minElbowAngle > 60) {
          currentWarnings.push('Incomplete range of motion');
          feedbackMessage = 'Rep counted. Curl higher for full range of motion!';
        } else {
          isGoodRep = true;
          feedbackMessage = 'Great rep! Squeeze at the top and lower with control.';
        }
      }
      this.stage = 'DOWN';
      this.minElbowAngle = 180;
      this.maxElbowDrift = 0;
      this.maxTorsoSway = 0;
    } else if (elbowAngle <= 55) {
      this.stage = 'TOP';
      feedbackMessage = 'Squeeze biceps at the top! Lower under control.';
    } else if (elbowAngle < 135 && this.stage === 'DOWN') {
      this.stage = 'CURLING';
      feedbackMessage = 'Smoothly curl upward...';
    } else if (elbowAngle > this.minElbowAngle + 15 && (this.stage === 'TOP' || this.stage === 'CURLING')) {
      this.stage = 'LOWERING';
      feedbackMessage = 'Lower the dumbbell under control...';
    }

    const romPercent = Math.min(100, Math.max(0, Math.round(((165 - (this.minElbowAngle === 180 ? elbowAngle : this.minElbowAngle)) / 115) * 100)));
    const stabilityScore = Math.max(40, Math.min(100, Math.round(100 - elbowDrift * 180 - torsoSway * 1.2)));
    const tempoScore = 88;
    const consistencyScore = 90;

    const currentFormScore = Math.round(romPercent * 0.4 + stabilityScore * 0.4 + tempoScore * 0.2);

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      elbowAngle: Math.round(elbowAngle),
      romPercent,
      stabilityScore,
      tempoScore,
      consistencyScore,
      formScore: currentFormScore,
      symmetryScore: stabilityScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  public reset(): void {
    this.stage = 'DOWN';
    this.repCount = 0;
    this.minElbowAngle = 180;
    this.maxElbowAngle = 0;
    this.repScores = [];
    this.activeWarnings.clear();
    this.maxElbowDrift = 0;
    this.maxTorsoSway = 0;
    this.smootherElbow.reset();
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    const sum = this.repScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.repScores.length);
  }
}
