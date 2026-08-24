import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPoseDetector, drawPoseSkeleton, smoothLandmarks, Results, Pose } from '../mediapipe/pose';

// Existing analyzers
import { SquatAnalyzer } from '../mediapipe/squat';
import { PushupAnalyzer } from '../mediapipe/pushup';
import { CurlAnalyzer } from '../mediapipe/curl';

// 🏀 Basketball Analyzers
import { VerticalJumpAnalyzer } from '../mediapipe/basketball_verticalJump';
import { AgilityAnalyzer } from '../mediapipe/basketball_agility';
import { SprintAnalyzer } from '../mediapipe/basketball_sprint';
import { ShootingFormAnalyzer } from '../mediapipe/basketball_shootingForm';
import { DefensiveStanceAnalyzer } from '../mediapipe/basketball_defensiveStance';
import { LateralMovementAnalyzer } from '../mediapipe/basketball_lateralMovement';

// 🥊 Boxing Analyzers
import { PunchSpeedAnalyzer } from '../mediapipe/boxing_punchSpeed';
import { ReactionTimeAnalyzer } from '../mediapipe/boxing_reactionTime';
import { BoxingStanceAnalyzer } from '../mediapipe/boxing_stance';
import { GuardPositionAnalyzer } from '../mediapipe/boxing_guardPosition';
import { FootworkAnalyzer } from '../mediapipe/boxing_footwork';
import { HipRotationAnalyzer } from '../mediapipe/boxing_hipRotation';

// 🏋️ Weightlifting Analyzers
import { WeightliftingSquatDepthAnalyzer } from '../mediapipe/weightlifting_squatDepth';
import { BarPathAnalyzer } from '../mediapipe/weightlifting_barPath';
import { JointAnglesAnalyzer } from '../mediapipe/weightlifting_jointAngles';
import { WeightliftingStabilityAnalyzer } from '../mediapipe/weightlifting_stability';
import { TempoAnalyzer } from '../mediapipe/weightlifting_tempo';
import { LiftingTechniqueAnalyzer } from '../mediapipe/weightlifting_liftingTechnique';

// Audio
import { playBeep } from '../mediapipe/beep';

// Config & Analytics
import { EXERCISE_CONFIGS, ExerciseType, SportCategory, SPORTS_LIST, getExercisesBySport } from '../config/exercises';
import { computeOverallAssessmentScore, AssessmentScore } from '../analytics/scoring';
import { OfflineStorage, LandmarkSample } from '../storage/indexedDB';
import { syncManager, SyncStatus } from '../services/syncManager';
import {
  AlertTriangle,
  BarChart2,
  Camera as CameraIcon,
  CameraOff,
  Cloud,
  CloudOff,
  Info,
  Loader2,
  Play,
  RotateCcw,
  Square,
  SwitchCamera,
  Zap,
} from 'lucide-react';

const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  surfaceContainerLow: '#f2ede5',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00', // Electric Yellow
  tertiary: '#0055ff',        // Cobalt Blue
  tertiaryContainer: '#d6e3ff',
  secondary: '#e63b2e',       // Energy Crimson
  secondaryContainer: '#ffdad6',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  onPrimary: '#ffffff',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
  shadow6: '6px 6px 0px 0px #1a1a1a',
  shadow8: '8px 8px 0px 0px #1a1a1a',
} as const;

interface RepLogEntry {
  repNumber: number;
  status: 'Good' | 'Insufficient Depth' | 'Excellent' | 'Form Warning';
}

