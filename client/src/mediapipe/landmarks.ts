/**
 * MediaPipe Pose Landmark Definitions & Utilities
 * Standard 33 Keypoint Pose Topology
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface LandmarkConnection {
  start: number;
  end: number;
}

export enum PoseLandmark {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

// MediaPipe 33 Landmark Connections for Skeleton Rendering
export const POSE_CONNECTIONS: LandmarkConnection[] = [
  // Head
  { start: PoseLandmark.NOSE, end: PoseLandmark.LEFT_EYE_INNER },
  { start: PoseLandmark.LEFT_EYE_INNER, end: PoseLandmark.LEFT_EYE },
  { start: PoseLandmark.LEFT_EYE, end: PoseLandmark.LEFT_EYE_OUTER },
  { start: PoseLandmark.LEFT_EYE_OUTER, end: PoseLandmark.LEFT_EAR },
  { start: PoseLandmark.NOSE, end: PoseLandmark.RIGHT_EYE_INNER },
  { start: PoseLandmark.RIGHT_EYE_INNER, end: PoseLandmark.RIGHT_EYE },
  { start: PoseLandmark.RIGHT_EYE, end: PoseLandmark.RIGHT_EYE_OUTER },
  { start: PoseLandmark.RIGHT_EYE_OUTER, end: PoseLandmark.RIGHT_EAR },
  { start: PoseLandmark.MOUTH_LEFT, end: PoseLandmark.MOUTH_RIGHT },

  // Torso
  { start: PoseLandmark.LEFT_SHOULDER, end: PoseLandmark.RIGHT_SHOULDER },
  { start: PoseLandmark.LEFT_SHOULDER, end: PoseLandmark.LEFT_HIP },
  { start: PoseLandmark.RIGHT_SHOULDER, end: PoseLandmark.RIGHT_HIP },
  { start: PoseLandmark.LEFT_HIP, end: PoseLandmark.RIGHT_HIP },

  // Left Arm
  { start: PoseLandmark.LEFT_SHOULDER, end: PoseLandmark.LEFT_ELBOW },
  { start: PoseLandmark.LEFT_ELBOW, end: PoseLandmark.LEFT_WRIST },
  { start: PoseLandmark.LEFT_WRIST, end: PoseLandmark.LEFT_PINKY },
  { start: PoseLandmark.LEFT_WRIST, end: PoseLandmark.LEFT_INDEX },
  { start: PoseLandmark.LEFT_WRIST, end: PoseLandmark.LEFT_THUMB },

  // Right Arm
  { start: PoseLandmark.RIGHT_SHOULDER, end: PoseLandmark.RIGHT_ELBOW },
  { start: PoseLandmark.RIGHT_ELBOW, end: PoseLandmark.RIGHT_WRIST },
  { start: PoseLandmark.RIGHT_WRIST, end: PoseLandmark.RIGHT_PINKY },
  { start: PoseLandmark.RIGHT_WRIST, end: PoseLandmark.RIGHT_INDEX },
  { start: PoseLandmark.RIGHT_WRIST, end: PoseLandmark.RIGHT_THUMB },

  // Left Leg
  { start: PoseLandmark.LEFT_HIP, end: PoseLandmark.LEFT_KNEE },
  { start: PoseLandmark.LEFT_KNEE, end: PoseLandmark.LEFT_ANKLE },
  { start: PoseLandmark.LEFT_ANKLE, end: PoseLandmark.LEFT_HEEL },
  { start: PoseLandmark.LEFT_HEEL, end: PoseLandmark.LEFT_FOOT_INDEX },
  { start: PoseLandmark.LEFT_ANKLE, end: PoseLandmark.LEFT_FOOT_INDEX },

  // Right Leg
  { start: PoseLandmark.RIGHT_HIP, end: PoseLandmark.RIGHT_KNEE },
  { start: PoseLandmark.RIGHT_KNEE, end: PoseLandmark.RIGHT_ANKLE },
  { start: PoseLandmark.RIGHT_ANKLE, end: PoseLandmark.RIGHT_HEEL },
  { start: PoseLandmark.RIGHT_HEEL, end: PoseLandmark.RIGHT_FOOT_INDEX },
  { start: PoseLandmark.RIGHT_ANKLE, end: PoseLandmark.RIGHT_FOOT_INDEX },
];

/**
 * Checks whether key landmarks have acceptable visibility confidence
 */
export function areLandmarksVisible(
  landmarks: NormalizedLandmark[],
  indices: PoseLandmark[],
  threshold = 0.25
): boolean {
  if (!landmarks || landmarks.length === 0) return false;
  let visibleCount = 0;
  for (const idx of indices) {
    const point = landmarks[idx];
    if (point && (point.visibility === undefined || point.visibility >= threshold)) {
      visibleCount++;
    }
  }
  return visibleCount >= Math.max(1, Math.ceil(indices.length * 0.4));
}

/**
 * Validates if a person is in frame with acceptable core landmark visibility
 */
export function isPersonDetectedInFrame(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 33) return false;
  const coreIndices = [
    PoseLandmark.LEFT_SHOULDER,
    PoseLandmark.RIGHT_SHOULDER,
    PoseLandmark.LEFT_HIP,
    PoseLandmark.RIGHT_HIP,
  ];
  return areLandmarksVisible(landmarks, coreIndices, 0.45);
}

