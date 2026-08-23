/**
 * Weightlifting — Tempo Analyzer
 * Records frame timestamps at key phase transitions.
 * Computes eccentric (lowering) and concentric (lifting) durations.
 * Ideal tempo for strength: ~2-3s eccentric, 1-2s concentric.
 * Gives real-time coaching on tempo adherence.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { AngleSmoother } from './angles';

export type TempoPhase = 'RESTING' | 'CONCENTRIC' | 'PAUSE' | 'ECCENTRIC';

export interface TempoFeedback {
  detected: boolean;
  phase: TempoPhase;
  repCount: number;
  concentricMs: number;   // Last concentric duration
  eccentricMs: number;    // Last eccentric duration
  pauseMs: number;        // Top/bottom pause duration
  tempoRatio: number;     // eccentric / concentric ratio (ideal ~2.0)
  concentricScore: number;
  eccentricScore: number;
  overallTempoScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodTempo: boolean;
}

export class TempoAnalyzer {
  private phase: TempoPhase = 'RESTING';
  private repCount = 0;
  private formScores: number[] = [];

  private smootherWristY = new AngleSmoother(0.3);
  private wristYHistory: number[] = [];

  private phaseStartTime = 0;
  private concentricMs = 0;
  private eccentricMs = 0;
  private pauseMs = 0;
  private lastConcentricMs = 0;
  private lastEccentricMs = 0;
  private lastPauseMs = 0;

  private IDEAL_ECCENTRIC_MS = 2500;
  private IDEAL_CONCENTRIC_MS = 1200;

  public process(landmarks: NormalizedLandmark[]): TempoFeedback {
    const required = [PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST];

    if (!areLandmarksVisible(landmarks, required, 0.3)) {
      // Try knee landmarks for squat tempo
      const kneeRequired = [PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_ANKLE];
      if (!areLandmarksVisible(landmarks, kneeRequired, 0.35)) {
        return this.noDetection('No athlete detected. Ensure wrists or full body are visible for tempo tracking.');
      }
    }

    // Use wrist Y as primary movement proxy
    const rawY = areLandmarksVisible(landmarks, [PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST], 0.3)
      ? (landmarks[PoseLandmark.LEFT_WRIST].y + landmarks[PoseLandmark.RIGHT_WRIST].y) / 2
      : (landmarks[PoseLandmark.LEFT_KNEE]?.y ?? 0.5);

    const smoothY = this.smootherWristY.update(rawY);
    this.wristYHistory.push(smoothY);
    if (this.wristYHistory.length > 6) this.wristYHistory.shift();

    // Velocity: positive = moving down in frame = eccentric (lowering)
    let velocity = 0;
    if (this.wristYHistory.length >= 3) {
      velocity = (this.wristYHistory[this.wristYHistory.length - 1] - this.wristYHistory[0]) / this.wristYHistory.length;
    }

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Begin your lift — track tempo: 2s down, 1s up.';
    let isGoodTempo = false;
    const now = performance.now();

    const VELOCITY_THRESHOLD = 0.003;
    const isMovingUp = velocity < -VELOCITY_THRESHOLD;    // wrist moving up in frame
    const isMovingDown = velocity > VELOCITY_THRESHOLD;   // wrist moving down in frame
    const isPaused = Math.abs(velocity) <= VELOCITY_THRESHOLD;

    switch (this.phase) {
      case 'RESTING':
        feedbackMessage = 'Ready. Start your lift — controlled movement throughout.';
        if (isMovingUp) {
          this.phase = 'CONCENTRIC';
          this.phaseStartTime = now;
          feedbackMessage = 'Concentric phase — lift with power, 1-2 seconds.';
        } else if (isMovingDown) {
          this.phase = 'ECCENTRIC';
          this.phaseStartTime = now;
          feedbackMessage = 'Eccentric phase — lower with control, 2-3 seconds.';
        }
        break;

      case 'CONCENTRIC':
        this.concentricMs = now - this.phaseStartTime;
        feedbackMessage = `Lifting: ${(this.concentricMs / 1000).toFixed(1)}s — target 1-2s.`;
        if (this.concentricMs < 500) {
          feedbackMessage = 'Keep lifting — controlled power!';
        } else if (this.concentricMs > 3000) {
          currentWarnings.push('Concentric phase too slow');
          feedbackMessage = 'You\'re slowing down too much on the way up! Drive with more intent.';
        }
        if (!isMovingUp) {
          this.lastConcentricMs = this.concentricMs;
          if (isPaused) {
            this.phase = 'PAUSE';
            this.phaseStartTime = now;
            feedbackMessage = 'Pause at top — breathe, brace, then lower with control.';
          } else {
            this.phase = 'ECCENTRIC';
            this.phaseStartTime = now;
            feedbackMessage = 'Eccentric phase — 2-3 seconds down, resist gravity!';
          }
        }
        break;

      case 'PAUSE':
        this.pauseMs = now - this.phaseStartTime;
        feedbackMessage = `Pausing: ${(this.pauseMs / 1000).toFixed(1)}s — brace and breathe.`;
        if (!isPaused) {
          this.lastPauseMs = this.pauseMs;
          this.phase = isMovingDown ? 'ECCENTRIC' : 'RESTING';
          if (this.phase === 'ECCENTRIC') {
            this.phaseStartTime = now;
            feedbackMessage = 'Lowering — take 2-3 full seconds on the way down!';
          }
        }
        break;

      case 'ECCENTRIC':
        this.eccentricMs = now - this.phaseStartTime;
        feedbackMessage = `Lowering: ${(this.eccentricMs / 1000).toFixed(1)}s — target 2-3s.`;

        if (this.eccentricMs < 800) {
          feedbackMessage = 'Slow down! Fight gravity on the way down — don\'t just drop it.';
        } else if (this.eccentricMs < 1500) {
          feedbackMessage = `Good... keep lowering slowly. ${((3000 - this.eccentricMs) / 1000).toFixed(1)}s more.`;
        } else if (this.eccentricMs >= 2000 && this.eccentricMs <= 3500) {
          feedbackMessage = 'Perfect eccentric pace! Feel the muscle stretch under tension.';
        } else if (this.eccentricMs > 5000) {
          currentWarnings.push('Eccentric too slow — losing tension');
          feedbackMessage = 'You\'re going too slow — maintain consistent tension, don\'t pause mid-rep.';
        }

        if (!isMovingDown) {
          this.lastEccentricMs = this.eccentricMs;
          this.repCount++;

          // Score this rep's tempo
          const eccentricScore = this.scorePhase(this.lastEccentricMs, this.IDEAL_ECCENTRIC_MS, 800);
          const concentricScore = this.scorePhase(this.lastConcentricMs, this.IDEAL_CONCENTRIC_MS, 500);
          const repScore = Math.round(eccentricScore * 0.6 + concentricScore * 0.4);
          this.formScores.push(repScore);

          const tempoRatio = this.lastConcentricMs > 0 ? this.lastEccentricMs / this.lastConcentricMs : 0;
          isGoodTempo = repScore >= 70;

          feedbackMessage = isGoodTempo
            ? `Perfect tempo! ${(this.lastEccentricMs / 1000).toFixed(1)}s down : ${(this.lastConcentricMs / 1000).toFixed(1)}s up — textbook!`
            : tempoRatio < 1.5
            ? 'Lower more slowly! Eccentric should be 2x longer than concentric.'
            : 'Good rep. Try to slow the eccentric to 2.5-3 seconds next time.';

          this.phase = isPaused ? 'PAUSE' : 'RESTING';
          this.phaseStartTime = now;
          this.concentricMs = 0;
          this.eccentricMs = 0;
        }
        break;
    }

    const tempoRatio = this.lastConcentricMs > 0 ? Math.round(this.lastEccentricMs / this.lastConcentricMs * 10) / 10 : 0;
    const concentricScore = this.scorePhase(this.lastConcentricMs, this.IDEAL_CONCENTRIC_MS, 500);
    const eccentricScore = this.scorePhase(this.lastEccentricMs, this.IDEAL_ECCENTRIC_MS, 800);
    const overallTempoScore = Math.round(eccentricScore * 0.6 + concentricScore * 0.4);

    const avgFormScore = this.formScores.length > 0
      ? Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length)
      : overallTempoScore;

    return {
      detected: true,
      phase: this.phase,
      repCount: this.repCount,
      concentricMs: Math.round(this.lastConcentricMs),
      eccentricMs: Math.round(this.lastEccentricMs),
      pauseMs: Math.round(this.lastPauseMs),
      tempoRatio,
      concentricScore,
      eccentricScore,
      overallTempoScore,
      formScore: avgFormScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodTempo,
    };
  }

  private scorePhase(actualMs: number, idealMs: number, minMs: number): number {
    if (actualMs <= 0) return 50;
    const deviation = Math.abs(actualMs - idealMs);
    const score = Math.max(0, Math.min(100, Math.round(100 - deviation / idealMs * 80)));
    if (actualMs < minMs) return Math.max(0, score - 30);
    return score;
  }

  private noDetection(msg: string): TempoFeedback {
    return {
      detected: false, phase: this.phase, repCount: this.repCount,
      concentricMs: 0, eccentricMs: 0, pauseMs: 0, tempoRatio: 0,
      concentricScore: 0, eccentricScore: 0, overallTempoScore: 0,
      formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodTempo: false,
    };
  }

  public reset(): void {
    this.phase = 'RESTING';
    this.repCount = 0;
    this.formScores = [];
    this.wristYHistory = [];
    this.concentricMs = 0;
    this.eccentricMs = 0;
    this.pauseMs = 0;
    this.lastConcentricMs = 0;
    this.lastEccentricMs = 0;
    this.lastPauseMs = 0;
    this.smootherWristY.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
