export type SportCategory = 'Basketball' | 'Boxing' | 'Weightlifting' | 'General';

export type ExerciseType =
  // General / Legacy
  | 'curl'
  | 'pushup'
  | 'squat'
  // Basketball
  | 'basketball_vertical_jump'
  | 'basketball_agility'
  | 'basketball_sprint'
  | 'basketball_shooting_form'
  | 'basketball_defensive_stance'
  | 'basketball_lateral_movement'
  // Boxing
  | 'boxing_punch_speed'
  | 'boxing_reaction_time'
  | 'boxing_stance'
  | 'boxing_guard_position'
  | 'boxing_footwork'
  | 'boxing_hip_rotation'
  // Weightlifting
  | 'weightlifting_squat_depth'
  | 'weightlifting_bar_path'
  | 'weightlifting_joint_angles'
  | 'weightlifting_stability'
  | 'weightlifting_tempo'
  | 'weightlifting_lifting_technique';

export interface ExerciseConfig {
  id: ExerciseType;
  name: string;
  sport: SportCategory;
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
  // ==========================================
  // 🏀 BASKETBALL
  // ==========================================
  basketball_vertical_jump: {
    id: 'basketball_vertical_jump',
    name: 'Vertical Jump',
    sport: 'Basketball',
    category: 'Explosive Power',
    objective: 'Evaluate takeoff loading depth, bilateral leg symmetry, vertical explosion power, and soft landing mechanics.',
    equipment: 'Open Floor Space',
    cameraSetup: {
      view: 'Side Profile or 45° Angled View',
      positioning: 'Full athlete body visible from head to feet (6-8 ft away)',
      targetHeight: 'Waist / Hip Height',
      instructions: 'Position camera sideways at waist height so your takeoff crouch, air peak, and knees on landing are fully visible.',
    },
    instructions: [
      'Stand tall with feet shoulder-width apart.',
      'Drop your hips and bend knees deeply to load power.',
      'Explode straight up toward the ceiling with maximum power.',
      'Land softly on the balls of your feet, absorbing shock through bent knees.',
      'Reset to standing position for the next jump.',
    ],
    measuredMetrics: [
      'Jump count',
      'Loading knee angle & depth %',
      'Takeoff bilateral symmetry',
      'Airborne extension',
      'Landing impact absorption',
    ],
    warnings: [
      'Uneven leg loading — balance both feet',
      'Forward trunk lean — keep chest up',
      'Stiff landing — absorb impact with bent knees',
      'Insufficient loading depth',
    ],
    improvementSuggestions: {
      'Uneven leg loading — balance both feet': 'Distribute bodyweight evenly across both feet before takeoff.',
      'Forward trunk lean — keep chest up': 'Keep your chest tall while hinging at the hips during the loading phase.',
      'Stiff landing — absorb impact with bent knees': 'Land on the balls of your feet and let your knees flex to 120°+ to absorb force.',
    },
  },

