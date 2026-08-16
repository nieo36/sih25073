import { NormalizedLandmark } from './landmarks';

/**
 * Calculates the interior angle (in degrees) between three points: A -> B (vertex) -> C.
 * Output range: 0 to 180 degrees.
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  if (!a || !b || !c) return 0;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle * 10) / 10;
}

/**
 * Calculates vertical inclination angle of a vector from vertical line
 */
export function calculateVerticalAngle(
  top: NormalizedLandmark,
  bottom: NormalizedLandmark
): number {
  if (!top || !bottom) return 0;
  const radians = Math.atan2(bottom.x - top.x, bottom.y - top.y);
  const angle = Math.abs((radians * 180.0) / Math.PI);
  return Math.round(angle * 10) / 10;
}

/**
 * Exponential Moving Average (EMA) smoothing for angle time-series
 */
export class AngleSmoother {
  private smoothedValue: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.35) {
    this.alpha = alpha;
  }

  public update(rawValue: number): number {
    if (this.smoothedValue === null) {
      this.smoothedValue = rawValue;
      return rawValue;
    }
    this.smoothedValue = this.alpha * rawValue + (1 - this.alpha) * this.smoothedValue;
    return Math.round(this.smoothedValue * 10) / 10;
  }

  public reset(): void {
    this.smoothedValue = null;
  }
}
