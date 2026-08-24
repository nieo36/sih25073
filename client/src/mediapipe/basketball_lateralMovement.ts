/**
 * Basketball — Lateral Movement Analyzer
 * Evaluates defensive/offensive lateral movement quality:
 * hip oscillation, knee flex during slides, step pattern
 * (slide step vs crossover), and lateral speed.
 */

import { NormalizedLandmark, PoseLandmark, areLandmarksVisible } from './landmarks';
import { calculateAngle, AngleSmoother } from './angles';

export type LateralMovementStage = 'STATIC' | 'SLIDING_LEFT' | 'SLIDING_RIGHT' | 'CROSSOVER';

export interface LateralMovementFeedback {
  detected: boolean;
  stage: LateralMovementStage;
  slideCount: number;
  kneeAngle: number;
  hipFlexion: number;
  lateralSpeed: number;
  stepPatternScore: number;    // 100 = perfect slide step
  kneeFlexScore: number;
  formScore: number;
  feedbackMessage: string;
  warnings: string[];
  isGoodMovement: boolean;
}

export class LateralMovementAnalyzer {
  private stage: LateralMovementStage = 'STATIC';
  private slideCount = 0;
  private smootherLeftKnee = new AngleSmoother(0.3);
  private smootherRightKnee = new AngleSmoother(0.3);
  private formScores: number[] = [];

  private hipXHistory: number[] = [];
  private ankleXHistory: { left: number[]; right: number[] } = { left: [], right: [] };
  private prevDirection = 0;

  public process(landmarks: NormalizedLandmark[]): LateralMovementFeedback {
    const required = [
      PoseLandmark.LEFT_HIP, PoseLandmark.LEFT_KNEE, PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_HIP, PoseLandmark.RIGHT_KNEE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
    ];

    if (!areLandmarksVisible(landmarks, required, 0.4)) {
      return this.noDetection('No athlete detected. Face camera, step back so full body is visible.');
    }

    const leftKnee = this.smootherLeftKnee.update(
      calculateAngle(landmarks[PoseLandmark.LEFT_HIP], landmarks[PoseLandmark.LEFT_KNEE], landmarks[PoseLandmark.LEFT_ANKLE])
    );
    const rightKnee = this.smootherRightKnee.update(
      calculateAngle(landmarks[PoseLandmark.RIGHT_HIP], landmarks[PoseLandmark.RIGHT_KNEE], landmarks[PoseLandmark.RIGHT_ANKLE])
    );
    const avgKnee = Math.round((leftKnee + rightKnee) / 2);

    // Hip center tracking
    const hipCenterX = (landmarks[PoseLandmark.LEFT_HIP].x + landmarks[PoseLandmark.RIGHT_HIP].x) / 2;
    this.hipXHistory.push(hipCenterX);
    if (this.hipXHistory.length > 10) this.hipXHistory.shift();

    // Ankle positions for crossover detection
    const leftAnkleX = landmarks[PoseLandmark.LEFT_ANKLE].x;
    const rightAnkleX = landmarks[PoseLandmark.RIGHT_ANKLE].x;
    this.ankleXHistory.left.push(leftAnkleX);
    this.ankleXHistory.right.push(rightAnkleX);
    if (this.ankleXHistory.left.length > 5) {
      this.ankleXHistory.left.shift();
      this.ankleXHistory.right.shift();
    }

    // Compute lateral velocity
    let lateralSpeed = 0;
    if (this.hipXHistory.length >= 2) {
      const delta = this.hipXHistory[this.hipXHistory.length - 1] - this.hipXHistory[0];
      lateralSpeed = Math.abs(delta) / this.hipXHistory.length * 60;
    }

    const direction = this.hipXHistory.length >= 2
      ? Math.sign(this.hipXHistory[this.hipXHistory.length - 1] - this.hipXHistory[this.hipXHistory.length - 2])
      : 0;

    if (direction !== 0 && direction !== this.prevDirection && this.prevDirection !== 0) {
      this.slideCount++;
    }
    if (direction !== 0) this.prevDirection = direction;

    // Stage detection
    const isCrossover = leftAnkleX > rightAnkleX; // feet crossed
    if (lateralSpeed < 0.003) {
      this.stage = 'STATIC';
    } else if (isCrossover) {
      this.stage = 'CROSSOVER';
    } else {
      this.stage = direction < 0 ? 'SLIDING_LEFT' : 'SLIDING_RIGHT';
    }

    const currentWarnings: string[] = [];
    let feedbackMessage = 'Start lateral shuffle — keep knees bent and hips low!';
    let isGoodMovement = false;

    // Knee flex during lateral movement
    const kneeFlexScore = avgKnee <= 130 ? 100
      : avgKnee <= 150 ? Math.round(100 - (avgKnee - 130) * 3)
      : Math.max(0, Math.round(100 - (avgKnee - 150) * 5));

    if (avgKnee > 155 && this.stage !== 'STATIC') {
      currentWarnings.push('Legs too straight during slides');
      feedbackMessage = 'Bend your knees! Stay low during lateral slides.';
    }

    // Step pattern: crossover = penalty in defensive context
    let stepPatternScore = 100;
    if (this.stage === 'CROSSOVER') {
      stepPatternScore = 40;
      currentWarnings.push('Crossover step detected — use slide step on defense');
      feedbackMessage = 'Use a slide step on defense — do NOT cross your feet! Lead with the near foot.';
    } else if (this.stage !== 'STATIC') {
      feedbackMessage = direction < 0
        ? 'Good slide left! Push off right foot, lead with left foot.'
        : 'Good slide right! Push off left foot, lead with right foot.';
      isGoodMovement = true;
    }

    const symmetryScore = Math.max(0, Math.round(100 - Math.abs(leftKnee - rightKnee) * 3));
    if (symmetryScore < 70) {
      currentWarnings.push('Uneven knee bend during slide');
    }

    const formScore = Math.round(kneeFlexScore * 0.4 + stepPatternScore * 0.4 + symmetryScore * 0.2);
    if (this.stage !== 'STATIC') this.formScores.push(formScore);
    if (this.formScores.length > 60) this.formScores.shift();

    const hipFlexion = Math.round(
      calculateAngle(
        landmarks[PoseLandmark.LEFT_SHOULDER],
        landmarks[PoseLandmark.LEFT_HIP],
        landmarks[PoseLandmark.LEFT_KNEE]
      )
    );

    return {
      detected: true,
      stage: this.stage,
      slideCount: this.slideCount,
      kneeAngle: avgKnee,
      hipFlexion,
      lateralSpeed: Math.round(lateralSpeed * 1000) / 1000,
      stepPatternScore,
      kneeFlexScore,
      formScore,
      feedbackMessage,
      warnings: Array.from(new Set(currentWarnings)),
      isGoodMovement,
    };
  }

  private noDetection(msg: string): LateralMovementFeedback {
    return {
      detected: false, stage: this.stage, slideCount: this.slideCount,
      kneeAngle: 0, hipFlexion: 0, lateralSpeed: 0, stepPatternScore: 0,
      kneeFlexScore: 0, formScore: 0, feedbackMessage: msg, warnings: [msg], isGoodMovement: false,
    };
  }

  public reset(): void {
    this.stage = 'STATIC';
    this.slideCount = 0;
    this.hipXHistory = [];
    this.ankleXHistory = { left: [], right: [] };
    this.prevDirection = 0;
    this.formScores = [];
    this.smootherLeftKnee.reset();
    this.smootherRightKnee.reset();
  }

  public getAverageFormScore(): number {
    if (this.formScores.length === 0) return 0;
    return Math.round(this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length);
  }
}
