import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const UpdateBanner: React.FC = () => {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <aside
      aria-label="App Update Available"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 95,
        width: 'calc(100% - 24px)',
        maxWidth: '460px',
        background: '#0055ff',
        color: '#ffffff',
        border: '3px solid #1a1a1a',
        boxShadow: '6px 6px 0px 0px #1a1a1a',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Sparkles size={20} color="#ffcc00" style={{ flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            New KreedAI Update Ready
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.72rem',
              color: '#d6e3ff',
              marginTop: '0.15rem',
            }}
          >
            Latest biomechanical models & performance patches
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={updateApp}
        style={{
          background: '#ffcc00',
          color: '#1a1a1a',
          border: '2px solid #1a1a1a',
          boxShadow: '2px 2px 0px 0px #1a1a1a',
          padding: '0.45rem 0.85rem',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          flexShrink: 0,
        }}
      >
        <RefreshCw size={13} /> Update Now
      </button>
    </aside>
  );
};
