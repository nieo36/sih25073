/**
 * Basketball — Shooting Form Analyzer
 * Evaluates shooting mechanics: elbow angle under ball (~90°),
 * wrist snap at release, shooting platform alignment,
 * and hip-shoulder-elbow vertical stack.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type ShootingStage = 'SET_POSITION' | 'LOADING' | 'RELEASE' | 'FOLLOW_THROUGH';

export interface ShootingFormFeedback {
  detected: boolean;
  stage: ShootingStage;
  shotCount: number;
  shootingElbowAngle: number;
  wristSnapScore: number;
  platformAlignmentScore: number;
  elbowTuckScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodShot: boolean;
}

export class ShootingFormAnalyzer {
  private stage: ShootingStage = 'SET_POSITION';
  private shotCount = 0;
  private smootherShootingElbow = new AngleSmoother(0.35);
  private smootherKnee = new AngleSmoother(0.4);
  private formScores: number[] = [];

  // Track wrist vertical movement for snap detection
  private minElbowAngle = 180;
  private maxWristLift = 0;

  public process(landmarks: NormalizedLandmark[]): ShootingFormFeedback {
    // Try right-handed first, then left
    const rightVisible = areLandmarksVisible(landmarks, [
      PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.RIGHT_WRIST, PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE,
    ], 0.4);
    const leftVisible = areLandmarksVisible(landmarks, [
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW,
      PoseLandmark.LEFT_WRIST, PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE,
    ], 0.4);

    if (!rightVisible && !leftVisible) {
      return this.noDetection('No athlete detected. Stand facing camera with shooting arm visible.');
    }

    // Use the more visible arm as shooting arm
    const useRight = rightVisible;
    const shoulderIdx = useRight ? PoseLandmark.RIGHT_SHOULDER : PoseLandmark.LEFT_SHOULDER;
    const elbowIdx = useRight ? PoseLandmark.RIGHT_ELBOW : PoseLandmark.LEFT_ELBOW;
    const wristIdx = useRight ? PoseLandmark.RIGHT_WRIST : PoseLandmark.LEFT_WRIST;
    const hipIdx = useRight ? PoseLandmark.RIGHT_HIP : PoseLandmark.LEFT_HIP;
    const kneeIdx = useRight ? PoseLandmark.RIGHT_KNEE : PoseLandmark.LEFT_KNEE;

    const shoulder = landmarks[shoulderIdx];
    const elbow = landmarks[elbowIdx];
    const wrist = landmarks[wristIdx];
    const hip = landmarks[hipIdx];
    const knee = landmarks[kneeIdx];

    const shootingElbow = this.smootherShootingElbow.update(
      calculateAngle(shoulder, elbow, wrist)
    );
    const kneeAngle = this.smootherKnee.update(
      calculateAngle(hip, knee, landmarks[useRight ? PoseLandmark.RIGHT_ANKLE : PoseLandmark.LEFT_ANKLE])
    );

    if (shootingElbow < this.minElbowAngle) this.minElbowAngle = shootingElbow;

    // Wrist lift — higher wrist above elbow = snap occurring
    const wristAboveElbow = elbow.y - wrist.y; // positive when wrist is above elbow
    if (wristAboveElbow > this.maxWristLift) this.maxWristLift = wristAboveElbow;

    // Elbow alignment: elbow should be below/behind wrist at release (not flared out)
    const elbowLateralOffset = Math.abs(elbow.x - shoulder.x);
    const elbowTuckScore = Math.max(0, Math.round(100 - elbowLateralOffset * 300));

    // Platform alignment: hip-shoulder-elbow in vertical stack
    const hipElbowXDiff = Math.abs(elbow.x - hip.x);
    const platformAlignmentScore = Math.max(0, Math.round(100 - hipElbowXDiff * 200));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Hold ball at set point — elbow under ball at 90°.';
    let isGoodShot = false;

    // State machine
    switch (this.stage) {
      case 'SET_POSITION':
        feedbackMessage = 'Set position — feet shoulder-width, dominant foot slightly forward.';
        if (kneeAngle < 150 && shootingElbow < 140) {
          this.stage = 'LOADING';
          feedbackMessage = 'Loading... bend knees and cock shooting arm.';
        }
        break;

      case 'LOADING':
        feedbackMessage = 'Load — elbow under ball, eyes on target!';
        if (shootingElbow < 100) {
          feedbackMessage = 'Elbow nicely under ball! Explode upward on release!';
        }
        if (kneeAngle > 155 && this.minElbowAngle < 120) {
          this.stage = 'RELEASE';
          feedbackMessage = 'Release! Flick wrist and extend arm fully!';
        }
        break;

      case 'RELEASE':
        feedbackMessage = 'Release phase — snap wrist toward target!';
        if (wristAboveElbow > 0.05) {
          this.stage = 'FOLLOW_THROUGH';
          this.shotCount++;

          const elbowScore = Math.max(0, 100 - Math.abs(this.minElbowAngle - 90) * 1.5);
          const wristScore = Math.min(100, this.maxWristLift * 600);
          const formScore = Math.round(elbowScore * 0.4 + wristScore * 0.3 + platformAlignmentScore * 0.3);
          this.formScores.push(formScore);

          isGoodShot = formScore >= 70;
          feedbackMessage = isGoodShot
            ? 'Beautiful shot! Perfect elbow angle and wrist snap!'
            : 'Shot counted. Work on elbow alignment — keep it under the ball.';
        }
        break;

      case 'FOLLOW_THROUGH':
        feedbackMessage = 'Hold follow-through — hand in the cookie jar!';
        if (shootingElbow > 150 && wristAboveElbow < 0.02) {
          this.stage = 'SET_POSITION';
          this.minElbowAngle = 180;
          this.maxWristLift = 0;
        }
        break;
    }

    // Specific feedback overrides
    if (this.stage === 'LOADING' || this.stage === 'RELEASE') {
      if (shootingElbow < 70) {
        currentWarnings.push('Elbow too tucked — ball behind ear');
        feedbackMessage = 'Bring ball forward — elbow should be under ball, not behind head.';
      }
      if (elbowTuckScore < 50) {
        currentWarnings.push('Elbow flaring out — keep elbow in');
        feedbackMessage = 'Elbow flaring out — point it toward the basket!';
      }
      if (platformAlignmentScore < 50) {
        currentWarnings.push('Hip-shoulder-elbow misalignment');
      }
    }

    // Wrist snap score
    const wristSnapScore = Math.min(100, Math.round(this.maxWristLift * 600));

    const overallFormScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : Math.round(elbowTuckScore * 0.4 + platformAlignmentScore * 0.4 + wristSnapScore * 0.2);

    return {
      detected: true,
      stage: this.stage,
      shotCount: this.shotCount,
      shootingElbowAngle: Math.round(shootingElbow),
      wristSnapScore,
      platformAlignmentScore,
      elbowTuckScore,
      formScore: overallFormScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodShot,
    };
  }

  private noDetection(msg: string): ShootingFormFeedback {
    return {
      detected: false, stage: this.stage, shotCount: this.shotCount,
      shootingElbowAngle: 0, wristSnapScore: 0, platformAlignmentScore: 0,
      elbowTuckScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodShot: false,
    };
  }

  public reset(): void {
    this.stage = 'SET_POSITION';
    this.shotCount = 0;
    this.formScores = [];
    this.minElbowAngle = 180;
    this.maxWristLift = 0;
    this.smootherShootingElbow.reset();
    this.smootherKnee.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
