import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestoredToast(false);
    } else if (wasOffline) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => {
        setShowRestoredToast(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <aside
        aria-label="Offline Mode Notification"
        style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#1a1a1a',
          color: '#ffcc00',
          border: '2px solid #ffcc00',
          boxShadow: '4px 4px 0px 0px #ffcc00',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          animation: 'slideDown 0.2s ease',
          maxWidth: '92vw',
        }}
      >
        <WifiOff size={15} color="#ffcc00" />
        <span>Offline Mode · Assessments saved to device</span>
      </aside>
    );
  }

  if (showRestoredToast) {
    return (
      <aside
        aria-label="Online Restored Notification"
        style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#16a34a',
          color: '#ffffff',
          border: '2px solid #1a1a1a',
          boxShadow: '4px 4px 0px 0px #1a1a1a',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          animation: 'slideDown 0.2s ease',
          maxWidth: '92vw',
        }}
      >
        <CheckCircle2 size={15} color="#ffffff" />
        <span>Connection Restored · Cloud sync enabled</span>
      </aside>
    );
  }

  return null;
};
