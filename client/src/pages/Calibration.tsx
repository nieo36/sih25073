import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Award,
  Camera as CameraIcon,
  CheckCircle2,
  Loader2,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createPoseDetector, drawPoseSkeleton, smoothLandmarks, checkFramingAndVisibility } from '../mediapipe/pose';
import { PushupAnalyzer } from '../mediapipe/pushup';
import { SquatAnalyzer } from '../mediapipe/squat';
import { VerticalJumpAnalyzer } from '../mediapipe/basketball_verticalJump';
import { OfflineStorage } from '../storage/indexedDB';
import { ApiService } from '../services/api';

const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
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

interface CalibrationStep {
  id: number;
  title: string;
  category: string;
  exercise: string;
  duration: number; // in seconds
  description: string;
  instruction: string;
}

const CALIBRATION_STEPS: CalibrationStep[] = [
  {
    id: 1,
    title: 'Upper Body Strength',
    category: 'STRENGTH',
    exercise: 'pushup',
    duration: 30,
    description: 'Perform controlled push-ups to calibrate chest, triceps, and core stability.',
    instruction: 'Position device at floor level ~2m away so your full body is visible.',
  },
  {
    id: 2,
    title: 'Lower Body Mobility & Depth',
    category: 'MOBILITY',
    exercise: 'squat',
    duration: 30,
    description: 'Perform bodyweight squats with full range of motion past parallel.',
    instruction: 'Stand sideways or 45° to the camera with head-to-toe in full frame.',
  },
  {
    id: 3,
    title: 'Explosive Power & Readiness',
    category: 'POWER',
    exercise: 'vertical_jump',
    duration: 20,
    description: 'Perform max vertical jump efforts to calculate explosive power and landing stability.',
    instruction: 'Stand fully upright in camera frame and jump vertically on prompt.',
  },
];

