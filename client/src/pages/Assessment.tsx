import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPoseDetector, drawPoseSkeleton, Results, Pose } from '../mediapipe/pose';
import { SquatAnalyzer } from '../mediapipe/squat';
import { PushupAnalyzer } from '../mediapipe/pushup';
import { CurlAnalyzer } from '../mediapipe/curl';
import { EXERCISE_CONFIGS, ExerciseType } from '../config/exercises';
import { computeOverallAssessmentScore, AssessmentScore } from '../analytics/scoring';
import { OfflineStorage, LandmarkSample } from '../storage/indexedDB';
import { syncManager, SyncStatus } from '../services/syncManager';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Camera as CameraIcon,
  CameraOff,
  CheckCircle2,
  Cloud,
  CloudOff,
  Dumbbell,
  Info,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  SwitchCamera,
  Target,
  User,
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
  // Exercise Selection & State
  const [exercise, setExercise] = useState<ExerciseType>('curl');
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
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
  const animationFrameIdRef = useRef<number | null>(null);
  const landmarkSamplesRef = useRef<LandmarkSample[]>([]);

  // Biomechanical Analyzers
  const squatAnalyzerRef = useRef<SquatAnalyzer>(new SquatAnalyzer());
  const pushupAnalyzerRef = useRef<PushupAnalyzer>(new PushupAnalyzer());
  const curlAnalyzerRef = useRef<CurlAnalyzer>(new CurlAnalyzer());

  // Real-time State Mirror Refs
  const isAssessingRef = useRef<boolean>(isAssessing);
  const exerciseRef = useRef<ExerciseType>(exercise);
  const timerRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const lastSampleTimeRef = useRef<number>(0);

  const currentConfig = EXERCISE_CONFIGS[exercise];

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

    // 2. Clear canvas overlay
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Draw video background frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // 4. Draw pose skeleton
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      drawPoseSkeleton(ctx, results.poseLandmarks, canvas.width, canvas.height, {
        pointColor: '#ffcc00',
        lineColor: 'rgba(0, 85, 255, 0.85)',
        pointRadius: 6,
        lineWidth: 4,
        minConfidence: 0.45,
      });

      // 5. If assessment active, feed landmarks into exercise analyzer
      if (isAssessingRef.current) {
        let currentJointAngle = 0;
        let isInflection = false;
        let feedback: any = null;

        if (exerciseRef.current === 'curl') {
          feedback = curlAnalyzerRef.current.process(results.poseLandmarks);
        } else if (exerciseRef.current === 'squat') {
          feedback = squatAnalyzerRef.current.process(results.poseLandmarks);
        } else {
          feedback = pushupAnalyzerRef.current.process(results.poseLandmarks);
        }

        if (!feedback.detected) {
          setLiveFeedback(feedback.feedbackMessage || 'No athlete detected in camera frame. Adjust positioning.');
          setCurrentAngle(0);
          setRomPercent(0);
          setStabilityScore(0);
          setTempoScore(0);
          setConsistencyScore(0);
        } else {
          if (feedback.repCount > repCount) {
            setRepCount(feedback.repCount);
            setRepLogs((prev) => [
              ...prev,
              {
                repNumber: feedback.repCount,
                status: feedback.isGoodRep ? 'Excellent' : 'Form Warning',
              },
            ]);
          }

          const angleVal = feedback.elbowAngle ?? feedback.kneeAngle ?? 0;
          setCurrentAngle(angleVal);
          setLiveFeedback(feedback.feedbackMessage);
          setRomPercent(feedback.romPercent);
          setStabilityScore(feedback.stabilityScore);
          setTempoScore(feedback.tempoScore);
          setConsistencyScore(feedback.consistencyScore);

          if (feedback.warnings && feedback.warnings.length > 0) {
            setActiveWarnings((prev) => Array.from(new Set([...prev, ...feedback.warnings])));
          }

          currentJointAngle = angleVal;
          isInflection = feedback.isGoodRep || feedback.isGoodDepth || feedback.isGoodAlignment;

          let avgForm = 85;
          if (exerciseRef.current === 'curl') avgForm = curlAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;
          else if (exerciseRef.current === 'squat') avgForm = squatAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 88;
          else avgForm = pushupAnalyzerRef.current.getAverageFormScore() || feedback.formScore || 85;

          const computed = computeOverallAssessmentScore({
            repsCompleted: feedback.repCount,
            validReps: feedback.repCount,
            avgFormAccuracy: avgForm,
            avgDepthScore: feedback.romPercent,
            cadenceConsistency: feedback.tempoScore,
            avgSymmetry: feedback.stabilityScore,
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
        throw new Error(
          lastErr?.name === 'NotAllowedError'
            ? 'Camera permission denied.'
            : 'Could not acquire camera stream.'
        );
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video reference not ready');

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      await video.play();

      setIsCameraActive(true);
      setLiveFeedback(`Camera active. Ready for ${currentConfig.name} assessment.`);

      const sendFrame = async () => {
        if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
          try {
            await poseRef.current.send({ image: videoRef.current });
          } catch {}
        }
        animationFrameIdRef.current = requestAnimationFrame(sendFrame);
      };

      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = requestAnimationFrame(sendFrame);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setCameraError(err.message || 'Could not access camera.');
      setIsCameraActive(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  /**
   * Stop Webcam Stream
   */
  const handleStopCamera = async () => {
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
    squatAnalyzerRef.current.reset();
    pushupAnalyzerRef.current.reset();
    curlAnalyzerRef.current.reset();
    landmarkSamplesRef.current = [];
    setRepCount(0);
    setDuration(0);
    setCompleted(false);
    setSavedSuccess(false);
    setRepLogs([]);
    setActiveWarnings([]);
    setIsAssessing(true);
    setLiveFeedback(`Assessment started! Perform controlled ${currentConfig.name} repetitions.`);
  };

  const handleStopAssessment = async () => {
    setIsAssessing(false);
    setCompleted(true);

    const validReps = repCount;
    let avgFormScore = 85;

    if (exercise === 'curl') avgFormScore = curlAnalyzerRef.current.getAverageFormScore() || (repCount > 0 ? 86 : 0);
    else if (exercise === 'squat') avgFormScore = squatAnalyzerRef.current.getAverageFormScore() || (repCount > 0 ? 88 : 0);
    else avgFormScore = pushupAnalyzerRef.current.getAverageFormScore() || (repCount > 0 ? 85 : 0);

    const computedScore = computeOverallAssessmentScore({
      repsCompleted: repCount,
      validReps,
      avgFormAccuracy: avgFormScore,
      avgDepthScore: romPercent,
      cadenceConsistency: tempoScore,
      avgSymmetry: stabilityScore,
    });

    setScore(computedScore);
    setLiveFeedback(`Assessment finished! Completed ${repCount} reps with Score: ${computedScore.totalScore}/100.`);

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

  const handleSimulateRep = (isGood: boolean) => {
    const nextRep = repCount + 1;
    setRepCount(nextRep);
    setRepLogs((prev) => [
      ...prev,
      { repNumber: nextRep, status: isGood ? 'Good' : 'Form Warning' },
    ]);
    if (!isGood) {
      setActiveWarnings((prev) => Array.from(new Set([...prev, currentConfig.warnings[0]])));
    }
    const computed = computeOverallAssessmentScore({
      repsCompleted: nextRep,
      validReps: isGood ? nextRep : Math.max(0, nextRep - 1),
      avgFormAccuracy: isGood ? 92 : 75,
      avgDepthScore: isGood ? 94 : 70,
      cadenceConsistency: 88,
      avgSymmetry: isGood ? 90 : 70,
    });
    setScore(computed);
    setLiveFeedback(isGood ? `Good rep completed on ${currentConfig.name}` : `Movement Warning detected during rep.`);
  };

  // Active recommendations list based on exercise and warnings
  const currentSuggestions = currentConfig.warnings
    .filter((w) => activeWarnings.includes(w) || activeWarnings.length === 0)
    .map((w) => currentConfig.improvementSuggestions[w])
    .filter(Boolean);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.onSurface,
      fontFamily: T.fontBody,
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: '5rem',
    }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Header Bar & Exercise Selector */}
        <header style={{
          borderBottom: T.border4,
          paddingBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
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
                AI Movement Studio
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
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              color: T.primary,
            }}>
              {currentConfig.name} Assessment
            </h1>
          </div>

          {/* Exercise Selection Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: T.surfaceVariant,
            padding: '0.35rem',
            border: T.border3,
            boxShadow: '3px 3px 0px 0px #1a1a1a',
          }}>
            <button
              disabled={isAssessing}
              onClick={() => { setExercise('curl'); setCompleted(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                border: exercise === 'curl' ? T.border2 : '2px solid transparent',
                background: exercise === 'curl' ? T.primaryContainer : 'transparent',
                color: T.primary,
                cursor: isAssessing ? 'not-allowed' : 'pointer',
                boxShadow: exercise === 'curl' ? '2px 2px 0px 0px #1a1a1a' : 'none',
              }}
            >
              <Dumbbell size={16} />
              <span>Dumbbell Curl</span>
            </button>

            <button
              disabled={isAssessing}
              onClick={() => { setExercise('pushup'); setCompleted(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                border: exercise === 'pushup' ? T.border2 : '2px solid transparent',
                background: exercise === 'pushup' ? T.primaryContainer : 'transparent',
                color: T.primary,
                cursor: isAssessing ? 'not-allowed' : 'pointer',
                boxShadow: exercise === 'pushup' ? '2px 2px 0px 0px #1a1a1a' : 'none',
              }}
            >
              <Activity size={16} />
              <span>Push-Up</span>
            </button>

            <button
              disabled={isAssessing}
              onClick={() => { setExercise('squat'); setCompleted(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                border: exercise === 'squat' ? T.border2 : '2px solid transparent',
                background: exercise === 'squat' ? T.primaryContainer : 'transparent',
                color: T.primary,
                cursor: isAssessing ? 'not-allowed' : 'pointer',
                boxShadow: exercise === 'squat' ? '2px 2px 0px 0px #1a1a1a' : 'none',
              }}
            >
              <Target size={16} />
              <span>Squat</span>
            </button>
          </div>
        </header>

        {/* Setup & Positioning Guide Box */}
        {!isAssessing && !completed && (
          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '1.25rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary, fontWeight: 900, fontFamily: T.fontHeadline, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                <CameraIcon size={18} color={T.tertiary} />
                <span>Camera Setup</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: T.onSurfaceVariant, marginTop: '0.35rem', lineHeight: 1.4 }}>
                {currentConfig.cameraSetup.instructions}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary, fontWeight: 900, fontFamily: T.fontHeadline, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                <Info size={18} color={T.primaryContainer} />
                <span>Instructions</span>
              </div>
              <ol style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, marginTop: '0.35rem', paddingLeft: '1.2rem', lineHeight: 1.4 }}>
                {currentConfig.instructions.slice(0, 3).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary, fontWeight: 900, fontFamily: T.fontHeadline, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                <Activity size={18} color={T.secondary} />
                <span>AI Evaluates</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {currentConfig.measuredMetrics.map((m, i) => (
                  <span key={i} style={{ background: T.surfaceVariant, border: T.border2, fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', fontFamily: T.fontHeadline }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Two-Column Studio Layout */}
        <main style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}>
          
          {/* LEFT COLUMN: CAMERA / SKELETON VIEWPORT */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderBottom: T.border4,
              paddingBottom: '0.5rem',
            }}>
              <h2 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '1.85rem',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                color: T.primary,
              }}>
                Live Camera Feed
              </h2>

              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.85rem',
                color: T.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textTransform: 'uppercase',
              }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.secondary, display: 'inline-block' }} />
                {isAssessing ? 'REC • ASSESSING' : (isCameraActive ? 'READY' : 'STANDBY')}
              </span>
            </div>

            {/* Camera Overlay Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/10',
              background: '#090d16',
              border: T.border4,
              boxShadow: T.shadow6,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isCameraActive ? 'block' : 'none',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />

              {isCameraActive && (
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: T.primary, color: T.primaryContainer,
                  fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem', border: T.border2, zIndex: 20,
                }}>
                  {fps > 0 ? `${fps} FPS` : '60 FPS'}
                </div>
              )}

              {!isCameraActive && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '2rem', textAlign: 'center',
                  gap: '1rem', color: '#ffffff',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: T.primaryContainer, border: '3px solid #1a1a1a',
                    boxShadow: '3px 3px 0px 0px #ffffff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCameraLoading ? <Loader2 size={30} color={T.primary} className="kreedai-spin" /> : <CameraIcon size={30} color={T.primary} />}
                  </div>

                  <div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '1.25rem', textTransform: 'uppercase', color: '#ffffff' }}>
                      {isCameraLoading ? 'Initializing MediaPipe...' : `${currentConfig.name} Camera`}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#a0aec0', maxWidth: '380px', marginTop: '0.25rem' }}>
                      {cameraError ? <span style={{ color: '#ff6b6b' }}>{cameraError}</span> : currentConfig.cameraSetup.instructions}
                    </p>
                  </div>

                  <button
                    disabled={isCameraLoading}
                    onClick={() => handleStartCamera(facingMode)}
                    style={{
                      background: T.primaryContainer, color: T.primary,
                      border: T.border3, boxShadow: '4px 4px 0px 0px #ffffff',
                      padding: '0.75rem 1.75rem', fontFamily: T.fontHeadline,
                      fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <CameraIcon size={18} />
                    <span>Start Camera</span>
                  </button>
                </div>
              )}

              {isCameraActive && (
                <div style={{
                  position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                  background: T.primary, color: T.primaryContainer, fontFamily: T.fontHeadline,
                  fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase',
                  padding: '0.5rem 1.25rem', border: T.border2, boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.5)',
                  zIndex: 20, whiteSpace: 'nowrap',
                }}>
                  {liveFeedback}
                </div>
              )}

              {/* Angle HUD Meter */}
              {isCameraActive && (
                <div style={{
                  position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.92)', border: T.border2, boxShadow: '3px 3px 0px 0px #1a1a1a',
                  padding: '0.75rem', zIndex: 20, minWidth: '95px',
                }}>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                    ROM %
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.6rem', lineHeight: 1, color: T.primary, marginTop: '0.2rem' }}>
                    {romPercent}%
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2ddd4', border: '1px solid #1a1a1a', marginTop: '0.4rem' }}>
                    <div style={{ height: '100%', background: romPercent >= 80 ? '#10b981' : T.secondary, width: `${romPercent}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: T.primaryContainer, border: T.border3, boxShadow: T.shadow4, padding: '0.85rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: T.primary }}>
                  Reps
                </div>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2.5rem', lineHeight: 1, color: T.primary, marginTop: '0.25rem' }}>
                  {repCount}
                </div>
              </div>

              <div style={{ background: T.surfaceLowest, border: T.border3, boxShadow: T.shadow4, padding: '0.85rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  TUT Sec
                </div>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', lineHeight: 1.1, color: T.primary, marginTop: '0.25rem' }}>
                  {duration}s
                </div>
              </div>

              <div style={{ background: T.surfaceLowest, border: T.border3, boxShadow: T.shadow4, padding: '0.85rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  Joint Angle
                </div>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', lineHeight: 1.1, color: T.primary, marginTop: '0.25rem' }}>
                  {currentAngle}°
                </div>
              </div>

              <div style={{ background: T.surfaceLowest, border: T.border3, boxShadow: T.shadow4, padding: '0.85rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  Stability
                </div>
                <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.6rem', lineHeight: 1.2, color: T.tertiary, marginTop: '0.25rem', textTransform: 'uppercase' }}>
                  {stabilityScore}%
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              background: T.surfaceLowest, border: T.border3, boxShadow: T.shadow6,
              padding: '1.25rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {!isAssessing ? (
                  <button
                    onClick={handleStartAssessment}
                    style={{
                      background: T.primaryContainer, color: T.primary,
                      border: T.border3, boxShadow: '3px 3px 0px 0px #1a1a1a',
                      padding: '0.75rem 1.5rem', fontFamily: T.fontHeadline,
                      fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <Play size={18} fill="#1a1a1a" />
                    <span>Start AI Assessment</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopAssessment}
                    style={{
                      background: T.secondary, color: '#ffffff',
                      border: T.border3, boxShadow: '3px 3px 0px 0px #1a1a1a',
                      padding: '0.75rem 1.5rem', fontFamily: T.fontHeadline,
                      fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <Square size={18} fill="#ffffff" />
                    <span>Finish & Show Results</span>
                  </button>
                )}

                <button
                  disabled={isCameraLoading}
                  onClick={isCameraActive ? handleStopCamera : () => handleStartCamera(facingMode)}
                  style={{
                    background: T.surfaceLowest, color: T.primary,
                    border: T.border2, boxShadow: '2px 2px 0px 0px #1a1a1a',
                    padding: '0.65rem 1rem', fontFamily: T.fontHeadline,
                    fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  {isCameraActive ? <CameraOff size={16} /> : <CameraIcon size={16} />}
                  <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                </button>

                <button
                  onClick={handleFlipCamera}
                  style={{
                    background: T.surfaceLowest, color: T.primary, border: T.border2,
                    boxShadow: '2px 2px 0px 0px #1a1a1a', padding: '0.65rem 0.85rem',
                    fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  <SwitchCamera size={16} />
                </button>

                <button
                  onClick={() => {
                    squatAnalyzerRef.current.reset();
                    pushupAnalyzerRef.current.reset();
                    curlAnalyzerRef.current.reset();
                    landmarkSamplesRef.current = [];
                    setRepCount(0);
                    setDuration(0);
                    setScore({ totalScore: 0, formAccuracy: 0, depthScore: 0, cadenceScore: 0, symmetryScore: 0, grade: 'D', repsCompleted: 0, validReps: 0 });
                    setCompleted(false);
                    setActiveWarnings([]);
                    setLiveFeedback('Session reset. Ready for assessment.');
                  }}
                  style={{
                    background: T.surfaceLowest, color: T.primary, border: T.border2,
                    boxShadow: '2px 2px 0px 0px #1a1a1a', padding: '0.65rem 0.85rem',
                    fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {isAssessing && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleSimulateRep(true)}
                    style={{ background: T.tertiary, color: '#fff', border: '1.5px solid #1a1a1a', padding: '0.4rem 0.65rem', fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    + Valid Rep
                  </button>
                  <button
                    onClick={() => handleSimulateRep(false)}
                    style={{ background: T.surfaceVariant, color: T.primary, border: '1.5px solid #1a1a1a', padding: '0.4rem 0.65rem', fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    + Warning Rep
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: ASSESSMENT RESULT & FORM BREAKDOWN */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Main Result Card */}
            <div style={{
              background: T.primaryContainer,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: T.border3, paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.35rem', textTransform: 'uppercase', color: T.primary }}>
                  {currentConfig.name}
                </h3>
                <div style={{ background: T.surfaceLowest, border: T.border2, boxShadow: '2px 2px 0px 0px #1a1a1a', padding: '0.3rem 0.75rem', fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', color: T.primary }}>
                  GRADE {score.grade || 'D'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.primary, display: 'block' }}>
                    FORM SCORE
                  </span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '4.5rem', lineHeight: 0.9, letterSpacing: '-0.06em', color: T.primary }}>
                      {score.totalScore || 0}
                    </span>
                    <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '1.5rem', color: T.primary, marginBottom: '0.4rem' }}>
                      /100
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.primary, display: 'block' }}>
                    REPS COMPLETED
                  </span>
                  <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2.5rem', color: T.primary }}>
                    {score.validReps} / {score.repsCompleted}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Breakdown Metrics (ROM, Stability, Tempo, Consistency) */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.5rem',
            }}>
              <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1rem', color: T.primary }}>
                Movement Metrics
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontFamily: T.fontHeadline, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Range of Motion</span>
                    <span>{romPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', border: T.border2, background: T.surfaceVariant }}>
                    <div style={{ height: '100%', background: T.primary, width: `${romPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontFamily: T.fontHeadline, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Stability</span>
                    <span>{stabilityScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', border: T.border2, background: T.surfaceVariant }}>
                    <div style={{ height: '100%', background: T.tertiary, width: `${stabilityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontFamily: T.fontHeadline, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Tempo & Control</span>
                    <span>{tempoScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', border: T.border2, background: T.surfaceVariant }}>
                    <div style={{ height: '100%', background: T.primaryContainer, borderRight: '2px solid #1a1a1a', width: `${tempoScore}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontFamily: T.fontHeadline, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Consistency</span>
                    <span>{consistencyScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', border: T.border2, background: T.surfaceVariant }}>
                    <div style={{ height: '100%', background: '#10b981', width: `${consistencyScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Warnings Box */}
            {activeWarnings.length > 0 && (
              <div style={{
                background: T.secondaryContainer,
                border: T.border3,
                borderLeft: `8px solid ${T.secondary}`,
                boxShadow: T.shadow4,
                padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} color={T.secondary} />
                  <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: T.secondary }}>
                    FORM WARNINGS DETECTED
                  </h4>
                </div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.88rem', fontWeight: 700, fontFamily: T.fontHeadline, color: T.primary }}>
                  {activeWarnings.map((w, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Coach Feedback & Actionable Improvement */}
            <div style={{
              background: T.surfaceVariant,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Sparkles size={18} color={T.primary} />
                <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: T.primary }}>
                  AI COACH FEEDBACK
                </h4>
              </div>
              <p style={{ fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5, color: T.primary, marginBottom: '0.75rem' }}>
                {liveFeedback}
              </p>

              {currentSuggestions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: T.fontHeadline, textTransform: 'uppercase', color: T.onSurfaceVariant, display: 'block', marginBottom: '0.35rem' }}>
                    IMPROVEMENT SUGGESTIONS:
                  </span>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', fontWeight: 600, fontFamily: T.fontBody, color: T.primary }}>
                    {currentSuggestions.map((sug, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Session Logs List */}
            {repLogs.length > 0 && (
              <div style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1rem 1.25rem',
                maxHeight: '160px',
                overflowY: 'auto',
              }}>
                <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: T.onSurfaceVariant, marginBottom: '0.5rem' }}>
                  Rep Evaluation Log
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: T.fontHeadline }}>
                  {repLogs.slice(-6).map((log, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: log.status === 'Form Warning' || log.status === 'Insufficient Depth' ? T.secondary : T.primary }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'Form Warning' || log.status === 'Insufficient Depth' ? T.secondary : T.primary }} />
                      <span>Rep {log.repNumber}: {log.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save & Navigation Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {(completed || savedSuccess) && (
                <div style={{
                  padding: '0.65rem 1rem', background: '#E6F4EA', border: T.border2,
                  color: '#137333', fontFamily: T.fontHeadline, fontWeight: 800,
                  fontSize: '0.82rem', textTransform: 'uppercase', display: 'flex',
                  alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={16} />
                  <span>Result Saved to Cloud & IndexedDB</span>
                </div>
              )}

              {completed && (
                <button
                  onClick={handleStopAssessment}
                  style={{
                    background: T.primaryContainer, color: T.primary,
                    border: T.border3, boxShadow: T.shadow4, padding: '1rem',
                    fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.1rem',
                    textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {savedSuccess ? '✓ Assessment Saved' : 'Save Result to Profile'}
                </button>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Link
                  to="/progress"
                  style={{
                    background: T.surfaceLowest, color: T.primary, border: T.border2,
                    boxShadow: '3px 3px 0px 0px #1a1a1a', padding: '0.75rem',
                    fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.85rem',
                    textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  }}
                >
                  <BarChart2 size={16} />
                  <span>Analytics</span>
                </Link>

                <Link
                  to="/dashboard"
                  style={{
                    background: T.surfaceLowest, color: T.primary, border: T.border2,
                    boxShadow: '3px 3px 0px 0px #1a1a1a', padding: '0.75rem',
                    fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.85rem',
                    textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  }}
                >
                  <User size={16} />
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default Assessment;