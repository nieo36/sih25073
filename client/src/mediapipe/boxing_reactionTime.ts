/**
 * Boxing — Reaction Time Analyzer
 * Establishes a resting guard baseline, then measures the frame-count
 * latency from guard position to full punch extension.
 * Also coaches how fast the guard is restored after each punch.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type ReactionStage = 'CALIBRATING' | 'GUARD' | 'REACTING' | 'EXTENDED' | 'RESTORING';

export interface ReactionTimeFeedback {
  detected: boolean;
  stage: ReactionStage;
  reactionCount: number;
  avgReactionFrames: number;    // Lower = faster
  avgReactionMs: number;        // Estimated ms (assumes 30fps)
  currentReactionFrames: number;
  guardRestorationScore: number;
  reactionScore: number;        // 0-100 (100 = fastest)
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodReaction: boolean;
}

export class ReactionTimeAnalyzer {
  private stage: ReactionStage = 'CALIBRATING';
  private reactionCount = 0;
  private smootherLeftElbow = new AngleSmoother(0.3);
  private smootherRightElbow = new AngleSmoother(0.3);
  private formScores: number[] = [];

  private guardLeftElbow = 75;
  private guardRightElbow = 75;
  private calibrationFrames = 0;
  private calibrationSamples: number[] = [];

  private reactionStartFrame = 0;
  private currentFrame = 0;
  private reactionFrameCounts: number[] = [];
  private maxExtensionFrame = 0;
  private activeSide: 'LEFT' | 'RIGHT' = 'RIGHT';

  public process(landmarks: NormalizedLandmark[]): ReactionTimeFeedback {
    const required = [
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.35)) {
      return this.noDetection('No athlete detected. Adopt boxing stance facing camera.');
    }

    this.currentFrame++;
    const leftElbow = this.smootherLeftElbow.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_SHOULDER], landmarks[PoseLandmark.LEFT_ELBOW], landmarks[PoseLandmark.LEFT_WRIST])
    );
    const rightElbow = this.smootherRightElbow.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_SHOULDER], landmarks[PoseLandmark.RIGHT_ELBOW], landmarks[PoseLandmark.RIGHT_WRIST])
    );

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Hold your guard. Ready to measure reaction time.';
    let isGoodReaction = false;

    // State machine
    switch (this.stage) {
      case 'CALIBRATING':
        feedbackMessage = 'Hold your guard position still — calibrating baseline...';
        this.calibrationSamples.push((leftElbow + rightElbow) / 2);
        this.calibrationFrames++;
        if (this.calibrationFrames >= 30) {
          this.guardLeftElbow = leftElbow;
          this.guardRightElbow = rightElbow;
          this.stage = 'GUARD';
          feedbackMessage = 'Guard calibrated! Now throw a punch when ready.';
        }
        break;

      case 'GUARD':
        feedbackMessage = 'Guard set. React and punch — go!';
        // Detect punch initiation: significant elbow extension from guard
        const leftDelta = leftElbow - this.guardLeftElbow;
        const rightDelta = rightElbow - this.guardRightElbow;
        if (rightDelta > 25) {
          this.stage = 'REACTING';
          this.activeSide = 'RIGHT';
          this.reactionStartFrame = this.currentFrame;
          feedbackMessage = 'Right punch detected — tracking reaction speed!';
        } else if (leftDelta > 25) {
          this.stage = 'REACTING';
          this.activeSide = 'LEFT';
          this.reactionStartFrame = this.currentFrame;
          feedbackMessage = 'Left punch detected — tracking reaction speed!';
        }
        break;

      case 'REACTING':
        feedbackMessage = 'Extending punch — faster! Explode through!';
        const activeElbow = this.activeSide === 'RIGHT' ? rightElbow : leftElbow;
        if (activeElbow > 155) {
          this.stage = 'EXTENDED';
          this.maxExtensionFrame = this.currentFrame;
          const reactionFrames = this.currentFrame - this.reactionStartFrame;
          this.reactionFrameCounts.push(reactionFrames);
          this.reactionCount++;
          const reactionMs = Math.round(reactionFrames * (1000 / 30)); // 30fps estimate
          feedbackMessage = `Punch landed! Reaction: ~${reactionMs}ms. Snap back to guard!`;
        }
        if (this.currentFrame - this.reactionStartFrame > 60) {
          // Timeout — reset
          currentWarnings.push('Punch timed out — react faster!');
          this.stage = 'GUARD';
        }
        break;

      case 'EXTENDED':
        feedbackMessage = 'Restore guard — bring hand back to chin level NOW!';
        const extendedActiveElbow = this.activeSide === 'RIGHT' ? rightElbow : leftElbow;
        const guardTarget = this.activeSide === 'RIGHT' ? this.guardRightElbow : this.guardLeftElbow;
        if (extendedActiveElbow < guardTarget + 20) {
          this.stage = 'RESTORING';
        }
        break;

      case 'RESTORING':
        const reactionFrames2 = this.reactionFrameCounts[this.reactionFrameCounts.length - 1] || 20;
        const restoreFrames = this.currentFrame - this.maxExtensionFrame;
        const guardRestorationScore = Math.min(100, Math.max(0, Math.round(100 - (restoreFrames - reactionFrames2) * 3)));

        const reactionScore = Math.min(100, Math.max(0, Math.round(100 - (reactionFrames2 - 8) * 4)));
        const formScore = Math.round(reactionScore * 0.6 + guardRestorationScore * 0.4);
        this.formScores.push(formScore);
        isGoodReaction = formScore >= 65;
        feedbackMessage = isGoodReaction
          ? 'Excellent speed! Fast punch and guard restoration!'
          : 'Good attempt. Work on snapping back to guard faster after each punch.';
        this.stage = 'GUARD';
        break;
    }

    const avgReactionFrames = this.reactionFrameCounts.length > 0
      ? Math.round(this.reactionFrameCounts.reduce((a, b) => a + b, 0) / this.reactionFrameCounts.length)
      : 0;
    const avgReactionMs = Math.round(avgReactionFrames * (1000 / 30));
    const reactionScore = avgReactionFrames > 0
      ? Math.min(100, Math.max(0, Math.round(100 - (avgReactionFrames - 8) * 4)))
      : 0;
    const guardRestorationScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : 0;

    return {
      detected: true,
      stage: this.stage,
      reactionCount: this.reactionCount,
      avgReactionFrames,
      avgReactionMs,
      currentReactionFrames: this.stage === 'REACTING' ? this.currentFrame - this.reactionStartFrame : 0,
      guardRestorationScore,
      reactionScore,
      formScore: guardRestorationScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodReaction,
    };
  }

  private noDetection(msg: string): ReactionTimeFeedback {
    return {
      detected: false, stage: this.stage, reactionCount: this.reactionCount,
      avgReactionFrames: 0, avgReactionMs: 0, currentReactionFrames: 0,
      guardRestorationScore: 0, reactionScore: 0, formScore: 0,
      feedbackMessage: msg, warnings: [msg], isGoodReaction: false,
    };
  }

  public reset(): void {
    this.stage = 'CALIBRATING';
    this.reactionCount = 0;
    this.calibrationFrames = 0;
    this.calibrationSamples = [];
    this.reactionFrameCounts = [];
    this.formScores = [];
    this.currentFrame = 0;
    this.smootherLeftElbow.reset();
    this.smootherRightElbow.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