  basketball_agility: {
    id: 'basketball_agility',
    name: 'Agility & Shuttle',
    sport: 'Basketball',
    category: 'Lateral Quickness',
    objective: 'Evaluate lateral acceleration, defensive center-of-mass control, and quick direction changes.',
    equipment: 'Open Floor (8-10 ft lateral space)',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Full body visible with 4-5 feet of clearance on both sides',
      targetHeight: 'Waist Height',
      instructions: 'Place camera in front at waist height with enough room to shuffle 3-4 steps left and right.',
    },
    instructions: [
      'Get into a low defensive stance with knees bent and chest proud.',
      'Shuffle rapidly to your left, staying low to the floor.',
      'Plant your outside foot and sharply change direction to the right.',
      'Avoid crossing your feet or bobbing up and down.',
      'Maintain an active low athletic posture throughout.',
    ],
    measuredMetrics: [
      'Direction change count',
      'Lateral speed index',
      'Stance hip height & knee flex',
      'Center of mass stability',
    ],
    warnings: [
      'Hips too high — bend your knees more',
      'Overly deep stance — slight inefficiency',
      'Weight unevenly distributed between feet',
      'Standing up during direction change',
    ],
    improvementSuggestions: {
      'Hips too high — bend your knees more': 'Drop your hips down into a 120° knee flex for explosive lateral reactivity.',
      'Weight unevenly distributed between feet': 'Keep your center of gravity balanced between your feet during slides.',
    },
  },

  basketball_sprint: {
    id: 'basketball_sprint',
    name: 'Sprint Mechanics',
    sport: 'Basketball',
    category: 'Linear Speed & Acceleration',
    objective: 'Analyze high knee drive, aggressive 90° arm swing, forward acceleration lean, and bilateral stride symmetry.',
    equipment: 'Open Runway / Treadmill',
    cameraSetup: {
      view: 'Side Profile View',
      positioning: 'Athlete side profile visible in motion',
      targetHeight: 'Chest / Hip Height',
      instructions: 'Position camera sideways to capture knee lift height, arm swing angle, and forward torso lean.',
    },
    instructions: [
      'Begin in an athletic ready position.',
      'Drive forward with explosive knee lifts and aggressive arm drive.',
      'Keep your elbows bent at 90° pumping front to back.',
      'Maintain a slight forward lean from the ankles, not waist.',
      'Sprint through the capture zone with consistent cadence.',
    ],
    measuredMetrics: [
      'Stride count & cadence score',
      'Knee drive elevation angle',
      'Arm drive 90° angle score',
      'Forward lean angle',
      'Stride symmetry',
    ],
    warnings: [
      'Arms too straight — pump elbows at 90°',
      'Too upright — lean forward at hips',
      'Excessive forward lean — risk of tripping',
      'Low knee drive — lift knees higher',
      'Asymmetric stride — balance left/right knee drive',
    ],
    improvementSuggestions: {
      'Arms too straight — pump elbows at 90°': 'Lock elbows at 90 degrees and drive hands from hip to chin.',
      'Low knee drive — lift knees higher': 'Drive your lead knee aggressively upward toward chest level on each stride.',
    },
  },

  basketball_shooting_form: {
    id: 'basketball_shooting_form',
    name: 'Shooting Form',
    sport: 'Basketball',
    category: 'Biomechanical Shooting Mechanics',
    objective: 'Evaluate set point elbow angle (~90°), vertical shooting platform alignment, elbow tuck, and follow-through wrist snap.',
    equipment: 'Basketball (or simulated shot)',
    cameraSetup: {
      view: 'Front or 45° Shooting Side View',
      positioning: 'Upper body and shooting arm clearly visible in frame',
      targetHeight: 'Chest Height',
      instructions: 'Position camera in front or slightly to your shooting hand side so elbow, wrist, and hip alignment are clear.',
    },
    instructions: [
      'Set your feet shoulder-width apart with dominant foot slightly forward.',
      'Bring the ball to set point with elbow tucked under the ball at ~90°.',
      'Dip knees and elevate upward smoothly in one continuous motion.',
      'Extend shooting arm fully toward target and flick wrist (goose neck).',
      'Hold your follow-through until the ball reaches the hoop.',
    ],
    measuredMetrics: [
      'Shot count',
      'Shooting elbow set point angle',
      'Wrist snap & lift score',
      'Vertical platform alignment (hip-shoulder-elbow)',
      'Elbow tuck score (preventing flare)',
    ],
    warnings: [
      'Elbow too tucked — ball behind ear',
      'Elbow flaring out — keep elbow in',
      'Hip-shoulder-elbow misalignment',
      'Incomplete follow-through',
    ],
    improvementSuggestions: {
      'Elbow flaring out — keep elbow in': 'Point your shooting elbow directly toward the basket rim before release.',
      'Incomplete follow-through': 'Hold your wrist flexed with fingers pointing down ("hand in the cookie jar").',
    },
  },

  basketball_defensive_stance: {
    id: 'basketball_defensive_stance',
    name: 'Defensive Stance',
    sport: 'Basketball',
    category: 'Defensive Fundamentals',
    objective: 'Measure low athletic knee bend (100-130°), wide base of support, extended active hands, and upright torso posture.',
    equipment: 'Open Floor Space',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Full body clearly visible from head to feet',
      targetHeight: 'Waist Height',
      instructions: 'Face camera directly 6-8 ft away so feet width, knee bend, and arm spread are captured.',
    },
    instructions: [
      'Spread feet wider than shoulder-width apart.',
      'Drop your hips down and flex knees between 100° and 130°.',
      'Keep your chest proud with a slight natural forward lean.',
      'Spread arms wide with palms up and active hands.',
      'Stay balanced on the balls of your feet ready to slide.',
    ],
    measuredMetrics: [
      'Defensive stance depth score',
      'Knee flexion angle',
      'Base width ratio (feet vs shoulders)',
      'Arm reach & hand activity score',
      'Torso posture alignment',
    ],
    warnings: [
      'Legs too straight — bend knees to 110-130°',
      'Overly deep stance — too deep to react quickly',
      'Feet too narrow — widen your stance',
      'Arms down — put your hands up!',
      'Excessive torso lean',
    ],
    improvementSuggestions: {
      'Legs too straight — bend knees to 110-130°': 'Sink down into your hips and load the quads and glutes.',
      'Arms down — put your hands up!': 'Raise hands to chest height with elbows slightly flexed to contest passes.',
    },
  },

  basketball_lateral_movement: {
    id: 'basketball_lateral_movement',
    name: 'Lateral Movement & Slide',
    sport: 'Basketball',
    category: 'Footwork & Agility',
    objective: 'Analyze defensive sliding mechanics, prevent crossing feet, track knee flex consistency, and evaluate lateral velocity.',
    equipment: 'Open Floor Space',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Full body visible with 4-5 feet of side clearance',
      targetHeight: 'Waist Height',
      instructions: 'Position camera in front at waist height with room to slide laterally.',
    },
    instructions: [
      'Drop into a balanced defensive stance.',
      'Push off your trailing foot and slide laterally without hopping.',
      'Lead with your near foot and slide the trailing foot inward.',
      'DO NOT cross your feet at any point during defensive slides.',
      'Change direction and slide back across the screen.',
    ],
    measuredMetrics: [
      'Slide rep count',
      'Step pattern quality (slide vs crossover)',
      'Knee flex angle during movement',
      'Lateral movement velocity',
      'Bilateral symmetry',
    ],
    warnings: [
      'Crossover step detected — use slide step on defense',
      'Legs too straight during slides',
      'Uneven knee bend during slide',
      'Hopping instead of sliding',
    ],
    improvementSuggestions: {
      'Crossover step detected — use slide step on defense': 'Keep feet spaced apart and never let your ankles cross on defense.',
      'Legs too straight during slides': 'Stay low through every slide — avoid rising up between steps.',
    },
  },

  // ==========================================
  // 🥊 BOXING
  // ==========================================
  boxing_punch_speed: {
    id: 'boxing_punch_speed',
    name: 'Punch Speed & Snap',
    sport: 'Boxing',
    category: 'Upper-Body Hand Speed',
    objective: 'Track wrist landmark velocity, explosive punch extension, and rapid retraction back to guard.',
    equipment: 'Open Space (Gloves Optional)',
    cameraSetup: {
      view: 'Front or 45° Angle Camera',
      positioning: 'Upper body and torso clearly visible',
      targetHeight: 'Chest Height',
      instructions: 'Stand facing camera in boxing stance with hands and elbows clearly framed.',
    },
    instructions: [
      'Assume your boxing guard with fists protecting your chin.',
      'Throw a fast, snappy jab or cross straight toward the camera.',
      'Fully extend your elbow at contact point while rotating fist.',
      'Snap your hand back to chin level as fast as it went out.',
      'Repeat with maximum speed and snappy retraction.',
    ],
    measuredMetrics: [
      'Punch count (Left/Right)',
      'Wrist velocity index',
      'Extension elbow angle',
      'Retraction speed score',
      'Overall punch snap rating',
    ],
    warnings: [
      'Punch too slow — lack of explosive power',
      'Incomplete extension — reach full lock',
      'Slow retraction — leave hand hanging',
      'Dropping non-punching hand',
    ],
    improvementSuggestions: {
      'Punch too slow — lack of explosive power': 'Relax shoulders before punch; tense only at the instant of impact.',
      'Slow retraction — leave hand hanging': 'Pull the hand back on the exact same trajectory faster than you threw it.',
    },
  },

  boxing_reaction_time: {
    id: 'boxing_reaction_time',
    name: 'Reaction Time',
    sport: 'Boxing',
    category: 'Neuromuscular Reactivity',
    objective: 'Calibrate resting guard baseline, then measure millisecond latency from guard to full extension and guard restoration.',
    equipment: 'Open Space',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Upper torso and fists visible',
      targetHeight: 'Chest Height',
      instructions: 'Hold guard steady in front of camera to calibrate baseline before initiating explosive punches.',
    },
    instructions: [
      'Hold a tight guard in front of the camera for 2 seconds to calibrate.',
      'On your own signal or visual cue, explode with an immediate punch.',
      'Reach full extension in minimum frame time.',
      'Instantly restore guard position to stop the timer.',
    ],
    measuredMetrics: [
      'Reaction attempts count',
      'Average latency (estimated ms & frame count)',
      'Explosive acceleration score',
      'Guard restoration speed',
    ],
    warnings: [
      'Punch timed out — react faster!',
      'Premature flinch before calibration',
      'Slow guard return',
    ],
    improvementSuggestions: {
      'Punch timed out — react faster!': 'Stay loose in the shoulders and explode off the rear foot.',
      'Slow guard return': 'Treat the return as part of the punch cycle — snap back to chin instantly.',
    },
  },

  boxing_stance: {
    id: 'boxing_stance',
    name: 'Boxing Stance',
    sport: 'Boxing',
    category: 'Stance & Balance Fundamentals',
    objective: 'Evaluate foot separation, orthodox vs southpaw detection, weight distribution over center of mass, and slight knee springiness.',
    equipment: 'Open Floor Space',
    cameraSetup: {
      view: 'Front or 45° Angle Camera',
      positioning: 'Full body from head to feet visible',
      targetHeight: 'Waist Height',
      instructions: 'Stand 6-8 ft away so your staggered feet, knees, and torso angle are clearly in frame.',
    },
    instructions: [
      'Stagger your feet: dominant side back (Orthodox = left forward, Southpaw = right forward).',
      'Keep feet shoulder-width apart and angled at ~45°.',
      'Bend knees slightly for springiness and lower center of mass.',
      'Distribute weight 50/50 across both feet.',
      'Keep chin down and eyes looking through eyebrows.',
    ],
    measuredMetrics: [
      'Stance type (Orthodox / Southpaw / Square)',
      'Foot separation ratio',
      'Weight distribution balance score',
      'Knee flexion angle',
      'Overall stance quality score',
    ],
    warnings: [
      'Square stance — vulnerable to counter attacks',
      'Feet too close together',
      'Feet too wide — reduces mobility',
      'Legs too straight — add a soft knee bend',
      'Weight shifted off center',
    ],
    improvementSuggestions: {
      'Square stance — vulnerable to counter attacks': 'Turn your hips sideways and step one foot forward to minimize target area.',
      'Feet too close together': 'Widen your base to at least shoulder width for solid punching power.',
    },
  },

  boxing_guard_position: {
    id: 'boxing_guard_position',
    name: 'Guard Position',
    sport: 'Boxing',
    category: 'Defensive Protection',
    objective: 'Monitor chin protection, fist height relative to nose landmark, and elbow tucking against torso.',
    equipment: 'Open Space',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Head and upper torso framed clearly',
      targetHeight: 'Chest / Head Height',
      instructions: 'Position camera at chest height facing you directly.',
    },
    instructions: [
      'Raise both hands so fists sit just below cheekbones / chin level.',
      'Tuck elbows firmly into your ribs to protect your body.',
      'Tuck your chin down behind your lead shoulder.',
      'Maintain tight guard while making small defensive adjustments.',
    ],
    measuredMetrics: [
      'Left/Right fist height score (vs chin)',
      'Elbow tuck & rib coverage score',
      'Chin protection score',
      'Overall guard integrity %',
    ],
    warnings: [
      'Left fist too low — protect your chin!',
      'Right fist too low — protect your chin!',
      'Elbows flaring out — exposing body',
      'Chin exposed — tuck your chin down',
    ],
    improvementSuggestions: {
      'Left fist too low — protect your chin!': 'Glue your hands to your face — never let wrists drop below mouth level.',
      'Elbows flaring out — exposing body': 'Squeeze elbows against your ribcage to protect your liver and solar plexus.',
    },
  },

  boxing_footwork: {
    id: 'boxing_footwork',
    name: 'Footwork & Agility',
    sport: 'Boxing',
    category: 'Ring Mobility',
    objective: 'Track active footwork on balls of feet, detect crossed legs, analyze weight shifts during circling, and evaluate balance.',
    equipment: 'Open Floor Space',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Full body including feet and ankles visible',
      targetHeight: 'Waist Height',
      instructions: 'Ensure feet and floor contact are clearly framed.',
    },
    instructions: [
      'Stay light on the balls of your feet with heels slightly raised.',
      'Step and slide around your training area (advance, retreat, circle).',
      'Step with the foot closest to the direction you want to move.',
      'Never cross your legs or allow feet to touch together.',
    ],
    measuredMetrics: [
      'Footwork step count',
      'Active foot score (heel lift)',
      'Balance & center-of-mass stability',
      'Weight shift coordination',
      'Crossed feet safety check',
    ],
    warnings: [
      'Feet crossed — dangerous position!',
      'Flat-footed — stay on balls of feet',
      'Excessive weight shift — losing balance',
      'Dragging feet on floor',
    ],
    improvementSuggestions: {
      'Feet crossed — dangerous position!': 'Lead foot moves first when advancing, rear foot moves first when retreating.',
      'Flat-footed — stay on balls of feet': 'Keep your rear heel elevated off the canvas for springiness and push power.',
    },
  },

  boxing_hip_rotation: {
    id: 'boxing_hip_rotation',
    name: 'Hip Rotation & Kinetic Chain',
    sport: 'Boxing',
    category: 'Punching Power Generation',
    objective: 'Measure degrees of hip rotation, angular velocity, and hip-to-shoulder kinematic sequence for maximum punch power.',
    equipment: 'Open Space',
    cameraSetup: {
      view: 'Front or 45° Angle Camera',
      positioning: 'Shoulders, hips, and knees clearly visible',
      targetHeight: 'Chest / Waist Height',
      instructions: 'Stand facing camera in boxing stance with hips and shoulders unobstructed.',
    },
    instructions: [
      'Calibrate in your boxing stance for 1-2 seconds.',
      'Initiate a power punch (cross or hook) by pivoting your rear foot.',
      'Drive and snap your hips forward before your shoulders rotate.',
      'Let your shoulder and arm follow through as a whip.',
      'Return to neutral stance and repeat.',
    ],
    measuredMetrics: [
      'Rotation rep count',
      'Hip rotation angle (degrees)',
      'Shoulder rotation angle',
      'Kinetic chain sync score (hips before shoulders)',
      'Rotational power index',
    ],
    warnings: [
      'Shoulders rotating before hips — losing power',
      'Insufficient hip rotation — arm punch only',
      'Over-rotating and falling off balance',
    ],
    improvementSuggestions: {
      'Shoulders rotating before hips — losing power': 'Think of turning your belt buckle toward the target before the fist leaves your face.',
      'Insufficient hip rotation — arm punch only': 'Pivot hard on the ball of your back foot and drive the hip through.',
    },
  },

  // ==========================================
  // 🏋️ WEIGHTLIFTING
  // ==========================================
  weightlifting_squat_depth: {
    id: 'weightlifting_squat_depth',
    name: 'Squat Depth & Biomechanics',
    sport: 'Weightlifting',
    category: 'Lower Body Strength & Mobility',
    objective: 'Evaluate parallel/sub-parallel squat depth (<=90° knee angle), knee valgus (cave-in), heel rise, trunk angle, and symmetry.',
    equipment: 'Barbell / Dumbbell / Bodyweight',
    cameraSetup: {
      view: 'Side Profile or 45° Angle View',
      positioning: 'Full body from head to feet visible',
      targetHeight: 'Waist Height',
      instructions: 'Position camera at waist height sideways so hip crease depth relative to knee is clearly visible.',
    },
    instructions: [
      'Stand with feet shoulder-width apart and toes angled slightly outward.',
      'Brace core and sit hips back and down.',
      'Descend until hip crease is below top of knees (parallel or below 90°).',
      'Push knees outward over toes without caving inward.',
      'Keep heels pinned to the floor and drive up through mid-foot.',
    ],
    measuredMetrics: [
      'Rep count',
      'Knee angle at bottom depth',
      'Knee valgus stability score (anti-cave)',
      'Heel rise detection score',
      'Trunk lean angle',
      'Bilateral symmetry',
    ],
    warnings: [
      'Knee cave detected — push knees out!',
      'Excessive forward lean — risk of lower back strain',
      'Heels rising off ground — work on ankle mobility',
      'Insufficient depth — reach parallel',
      'Uneven left/right movement',
    ],
    improvementSuggestions: {
      'Knee cave detected — push knees out!': 'Actively spread the floor with your feet and push your knees out in line with your pinky toes.',
      'Heels rising off ground — work on ankle mobility': 'Drive weight through mid-foot/heels or elevate heels slightly on small plates.',
      'Insufficient depth — reach parallel': 'Sink down until your thighs are completely parallel to the ground.',
    },
  },

  weightlifting_bar_path: {
    id: 'weightlifting_bar_path',
    name: 'Bar / Movement Path',
    sport: 'Weightlifting',
    category: 'Kinematic Efficiency',
    objective: 'Track vertical bar trajectory, measure horizontal deviation from ideal vertical line, and analyze bar-to-body proximity.',
    equipment: 'Barbell / Dumbbell / Broomstick',
    cameraSetup: {
      view: 'Direct Side Profile View (90°)',
      positioning: 'Full lift profile visible from side',
      targetHeight: 'Waist / Chest Height',
      instructions: 'Place camera directly at 90° side profile to accurately track horizontal bar drift.',
    },
    instructions: [
      'Grip the bar with hands positioned for your lift (Squat, Deadlift, Press).',
      'Initiate the concentric lifting phase smoothly.',
      'Keep the bar as close to your body/mid-foot line as possible.',
      'Reach full lockout at the top.',
      'Control the descent along the exact same vertical track.',
    ],
    measuredMetrics: [
      'Rep count',
      'Horizontal bar path deviation (mm)',
      'Bar proximity / body drift score',
      'Rep-to-rep path consistency',
      'Concentric vs eccentric track overlap',
    ],
    warnings: [
      'Bar drifting away from body',
      'Bar swinging horizontally',
      'Inconsistent bar path between reps',
    ],
    improvementSuggestions: {
      'Bar drifting away from body': 'Engage your lats to keep the bar shaved against your shins and thighs.',
      'Bar swinging horizontally': 'Drive straight upward instead of looping the bar around your knees.',
    },
  },

  weightlifting_joint_angles: {
    id: 'weightlifting_joint_angles',
    name: 'Joint Angles & Kinematics',
    sport: 'Weightlifting',
    category: 'Multi-Joint Postural Analysis',
    objective: 'Real-time multi-joint tracking of hips, knees, elbows, shoulders, trunk lean, and bilateral joint symmetry.',
    equipment: 'Barbell / Dumbbells / Bodyweight',
    cameraSetup: {
      view: 'Front or 45° Angle View',
      positioning: 'Full body clearly visible',
      targetHeight: 'Waist Height',
      instructions: 'Position camera so all 8 major joints (shoulders, elbows, hips, knees) are in frame simultaneously.',
    },
    instructions: [
      'Perform compound lifting movements (Squat, Overhead Press, Clean, Row).',
      'Observe real-time joint angles displayed over your skeleton.',
      'Maintain symmetric angles between your left and right sides.',
      'Avoid excessive trunk lean or joint hyperextension.',
    ],
    measuredMetrics: [
      'Left/Right Hip angle (°)',
      'Left/Right Knee angle (°)',
      'Left/Right Elbow angle (°)',
      'Left/Right Shoulder angle (°)',
      'Trunk lean angle (°)',
      'Bilateral symmetry score',
    ],
    warnings: [
      'Hip angle asymmetry detected',
      'Knee angle asymmetry detected',
      'Excessive forward lean',
      'Elbow asymmetry — check grip and bar position',
    ],
    improvementSuggestions: {
      'Hip angle asymmetry detected': 'Check your foot stance and ensure both hips descend at the same rate.',
      'Elbow asymmetry — check grip and bar position': 'Measure your grip evenly from the barbell knurling marks.',
    },
  },

  weightlifting_stability: {
    id: 'weightlifting_stability',
    name: 'Stability & Core Control',
    sport: 'Weightlifting',
    category: 'Structural Balance',
    objective: 'Monitor lateral torso sway, shoulder-to-hip parallelism (anti-rotation), and high-frequency wobble/oscillation during heavy loads.',
    equipment: 'Barbell / Dumbbells / Bodyweight',
    cameraSetup: {
      view: 'Front Facing Camera',
      positioning: 'Full upper torso and shoulders clearly framed',
      targetHeight: 'Chest Height',
      instructions: 'Face camera directly so lateral sway and shoulder tilt are measured with high precision.',
    },
    instructions: [
      'Unrack or hold your lifting load in a stable posture.',
      'Brace your 360° core tightly before initiating movement.',
      'Perform your lift without letting your shoulders tilt or body sway side-to-side.',
      'Control the eccentric phase without shaking or wobbling.',
    ],
    measuredMetrics: [
      'Lateral sway stability score',
      'Shoulder-hip parallelism angle (°)',
      'Anti-oscillation / steady control score',
      'Overall stability index',
    ],
    warnings: [
      'Excessive lateral sway',
      'Torso rotating — shoulder and hip lines not parallel',
      'Wobbling detected — loss of stability',
    ],
    improvementSuggestions: {
      'Excessive lateral sway': 'Take a deep diaphragmatic breath into your belly and brace before every rep.',
      'Torso rotating — shoulder and hip lines not parallel': 'Keep both shoulders square to the front throughout the entire range of motion.',
    },
  },

  weightlifting_tempo: {
    id: 'weightlifting_tempo',
    name: 'Lifting Tempo & Cadence',
    sport: 'Weightlifting',
    category: 'Time Under Tension',
    objective: 'Measure eccentric (lowering) vs concentric (lifting) duration, coach ideal 2-3s lowering to 1s lifting ratio, and track pauses.',
    equipment: 'Barbell / Dumbbells',
    cameraSetup: {
      view: 'Side or Front View',
      positioning: 'Hands / barbell clearly visible in motion',
      targetHeight: 'Chest Height',
      instructions: 'Frame the full range of motion so upward and downward phase timings are accurately clocked.',
    },
    instructions: [
      'Lower the weight smoothly for 2 to 3 full seconds (eccentric phase).',
      'Pause for 1 second at the bottom under full muscular tension.',
      'Explode upward in 1 second during the concentric lift.',
      'Lockout, breathe, and maintain consistent tempo across all repetitions.',
    ],
    measuredMetrics: [
      'Rep count',
      'Eccentric duration (seconds)',
      'Concentric duration (seconds)',
      'Pause duration (seconds)',
      'Tempo ratio (Eccentric / Concentric)',
    ],
    warnings: [
      'Eccentric too fast — fight gravity on way down',
      'Concentric phase too slow',
      'Eccentric too slow — losing tension',
      'Inconsistent tempo across reps',
    ],
    improvementSuggestions: {
      'Eccentric too fast — fight gravity on way down': 'Count "1-thousand-1, 1-thousand-2" on the way down; don\'t drop the weight.',
      'Inconsistent tempo across reps': 'Maintain the same controlled cadence on rep 10 as you did on rep 1.',
    },
  },

  weightlifting_lifting_technique: {
    id: 'weightlifting_lifting_technique',
    name: 'Comprehensive Lifting Technique',
    sport: 'Weightlifting',
    category: 'Full-Kinematic Technique Rating',
    objective: 'Automatically detect lift type (Squat, Deadlift, Press, Row) and combine spine neutrality, bar path, depth, and stability into an overall master technique score.',
    equipment: 'Barbell / Dumbbell / Weight Plates',
    cameraSetup: {
      view: 'Side Profile or 45° Angle Camera',
      positioning: 'Full athlete body visible during lift',
      targetHeight: 'Waist Height',
      instructions: 'Position camera at side profile 6-8 ft away so full spine, bar path, and joint angles are in frame.',
    },
    instructions: [
      'Set up for your lift with feet grounded and spine neutral.',
      'Execute your rep with full intent, keeping bar close and core braced.',
      'Complete the full range of motion to lockout.',
      'Lower with control back to the setup position.',
    ],
    measuredMetrics: [
      'Detected lift type (Deadlift / Squat / Overhead Press / Row)',
      'Overall master technique score (0-100)',
      'Spine neutral angle score',
      'Vertical bar path precision',
      'Depth / range of motion score',
      'Rep stability score',
    ],
    warnings: [
      'Excessive trunk lean — spine not neutral',
      'Bar path deviating — not vertical',
      'Knee or hip asymmetry detected',
      'Incomplete lockout',
    ],
    improvementSuggestions: {
      'Excessive trunk lean — spine not neutral': 'Pack your neck neutral and keep your chest proud without hyperextending lower back.',
      'Bar path deviating — not vertical': 'Keep the bar over mid-foot throughout the entire ascent and descent.',
    },
  },

  // ==========================================
  // GENERAL / BODYWEIGHT (Legacy)
  // ==========================================
  curl: {
    id: 'curl',
    name: 'Dumbbell Curl',
    sport: 'General',
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
    sport: 'General',
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
    sport: 'General',
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

export const SPORTS_LIST: { id: SportCategory; label: string; icon: string }[] = [
  { id: 'Basketball', label: 'Basketball', icon: '🏀' },
  { id: 'Boxing', label: 'Boxing', icon: '🥊' },
  { id: 'Weightlifting', label: 'Weightlifting', icon: '🏋️' },
  { id: 'General', label: 'General / Bodyweight', icon: '⚡' },
];

export const getExercisesBySport = (sport: SportCategory): ExerciseConfig[] => {
  return Object.values(EXERCISE_CONFIGS).filter((ex) => ex.sport === sport);
};
