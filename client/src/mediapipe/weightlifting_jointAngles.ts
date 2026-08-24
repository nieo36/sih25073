/**
 * Weightlifting — Joint Angles Analyzer
 * Comprehensive real-time multi-joint angle tracker.
 * Outputs all key joint angles simultaneously every frame:
 * hip, knee, shoulder, elbow, trunk lean, ankle.
 * Useful as a general overlay display and for compound lift coaching.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export interface JointAngles {
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  leftElbow: number;
  rightElbow: number;
  leftShoulder: number;
  rightShoulder: number;
  trunkLean: number;    // Degrees forward lean from vertical
  hipSymmetry: number;  // Difference between left/right hip
  kneeSymmetry: number;
}

export interface JointAnglesFeedback {
  detected: boolean;
  joints: JointAngles;
  primaryFocusJoint: string;
  criticalWarning: string | null;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
}

export class JointAnglesAnalyzer {
  private smootherLeftHip = new AngleSmoother(0.35);
  private smootherRightHip = new AngleSmoother(0.35);
  private smootherLeftKnee = new AngleSmoother(0.35);
  private smootherRightKnee = new AngleSmoother(0.35);
  private smootherLeftElbow = new AngleSmoother(0.35);
  private smootherRightElbow = new AngleSmoother(0.35);
  private smootherLeftShoulder = new AngleSmoother(0.35);
  private smootherRightShoulder = new AngleSmoother(0.35);
  private frameCount = 0;
  private formScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): JointAnglesFeedback {
    const coreRequired = [
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, coreRequired, 0.35)) {
      return this.noDetection('No athlete detected. Ensure upper body is fully visible.');
    }

    this.frameCount++;

    const leftHip = this.smootherLeftHip.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE])
    );
    const rightHip = this.smootherRightHip.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE])
    );

    const leftKnee = this.smootherLeftKnee.update(
      areLandmarksVisible(landmarks, [PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE], 0.3)
        ? calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
        : 180
    );
    const rightKnee = this.smootherRightKnee.update(
      areLandmarksVisible(landmarks, [PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE], 0.3)
        ? calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
        : 180
    );

    const leftElbow = this.smootherLeftElbow.update(
      areLandmarksVisible(landmarks, [PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST], 0.3)
        ? calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_WRIST])
        : 180
    );
    const rightElbow = this.smootherRightElbow.update(
      areLandmarksVisible(landmarks, [PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST], 0.3)
        ? calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_ELBOW], landmarks[PoseLandmark.RIGHT_WRIST])
        : 180
    );

    const leftShoulder = this.smootherLeftShoulder.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_HIP])
    );
    const rightShoulder = this.smootherRightShoulder.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_ELBOW], landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_HIP])
    );

    // Trunk lean
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const shoulderMidY = (landmarks[PoseLandmark.LEFT_SHOULDER].y + landmarks[PoseLandmark.RIGHT_SHOULDER].y) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipMidY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;
    const trunkLean = Math.round(Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) * 180 / Math.PI));

    const joints: JointAngles = {
      leftHip: Math.round(leftHip),
      rightHip: Math.round(rightHip),
      leftKnee: Math.round(leftKnee),
      rightKnee: Math.round(rightKnee),
      leftElbow: Math.round(leftElbow),
      rightElbow: Math.round(rightElbow),
      leftShoulder: Math.round(leftShoulder),
      rightShoulder: Math.round(rightShoulder),
      trunkLean,
      hipSymmetry: Math.abs(Math.round(leftHip - rightHip)),
      kneeSymmetry: Math.abs(Math.round(leftKnee - rightKnee)),
    };

    const currentWarnings: string[] = [];
    let criticalWarning: string | null = null;
    let feedbackMessage = 'Monitoring joint angles in real-time.';
    let primaryFocusJoint = 'Overall';

    // Identify biggest imbalances
    if (joints.hipSymmetry > 20) {
      criticalWarning = `Hip asymmetry: L${joints.leftHip}° vs R${joints.rightHip}°`;
      feedbackMessage = `Hip angles uneven by ${joints.hipSymmetry}°! Check your foot placement and hip mobility.`;
      primaryFocusJoint = 'Hips';
      currentWarnings.push('Hip angle asymmetry detected');
    }

    if (joints.kneeSymmetry > 20) {
      const msg = `Knee angles uneven by ${joints.kneeSymmetry}° — check foot width and knee tracking`;
      if (!criticalWarning) { criticalWarning = msg; primaryFocusJoint = 'Knees'; }
      currentWarnings.push('Knee angle asymmetry detected');
      feedbackMessage = msg;
    }

    if (trunkLean > 50) {
      const msg = 'Excessive trunk lean — brace core and keep chest up';
      if (!criticalWarning) { criticalWarning = msg; primaryFocusJoint = 'Trunk'; }
      currentWarnings.push('Excessive forward lean');
      feedbackMessage = msg;
    }

    if (Math.abs(leftElbow - rightElbow) > 25 && leftElbow < 170 && rightElbow < 170) {
      currentWarnings.push('Elbow asymmetry — check grip and bar position');
      feedbackMessage = `Elbows uneven: L${joints.leftElbow}° vs R${joints.rightElbow}°. Adjust grip width.`;
      if (!criticalWarning) primaryFocusJoint = 'Elbows';
    }

    if (currentWarnings.length === 0) {
      feedbackMessage = `All joints aligned. Hip: ${joints.leftHip}°/${joints.rightHip}° — Knee: ${joints.leftKnee}°/${joints.rightKnee}°`;
      primaryFocusJoint = 'Overall';
    }

    // Form score: based on symmetry and trunk position
    const hipSymScore = Math.max(0, 100 - joints.hipSymmetry * 3);
    const kneeSymScore = Math.max(0, 100 - joints.kneeSymmetry * 3);
    const trunkScore = Math.max(0, 100 - Math.max(0, trunkLean - 20) * 2);
    const formScore = Math.round(hipSymScore * 0.35 + kneeSymScore * 0.35 + trunkScore * 0.3);

    this.formScores.push(formScore);
    if (this.formScores.length > 60) this.formScores.shift();

    return {
      detected: true,
      joints,
      primaryFocusJoint,
      criticalWarning,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
    };
  }

  private noDetection(msg: string): JointAnglesFeedback {
    return {
      detected: false,
      joints: {
        leftHip: 0, rightHip: 0, leftKnee: 0, rightKnee: 0,
        leftElbow: 0, rightElbow: 0, leftShoulder: 0, rightShoulder: 0,
        trunkLean: 0, hipSymmetry: 0, kneeSymmetry: 0,
      },
      primaryFocusJoint: 'None',
      criticalWarning: msg,
      formScore: 0,
      feedbackMessage: msg,
      warnings: [msg],
    };
  }

  public reset(): void {
    this.frameCount = 0;
    this.formScores = [];
    this.smootherLeftHip.reset();
    this.smootherRightHip.reset();
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
    this.smootherLeftShoulder.reset();
    this.smootherRightShoulder.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
