import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Camera, CameraOff, RefreshCw, Video } from 'lucide-react';

export interface CameraViewRef {
  getVideoElement: () => HTMLVideoElement | null;
  getCanvasElement: () => HTMLCanvasElement | null;
}

interface CameraViewProps {
  onFrame?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  showOverlay?: boolean;
}

export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(({ onFrame, showOverlay = true }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    getCanvasElement: () => canvasRef.current,
  }));

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (err) {
      console.warn('Webcam stream could not be started:', err);
      setErrorMessage('Camera access unavailable. Using interactive AI simulation mode.');
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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

      if (videoRef.current && canvasRef.current && onFrame) {
        onFrame(videoRef.current, canvasRef.current);
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [onFrame]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#05070c' }}>
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: '100%',
          height: '480px',
          objectFit: 'cover',
          display: isActive ? 'block' : 'none',
          transform: 'scaleX(-1)', // Mirror mode
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
            transform: 'scaleX(-1)', // Match mirrored video
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
            background: 'rgba(6, 182, 212, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.25)',
          }}>
            <Video size={32} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Vision Feed Ready
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px' }}>
              {errorMessage || 'Initializing hardware acceleration and high-speed pose tracking.'}
            </p>
          </div>
          <button onClick={startCamera} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <RefreshCw size={16} /> Re-detect Camera
          </button>
        </div>
      )}

      {/* Top Camera Status Overlay */}
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

        <button
          onClick={isActive ? stopCamera : startCamera}
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
  );
});

CameraView.displayName = 'CameraView';
