/**
 * Boxing — Punch Speed Analyzer
 * Tracks wrist velocity per frame to estimate punch speed,
 * detects punch extension (elbow approaching straight),
 * retraction completeness, and gives coaching on faster snappy punches.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type PunchSpeedStage = 'GUARD' | 'EXTENDING' | 'EXTENDED' | 'RETRACTING';

export interface PunchSpeedFeedback {
  detected: boolean;
  stage: PunchSpeedStage;
  punchCount: number;
  activeSide: 'LEFT' | 'RIGHT';
  wristSpeed: number;           // Normalized units/frame
  extensionAngle: number;       // Elbow angle at extension
  retractionScore: number;      // How well they snap back to guard
  speedScore: number;           // 0-100
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodPunch: boolean;
}

export class PunchSpeedAnalyzer {
  private stage: PunchSpeedStage = 'GUARD';
  private punchCount = 0;
  private smootherLeftElbow = new AngleSmoother(0.25);
  private smootherRightElbow = new AngleSmoother(0.25);
  private formScores: number[] = [];

  private prevLeftWrist = { x: 0, y: 0 };
  private prevRightWrist = { x: 0, y: 0 };
  private leftWristSpeeds: number[] = [];
  private rightWristSpeeds: number[] = [];
  private activeSide: 'LEFT' | 'RIGHT' = 'RIGHT';
  private maxExtensionSpeed = 0;
  private maxElbowExtension = 0;
  private guardLeftElbow = 0;
  private guardRightElbow = 0;
  private guardCalibrated = false;
  private guardFrames = 0;

  public process(landmarks: NormalizedLandmark[]): PunchSpeedFeedback {
    const required = [
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_HIP,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Stand facing camera, boxing stance visible.');
    }

    const leftElbow = this.smootherLeftElbow.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_WRIST])
    );
    const rightElbow = this.smootherRightElbow.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_ELBOW], landmarks[PoseLandmark.RIGHT_WRIST])
    );

    // Wrist velocities
    const leftWrist = landmarks[PoseLandmark.LEFT_WRIST];
    const rightWrist = landmarks[PoseLandmark.RIGHT_WRIST];

    const leftSpeed = Math.sqrt(
      Math.pow(leftWrist.x - this.prevLeftWrist.x, 2) + Math.pow(leftWrist.y - this.prevLeftWrist.y, 2)
    ) * 60;
    const rightSpeed = Math.sqrt(
      Math.pow(rightWrist.x - this.prevRightWrist.x, 2) + Math.pow(rightWrist.y - this.prevRightWrist.y, 2)
    ) * 60;

    this.leftWristSpeeds.push(leftSpeed);
    this.rightWristSpeeds.push(rightSpeed);
    if (this.leftWristSpeeds.length > 5) { this.leftWristSpeeds.shift(); this.rightWristSpeeds.shift(); }

    this.prevLeftWrist = { x: leftWrist.x, y: leftWrist.y };
    this.prevRightWrist = { x: rightWrist.x, y: rightWrist.y };

    const avgLeftSpeed = this.leftWristSpeeds.reduce((a, b) => a + b, 0) / this.leftWristSpeeds.length;
    const avgRightSpeed = this.rightWristSpeeds.reduce((a, b) => a + b, 0) / this.rightWristSpeeds.length;

    // Determine active side by which is faster
    this.activeSide = avgLeftSpeed > avgRightSpeed ? 'LEFT' : 'RIGHT';
    const activeElbow = this.activeSide === 'LEFT' ? leftElbow : rightElbow;
    const activeSpeed = this.activeSide === 'LEFT' ? avgLeftSpeed : avgRightSpeed;

    // Guard calibration: first few frames with arms bent
    if (!this.guardCalibrated && leftElbow < 100 && rightElbow < 100) {
      this.guardFrames++;
      this.guardLeftElbow = leftElbow;
      this.guardRightElbow = rightElbow;
      if (this.guardFrames > 10) this.guardCalibrated = true;
    }

    // Track max speed and extension
    if (activeSpeed > this.maxExtensionSpeed) this.maxExtensionSpeed = activeSpeed;
    if (activeElbow > this.maxElbowExtension) this.maxElbowExtension = activeElbow;

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Assume guard position. Throw punches sharply at the camera.';
    let isGoodPunch = false;

    // State machine
    switch (this.stage) {
      case 'GUARD':
        feedbackMessage = 'Good guard. Throw a jab or cross — explode with your whole body!';
        if (activeElbow > 130 && activeSpeed > 0.015) {
          this.stage = 'EXTENDING';
          this.maxExtensionSpeed = activeSpeed;
        }
        break;

      case 'EXTENDING':
        feedbackMessage = 'Punch extending — keep it snappy! Twist your fist at contact.';
        if (activeElbow > 155) {
          this.stage = 'EXTENDED';
          feedbackMessage = 'Full extension reached! Snap back to guard!';
        }
        if (activeSpeed < 0.005 && activeElbow > 140) {
          // Stalled extension = slow punch
          currentWarnings.push('Punch too slow — lack of explosive power');
          feedbackMessage = 'Punch is too slow! Explode from your shoulder — flick that fist!';
        }
        break;

      case 'EXTENDED':
        feedbackMessage = 'Retract fast — return to guard position immediately!';
        if (activeElbow < 120) {
          this.stage = 'RETRACTING';
        }
        break;

      case 'RETRACTING':
        feedbackMessage = 'Retracting to guard — snap back as fast as you threw!';
        const guardAngle = this.activeSide === 'LEFT' ? this.guardLeftElbow : this.guardRightElbow;
        const retractionScore = Math.min(100, Math.max(0, Math.round(100 - Math.abs(activeElbow - guardAngle) * 2)));
        if (activeElbow < 100 || !this.guardCalibrated) {
          this.punchCount++;
          const speedScore = Math.min(100, Math.round(this.maxExtensionSpeed * 800));
          const extensionBonus = this.maxElbowExtension > 155 ? 100 : Math.round(this.maxElbowExtension * 0.65);
          const formScore = Math.round(speedScore * 0.5 + extensionBonus * 0.3 + retractionScore * 0.2);
          this.formScores.push(formScore);
          isGoodPunch = formScore >= 65;
          feedbackMessage = isGoodPunch
            ? `${this.activeSide} punch sharp! Speed: ${Math.round(this.maxExtensionSpeed * 1000)} units. Stay consistent!`
            : 'Punch counted. Focus on snapping through contact faster!';
          this.stage = 'GUARD';
          this.maxExtensionSpeed = 0;
          this.maxElbowExtension = 0;
        }
        break;
    }

    const speedScore = Math.min(100, Math.round(activeSpeed * 800));
    const retractionScore = this.stage === 'GUARD' ? 85 : Math.min(100, Math.round(100 - Math.abs(activeElbow - 90) * 0.5));
    const formScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : 70;

    return {
      detected: true,
      stage: this.stage,
      punchCount: this.punchCount,
      activeSide: this.activeSide,
      wristSpeed: Math.round(activeSpeed * 1000) / 1000,
      extensionAngle: Math.round(activeElbow),
      retractionScore,
      speedScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodPunch,
    };
  }

  private noDetection(msg: string): PunchSpeedFeedback {
    return {
      detected: false, stage: this.stage, punchCount: this.punchCount,
      activeSide: this.activeSide, wristSpeed: 0, extensionAngle: 0,
      retractionScore: 0, speedScore: 0, formScore: 0,
      feedbackMessage: msg, warnings: [msg], isGoodPunch: false,
    };
  }

  public reset(): void {
    this.stage = 'GUARD';
    this.punchCount = 0;
    this.formScores = [];
    this.maxExtensionSpeed = 0;
    this.maxElbowExtension = 0;
    this.guardCalibrated = false;
    this.guardFrames = 0;
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
