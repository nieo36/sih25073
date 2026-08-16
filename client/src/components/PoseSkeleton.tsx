import React, { useEffect, useRef } from 'react';
import { NormalizedLandmark } from '../mediapipe/landmarks';
import { drawPoseSkeleton } from '../mediapipe/pose';

interface PoseSkeletonProps {
  landmarks: NormalizedLandmark[];
  width?: number;
  height?: number;
  highlightAngle?: {
    jointIndex: number;
    angleValue: number;
    label: string;
    isOptimal: boolean;
  };
}

export const PoseSkeleton: React.FC<PoseSkeletonProps> = ({
  landmarks,
  width = 640,
  height = 360,
  highlightAngle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines for athletic posture calibration
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render skeleton
    drawPoseSkeleton(ctx, landmarks, width, height, {
      pointColor: '#06b6d4',
      lineColor: 'rgba(6, 182, 212, 0.8)',
      pointRadius: 4,
      lineWidth: 3,
    });

    // Render angle gauge callout if specified
    if (highlightAngle && landmarks[highlightAngle.jointIndex]) {
      const p = landmarks[highlightAngle.jointIndex];
      const cx = p.x * width;
      const cy = p.y * height;

      ctx.save();
      ctx.fillStyle = highlightAngle.isOptimal ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Tooltip box
      const text = `${highlightAngle.label}: ${highlightAngle.angleValue}°`;
      ctx.font = 'bold 12px Space Grotesk, monospace';
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = highlightAngle.isOptimal ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx + 15, cy - 15, textWidth + 16, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx + 23, cy + 2);
      ctx.restore();
    }
  }, [landmarks, width, height, highlightAngle]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(15, 23, 42, 0.4)',
        }}
      />
    </div>
  );
};
