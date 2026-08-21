import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Camera, CameraOff, RefreshCw, Video, SwitchCamera, AlertTriangle } from 'lucide-react';

export interface CameraViewRef {
  getVideoElement: () => HTMLVideoElement | null;
  getCanvasElement: () => HTMLCanvasElement | null;
  toggleCameraFacing: () => void;
  getFacingMode: () => 'user' | 'environment';
}

interface CameraViewProps {
  onFrame?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  showOverlay?: boolean;
  initialFacingMode?: 'user' | 'environment';
}

export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(({ onFrame, showOverlay = true, initialFacingMode = 'user' }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [isInsecureContext, setIsInsecureContext] = useState<boolean>(false);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    getCanvasElement: () => canvasRef.current,
    toggleCameraFacing: () => {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    },
    getFacingMode: () => facingMode,
  }));

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();

    // Check secure context for mobile devices
    if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost') {
      setIsInsecureContext(true);
      setErrorMessage('Mobile cameras require HTTPS or localhost. If on a phone over local Wi-Fi, open via HTTPS or a secure tunnel (e.g. ngrok).');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Webcam API is unavailable in this browser context. Please verify permissions and HTTPS.');
      setIsActive(false);
      return;
    }

    setErrorMessage(null);
    setIsInsecureContext(false);

    // Tiered constraint fallbacks for phone compatibility (portrait/landscape & varying resolutions)
    const constraintTiers: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: mode,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let stream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintTiers) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!stream) {
      console.warn('Webcam stream could not be started after fallback tiers:', lastError);
      setErrorMessage(
        lastError?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your mobile browser settings.'
          : 'Could not acquire camera stream. Running in simulation mode.'
      );
      setIsActive(false);
      return;
    }

    try {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS requires explicit attributes
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (playErr) {
      console.warn('Error playing video stream:', playErr);
      setIsActive(false);
    }
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Frame processing loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      if (videoRef.current && canvasRef.current && onFrame && isActive) {
        onFrame(videoRef.current, canvasRef.current);
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    if (isActive) {
      animationFrameId.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [onFrame, isActive]);

  const isFrontCamera = facingMode === 'user';

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#05070c' }}>
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '480px',
          objectFit: 'cover',
          display: isActive ? 'block' : 'none',
          transform: isFrontCamera ? 'scaleX(-1)' : 'none', // Mirror front camera only
        }}
      />

      {/* Canvas Overlay for Pose Keypoints and Angle Annotations */}
      {showOverlay && (
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            transform: isFrontCamera ? 'scaleX(-1)' : 'none',
          }}
        />
      )}

      {/* Fallback Simulation Mode view if camera is offline */}
      {!isActive && (
        <div style={{
          height: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #090d16 0%, #111827 100%)',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isInsecureContext ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isInsecureContext ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.25)'}`,
          }}>
            {isInsecureContext ? (
              <AlertTriangle size={32} color="#ef4444" />
            ) : (
              <Video size={32} color="var(--accent-cyan)" />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {isInsecureContext ? 'Secure Context (HTTPS) Required' : 'Vision Feed Ready'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.5 }}>
              {errorMessage || 'Initializing hardware acceleration and high-speed pose tracking.'}
            </p>
          </div>
          <button onClick={() => startCamera(facingMode)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <RefreshCw size={16} /> Re-detect Camera
          </button>
        </div>
      )}

      {/* Top Camera Status & Control Overlay */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          border: '1px solid var(--border-color)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isActive ? '#10b981' : '#f43f5e',
            boxShadow: isActive ? '0 0 8px #10b981' : 'none',
          }} />
          <span style={{ fontWeight: 600 }}>{isActive ? 'LIVE STREAM' : 'AI SIMULATION'}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {fps > 0 ? `${fps} FPS` : '60 FPS'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Flip Front / Rear Camera Button */}
          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="btn btn-secondary"
            title={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} Camera`}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <SwitchCamera size={15} />
            <span style={{ display: 'none', md: 'inline' } as any}>{facingMode === 'user' ? 'Front' : 'Rear'}</span>
          </button>

          <button
            onClick={isActive ? stopCamera : () => startCamera(facingMode)}
            className="btn btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {isActive ? <CameraOff size={15} /> : <Camera size={15} />}
            <span>{isActive ? 'Turn Off' : 'Turn On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

CameraView.displayName = 'CameraView';
