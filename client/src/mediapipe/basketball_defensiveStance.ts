/**
 * Basketball — Defensive Stance Analyzer
 * Evaluates the quality of a defensive stance:
 * knee bend (100-130° ideal), hip width vs shoulder width,
 * low center of gravity, arm reach, and torso positioning.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type DefensiveStanceStage = 'STANDING' | 'GOOD_STANCE' | 'ADJUSTING';

export interface DefensiveStanceFeedback {
  detected: boolean;
  stage: DefensiveStanceStage;
  kneeAngle: number;
  hipWidthRatio: number;    // hip width / shoulder width
  armReachScore: number;
  torsoAngle: number;
  depthScore: number;       // 0-100 how close to ideal knee angle
  stabilityScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodStance: boolean;
}

export class DefensiveStanceAnalyzer {
  private stage: DefensiveStanceStage = 'STANDING';
  private smootherLeftKnee = new AngleSmoother(0.35);
  private smootherRightKnee = new AngleSmoother(0.35);
  private goodStanceFrames = 0;
  private totalFrames = 0;
  private formScores: number[] = [];

  public process(landmarks: NormalizedLandmark[]): DefensiveStanceFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.4)) {
      return this.noDetection('No athlete detected. Step back and face camera directly. Show full body.');
    }

    this.totalFrames++;

    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    // Hip width vs shoulder width
    const hipWidth = Math.abs(landmarks[PoseLandmark.LEFT_HIP].x - landmarks[PoseLandmark.RIGHT_HIP].x);
    const shoulderWidth = Math.abs(landmarks[PoseLandmark.LEFT_SHOULDER].x - landmarks[PoseLandmark.RIGHT_SHOULDER].x);
    const hipWidthRatio = shoulderWidth > 0 ? Math.round((hipWidth / shoulderWidth) * 100) / 100 : 1;

    // Torso lean: shoulder midpoint vs hip midpoint
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const shoulderMidY = (landmarks[PoseLandmark.LEFT_SHOULDER].y + landmarks[PoseLandmark.RIGHT_SHOULDER].y) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipMidY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;
    const torsoAngle = Math.round(Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) * 180 / Math.PI));

    // Arm reach: wrists should be out from body, at least chest height
    const leftWristReach = Math.abs(landmarks[PoseLandmark.LEFT_WRIST].x - landmarks[PoseLandmark.LEFT_SHOULDER].x);
    const rightWristReach = Math.abs(landmarks[PoseLandmark.RIGHT_WRIST].x - landmarks[PoseLandmark.RIGHT_SHOULDER].x);
    const wristAboveShoulder = (landmarks[PoseLandmark.LEFT_SHOULDER].y - landmarks[PoseLandmark.LEFT_WRIST].y) +
                               (landmarks[PoseLandmark.RIGHT_SHOULDER].y - landmarks[PoseLandmark.RIGHT_WRIST].y);
    const armReachScore = Math.min(100, Math.max(0, Math.round((leftWristReach + rightWristReach) * 300 + wristAboveShoulder * 200)));

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Get into defensive stance — feet wide, knees bent, hands up!';
    let isGoodStance = false;

    // Knee angle analysis: ideal 100-130°
    let depthScore: number;
    if (avgKnee >= 100 && avgKnee <= 130) {
      depthScore = 100;
      feedbackMessage = 'Perfect defensive stance depth! Stay low and active.';
    } else if (avgKnee > 130 && avgKnee <= 150) {
      depthScore = Math.round(100 - (avgKnee - 130) * 3);
      feedbackMessage = 'Bend your knees more — get lower into stance!';
    } else if (avgKnee < 100) {
      depthScore = Math.round(100 - (100 - avgKnee) * 3);
      feedbackMessage = 'Too deep — straighten slightly to maintain mobility.';
      currentWarnings.push('Overly deep stance — too deep to react quickly');
    } else {
      depthScore = Math.max(0, Math.round(100 - (avgKnee - 150) * 4));
      feedbackMessage = 'Bend your knees! A straight-legged stance is easy to beat.';
      currentWarnings.push('Legs too straight — bend knees to 110-130°');
    }

    // Width check
    if (hipWidthRatio < 0.9) {
      currentWarnings.push('Feet too narrow — widen your stance');
      feedbackMessage = 'Widen your feet beyond shoulder-width for a solid defensive base!';
    } else if (hipWidthRatio > 1.5) {
      currentWarnings.push('Feet too wide — reduces lateral quickness');
      feedbackMessage = 'Slightly narrow your stance — too wide slows lateral movement.';
    }

    // Torso angle
    if (torsoAngle > 20) {
      currentWarnings.push('Excessive torso lean');
      feedbackMessage = 'Stay more upright — lean forward slightly, not excessively.';
    }

    // Arm position
    if (armReachScore < 30) {
      currentWarnings.push('Arms down — put your hands up!');
      feedbackMessage = 'Hands up! Extend arms out to challenge passes and shots.';
    }

    const symmetryScore = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 3));
    if (symmetryScore < 70) {
      currentWarnings.push('Weight unevenly distributed');
    }

    // Overall assessment
    if (depthScore >= 75 && armReachScore >= 40 && hipWidthRatio >= 0.9 && symmetryScore >= 70) {
      this.stage = 'GOOD_STANCE';
      isGoodStance = true;
      this.goodStanceFrames++;
      feedbackMessage = 'Excellent defensive stance! Stay active — move your feet!';
    } else if (currentWarnings.length > 0) {
      this.stage = 'ADJUSTING';
    } else {
      this.stage = 'STANDING';
    }

    const stabilityScore = symmetryScore;
    const formScore = Math.round(depthScore * 0.4 + armReachScore * 0.2 + stabilityScore * 0.3 + (hipWidthRatio >= 0.9 && hipWidthRatio <= 1.4 ? 100 : 50) * 0.1);
    this.formScores.push(formScore);
    if (this.formScores.length > 60) this.formScores.shift();

    return {
      detected: true,
      stage: this.stage,
      kneeAngle: avgKnee,
      hipWidthRatio,
      armReachScore,
      torsoAngle,
      depthScore,
      stabilityScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodStance,
    };
  }

  private noDetection(msg: string): DefensiveStanceFeedback {
    return {
      detected: false, stage: this.stage, kneeAngle: 0, hipWidthRatio: 0,
      armReachScore: 0, torsoAngle: 0, depthScore: 0, stabilityScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodStance: false,
    };
  }

  public reset(): void {
    this.stage = 'STANDING';
    this.goodStanceFrames = 0;
    this.totalFrames = 0;
    this.formScores = [];
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
  }

  public getGoodStancePercent(): number {
    if (this.totalFrames === 0) return 0;
    return Math.round((this.goodStanceFrames / this.totalFrames) * 100);
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
