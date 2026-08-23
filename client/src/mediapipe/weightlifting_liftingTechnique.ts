/**
 * Weightlifting — Lifting Technique Analyzer (Comprehensive)
 * Combines bar path + depth + joint angles + stability + tempo
 * into a single comprehensive technique score per rep.
 * Detects lift type (deadlift / squat / overhead press / row)
 * and provides sport-specific technique coaching.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type LiftType = 'DEADLIFT' | 'SQUAT' | 'OVERHEAD_PRESS' | 'ROW' | 'UNKNOWN';
export type TechniqueStage = 'SETUP' | 'FIRST_PULL' | 'CONCENTRIC' | 'LOCKOUT' | 'ECCENTRIC';

export interface LiftingTechniqueFeedback {
  detected: boolean;
  liftType: LiftType;
  stage: TechniqueStage;
  repCount: number;
  techniqueScore: number;    // 0-100 overall
  depthScore: number;
  barPathScore: number;
  stabilityScore: number;
  spineNeutralScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodRep: boolean;
}

export class LiftingTechniqueAnalyzer {
  private liftType: LiftType = 'UNKNOWN';
  private stage: TechniqueStage = 'SETUP';
  private repCount = 0;
  private formScores: number[] = [];

  private smootherKnee = new AngleSmoother(0.35);
  private smootherHip = new AngleSmoother(0.35);
  private smootherElbow = new AngleSmoother(0.35);
  private smootherTrunk = new AngleSmoother(0.4);

  private wristYHistory: number[] = [];
  private hipYHistory: number[] = [];
  private prevWristY = -1;
  private minKneeAngle = 180;
  private repBarPathX: number[] = [];
  private startBarX = -1;
  private maxBarDev = 0;

  // Lift detection via joint angle patterns
  private detectLiftType(kneeAngle: number, hipAngle: number, elbowAngle: number, wristY: number): LiftType {
    if (elbowAngle > 160 && wristY < 0.5) return 'OVERHEAD_PRESS'; // Bar overhead
    if (kneeAngle > 150 && hipAngle < 100) return 'DEADLIFT';       // Hips hinge, legs straight
    if (kneeAngle < 130) return 'SQUAT';                            // Deep knee bend
    if (elbowAngle < 80 && hipAngle < 100) return 'ROW';            // Bent over, arm pulling
    return 'UNKNOWN';
  }

  public process(landmarks: NormalizedLandmark[]): LiftingTechniqueFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Position side-on camera for full lift analysis.');
    }

    const kneeAngle = this.smootherKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const hipAngle = this.smootherHip.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE])
    );
    const elbowAngle = this.smootherElbow.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_WRIST])
    );

    const barX = (landmarks[PoseLandmark.LEFT_WRIST].x + landmarks[PoseLandmark.RIGHT_WRIST].x) / 2;
    const barY = (landmarks[PoseLandmark.LEFT_WRIST].y + landmarks[PoseLandmark.RIGHT_WRIST].y) / 2;
    const hipY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;

    // Trunk lean
    const shoulderMidX = (landmarks[PoseLandmark.LEFT_SHOULDER].x + landmarks[PoseLandmark.RIGHT_SHOULDER].x) / 2;
    const shoulderMidY = (landmarks[PoseLandmark.LEFT_SHOULDER].y + landmarks[PoseLandmark.RIGHT_SHOULDER].y) / 2;
    const hipMidX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    const hipMidY = (landmarks[PoseLandmark.LEFT_HIP].y + landmarks[PoseLandmark.RIGHT_HIP].y) / 2;
    const trunkAngle = this.smootherTrunk.update(
      Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) * 180 / Math.PI)
    );

    this.wristYHistory.push(barY);
    this.hipYHistory.push(hipY);
    if (this.wristYHistory.length > 6) { this.wristYHistory.shift(); this.hipYHistory.shift(); }

    if (kneeAngle < this.minKneeAngle) this.minKneeAngle = kneeAngle;

    // Lift type detection (updates every 10 frames)
    if (this.repCount === 0 || this.stage === 'SETUP') {
      const detected = this.detectLiftType(kneeAngle, hipAngle, elbowAngle, barY);
      if (detected !== 'UNKNOWN') this.liftType = detected;
    }

    // Bar path tracking
    if (this.startBarX < 0) this.startBarX = barX;
    const barDev = Math.abs(barX - this.startBarX);
    if (barDev > this.maxBarDev) this.maxBarDev = barDev;
    this.repBarPathX.push(barX);

    // Velocity
    let barVelocity = 0;
    if (this.prevWristY >= 0) barVelocity = barY - this.prevWristY;
    this.prevWristY = barY;

    const currentWarnings: string[] = [];
    let feedbackMessage = `${this.liftType === 'UNKNOWN' ? 'Begin lift' : this.liftType.replace('_', ' ')} — setup with braced core.`;
    let isGoodRep = false;

    // Spine neutral (based on trunk angle)
    let spineNeutralScore: number;
    if (trunkAngle >= 0 && trunkAngle <= 30) {
      spineNeutralScore = 100;
    } else if (trunkAngle <= 50) {
      spineNeutralScore = Math.round(100 - (trunkAngle - 30) * 3);
    } else {
      spineNeutralScore = Math.max(0, Math.round(100 - (trunkAngle - 30) * 5));
      currentWarnings.push('Excessive trunk lean — spine not neutral');
      feedbackMessage = 'Keep spine neutral! Excessive lean risks injury — brace and lift with your legs!';
    }

    // Bar path deviation
    const barPathScore = Math.max(0, Math.round(100 - this.maxBarDev * 800));
    if (barPathScore < 60) {
      currentWarnings.push('Bar path deviating — not vertical');
      if (feedbackMessage.startsWith(this.liftType)) {
        feedbackMessage = 'Bar is swinging! Drive the bar straight up — shortest path is a straight line.';
      }
    }

    // Depth (relevant for squat/deadlift)
    const depthScore = this.liftType === 'SQUAT'
      ? (this.minKneeAngle <= 90 ? 100 : Math.max(40, 100 - (this.minKneeAngle - 90) * 3))
      : (this.liftType === 'DEADLIFT'
        ? (hipAngle < 70 ? 100 : Math.max(50, 100 - (hipAngle - 70) * 2))
        : 85);

    // Stability: lateral sway of shoulder
    const stabilityScore = Math.max(0, Math.round(100 - Math.abs(trunkAngle - 20) * 2));

    // State machine
    const isMovingUp = barVelocity < -0.005;
    const isMovingDown = barVelocity > 0.005;

    switch (this.stage) {
      case 'SETUP':
        feedbackMessage = getLiftSetupTip(this.liftType);
        if (isMovingUp) { this.stage = 'CONCENTRIC'; this.startBarX = barX; this.maxBarDev = 0; this.repBarPathX = []; }
        else if (isMovingDown) { this.stage = 'ECCENTRIC'; }
        break;

      case 'CONCENTRIC':
        feedbackMessage = getLiftConcentricTip(this.liftType);
        if (!isMovingUp) { this.stage = 'LOCKOUT'; }
        break;

      case 'LOCKOUT':
        feedbackMessage = 'Lockout! Lock hips and knees — breathe at the top.';
        if (isMovingDown) { this.stage = 'ECCENTRIC'; }
        break;

      case 'ECCENTRIC':
        feedbackMessage = getLiftEccentricTip(this.liftType);
        if (!isMovingDown && barVelocity <= 0.002) {
          // Rep complete
          this.repCount++;
          const techniqueScore = Math.round(
            spineNeutralScore * 0.3 + barPathScore * 0.25 + depthScore * 0.25 + stabilityScore * 0.2
          );
          this.formScores.push(techniqueScore);
          isGoodRep = techniqueScore >= 72;
          feedbackMessage = isGoodRep
            ? `${this.liftType.replace('_', ' ')} — excellent technique! Clean rep!`
            : `Rep counted. Work on: ${currentWarnings.length > 0 ? currentWarnings[0] : 'consistency'}.`;
          this.stage = 'SETUP';
          this.minKneeAngle = 180;
          this.maxBarDev = 0;
        }
        break;
    }

    const overallTechniqueScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : Math.round(spineNeutralScore * 0.35 + barPathScore * 0.35 + stabilityScore * 0.3);

    return {
      detected: true,
      liftType: this.liftType,
      stage: this.stage,
      repCount: this.repCount,
      techniqueScore: overallTechniqueScore,
      depthScore: Math.round(depthScore),
      barPathScore,
      stabilityScore,
      spineNeutralScore,
      formScore: overallTechniqueScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodRep,
    };
  }

  private noDetection(msg: string): LiftingTechniqueFeedback {
    return {
      detected: false, liftType: this.liftType, stage: this.stage, repCount: this.repCount,
      techniqueScore: 0, depthScore: 0, barPathScore: 0, stabilityScore: 0,
      spineNeutralScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodRep: false,
    };
  }

  public reset(): void {
    this.stage = 'SETUP';
    this.repCount = 0;
    this.formScores = [];
    this.wristYHistory = [];
    this.hipYHistory = [];
    this.prevWristY = -1;
    this.minKneeAngle = 180;
    this.maxBarDev = 0;
    this.startBarX = -1;
    this.repBarPathX = [];
    this.smootherKnee.reset();
    this.smootherHip.reset();
    this.smootherElbow.reset();
    this.smootherTrunk.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}

function getLiftSetupTip(liftType: LiftType): string {
  switch (liftType) {
    case 'DEADLIFT': return 'Deadlift setup — bar over mid-foot, hips hinge back, lats engaged.';
    case 'SQUAT': return 'Squat setup — bar on traps, knees over toes, brace core.';
    case 'OVERHEAD_PRESS': return 'Press setup — grip just outside shoulders, bar at chin level.';
    case 'ROW': return 'Row setup — hinge hips to 45°, chest proud, pull with elbows.';
    default: return 'Setup complete — brace core and initiate lift.';
  }
}

function getLiftConcentricTip(liftType: LiftType): string {
  switch (liftType) {
    case 'DEADLIFT': return 'Push floor away — hips and shoulders rise at same rate!';
    case 'SQUAT': return 'Drive through heels — chest up, knees tracking toes!';
    case 'OVERHEAD_PRESS': return 'Press straight up — lock out fully, bar path vertical!';
    case 'ROW': return 'Pull elbows back — retract scapula fully at top!';
    default: return 'Lift with control — explosive but not sloppy!';
  }
}

function getLiftEccentricTip(liftType: LiftType): string {
  switch (liftType) {
    case 'DEADLIFT': return 'Hinge hips back first — resist the pull of gravity!';
    case 'SQUAT': return 'Sit back and down — control the descent 3 seconds!';
    case 'OVERHEAD_PRESS': return 'Lower to collar bone — stay tight, don\'t arch excessively!';
    case 'ROW': return 'Lower with control — full stretch at bottom!';
    default: return 'Eccentric phase — control the descent under tension!';
  }
}