export const Calibration: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRegistration = (location.state as any)?.isFirstRegistration;

  const [stepIndex, setStepIndex] = useState<number>(0);
  const currentStep = CALIBRATION_STEPS[stepIndex];
  const stepIndexRef = useRef<number>(stepIndex);

  // Camera & Pipeline State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(currentStep.duration);
  const [repCount, setRepCount] = useState<number>(0);
  const [formScore, setFormScore] = useState<number>(0);
  const [framingStatus, setFramingStatus] = useState<string>('Step into camera frame to begin');
  const [isProperlyFramed, setIsProperlyFramed] = useState<boolean>(false);

  // Step Results Collected
  const [collectedResults, setCollectedResults] = useState<Array<{
    stepId: number;
    category: string;
    exercise: string;
    reps: number;
    score: number;
    metrics: Record<string, number>;
  }>>([]);

  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseDetectorRef = useRef<any>(null);
  const prevLandmarksRef = useRef<any>(null);
  const isAssessingRef = useRef<boolean>(false);
  const cameraActiveRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  // Analyzers
  const pushupAnalyzerRef = useRef(new PushupAnalyzer());
  const squatAnalyzerRef = useRef(new SquatAnalyzer());
  const jumpAnalyzerRef = useRef(new VerticalJumpAnalyzer());

  useEffect(() => {
    isAssessingRef.current = isAssessing;
  }, [isAssessing]);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopCamera = () => {
    cameraActiveRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!poseDetectorRef.current) {
        poseDetectorRef.current = createPoseDetector(handlePoseResults);
        await poseDetectorRef.current.initialize();
      }

      cameraActiveRef.current = true;
      setCameraActive(true);

      const sendFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2 && poseDetectorRef.current) {
          try {
            await poseDetectorRef.current.send({ image: videoRef.current });
          } catch (e) {
            // frame processing catch
          }
        }
        if (streamRef.current && cameraActiveRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(sendFrame);
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(sendFrame);
    } catch (err: any) {
      console.error('Calibration camera error:', err);
      setFramingStatus('Unable to access camera. Please allow camera permissions.');
    } finally {
      setCameraLoading(false);
    }
  };

  const handlePoseResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !results.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const videoWidth = (video && video.videoWidth > 0) ? video.videoWidth : (results.image.width || 640);
    const videoHeight = (video && video.videoHeight > 0) ? video.videoHeight : (results.image.height || 480);

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      // 1. Landmark smoothing
      const smoothed = smoothLandmarks(results.poseLandmarks, prevLandmarksRef.current, 0.65);
      prevLandmarksRef.current = smoothed;

      // 2. Framing check
      const framing = checkFramingAndVisibility(smoothed);
      setIsProperlyFramed(framing.isProperlyFramed);
      setFramingStatus(framing.message);

      // 3. Draw skeleton
      drawPoseSkeleton(ctx, smoothed, canvas.width, canvas.height, {
        pointColor: '#ffcc00',
        lineColor: 'rgba(0, 85, 255, 0.8)',
        pointRadius: 6,
        lineWidth: 4,
        minConfidence: 0.5,
      });

      // 4. Live Analyzer Processing if assessing
      if (isAssessingRef.current) {
        const step = CALIBRATION_STEPS[stepIndexRef.current];
        if (step.exercise === 'pushup') {
          const res = pushupAnalyzerRef.current.process(smoothed);
          setRepCount(res.repCount);
          setFormScore(Math.round(res.formScore || 80));
        } else if (step.exercise === 'squat') {
          const res = squatAnalyzerRef.current.process(smoothed);
          setRepCount(res.repCount);
          setFormScore(Math.round(res.formScore || 80));
        } else if (step.exercise === 'vertical_jump') {
          const res = jumpAnalyzerRef.current.process(smoothed);
          setRepCount(res.repCount || 0);
          setFormScore(Math.round(res.formScore || 82));
        }
      }
    } else {
      setIsProperlyFramed(false);
      setFramingStatus('No athlete detected in frame.');
    }
    ctx.restore();
  }, []);

  const startTest = () => {
    // Reset analyzers for this step
    if (currentStep.exercise === 'pushup') pushupAnalyzerRef.current.reset();
    if (currentStep.exercise === 'squat') squatAnalyzerRef.current.reset();
    if (currentStep.exercise === 'vertical_jump') jumpAnalyzerRef.current.reset();

    setRepCount(0);
    setFormScore(0);
    setTimeLeft(currentStep.duration);
    setIsAssessing(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishStep = () => {
    setIsAssessing(false);

    // Calculate score based on actual reps and form
    const currentReps = repCount;
    const computedScore = Math.min(99, Math.max(50, Math.round(
      (currentReps >= 5 ? 75 : 60) + Math.min(20, currentReps * 2.5) + (formScore ? (formScore - 70) * 0.2 : 0)
    )));

    const result = {
      stepId: currentStep.id,
      category: currentStep.category,
      exercise: currentStep.exercise,
      reps: currentReps,
      score: computedScore,
      metrics: {
        reps: currentReps,
        form: formScore || 80,
      },
    };

    setCollectedResults((prev) => [...prev, result]);

    if (stepIndex + 1 < CALIBRATION_STEPS.length) {
      setStepIndex(stepIndex + 1);
      setTimeLeft(CALIBRATION_STEPS[stepIndex + 1].duration);
      setRepCount(0);
      setFormScore(0);
    } else {
      // Completed all calibration steps
      setIsComplete(true);
      saveCalibrationData([...collectedResults, result]);
    }
  };

  const saveCalibrationData = async (allResults: typeof collectedResults) => {
    try {
      const overallBaselineScore = Math.round(
        allResults.reduce((acc, r) => acc + r.score, 0) / allResults.length
      );

      // Save each assessment to IndexedDB
      for (const res of allResults) {
        const stored = {
          id: `calib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${res.exercise}`,
          exerciseType: res.exercise,
          date: new Date().toISOString(),
          totalScore: res.score,
          grade: res.score >= 85 ? 'A' : res.score >= 70 ? 'B' : 'C',
          repsCompleted: res.reps,
          validReps: res.reps,
          durationSeconds: 30,
          caloriesBurned: Math.round(res.reps * 1.5),
          symmetryScore: 85,
          depthScore: 80,
          formAccuracy: res.metrics.form || 80,
          cadenceScore: 80,
          synced: false,
          createdAt: Date.now(),
        };
        await OfflineStorage.saveAssessment(stored as any);

        // Also post to backend if available
        try {
          await ApiService.syncAssessment(stored as any);
        } catch {}
      }

      // Update user profile
      if (user) {
        updateUser({
          ...user,
          profile: {
            ...user.profile,
            score: overallBaselineScore,
            isCalibrated: true,
          },
        });
      }

      // Notify window of storage update so dashboard refreshes automatically
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('assessment-saved'));
    } catch (err) {
      console.warn('Failed saving calibration baseline:', err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.onSurface,
        fontFamily: T.fontBody,
        WebkitFontSmoothing: 'antialiased',
        padding: 'clamp(1rem, 3vw, 2.5rem) 1rem',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: T.border4,
            paddingBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: T.primaryContainer, border: T.border2, padding: '0.2rem 0.6rem', fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', boxShadow: '2px 2px 0px #1a1a1a' }}>
              <Sparkles size={13} />
              Initial Athlete Baseline
            </div>
            <h1 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', textTransform: 'uppercase', marginTop: '0.35rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Athlete Calibration
            </h1>
          </div>

          <Link
            to="/dashboard"
            style={{
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: T.onSurfaceVariant,
              textDecoration: 'none',
              border: T.border2,
              padding: '0.45rem 0.85rem',
              background: T.surfaceLowest,
              boxShadow: '2px 2px 0px #1a1a1a',
            }}
          >
            Skip to Dashboard &rarr;
          </Link>
        </header>

        {isFirstRegistration && (
          <div
            style={{
              background: T.primaryContainer,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              fontFamily: T.fontHeadline,
              fontSize: '0.9rem',
              color: T.primary,
            }}
          >
            <Sparkles size={24} color={T.primary} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                Welcome to KreedAI Athlete Onboarding!
              </div>
              <div style={{ fontFamily: T.fontBody, fontSize: '0.88rem', marginTop: '0.15rem', color: T.onSurface }}>
                Complete this initial MediaPipe AI calibration to benchmark your joint movement and display your baseline scores on your dashboard.
              </div>
            </div>
          </div>
        )}

        {/* Step Progress Tracker */}
        {!isComplete && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
            }}
          >
            {CALIBRATION_STEPS.map((step, idx) => {
              const isActive = idx === stepIndex;
              const isPast = idx < stepIndex;
              return (
                <div
                  key={step.id}
                  style={{
                    background: isActive ? T.primaryContainer : isPast ? '#dcfce7' : T.surfaceLowest,
                    border: T.border3,
                    padding: '0.75rem',
                    boxShadow: isActive ? T.shadow4 : '2px 2px 0px #1a1a1a',
                    transform: isActive ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: T.primary }}>
                      STEP {idx + 1}
                    </span>
                    {isPast && <CheckCircle2 size={15} color="#16a34a" />}
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.85rem', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete State Screen */}
        {isComplete ? (
          <div
            style={{
              background: T.surfaceLowest,
              border: T.border4,
              boxShadow: T.shadow8,
              padding: 'clamp(1.5rem, 5vw, 3rem)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: T.primaryContainer,
                border: T.border3,
                boxShadow: T.shadow4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={36} color={T.primary} />
            </div>

            <div>
              <h2 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
                Your Baseline Is Ready
              </h2>
              <p style={{ color: T.onSurfaceVariant, fontSize: '1rem', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
                Your initial biometric benchmarks have been recorded directly from your completed movement tests. Your genuine performance analytics are now calibrated and ready.
              </p>
            </div>

            {/* Baseline Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                width: '100%',
                maxWidth: '700px',
                marginTop: '1rem',
              }}
            >
              {collectedResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: T.surfaceVariant,
                    border: T.border3,
                    padding: '1rem',
                    textAlign: 'left',
                    boxShadow: '3px 3px 0px #1a1a1a',
                  }}
                >
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: T.tertiary }}>
                    {r.category}
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.75rem', margin: '0.25rem 0' }}>
                    {r.score}
                    <span style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, fontWeight: 700 }}> / 100</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: T.onSurfaceVariant }}>
                    {r.reps} completed reps recorded
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: T.primaryContainer,
                border: T.border4,
                boxShadow: T.shadow6,
                padding: '1rem 2.5rem',
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '1.2rem',
                textTransform: 'uppercase',
                color: T.primary,
                cursor: 'pointer',
                marginTop: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Enter Athlete Dashboard
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          /* Active Calibration Assessment View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Instruction Banner */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: T.tertiary }}>
                  Test {stepIndex + 1} of {CALIBRATION_STEPS.length} &bull; {currentStep.category}
                </span>
                <h2 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  {currentStep.title} ({currentStep.duration}s)
                </h2>
                <p style={{ fontSize: '0.88rem', color: T.onSurfaceVariant, marginTop: '0.25rem', fontWeight: 500 }}>
                  {currentStep.instruction}
                </p>
              </div>

              {/* Status Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  background: isProperlyFramed ? '#dcfce7' : '#fee2e2',
                  border: T.border2,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  color: isProperlyFramed ? '#15803d' : '#b91c1c',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isProperlyFramed ? '#16a34a' : '#ef4444' }} />
                {framingStatus}
              </div>
            </div>

            {/* Camera Viewport (Mobile-First Priority) */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                background: '#000000',
                border: T.border4,
                boxShadow: T.shadow8,
                aspectRatio: '4 / 3',
                maxHeight: '520px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror user
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  pointerEvents: 'none',
                }}
              />

              {/* Inactive Camera Overlay */}
              {!cameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(26,26,26,0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: '#ffffff',
                  }}
                >
                  <CameraIcon size={44} color="#ffcc00" />
                  <div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase' }}>
                      Camera Access Required
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#d6d1c9', marginTop: '0.25rem', maxWidth: '400px' }}>
                      KreedAI evaluates biomechanics directly on your device via privacy-first on-device computer vision.
                    </p>
                  </div>

                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    style={{
                      background: T.primaryContainer,
                      border: T.border3,
                      padding: '0.85rem 1.75rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      color: T.primary,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0px #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {cameraLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                    Start Calibration Camera
                  </button>
                </div>
              )}

              {/* Live Overlay Metrics HUD when assessing */}
              {isAssessing && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    right: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    pointerEvents: 'none',
                  }}
                >
                  {/* Reps Counter */}
                  <div
                    style={{
                      background: 'rgba(26,26,26,0.85)',
                      border: '2px solid #ffcc00',
                      padding: '0.5rem 1rem',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ fontFamily: T.fontHeadline, fontSize: '0.65rem', fontWeight: 800, color: '#ffcc00', textTransform: 'uppercase' }}>
                      REPS COMPLETED
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                      {repCount}
                    </div>
                  </div>

                  {/* Timer */}
                  <div
                    style={{
                      background: timeLeft <= 5 ? '#e63b2e' : 'rgba(26,26,26,0.85)',
                      border: '2px solid #ffffff',
                      padding: '0.5rem 1rem',
                      color: '#ffffff',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ fontFamily: T.fontHeadline, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      TIME LEFT
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Controls */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {cameraActive && !isAssessing && (
                <button
                  onClick={startTest}
                  disabled={!isProperlyFramed}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    background: isProperlyFramed ? T.primaryContainer : '#d6d1c9',
                    border: T.border4,
                    boxShadow: isProperlyFramed ? T.shadow6 : 'none',
                    padding: '1rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: 900,
                    fontSize: '1.15rem',
                    textTransform: 'uppercase',
                    color: T.primary,
                    cursor: isProperlyFramed ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Play size={20} />
                  Start {currentStep.title} ({currentStep.duration}s)
                </button>
              )}

              {isAssessing && (
                <button
                  onClick={finishStep}
                  style={{
                    flex: 1,
                    background: T.secondary,
                    border: T.border4,
                    boxShadow: T.shadow6,
                    padding: '1rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: 900,
                    fontSize: '1.15rem',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  End & Save Test Result
                </button>
              )}

              <button
                onClick={finishStep}
                disabled={isAssessing}
                style={{
                  background: T.surfaceLowest,
                  border: T.border3,
                  padding: '1rem 1.5rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  color: T.primary,
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px #1a1a1a',
                }}
              >
                Skip This Test &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
