/**
 * Basketball — Vertical Jump Analyzer
 * Tracks knee/hip angles during takeoff loading and landing phases.
 * Evaluates jump prep depth, explosion power, and landing mechanics.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type VerticalJumpStage = 'STANDING' | 'LOADING' | 'AIRBORNE' | 'LANDING';

export interface VerticalJumpFeedback {
  detected: boolean;
  stage: VerticalJumpStage;
  repCount: number;
  kneeAngle: number;
  hipAngle: number;
  loadDepthPercent: number;
  symmetryScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodRep: boolean;
}

export class VerticalJumpAnalyzer {
  private stage: VerticalJumpStage = 'STANDING';
  private repCount = 0;
  private minKneeAngle = 180;
  private smootherLeftKnee = new AngleSmoother(0.35);
  private smootherRightKnee = new AngleSmoother(0.35);
  private smootherLeftHip = new AngleSmoother(0.35);
  private smootherRightHip = new AngleSmoother(0.35);
  private repScores: number[] = [];
  private loadKneeAngle = 180;
  private airborneFrames = 0;

  public process(landmarks: NormalizedLandmark[]): VerticalJumpFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.4)) {
      return this.noDetection('No athlete detected. Step back so full body is visible from side.');
    }

    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    const leftHip = this.smootherLeftHip.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE])
    );
    const rightHip = this.smootherRightHip.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE])
    );
    const avgHip = Math.round((leftHip + rightHip) / 2);

    if (avgKnee < this.minKneeAngle) this.minKneeAngle = avgKnee;

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Stand tall. Bend knees to load for jump.';
    let isGoodRep = false;
    let formScore = 80;

    const symmetryScore = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 3));
    if (symmetryScore < 70) currentWarnings.push('Uneven leg loading — balance both feet');

    // State machine
    switch (this.stage) {
      case 'STANDING':
        feedbackMessage = 'Ready position — feet shoulder-width apart, knees soft.';
        if (avgKnee < 145) {
          this.stage = 'LOADING';
          this.loadKneeAngle = avgKnee;
          feedbackMessage = 'Good loading position! Explode upward!';
        }
        break;

      case 'LOADING':
        feedbackMessage = 'Bend deeper and drive up explosively!';
        if (avgKnee < 110) {
          feedbackMessage = 'Excellent deep load! Push through the floor now!';
          this.loadKneeAngle = avgKnee;
        }
        if (avgKnee > 160 && this.minKneeAngle < 140) {
          // Transition — either jumping or standing up
          this.stage = 'AIRBORNE';
          this.airborneFrames = 0;
          feedbackMessage = 'Exploding upward — fully extend hips and knees!';
        }
        break;

      case 'AIRBORNE':
        this.airborneFrames++;
        feedbackMessage = 'In the air! Prepare for soft landing — knees bent!';
        if (avgKnee < 150 && this.airborneFrames > 3) {
          this.stage = 'LANDING';
          feedbackMessage = 'Land softly! Absorb impact with bent knees!';
        }
        if (this.airborneFrames > 30) {
          // Timeout — reset
          this.stage = 'STANDING';
          this.minKneeAngle = 180;
        }
        break;

      case 'LANDING':
        feedbackMessage = 'Soft landing! Absorb through hips and knees. Reset.';
        if (this.minKneeAngle <= 140) {
          // Valid jump counted
          this.repCount++;
          const loadScore = this.loadKneeAngle <= 110 ? 100 : Math.max(50, 100 - (this.loadKneeAngle - 110) * 2);
          formScore = Math.round((loadScore + symmetryScore) / 2);
          this.repScores.push(formScore);
          isGoodRep = formScore >= 70;
          feedbackMessage = isGoodRep
            ? 'Excellent jump! Great depth and symmetry!'
            : 'Jump counted. Load deeper next time — aim for 90° knee bend.';
        }
        if (avgKnee > 155) {
          this.stage = 'STANDING';
          this.minKneeAngle = 180;
          this.airborneFrames = 0;
        }
        break;
    }

    if (avgHip < 80) currentWarnings.push('Forward trunk lean — keep chest up');

    const loadDepthPercent = Math.min(100, Math.max(0, Math.round(((180 - this.minKneeAngle) / 90) * 100)));

    return {
      detected: true,
      stage: this.stage,
      repCount: this.repCount,
      kneeAngle: avgKnee,
      hipAngle: avgHip,
      loadDepthPercent,
      symmetryScore,
      formScore: this.repScores.length > 0 ? Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length) : 80,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  private noDetection(msg: string): VerticalJumpFeedback {
    return {
      detected: false, stage: this.stage, repCount: this.repCount,
      kneeAngle: 0, hipAngle: 0, loadDepthPercent: 0, symmetryScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodRep: false,
    };
  }

  public reset(): void {
    this.stage = 'STANDING';
    this.repCount = 0;
    this.minKneeAngle = 180;
    this.repScores = [];
    this.airborneFrames = 0;
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
    this.smootherLeftHip.reset();
    this.smootherRightHip.reset();
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    return Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length);
  }
}
