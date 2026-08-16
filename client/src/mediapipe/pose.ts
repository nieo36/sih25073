import { NormalizedLandmark, POSE_CONNECTIONS, PoseLandmark } from './landmarks';

export interface PoseDetectorConfig {
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
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
    minConfidence = 0.4,
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

  public async initialize(_config: PoseDetectorConfig = {}): Promise<boolean> {
    // Config hook for MediaPipe Vision / WebAssembly runtime
    this.isInitialized = true;
    return this.isInitialized;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}
