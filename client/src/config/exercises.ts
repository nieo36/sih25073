export type ExerciseType = 'squat' | 'pushup' | 'curl';

export interface ExerciseConfig {
  id: ExerciseType;
  name: string;
  category: string;
  objective: string;
  equipment: string;
  cameraSetup: {
    view: string;
    positioning: string;
    targetHeight: string;
    instructions: string;
  };
  instructions: string[];
  measuredMetrics: string[];
  warnings: string[];
  improvementSuggestions: Record<string, string>;
}

export const EXERCISE_CONFIGS: Record<ExerciseType, ExerciseConfig> = {
  curl: {
    id: 'curl',
    name: 'Dumbbell Curl',
    category: 'Upper-Body Strength',
    objective: 'Evaluate upper-body movement quality, range of motion, stability, tempo and repetition consistency.',
    equipment: 'Dumbbell or Hand Weight',
    cameraSetup: {
      view: 'Side or Angled Side View',
      positioning: 'Upper body and working arm clearly visible',
      targetHeight: 'Waist / Elbow Height',
      instructions: 'Position camera at waist height on your side so working arm, elbow, and torso are clearly visible.',
    },
    instructions: [
      'Stand upright with the dumbbell at your side.',
      'Keep your elbow close to your torso.',
      'Curl the dumbbell toward your shoulder.',
      'Avoid swinging your torso.',
      'Lower the dumbbell under control.',
      'Complete the required repetitions.',
    ],
    measuredMetrics: [
      'Rep count',
      'Elbow angle / range of motion',
      'Elbow stability & position',
      'Tempo & lowering control',
      'Torso stability / anti-momentum',
      'Rep-to-rep consistency',
    ],
    warnings: [
      'Excessive torso movement',
      'Elbow moving too far forward',
      'Incomplete range of motion',
      'Excessively fast lowering',
      'Excessive shoulder compensation',
      'Inconsistent repetitions',
    ],
    improvementSuggestions: {
      'Excessive torso movement': 'Keep your torso steady and avoid swinging your upper body to lift weight.',
      'Elbow moving too far forward': 'Lock your upper arm against your ribs so the pivot stays at the elbow joint.',
      'Incomplete range of motion': 'Extend fully at the bottom (~160°+) and curl up to chest level (~45°).',
      'Excessively fast lowering': 'Control the eccentric phase on the way down (~2 seconds).',
      'Excessive shoulder compensation': 'Lower weight if needed to isolate the biceps without lifting the shoulder.',
    },
  },

  pushup: {
    id: 'pushup',
    name: 'Push-Up',
    category: 'Upper-Body Endurance & Core',
    objective: 'Evaluate upper-body endurance, chest/triceps power, body alignment and push-up movement quality.',
    equipment: 'Mat (Optional)',
    cameraSetup: {
      view: 'Side Profile View',
      positioning: 'Full body visible (head, shoulders, hips, feet)',
      targetHeight: 'Floor / Knee Height',
      instructions: 'Position camera sideways on floor/knee height so head, shoulders, hips, and feet are visible.',
    },
    instructions: [
      'Start in a high-plank position.',
      'Keep your body aligned from head to heels.',
      'Lower your body in a controlled movement.',
      'Maintain stable hips and torso without sagging.',
      'Push back to the starting position.',
      'Complete the required repetitions.',
    ],
    measuredMetrics: [
      'Rep count',
      'Push-up depth & elbow angle',
      'Spine & body alignment',
      'Hip stability',
      'Tempo & control',
      'Rep consistency',
    ],
    warnings: [
      'Hips sagging',
      'Hips too high',
      'Insufficient depth',
      'Excessive elbow flare',
      'Poor body alignment',
      'Inconsistent tempo',
      'Incomplete repetitions',
    ],
    improvementSuggestions: {
      'Hips sagging': 'Engage your core and glutes to maintain a rigid plank line.',
      'Hips too high': 'Lower your hips to form a straight plane from shoulders to ankles.',
      'Insufficient depth': 'Lower your chest until your elbows reach 90 degrees or below.',
      'Poor body alignment': 'Focus on keeping neck neutral and pelvis level during repetition.',
    },
  },

  squat: {
    id: 'squat',
    name: 'Deep Squat',
    category: 'Lower-Body Power & Mobility',
    objective: 'Evaluate lower-body movement quality, squat depth, knee alignment, stability and consistency.',
    equipment: 'Bodyweight',
    cameraSetup: {
      view: 'Front or Angled Side View',
      positioning: 'Full body and feet fully visible',
      targetHeight: 'Waist Height',
      instructions: 'Position camera at waist height 6-8ft away so full body from head to feet is visible.',
    },
    instructions: [
      'Stand with feet approximately shoulder-width apart.',
      'Keep your torso controlled.',
      'Bend your hips and knees to descend.',
      'Reach the required squat depth below 90°.',
      'Keep your knees aligned with your feet.',
      'Return to standing under control.',
      'Complete the required repetitions.',
    ],
    measuredMetrics: [
      'Rep count',
      'Squat depth angle',
      'Knee & hip alignment',
      'Bilateral symmetry',
      'Tempo & control',
      'Rep consistency',
    ],
    warnings: [
      'Insufficient depth',
      'Knees collapsing inward',
      'Excessive forward lean',
      'Heels lifting',
      'Uneven movement',
      'Inconsistent tempo',
      'Incomplete repetitions',
    ],
    improvementSuggestions: {
      'Insufficient depth': 'Sink your hips lower until thighs are parallel (<=90°) to the ground.',
      'Knees collapsing inward': 'Push knees outward over toes to maintain knee stability.',
      'Excessive forward lean': 'Keep your chest lifted and engage core to stay upright.',
      'Uneven movement': 'Distribute weight evenly across both feet during descent.',
    },
  },
};
