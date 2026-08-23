/**
 * Basketball — Sprint Analyzer
 * Evaluates sprint mechanics: knee drive, arm swing, forward lean,
 * and bilateral stride symmetry using MediaPipe pose landmarks.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type SprintStage = 'IDLE' | 'ACCELERATING' | 'TOP_SPEED' | 'DECELERATING';

export interface SprintFeedback {
  detected: boolean;
  stage: SprintStage;
  strideCount: number;
  leftKneeAngle: number;
  rightKneeAngle: number;
  armDriveScore: number;
  forwardLeanAngle: number;
  strideSymmetry: number;
  cadenceScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodStride: boolean;
}

export class SprintAnalyzer {
  private stage: SprintStage = 'IDLE';
  private strideCount = 0;
  private smootherLeftKnee = new AngleSmoother(0.3);
  private smootherRightKnee = new AngleSmoother(0.3);
  private smootherLeftElbow = new AngleSmoother(0.3);
  private smootherRightElbow = new AngleSmoother(0.3);
  private formScores: number[] = [];

  // Stride detection
  private leftKneeWasHigh = false;
  private rightKneeWasHigh = false;
  private lastStrideTime = 0;
  private strideIntervals: number[] = [];
  private speedHistory: number[] = [];
  private prevHipX = -1;

  public process(landmarks: NormalizedLandmark[]): SprintFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Position camera on the side to capture full running stride.');
    }

    // Knee angles
    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );

    // Arm angles
    const leftElbow = this.smootherLeftElbow.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_WRIST])
    );
    const rightElbow = this.smootherRightElbow.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_ELBOW], landmarks[PoseLandmark.RIGHT_WRIST])
    );

    // Forward lean: shoulder relative to hip (vertical angle)
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const shoulderMidY = (landmarks[PoseLandmark.LEFT_SHOULDER].y + landmarks[PoseLandmark.RIGHT_SHOULDER].y) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipMidY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;
    const leanAngle = Math.round(Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) * 180 / Math.PI));

    // Lateral speed to estimate cadence stage
    let lateralSpeed = 0;
    if (this.prevHipX >= 0) {
      lateralSpeed = Math.abs(hipMidX - this.prevHipX) * 60;
    }
    this.speedHistory.push(lateralSpeed);
    if (this.speedHistory.length > 20) this.speedHistory.shift();
    const avgSpeed = this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;
    this.prevHipX = hipMidX;

    // Stride detection via knee drive alternation
    const now = performance.now();
    const leftKneeHigh = leftKnee < 90; // Knee sharply bent = high drive
    const rightKneeHigh = rightKnee < 90;

    if (leftKneeHigh && !this.leftKneeWasHigh) {
      // Left stride detected
      if (this.lastStrideTime > 0) {
        this.strideIntervals.push(now - this.lastStrideTime);
        if (this.strideIntervals.length > 10) this.strideIntervals.shift();
      }
      this.lastStrideTime = now;
      this.strideCount++;
    }
    if (rightKneeHigh && !this.rightKneeWasHigh) {
      if (this.lastStrideTime > 0) {
        this.strideIntervals.push(now - this.lastStrideTime);
        if (this.strideIntervals.length > 10) this.strideIntervals.shift();
      }
      this.lastStrideTime = now;
      this.strideCount++;
    }
    this.leftKneeWasHigh = leftKneeHigh;
    this.rightKneeWasHigh = rightKneeHigh;

    // Stage estimation
    if (avgSpeed < 0.002) this.stage = 'IDLE';
    else if (avgSpeed < 0.008) this.stage = 'ACCELERATING';
    else if (avgSpeed < 0.015) this.stage = 'TOP_SPEED';
    else this.stage = 'DECELERATING';

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Drive knees high and pump arms front to back!';
    let isGoodStride = false;

    // Arm drive: ideal ~90° elbow, pumping front-to-back
    const avgArmAngle = (leftElbow + rightElbow) / 2;
    const armDriveScore = Math.max(0, Math.round(100 - Math.abs(avgArmAngle - 90) * 1.5));
    if (avgArmAngle > 130) {
      currentWarnings.push('Arms too straight — pump elbows at 90°');
      feedbackMessage = 'Keep elbows at 90°! Pump arms aggressively front to back.';
    }

    // Forward lean: ideal 5-15° forward lean
    if (leanAngle < 3) {
      currentWarnings.push('Too upright — lean forward at hips');
      feedbackMessage = 'Lean forward slightly from the ankles — drive hips forward!';
    } else if (leanAngle > 20) {
      currentWarnings.push('Excessive forward lean — risk of tripping');
      feedbackMessage = 'Too much lean — stay controlled with slight forward drive.';
    }

    // Knee drive
    if (leftKnee > 130 && rightKnee > 130) {
      currentWarnings.push('Low knee drive — lift knees higher');
      feedbackMessage = 'Drive your knees higher on each stride for maximum power!';
    } else {
      isGoodStride = true;
    }

    const strideSymmetry = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 2));
    if (strideSymmetry < 70) {
      currentWarnings.push('Asymmetric stride — balance left/right knee drive');
    }

    // Cadence from stride interval
    const avgInterval = this.strideIntervals.length > 2
      ? this.strideIntervals.reduce((a, b) => a + b, 0) / this.strideIntervals.length
      : 400;
    const cadenceScore = Math.min(100, Math.max(0, Math.round(100 - Math.abs(avgInterval - 250) * 0.2)));

    const formScore = Math.round(armDriveScore * 0.3 + strideSymmetry * 0.4 + cadenceScore * 0.3);
    this.formScores.push(formScore);
    if (this.formScores.length > 50) this.formScores.shift();

    return {
      detected: true,
      stage: this.stage,
      strideCount: this.strideCount,
      leftKneeAngle: Math.round(leftKnee),
      rightKneeAngle: Math.round(rightKnee),
      armDriveScore,
      forwardLeanAngle: leanAngle,
      strideSymmetry,
      cadenceScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodStride,
    };
  }

  private noDetection(msg: string): SprintFeedback {
    return {
      detected: false, stage: this.stage, strideCount: this.strideCount,
      leftKneeAngle: 0, rightKneeAngle: 0, armDriveScore: 0,
      forwardLeanAngle: 0, strideSymmetry: 0, cadenceScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodStride: false,
    };
  }

  public reset(): void {
    this.stage = 'IDLE';
    this.strideCount = 0;
    this.formScores = [];
    this.leftKneeWasHigh = false;
    this.rightKneeWasHigh = false;
    this.lastStrideTime = 0;
    this.strideIntervals = [];
    this.speedHistory = [];
    this.prevHipX = -1;
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
