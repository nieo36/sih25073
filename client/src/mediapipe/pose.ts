import { Pose, Results, Options } from '@mediapipe/pose';
import { NormalizedLandmark, POSE_CONNECTIONS, PoseLandmark } from './landmarks';

export { Pose };
export type { Results, Options };

export interface PoseDetectorConfig extends Options {}

/**
 * Creates and initializes a MediaPipe Pose detector instance with WASM dependencies
 * Tuned with higher confidence thresholds (0.65) to eliminate phantom landmarks.
 */
export function createPoseDetector(
  onResults: (results: Results) => void,
  options?: Options
): Pose {
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65,
    ...options,
  });

  pose.onResults(onResults);
  return pose;
}

/**
 * Exponential Moving Average Landmark Smoother
 * Reduces frame-to-frame jitter while maintaining real-time responsiveness.
 */
export function smoothLandmarks(
  current: NormalizedLandmark[],
  previous: NormalizedLandmark[] | null,
  alpha: number = 0.65
): NormalizedLandmark[] {
  if (!previous || previous.length !== current.length) {
    return current;
  }

  return current.map((curr, idx) => {
    const prev = previous[idx];
    if (!prev) return curr;

    const currVis = curr.visibility ?? 1;
    const prevVis = prev.visibility ?? 1;

    // Weight smoothing by visibility confidence
    const effectiveAlpha = Math.min(1, alpha * (currVis >= 0.6 ? 1 : 0.5));

    return {
      x: prev.x + effectiveAlpha * (curr.x - prev.x),
      y: prev.y + effectiveAlpha * (curr.y - prev.y),
      z: prev.z !== undefined && curr.z !== undefined ? prev.z + effectiveAlpha * (curr.z - prev.z) : curr.z,
      visibility: currVis * 0.7 + prevVis * 0.3,
    };
  });
}

/**
 * Validates whether the athlete's body is properly framed in the camera view
 */
export interface FramingCheckResult {
  isProperlyFramed: boolean;
  message: string;
  visibleJointCount: number;
  confidence: number;
}

export function checkFramingAndVisibility(
  landmarks: NormalizedLandmark[],
  requiredJoints: number[] = [
    PoseLandmark.LEFT_SHOULDER,
    PoseLandmark.RIGHT_SHOULDER,
    PoseLandmark.LEFT_HIP,
    PoseLandmark.RIGHT_HIP,
    PoseLandmark.LEFT_KNEE,
    PoseLandmark.RIGHT_KNEE,
  ]
): FramingCheckResult {
  if (!landmarks || landmarks.length === 0) {
    return {
      isProperlyFramed: false,
      message: 'No athlete detected. Step into the camera frame.',
      visibleJointCount: 0,
      confidence: 0,
    };
  }

  let visibleCount = 0;
  let totalConfidence = 0;
  let outOfBounds = false;

  for (const jointIndex of requiredJoints) {
    const lm = landmarks[jointIndex];
    if (!lm) continue;

    const vis = lm.visibility ?? 0;
    totalConfidence += vis;

    if (vis >= 0.6) {
      visibleCount++;
    }

    if (lm.x < 0.03 || lm.x > 0.97 || lm.y < 0.03 || lm.y > 0.97) {
      outOfBounds = true;
    }
  }

  const avgConfidence = requiredJoints.length > 0 ? totalConfidence / requiredJoints.length : 0;
  const isSufficientlyVisible = visibleCount >= Math.ceil(requiredJoints.length * 0.75);

  if (outOfBounds) {
    return {
      isProperlyFramed: false,
      message: 'Body too close to edge. Step back and center yourself.',
      visibleJointCount: visibleCount,
      confidence: avgConfidence,
    };
  }

  if (!isSufficientlyVisible) {
    return {
      isProperlyFramed: false,
      message: 'Ensure full body from shoulders to feet is visible.',
      visibleJointCount: visibleCount,
      confidence: avgConfidence,
    };
  }

  return {
    isProperlyFramed: true,
    message: 'Good positioning. Ready for assessment.',
    visibleJointCount: visibleCount,
    confidence: avgConfidence,
  };
}

/**
 * Visual Canvas Skeleton Drawer for MediaPipe 33 Landmarks
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  options: {
    pointColor?: string;
    lineColor?: string;
    pointRadius?: number;
    lineWidth?: number;
    minConfidence?: number;
    showAngleHighlights?: boolean;
  } = {}
) {
  const {
    pointColor = '#06b6d4',
    lineColor = 'rgba(6, 182, 212, 0.75)',
    pointRadius = 4,
    lineWidth = 3,
    minConfidence = 0.5,
  } = options;

  if (!landmarks || landmarks.length === 0) return;

  ctx.save();
  ctx.lineWidth = lineWidth;

  // 1. Draw Connections (Bones)
  for (const connection of POSE_CONNECTIONS) {
    const p1 = landmarks[connection.start];
    const p2 = landmarks[connection.end];

    if (!p1 || !p2) continue;
    if (
      (p1.visibility !== undefined && p1.visibility < minConfidence) ||
      (p2.visibility !== undefined && p2.visibility < minConfidence)
    ) {
      continue;
    }

    const x1 = p1.x * width;
    const y1 = p1.y * height;
    const x2 = p2.x * width;
    const y2 = p2.y * height;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, lineColor);
    gradient.addColorStop(1, '#8b5cf6');

    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 2. Draw Keypoints (Joints)
  for (let i = 0; i < landmarks.length; i++) {
    const point = landmarks[i];
    if (!point || (point.visibility !== undefined && point.visibility < minConfidence)) {
      continue;
    }

    const cx = point.x * width;
    const cy = point.y * height;

    // Major joints glow larger
    const isMajorJoint = [
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.RIGHT_KNEE,
    ].includes(i);

    const radius = isMajorJoint ? pointRadius + 2 : pointRadius;

    ctx.fillStyle = isMajorJoint ? '#10b981' : pointColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Modular Pose Estimator Interface
 */
export class PoseEngine {
  private isInitialized = false;
  private pose: Pose | null = null;

  public async initialize(
    onResults: (results: Results) => void,
    config: PoseDetectorConfig = {}
  ): Promise<boolean> {
    this.pose = createPoseDetector(onResults, config);
    await this.pose.initialize();
    this.isInitialized = true;
    return this.isInitialized;
  }

  public getDetector(): Pose | null {
    return this.pose;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public close(): void {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
      this.isInitialized = false;
    }
  }
}