export const Assessment: React.FC = () => {
  // Sport & Exercise Selection State
  const [selectedSport, setSelectedSport] = useState<SportCategory>('Basketball');
  const [exercise, setExercise] = useState<ExerciseType>('basketball_vertical_jump');

  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [liveFeedback, setLiveFeedback] = useState<string>('Select exercise and start camera to calibrate.');
  const [currentAngle, setCurrentAngle] = useState<number>(180);
  const [repCount, setRepCount] = useState<number>(0);
  const [repLogs, setRepLogs] = useState<RepLogEntry[]>([]);
  const [fps, setFps] = useState<number>(0);

  // Exercise Sub-Metrics Tracking State (Strictly 0 until exercise detection)
  const [romPercent, setRomPercent] = useState<number>(0);
  const [stabilityScore, setStabilityScore] = useState<number>(0);
  const [tempoScore, setTempoScore] = useState<number>(0);
  const [consistencyScore, setConsistencyScore] = useState<number>(0);
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);

  // Mobile Camera & Pipeline State
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const facingModeRef = useRef<'user' | 'environment'>(facingMode);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);

  // Session Result & Sync State
  const [score, setScore] = useState<AssessmentScore>({
    totalScore: 0,
    formAccuracy: 0,
    depthScore: 0,
    cadenceScore: 0,
    symmetryScore: 0,
    grade: 'D',
    repsCompleted: 0,
    validReps: 0,
  });
  const [completed, setCompleted] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());

  // Hardware & Model References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const prevLandmarksRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const landmarkSamplesRef = useRef<LandmarkSample[]>([]);

  // Biomechanical Analyzers
  // General
  const squatAnalyzerRef = useRef<SquatAnalyzer>(new SquatAnalyzer());
  const pushupAnalyzerRef = useRef<PushupAnalyzer>(new PushupAnalyzer());
  const curlAnalyzerRef = useRef<CurlAnalyzer>(new CurlAnalyzer());

  // 🏀 Basketball
  const verticalJumpAnalyzerRef = useRef<VerticalJumpAnalyzer>(new VerticalJumpAnalyzer());
  const agilityAnalyzerRef = useRef<AgilityAnalyzer>(new AgilityAnalyzer());
  const sprintAnalyzerRef = useRef<SprintAnalyzer>(new SprintAnalyzer());
  const shootingFormAnalyzerRef = useRef<ShootingFormAnalyzer>(new ShootingFormAnalyzer());
  const defensiveStanceAnalyzerRef = useRef<DefensiveStanceAnalyzer>(new DefensiveStanceAnalyzer());
  const lateralMovementAnalyzerRef = useRef<LateralMovementAnalyzer>(new LateralMovementAnalyzer());

  // 🥊 Boxing
  const punchSpeedAnalyzerRef = useRef<PunchSpeedAnalyzer>(new PunchSpeedAnalyzer());
  const reactionTimeAnalyzerRef = useRef<ReactionTimeAnalyzer>(new ReactionTimeAnalyzer());
  const boxingStanceAnalyzerRef = useRef<BoxingStanceAnalyzer>(new BoxingStanceAnalyzer());
  const guardPositionAnalyzerRef = useRef<GuardPositionAnalyzer>(new GuardPositionAnalyzer());
  const footworkAnalyzerRef = useRef<FootworkAnalyzer>(new FootworkAnalyzer());
  const hipRotationAnalyzerRef = useRef<HipRotationAnalyzer>(new HipRotationAnalyzer());

  // 🏋️ Weightlifting
  const weightliftingSquatDepthAnalyzerRef = useRef<WeightliftingSquatDepthAnalyzer>(new WeightliftingSquatDepthAnalyzer());
  const barPathAnalyzerRef = useRef<BarPathAnalyzer>(new BarPathAnalyzer());
  const jointAnglesAnalyzerRef = useRef<JointAnglesAnalyzer>(new JointAnglesAnalyzer());
  const weightliftingStabilityAnalyzerRef = useRef<WeightliftingStabilityAnalyzer>(new WeightliftingStabilityAnalyzer());
  const tempoAnalyzerRef = useRef<TempoAnalyzer>(new TempoAnalyzer());
  const liftingTechniqueAnalyzerRef = useRef<LiftingTechniqueAnalyzer>(new LiftingTechniqueAnalyzer());

  // Real-time State Mirror Refs
  const isAssessingRef = useRef<boolean>(isAssessing);
  const exerciseRef = useRef<ExerciseType>(exercise);
  const timerRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const lastSampleTimeRef = useRef<number>(0);

  const currentConfig = EXERCISE_CONFIGS[exercise] || EXERCISE_CONFIGS['basketball_vertical_jump'];

  // Ref to track last feedback message so we only beep when it changes
  const lastFeedbackRef = useRef<string>('');
  const lastRepCountRef = useRef<number>(0);

  useEffect(() => {
    isAssessingRef.current = isAssessing;
  }, [isAssessing]);

  useEffect(() => {
    exerciseRef.current = exercise;
  }, [exercise]);

  // Subscribe to Sync Manager status
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Assessment Duration Timer
  useEffect(() => {
    if (isAssessing) {
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAssessing]);

  const resetAllAnalyzers = useCallback(() => {
    squatAnalyzerRef.current.reset();
    pushupAnalyzerRef.current.reset();
    curlAnalyzerRef.current.reset();
    verticalJumpAnalyzerRef.current.reset();
    agilityAnalyzerRef.current.reset();
    sprintAnalyzerRef.current.reset();
    shootingFormAnalyzerRef.current.reset();
    defensiveStanceAnalyzerRef.current.reset();
    lateralMovementAnalyzerRef.current.reset();
    punchSpeedAnalyzerRef.current.reset();
    reactionTimeAnalyzerRef.current.reset();
    boxingStanceAnalyzerRef.current.reset();
    guardPositionAnalyzerRef.current.reset();
    footworkAnalyzerRef.current.reset();
    hipRotationAnalyzerRef.current.reset();
    weightliftingSquatDepthAnalyzerRef.current.reset();
    barPathAnalyzerRef.current.reset();
    jointAnglesAnalyzerRef.current.reset();
    weightliftingStabilityAnalyzerRef.current.reset();
    tempoAnalyzerRef.current.reset();
    liftingTechniqueAnalyzerRef.current.reset();
    prevLandmarksRef.current = null;
    lastFeedbackRef.current = '';
    lastRepCountRef.current = 0;
  }, []);

  /**
   * MediaPipe Pose Result Handler - Process Frame & Evaluate Kinematics
   */
  const onResults = useCallback((results: Results) => {
    // 1. Track FPS
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically match canvas pixel resolution with video's true stream resolution
    const video = videoRef.current;
    const videoWidth = (video && video.videoWidth > 0) ? video.videoWidth : 1280;
    const videoHeight = (video && video.videoHeight > 0) ? video.videoHeight : 720;
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // 2. Clear canvas overlay
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mirror user front camera properly
    if (facingModeRef.current === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // 3. Draw video background frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // 4. Draw pose skeleton with temporal landmark smoothing
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const smoothed = smoothLandmarks(results.poseLandmarks, prevLandmarksRef.current, 0.65);
      prevLandmarksRef.current = smoothed;

      drawPoseSkeleton(ctx, smoothed, canvas.width, canvas.height, {
        pointColor: '#ffcc00',
        lineColor: 'rgba(0, 85, 255, 0.85)',
        pointRadius: 6,
        lineWidth: 4,
        minConfidence: 0.5,
      });

      // 5. If assessment active, feed smoothed landmarks into the selected sport analyzer
      if (isAssessingRef.current) {
        let currentJointAngle = 0;
        let isInflection = false;
        let feedback: any = null;
        let repNumber = 0;
        let isGood = false;
        let avgForm = 85;

        const currentEx = exerciseRef.current;
        const lms = smoothed;

        switch (currentEx) {
          // 🏀 Basketball
          case 'basketball_vertical_jump':
            feedback = verticalJumpAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = verticalJumpAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'basketball_agility':
            feedback = agilityAnalyzerRef.current.process(lms);
            repNumber = feedback.directionChanges ?? 0;
            isGood = !!feedback.isGoodMovement;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = agilityAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'basketball_sprint':
            feedback = sprintAnalyzerRef.current.process(lms);
            repNumber = feedback.strideCount ?? 0;
            isGood = !!feedback.isGoodStride;
            currentJointAngle = feedback.leftKneeAngle ?? feedback.rightKneeAngle ?? 0;
            avgForm = sprintAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'basketball_shooting_form':
            feedback = shootingFormAnalyzerRef.current.process(lms);
            repNumber = feedback.shotCount ?? 0;
            isGood = !!feedback.isGoodShot;
            currentJointAngle = feedback.shootingElbowAngle ?? 0;
            avgForm = shootingFormAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'basketball_defensive_stance':
            feedback = defensiveStanceAnalyzerRef.current.process(lms);
            repNumber = Math.round((defensiveStanceAnalyzerRef.current.getGoodStancePercent() / 10));
            isGood = !!feedback.isGoodStance;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = defensiveStanceAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 82;
            break;
          case 'basketball_lateral_movement':
            feedback = lateralMovementAnalyzerRef.current.process(lms);
            repNumber = feedback.slideCount ?? 0;
            isGood = !!feedback.isGoodMovement;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = lateralMovementAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 82;
            break;

          // 🥊 Boxing
          case 'boxing_punch_speed':
            feedback = punchSpeedAnalyzerRef.current.process(lms);
            repNumber = feedback.punchCount ?? 0;
            isGood = !!feedback.isGoodPunch;
            currentJointAngle = feedback.extensionAngle ?? 0;
            avgForm = punchSpeedAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'boxing_reaction_time':
            feedback = reactionTimeAnalyzerRef.current.process(lms);
            repNumber = feedback.reactionCount ?? 0;
            isGood = !!feedback.isGoodReaction;
            currentJointAngle = feedback.avgReactionMs ?? 0;
            avgForm = reactionTimeAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 75;
            break;
          case 'boxing_stance':
            feedback = boxingStanceAnalyzerRef.current.process(lms);
            repNumber = feedback.isGoodStance ? 1 : 0;
            isGood = !!feedback.isGoodStance;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = boxingStanceAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'boxing_guard_position':
            feedback = guardPositionAnalyzerRef.current.process(lms);
            repNumber = Math.round(guardPositionAnalyzerRef.current.getGuardQualityPercent() / 10);
            isGood = !!feedback.isGoodGuard;
            currentJointAngle = feedback.overallGuardScore ?? 0;
            avgForm = guardPositionAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'boxing_footwork':
            feedback = footworkAnalyzerRef.current.process(lms);
            repNumber = feedback.stepCount ?? 0;
            isGood = !!feedback.isGoodFootwork;
            currentJointAngle = feedback.activeFootScore ?? 0;
            avgForm = footworkAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'boxing_hip_rotation':
            feedback = hipRotationAnalyzerRef.current.process(lms);
            repNumber = feedback.rotationCount ?? 0;
            isGood = !!feedback.isGoodRotation;
            currentJointAngle = feedback.hipRotationAngle ?? 0;
            avgForm = hipRotationAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;

          // 🏋️ Weightlifting
          case 'weightlifting_squat_depth':
            feedback = weightliftingSquatDepthAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.leftKneeAngle ?? feedback.rightKneeAngle ?? 0;
            avgForm = weightliftingSquatDepthAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'weightlifting_bar_path':
            feedback = barPathAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodPath;
            currentJointAngle = feedback.horizontalDeviation ? Math.round(feedback.horizontalDeviation * 1000) : 0;
            avgForm = barPathAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 82;
            break;
          case 'weightlifting_joint_angles':
            feedback = jointAnglesAnalyzerRef.current.process(lms);
            repNumber = 0;
            isGood = !feedback.criticalWarning;
            currentJointAngle = feedback.joints?.leftKnee ?? 0;
            avgForm = jointAnglesAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'weightlifting_stability':
            feedback = weightliftingStabilityAnalyzerRef.current.process(lms);
            repNumber = feedback.isStable ? 1 : 0;
            isGood = !!feedback.isStable;
            currentJointAngle = feedback.shoulderHipParallelism ?? 0;
            avgForm = weightliftingStabilityAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'weightlifting_tempo':
            feedback = tempoAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodTempo;
            currentJointAngle = feedback.tempoRatio ? Math.round(feedback.tempoRatio * 10) : 20;
            avgForm = tempoAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 80;
            break;
          case 'weightlifting_lifting_technique':
            feedback = liftingTechniqueAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.techniqueScore ?? 0;
            avgForm = liftingTechniqueAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;

          // Legacy / General
          case 'curl':
            feedback = curlAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.elbowAngle ?? 0;
            avgForm = curlAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
          case 'squat':
            feedback = squatAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.kneeAngle ?? 0;
            avgForm = squatAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 88;
            break;
          case 'pushup':
          default:
            feedback = pushupAnalyzerRef.current.process(lms);
            repNumber = feedback.repCount ?? 0;
            isGood = !!feedback.isGoodRep;
            currentJointAngle = feedback.elbowAngle ?? 0;
            avgForm = pushupAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
            break;
        }

        if (!feedback.detected) {
          const msg = feedback.feedbackMessage || 'No athlete detected in camera frame. Adjust positioning.';
          setLiveFeedback(msg);
          setCurrentAngle(0);
          setRomPercent(0);
          setStabilityScore(0);
          setTempoScore(0);
          setConsistencyScore(0);
        } else {
          // ── Beep sound on new feedback instruction ────────────────────────
          const newMsg = feedback.feedbackMessage || '';
          if (newMsg && newMsg !== lastFeedbackRef.current) {
            lastFeedbackRef.current = newMsg;
            if (isGood || feedback.isGoodDepth || feedback.isGoodAlignment || feedback.isGoodShot || feedback.isGoodPunch) {
              playBeep('success');
            } else if (feedback.warnings && feedback.warnings.length > 0) {
              playBeep('warning');
            } else {
              playBeep('info');
            }
          }

          // ── Rep Count & Log Tracking ─────────────────────────────────────
          if (repNumber > lastRepCountRef.current) {
            lastRepCountRef.current = repNumber;
            setRepCount(repNumber);
            setRepLogs((prev) => [
              ...prev,
              {
                repNumber: repNumber,
                status: isGood ? 'Excellent' : 'Form Warning',
              },
            ]);
          }

          // Normalize scores for universal HUD display
          const romVal = feedback.romPercent ?? feedback.loadDepthPercent ?? feedback.depthScore ?? feedback.extensionAngle ?? 85;
          const stabVal = feedback.stabilityScore ?? feedback.symmetryScore ?? feedback.guardRestorationScore ?? feedback.balanceScore ?? feedback.shoulderHipParallelism ?? 85;
          const tempoVal = feedback.tempoScore ?? feedback.cadenceScore ?? feedback.speedScore ?? feedback.overallTempoScore ?? 80;
          const consVal = feedback.consistencyScore ?? feedback.pathConsistencyScore ?? feedback.formScore ?? 85;

          setCurrentAngle(currentJointAngle);
          setLiveFeedback(newMsg);
          setRomPercent(Math.min(100, Math.max(0, Math.round(romVal))));
          setStabilityScore(Math.min(100, Math.max(0, Math.round(stabVal))));
          setTempoScore(Math.min(100, Math.max(0, Math.round(tempoVal))));
          setConsistencyScore(Math.min(100, Math.max(0, Math.round(consVal))));

          if (feedback.warnings && feedback.warnings.length > 0) {
            setActiveWarnings((prev) => Array.from(new Set([...prev, ...feedback.warnings])));
          }

          isInflection = isGood;

          const computed = computeOverallAssessmentScore({
            repsCompleted: repNumber,
            validReps: repNumber,
            avgFormAccuracy: avgForm,
            avgDepthScore: romVal,
            cadenceConsistency: tempoVal,
            avgSymmetry: stabVal,
          });
          setScore(computed);
        }

        // 6. Sample keyframe landmarks
        if (now - lastSampleTimeRef.current >= 500 || isInflection) {
          lastSampleTimeRef.current = now;
          landmarkSamplesRef.current.push({
            timestampMs: Math.round(now),
            repNumber: repCount,
            event: isInflection ? 'peak_inflection' : 'sample',
            angle: Math.round(currentJointAngle),
            landmarks: results.poseLandmarks.map((lm) => ({
              x: Math.round(lm.x * 1000) / 1000,
              y: Math.round(lm.y * 1000) / 1000,
              z: Math.round(lm.z * 1000) / 1000,
              visibility: lm.visibility !== undefined ? Math.round(lm.visibility * 100) / 100 : undefined,
            })),
          });

          if (landmarkSamplesRef.current.length > 100) {
            landmarkSamplesRef.current.shift();
          }
        }
      }
    }

    ctx.restore();
  }, [repCount]);

  /**
   * Start Webcam Stream
   */
  const handleStartCamera = async (targetFacingMode: 'user' | 'environment' = facingMode) => {
    try {
      setIsCameraLoading(true);
      setCameraError(null);

      if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost') {
        throw new Error('Mobile cameras require HTTPS or localhost.');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API unavailable. Please check permissions.');
      }

      if (!poseRef.current) {
        poseRef.current = createPoseDetector(onResults);
        await poseRef.current.initialize();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraintTiers: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: targetFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: targetFacingMode }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        { video: { facingMode: targetFacingMode }, audio: false },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const constraints of constraintTiers) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Could not access camera device.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsCameraLoading(false);

      // Start landmark detection render loop
      const processFrame = async () => {
        if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
          await poseRef.current.send({ image: videoRef.current });
        }
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      };
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setIsCameraLoading(false);
      setIsCameraActive(false);
      setCameraError(err.message || 'Failed to start camera');
    }
  };

  const handleStopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setFps(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      await handleStartCamera(nextMode);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (poseRef.current) poseRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartAssessment = () => {
    resetAllAnalyzers();
    landmarkSamplesRef.current = [];
    setRepCount(0);
    setDuration(0);
    setCompleted(false);
    setSavedSuccess(false);
    setRepLogs([]);
    setActiveWarnings([]);
    setIsAssessing(true);
    setLiveFeedback(`Assessment started! Perform ${currentConfig.name} drill.`);
    playBeep('info');
  };

  const handleStopAssessment = async () => {
    setIsAssessing(false);
    setCompleted(true);
    playBeep('success');

    const validReps = repCount;
    let avgFormScore = 85;

    const currentEx = exerciseRef.current;
    switch (currentEx) {
      case 'basketball_vertical_jump': avgFormScore = verticalJumpAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'basketball_agility': avgFormScore = agilityAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'basketball_sprint': avgFormScore = sprintAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'basketball_shooting_form': avgFormScore = shootingFormAnalyzerRef.current.getAverageFormScore() || 80; break;
      case 'basketball_defensive_stance': avgFormScore = defensiveStanceAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'basketball_lateral_movement': avgFormScore = lateralMovementAnalyzerRef.current.getAverageFormScore() || 82; break;
      case 'boxing_punch_speed': avgFormScore = punchSpeedAnalyzerRef.current.getAverageFormScore() || 82; break;
      case 'boxing_reaction_time': avgFormScore = reactionTimeAnalyzerRef.current.getAverageFormScore() || 80; break;
      case 'boxing_stance': avgFormScore = boxingStanceAnalyzerRef.current.getAverageFormScore() || 82; break;
      case 'boxing_guard_position': avgFormScore = guardPositionAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'boxing_footwork': avgFormScore = footworkAnalyzerRef.current.getAverageFormScore() || 80; break;
      case 'boxing_hip_rotation': avgFormScore = hipRotationAnalyzerRef.current.getAverageFormScore() || 82; break;
      case 'weightlifting_squat_depth': avgFormScore = weightliftingSquatDepthAnalyzerRef.current.getAverageFormScore() || 88; break;
      case 'weightlifting_bar_path': avgFormScore = barPathAnalyzerRef.current.getAverageFormScore() || 84; break;
      case 'weightlifting_joint_angles': avgFormScore = jointAnglesAnalyzerRef.current.getAverageFormScore() || 86; break;
      case 'weightlifting_stability': avgFormScore = weightliftingStabilityAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'weightlifting_tempo': avgFormScore = tempoAnalyzerRef.current.getAverageFormScore() || 82; break;
      case 'weightlifting_lifting_technique': avgFormScore = liftingTechniqueAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'curl': avgFormScore = curlAnalyzerRef.current.getAverageFormScore() || 85; break;
      case 'squat': avgFormScore = squatAnalyzerRef.current.getAverageFormScore() || 88; break;
      case 'pushup':
      default:
        avgFormScore = pushupAnalyzerRef.current.getAverageFormScore() || 85; break;
    }

    const computedScore = computeOverallAssessmentScore({
      repsCompleted: repCount,
      validReps,
      avgFormAccuracy: avgFormScore,
      avgDepthScore: romPercent || 85,
      cadenceConsistency: tempoScore || 80,
      avgSymmetry: stabilityScore || 85,
    });

    setScore(computedScore);
    setLiveFeedback(`Assessment finished! Completed ${repCount} reps/actions with Score: ${computedScore.totalScore}/100.`);

    // Persist session to IndexedDB & sync to cloud
    try {
      const sessionId = `sess-${Date.now()}`;
      await OfflineStorage.saveAssessment({
        id: sessionId,
        exerciseType: exercise,
        date: new Date().toISOString().split('T')[0],
        totalScore: computedScore.totalScore,
        grade: computedScore.grade,
        repsCompleted: repCount,
        validReps,
        durationSeconds: duration,
        caloriesBurned: Math.round((duration || 25) * 0.16 * 10) / 10,
        symmetryScore: stabilityScore,
        depthScore: romPercent,
        formAccuracy: computedScore.formAccuracy,
        cadenceScore: tempoScore,
        angles: {
          current: currentAngle,
          min: 45,
          max: 180,
          avg: 110,
        },
        landmarkSamples: [...landmarkSamplesRef.current],
        synced: false,
        createdAt: Date.now(),
      });
      setSavedSuccess(true);
      syncManager.syncNow();
    } catch (e) {
      console.warn('Error saving assessment session:', e);
    }
  };

  const handleSelectSport = (sport: SportCategory) => {
    if (isAssessing) return;
    setSelectedSport(sport);
    const exercisesForSport = getExercisesBySport(sport);
    if (exercisesForSport.length > 0) {
      setExercise(exercisesForSport[0].id);
      setCompleted(false);
      resetAllAnalyzers();
    }
  };

  const handleSelectExercise = (exId: ExerciseType) => {
    if (isAssessing) return;
    setExercise(exId);
    setCompleted(false);
    resetAllAnalyzers();
  };

  const sportExercises = getExercisesBySport(selectedSport);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.onSurface,
      fontFamily: T.fontBody,
      padding: '1.5rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Top Header & Sport Selector Bar */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: T.surfaceLowest,
          border: T.border3,
          boxShadow: T.shadow6,
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{
                  background: T.primaryContainer,
                  border: T.border2,
                  boxShadow: '2px 2px 0px 0px #1a1a1a',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  fontFamily: T.fontHeadline,
                  textTransform: 'uppercase',
                }}>
                  AI Sport Assessment Engine
                </span>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  background: syncStatus.isOnline ? '#E6F4EA' : '#FCE8E6',
                  color: syncStatus.isOnline ? '#137333' : '#C5221F',
                  border: '1.5px solid #1a1a1a',
                }}>
                  {syncStatus.isOnline ? <Cloud size={12} /> : <CloudOff size={12} />}
                  <span>{syncStatus.isOnline ? 'Cloud Synced' : 'Offline Ready'}</span>
                </div>
              </div>
              <h1 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                color: T.primary,
              }}>
                {currentConfig.name} Assessment
              </h1>
              <p style={{ fontSize: '0.88rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                {currentConfig.category} &bull; {currentConfig.sport}
              </p>
            </div>

            {/* Sport Selector Tabs */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              background: T.surfaceVariant,
              padding: '0.35rem',
              border: T.border3,
              boxShadow: '3px 3px 0px 0px #1a1a1a',
            }}>
              {SPORTS_LIST.map((s) => {
                const isSelected = selectedSport === s.id;
                return (
                  <button
                    key={s.id}
                    disabled={isAssessing}
                    onClick={() => handleSelectSport(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      border: isSelected ? T.border2 : '2px solid transparent',
                      background: isSelected ? T.primaryContainer : 'transparent',
                      color: T.primary,
                      cursor: isAssessing ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '2px 2px 0px 0px #1a1a1a' : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sport's Exercises Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            borderTop: '2px dashed #d6d1c9',
            paddingTop: '0.75rem',
          }}>
            {sportExercises.map((ex) => {
              const isSelected = exercise === ex.id;
              return (
                <button
                  key={ex.id}
                  disabled={isAssessing}
                  onClick={() => handleSelectExercise(ex.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: isSelected ? 900 : 700,
                    fontSize: '0.82rem',
                    border: isSelected ? T.border2 : '1.5px solid #1a1a1a',
                    background: isSelected ? T.tertiaryContainer : T.surfaceLowest,
                    color: isSelected ? T.tertiary : T.primary,
                    cursor: isAssessing ? 'not-allowed' : 'pointer',
                    boxShadow: isSelected ? '2px 2px 0px 0px #0055ff' : '2px 2px 0px 0px #1a1a1a',
                    transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? T.tertiary : '#888' }} />
                  <span>{ex.name}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Setup & Instructions Banner */}
        {!isAssessing && !completed && (
          <div
            className="kreedai-instructions-banner"
            style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.25rem 1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary, fontWeight: 900, fontFamily: T.fontHeadline, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                <CameraIcon size={18} color={T.tertiary} />
                <span>Camera Setup &bull; {currentConfig.cameraSetup.view}</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: T.onSurfaceVariant, marginTop: '0.35rem', lineHeight: 1.4 }}>
                {currentConfig.cameraSetup.instructions}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary, fontWeight: 900, fontFamily: T.fontHeadline, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                <Info size={18} color={T.primaryContainer} />
                <span>Drill Instructions</span>
              </div>
              <ol style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, marginTop: '0.35rem', paddingLeft: '1.2rem', lineHeight: 1.4 }}>
                {currentConfig.instructions.slice(0, 3).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Main Grid: Camera Studio (Left) + Live Analytics HUD (Right) */}
        <style>{`
          .kreedai-assessment-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 1.5rem;
            align-items: start;
          }
          .kreedai-camera-frame {
            position: relative;
            width: 100%;
            aspect-ratio: 4/3;
            background: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .kreedai-hud-mobile-overlays {
            display: none;
          }
          .kreedai-hud-desktop-sidebar {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          @media (max-width: 768px) {
            .kreedai-assessment-wrapper {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              padding: 0.75rem !important;
            }
            .kreedai-instructions-banner {
              order: 3;
            }
            .kreedai-assessment-grid {
              order: 2;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .kreedai-camera-frame {
              aspect-ratio: auto;
              height: clamp(340px, 52vh, 480px);
              border-radius: 2px;
            }
            .kreedai-hud-mobile-overlays {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: absolute;
              inset: 0;
              padding: 0.65rem;
              pointer-events: none;
              z-index: 10;
            }
            .kreedai-hud-mobile-overlays * {
              pointer-events: auto;
            }
            .kreedai-hud-desktop-sidebar {
              display: none;
            }
          }
        `}</style>

        <div className="kreedai-assessment-grid">

          {/* Left: Video & Canvas Stream */}
          <div style={{
            background: T.surfaceLowest,
            border: T.border4,
            boxShadow: T.shadow8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Viewport Frame */}
            <div className="kreedai-camera-frame">
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  display: 'none',
                }}
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Camera Off Placeholder */}
              {!isCameraActive && !isCameraLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  color: '#ffffff',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'rgba(26, 26, 26, 0.95)',
                  zIndex: 20,
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: T.primaryContainer,
                    border: T.border3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.primary,
                    boxShadow: '4px 4px 0px 0px #ffffff',
                  }}>
                    <CameraIcon size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                      {cameraError ? 'Camera Error' : 'Camera Offline'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: cameraError ? '#ff8080' : '#a0a0a0', maxWidth: '300px', marginTop: '0.25rem' }}>
                      {cameraError || 'Enable webcam to initialize MediaPipe AI pose skeleton and real-time audio biomechanical coaching.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartCamera()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: T.primaryContainer,
                      color: T.primary,
                      border: T.border3,
                      boxShadow: '4px 4px 0px 0px #ffffff',
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <Play size={18} fill={T.primary} />
                    <span>Start Video Feed</span>
                  </button>
                </div>
              )}

              {/* Camera Loading Spinner */}
              {isCameraLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  background: 'rgba(0,0,0,0.85)',
                  color: '#ffffff',
                  zIndex: 20,
                }}>
                  <Loader2 size={40} className="animate-spin" color={T.primaryContainer} />
                  <p style={{ fontFamily: T.fontHeadline, fontWeight: 800, textTransform: 'uppercase' }}>
                    Loading MediaPipe WASM Models...
                  </p>
                </div>
              )}

              {/* Desktop-only Top Badges */}
              {isCameraActive && (
                <div className="kreedai-desktop-links" style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  right: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 5,
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{
                      background: isAssessing ? T.secondary : '#10b981',
                      color: '#ffffff',
                      padding: '0.25rem 0.6rem',
                      border: '2px solid #ffffff',
                      boxShadow: '2px 2px 0px 0px #000000',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      fontFamily: T.fontHeadline,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
                      <span>{isAssessing ? 'TESTING IN PROGRESS' : 'CALIBRATING POSE'}</span>
                    </div>

                    <div style={{
                      background: 'rgba(0,0,0,0.75)',
                      color: '#ffffff',
                      padding: '0.25rem 0.6rem',
                      border: '1.5px solid #ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      fontFamily: T.fontHeadline,
                    }}>
                      {fps} FPS
                    </div>
                  </div>

                  <button
                    onClick={handleFlipCamera}
                    style={{
                      background: T.surfaceLowest,
                      border: T.border2,
                      boxShadow: '2px 2px 0px 0px #000000',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      fontFamily: T.fontHeadline,
                      textTransform: 'uppercase',
                    }}
                  >
                    <SwitchCamera size={14} />
                    <span>Flip</span>
                  </button>
                </div>
              )}

              {/* ── MOBILE / PWA OVERLAID HUD GUIDELINES ───────────────────────── */}
              {isCameraActive && (
                <div className="kreedai-hud-mobile-overlays">
                  {/* Top Bar Overlays: Coaching Cue & Warnings & Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}>
                      <div style={{
                        background: isAssessing ? T.secondary : '#10b981',
                        color: '#ffffff',
                        padding: '0.2rem 0.5rem',
                        border: '1.5px solid #1a1a1a',
                        boxShadow: '2px 2px 0px 0px #1a1a1a',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        fontFamily: T.fontHeadline,
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                        <span>{isAssessing ? `ASSESSING (${duration}s)` : 'CAMERA ACTIVE'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{
                          background: 'rgba(0,0,0,0.8)',
                          color: '#ffffff',
                          padding: '0.2rem 0.45rem',
                          border: '1.5px solid #1a1a1a',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          fontFamily: T.fontHeadline,
                        }}>
                          {fps} FPS
                        </div>
                        <button
                          type="button"
                          onClick={handleFlipCamera}
                          style={{
                            background: T.surfaceLowest,
                            border: '1.5px solid #1a1a1a',
                            boxShadow: '2px 2px 0px 0px #1a1a1a',
                            padding: '0.25rem 0.45rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            fontFamily: T.fontHeadline,
                            textTransform: 'uppercase',
                          }}
                        >
                          <SwitchCamera size={12} />
                          <span>Flip</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Coaching Cue Banner (Overlaid) */}
                    <div style={{
                      background: isAssessing ? T.primaryContainer : 'rgba(255, 255, 255, 0.95)',
                      border: '2.5px solid #1a1a1a',
                      boxShadow: '3px 3px 0px 0px #1a1a1a',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      <Zap size={16} color={T.primary} style={{ flexShrink: 0 }} />
                      <p style={{
                        fontFamily: T.fontHeadline,
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        lineHeight: 1.25,
                        color: T.primary,
                        textTransform: 'uppercase',
                        margin: 0,
                      }}>
                        {liveFeedback}
                      </p>
                    </div>

                    {/* Active Warning Badges */}
                    {activeWarnings.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {activeWarnings.slice(-2).map((w, i) => (
                          <div
                            key={i}
                            style={{
                              background: T.secondaryContainer,
                              color: T.secondary,
                              border: '1.5px solid #e63b2e',
                              boxShadow: '1px 1px 0px 0px #1a1a1a',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              fontFamily: T.fontHeadline,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <AlertTriangle size={11} />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mid Floating Widgets (ROM, Stability on Left | Reps, Angle on Right) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '0.25rem 0',
                  }}>
                    {/* Left Badges: ROM % & Stability */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{
                        background: '#ffffff',
                        border: '2px solid #1a1a1a',
                        boxShadow: '2.5px 2.5px 0px 0px #1a1a1a',
                        padding: '0.4rem 0.6rem',
                        minWidth: '85px',
                      }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          ROM %
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: T.fontHeadline, lineHeight: 1.1, color: T.primary }}>
                          {romPercent}%
                        </div>
                        <div style={{ height: '5px', background: '#e8e3da', border: '1px solid #1a1a1a', marginTop: '0.25rem', width: '100%' }}>
                          <div style={{ height: '100%', width: `${romPercent}%`, background: T.tertiary, transition: 'width 0.15s ease' }} />
                        </div>
                      </div>

                      <div style={{
                        background: '#ffffff',
                        border: '2px solid #1a1a1a',
                        boxShadow: '2.5px 2.5px 0px 0px #1a1a1a',
                        padding: '0.35rem 0.55rem',
                        minWidth: '85px',
                      }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          STABILITY
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: T.fontHeadline, color: '#059669', lineHeight: 1.1 }}>
                          {stabilityScore}%
                        </div>
                      </div>
                    </div>

                    {/* Right Badges: Reps & Joint Angle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                      <div style={{
                        background: T.primaryContainer,
                        border: '2.5px solid #1a1a1a',
                        boxShadow: '2.5px 2.5px 0px 0px #1a1a1a',
                        padding: '0.4rem 0.75rem',
                        textAlign: 'center',
                        minWidth: '85px',
                      }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.primary }}>
                          REPS
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: T.fontHeadline, lineHeight: 1, color: T.primary }}>
                          {repCount}
                        </div>
                      </div>

                      <div style={{
                        background: '#ffffff',
                        border: '2px solid #1a1a1a',
                        boxShadow: '2.5px 2.5px 0px 0px #1a1a1a',
                        padding: '0.35rem 0.55rem',
                        textAlign: 'center',
                        minWidth: '85px',
                      }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          JOINT ANGLE
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: T.fontHeadline, color: T.tertiary, lineHeight: 1.1 }}>
                          {currentAngle}°
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Overlaid Action Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingBottom: '0.25rem' }}>
                    {!isAssessing ? (
                      <button
                        type="button"
                        onClick={handleStartAssessment}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1.25rem',
                          background: T.primaryContainer,
                          color: T.primary,
                          border: '3px solid #1a1a1a',
                          boxShadow: '4px 4px 0px 0px #1a1a1a',
                          fontFamily: T.fontHeadline,
                          fontWeight: 900,
                          fontSize: '0.92rem',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={16} fill={T.primary} />
                        <span>Start AI Assessment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopAssessment}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1.25rem',
                          background: T.secondary,
                          color: '#ffffff',
                          border: '3px solid #1a1a1a',
                          boxShadow: '4px 4px 0px 0px #1a1a1a',
                          fontFamily: T.fontHeadline,
                          fontWeight: 900,
                          fontSize: '0.92rem',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <Square size={16} fill="#ffffff" />
                        <span>End Test ({duration}s)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop-only Camera & Assessment Controls Footer */}
            <div className="kreedai-desktop-links" style={{
              padding: '1rem 1.25rem',
              background: T.surfaceLowest,
              borderTop: T.border3,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isCameraActive ? (
                  <button
                    onClick={handleStopCamera}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      background: T.surfaceVariant,
                      border: T.border2,
                      boxShadow: '2px 2px 0px 0px #1a1a1a',
                      fontFamily: T.fontHeadline,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <CameraOff size={16} />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartCamera()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      background: T.primaryContainer,
                      border: T.border2,
                      boxShadow: '2px 2px 0px 0px #1a1a1a',
                      fontFamily: T.fontHeadline,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <CameraIcon size={16} />
                    <span>Enable Camera</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isAssessing ? (
                  <button
                    disabled={!isCameraActive}
                    onClick={handleStartAssessment}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.5rem',
                      background: !isCameraActive ? T.surfaceDim : T.primaryContainer,
                      color: T.primary,
                      border: T.border3,
                      boxShadow: !isCameraActive ? 'none' : T.shadow4,
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      textTransform: 'uppercase',
                      cursor: !isCameraActive ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Play size={18} fill={T.primary} />
                    <span>Start Test</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopAssessment}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.5rem',
                      background: T.secondary,
                      color: '#ffffff',
                      border: T.border3,
                      boxShadow: T.shadow4,
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <Square size={18} fill="#ffffff" />
                    <span>End Test ({duration}s)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right / Sidebar: Real-time Biomechanical HUD & Coaching (Desktop) */}
          <div className="kreedai-hud-desktop-sidebar">
            {/* Live Audio & Visual Coaching Box */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border4,
              boxShadow: T.shadow8,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={18} color={T.primaryContainer} />
                  <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.88rem' }}>
                    Live AI Coaching Cue
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: T.fontHeadline,
                  background: '#1a1a1a',
                  color: '#ffffff',
                  padding: '0.15rem 0.45rem',
                }}>
                  AUDIO BEEP SYNTH
                </span>
              </div>

              <div style={{
                background: isAssessing ? T.primaryContainer : T.surfaceVariant,
                border: T.border3,
                boxShadow: '3px 3px 0px 0px #1a1a1a',
                padding: '1rem',
                minHeight: '75px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <p style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  lineHeight: 1.3,
                  color: T.primary,
                  textTransform: 'uppercase',
                }}>
                  {liveFeedback}
                </p>
              </div>

              {/* Active Warning Badges */}
              {activeWarnings.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {activeWarnings.slice(-3).map((w, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.secondaryContainer,
                        color: T.secondary,
                        border: '1.5px solid #e63b2e',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        fontFamily: T.fontHeadline,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <AlertTriangle size={12} />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rep Counter & Primary Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              <div style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  Completed Reps / Actions
                </span>
                <div style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  lineHeight: 1,
                  color: T.primary,
                  marginTop: '0.5rem',
                }}>
                  {repCount}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.onSurfaceVariant, marginTop: '0.35rem' }}>
                  Target: 10-15 controlled reps
                </span>
              </div>

              <div style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  Joint Angle / Magnitude
                </span>
                <div style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  lineHeight: 1,
                  color: T.tertiary,
                  marginTop: '0.5rem',
                }}>
                  {currentAngle}°
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.onSurfaceVariant, marginTop: '0.35rem' }}>
                  Real-time 33-landmark kinematic
                </span>
              </div>
            </div>

            {/* Sub-Metrics Progress Bars */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}>
              <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Biomechanical Breakdown
              </span>

              {/* Range of Motion / Depth */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <span>Range of Motion / Depth</span>
                  <span>{romPercent}%</span>
                </div>
                <div style={{ height: '10px', background: T.surfaceVariant, border: T.border2 }}>
                  <div style={{ height: '100%', width: `${romPercent}%`, background: T.tertiary, transition: 'width 0.15s ease' }} />
                </div>
              </div>

              {/* Stability & Symmetry */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <span>Stability & Symmetry</span>
                  <span>{stabilityScore}%</span>
                </div>
                <div style={{ height: '10px', background: T.surfaceVariant, border: T.border2 }}>
                  <div style={{ height: '100%', width: `${stabilityScore}%`, background: T.primaryContainer, transition: 'width 0.15s ease' }} />
                </div>
              </div>

              {/* Cadence & Tempo */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <span>Cadence & Tempo Control</span>
                  <span>{tempoScore}%</span>
                </div>
                <div style={{ height: '10px', background: T.surfaceVariant, border: T.border2 }}>
                  <div style={{ height: '100%', width: `${tempoScore}%`, background: '#10b981', transition: 'width 0.15s ease' }} />
                </div>
              </div>

              {/* Form Consistency */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <span>Form Consistency</span>
                  <span>{consistencyScore}%</span>
                </div>
                <div style={{ height: '10px', background: T.surfaceVariant, border: T.border2 }}>
                  <div style={{ height: '100%', width: `${consistencyScore}%`, background: T.secondary, transition: 'width 0.15s ease' }} />
                </div>
              </div>
            </div>

            {/* Rep-by-Rep Log Feed */}
            {repLogs.length > 0 && (
              <div style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1rem',
                maxHeight: '160px',
                overflowY: 'auto',
              }}>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.82rem', display: 'block', marginBottom: '0.5rem' }}>
                  Recent Repetitions Log
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {repLogs.slice(-5).reverse().map((log, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.6rem',
                        background: log.status === 'Excellent' ? '#E6F4EA' : '#FFF0E6',
                        border: '1.5px solid #1a1a1a',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        fontFamily: T.fontHeadline,
                      }}
                    >
                      <span>Rep #{log.repNumber}</span>
                      <span style={{ color: log.status === 'Excellent' ? '#137333' : '#C5221F' }}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Completion Modal / Summary Card */}
        {completed && (
          <div style={{
            background: T.surfaceLowest,
            border: T.border4,
            boxShadow: T.shadow8,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    background: T.primaryContainer,
                    border: T.border2,
                    boxShadow: '2px 2px 0px 0px #1a1a1a',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    fontFamily: T.fontHeadline,
                    textTransform: 'uppercase',
                  }}>
                    Session Complete
                  </span>
                  {savedSuccess && (
                    <span style={{
                      background: '#E6F4EA',
                      color: '#137333',
                      border: '1.5px solid #137333',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      fontFamily: T.fontHeadline,
                    }}>
                      &bull; Saved & Synced
                    </span>
                  )}
                </div>
                <h2 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>
                  {currentConfig.name} Assessment Result
                </h2>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: T.surfaceVariant,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '0.75rem 1.5rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Overall Grade</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: T.fontHeadline, color: T.tertiary }}>{score.grade}</div>
                </div>
                <div style={{ width: '2px', height: '40px', background: '#1a1a1a' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Total Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: T.fontHeadline, color: T.primary }}>{score.totalScore}/100</div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              <div style={{ background: T.surfaceVariant, padding: '1rem', border: T.border2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Form Accuracy</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: T.fontHeadline, marginTop: '0.25rem' }}>{score.formAccuracy}%</div>
              </div>
              <div style={{ background: T.surfaceVariant, padding: '1rem', border: T.border2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Depth / ROM Score</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: T.fontHeadline, marginTop: '0.25rem' }}>{score.depthScore}%</div>
              </div>
              <div style={{ background: T.surfaceVariant, padding: '1rem', border: T.border2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Cadence Consistency</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: T.fontHeadline, marginTop: '0.25rem' }}>{score.cadenceScore}%</div>
              </div>
              <div style={{ background: T.surfaceVariant, padding: '1rem', border: T.border2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>Bilateral Symmetry</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: T.fontHeadline, marginTop: '0.25rem' }}>{score.symmetryScore}%</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', borderTop: '2px dashed #d6d1c9', paddingTop: '1.25rem' }}>
              <button
                onClick={() => { setCompleted(false); resetAllAnalyzers(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: T.surfaceVariant,
                  border: T.border2,
                  boxShadow: '2px 2px 0px 0px #1a1a1a',
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                <span>Retest Drill</span>
              </button>

              <Link
                to="/progress"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.5rem',
                  background: T.primaryContainer,
                  color: T.primary,
                  border: T.border3,
                  boxShadow: T.shadow4,
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                <BarChart2 size={16} />
                <span>View Full Analytics</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};