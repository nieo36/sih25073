import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Download, 
  QrCode, 
  Share2, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

export const Passport: React.FC = () => {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            Digital Athlete <span className="gradient-text">Sports Passport</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Government & SAI-recognized cryptographic proof of physical benchmarks and biomechanical integrity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary">
            <Share2 size={16} /> Share Passport
          </button>
          <button className="btn btn-primary">
            <Download size={16} /> Download Certificate
          </button>
        </div>
      </div>

      {/* Main Passport Card Container */}
      <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--shadow-glow)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle Watermark Badge */}
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: '-40px',
            opacity: 0.05,
            pointerEvents: 'none'
          }}>
            <ShieldCheck size={320} color="#fff" />
          </div>

          {/* Passport Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1.5rem',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'var(--gradient-neon)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
              }}>
                <Activity size={28} color="#fff" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  SPORTS AUTHORITY VERIFIED PASSPORT
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>SAI ATHLETE IDENTITY #IND-2026-8849</h2>
              </div>
            </div>

            <span className="badge badge-emerald" style={{ padding: '0.4rem 0.85rem' }}>
              <CheckCircle2 size={15} /> Cryptographically Signed
            </span>
          </div>

          {/* Body Profile & QR Scan Section */}
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {/* Athlete Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Athlete Full Name</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Aarav Sharma</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PRIMARY SPORT</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Athletics & Track</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>REGION / STATE</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Delhi, India</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AGE / CATEGORY</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>19 Yrs • Under-21</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ATHLETE TIER</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-violet)' }}>Platinum (1,850 ELO)</div>
                </div>
              </div>
            </div>

            {/* QR Code Verification Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '0.75rem'
            }}>
              {/* Synthetic QR Code Graphics */}
              <div style={{
                background: '#ffffff',
                padding: '0.75rem',
                borderRadius: '10px',
                display: 'inline-flex',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
              }}>
                <QrCode size={110} color="#090d16" />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                HASH: 8f9b...e21a (Scan to verify on-field)
              </span>
            </div>
          </div>

          {/* Biomechanical Athletic Rating Grid */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--accent-cyan)" /> Verified Biomechanical Competency Radar
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LOWER POWER</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>90%</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>UPPER POWER</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 850, color: '#10b981', fontFamily: 'var(--font-mono)' }}>86%</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MOBILITY & ROM</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>94%</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>BILATERAL SYMMETRY</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>95%</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>OVERALL GRADE</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 850, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>A+ (88.4)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
