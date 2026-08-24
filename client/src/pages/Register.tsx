import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff,
  User, Trophy, Award,
  Sparkles, CheckCircle2, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   KreedAI Register — Streamlined Athlete Onboarding
   Neo-Brutalist / Bauhaus Theme
   ───────────────────────────────────────────── */

// ── Design tokens ──────────────────────
const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  secondary: '#e63b2e',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  onPrimary: '#ffffff',
  performanceIndigo: '#4F46E5',
  actionTeal: '#0D9488',
  pulseOrange: '#F97316',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow4: '4px 4px 0px 0px rgba(26,26,26,1)',
  shadow6: '6px 6px 0px 0px rgba(26,26,26,1)',
  shadow8: '8px 8px 0px 0px rgba(26,26,26,1)',
} as const;

// ── Streamlined 3 Steps ──
const STEPS = [
  { key: 'account', label: 'Account', icon: <User size={18} /> },
  { key: 'about',   label: 'Athlete Info', icon: <Award size={18} /> },
  { key: 'sport',   label: 'Sport & Baseline', icon: <Trophy size={18} /> },
] as const;

// ── Visual Sport Cards ──────────────────────
interface SportOption {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

const SPORTS_LIST: SportOption[] = [
  { id: 'Athletics', name: 'Athletics & Track', category: 'Speed & Track', emoji: '🏃' },
  { id: 'Basketball', name: 'Basketball', category: 'Court & Power', emoji: '🏀' },
  { id: 'Boxing', name: 'Boxing', category: 'Combat & Speed', emoji: '🥊' },
  { id: 'Weightlifting', name: 'Weightlifting', category: 'Pure Strength', emoji: '🏋️' },
  { id: 'Football', name: 'Football (Soccer)', category: 'Team & Agility', emoji: '⚽' },
  { id: 'Badminton', name: 'Badminton', category: 'Racket & Reflexes', emoji: '🏸' },
  { id: 'Volleyball', name: 'Volleyball', category: 'Vertical Jump & Power', emoji: '🏐' },
  { id: 'Wrestling', name: 'Wrestling', category: 'Mat & Strength', emoji: '🤼' },
  { id: 'Hockey', name: 'Field Hockey', category: 'Stick & Precision', emoji: '🏑' },
  { id: 'Archery', name: 'Archery', category: 'Precision & Focus', emoji: '🎯' },
];

// ── Form State Interface ──────────────────────
interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
  state: string;
  city: string;
  primarySport: string;
  experienceLevel: string;
  termsAccepted: boolean;
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: 'Male',
  state: 'Delhi',
  city: '',
  primarySport: 'Basketball',
  experienceLevel: 'intermediate',
  termsAccepted: true,
};

// ── Google SVG ──────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ── Shared styles ──────────────────────
const neoLabel: React.CSSProperties = {
  display: 'block',
  fontFamily: T.fontHeadline,
  fontWeight: 700,
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  color: T.primary,
  marginBottom: '0.5rem',
};

const neoInput: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: T.border2,
  background: T.surfaceLowest,
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.2s ease',
  borderRadius: 0,
};

const neoCard: React.CSSProperties = {
  border: T.border3,
  background: T.surface,
  boxShadow: T.shadow8,
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  position: 'relative',
};

const neoCTA: React.CSSProperties = {
  width: '100%',
  background: T.primaryContainer,
  border: T.border4,
  color: T.primary,
  fontFamily: T.fontHeadline,
  fontWeight: 900,
  textTransform: 'uppercase',
  fontSize: 'clamp(1.05rem, 3vw, 1.25rem)',
  padding: '1rem',
  boxShadow: T.shadow8,
  cursor: 'pointer',
  transition: 'all 0.1s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  letterSpacing: '-0.02em',
};

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOAuth = searchParams.get('oauth') === 'true';

  const [currentStep, setCurrentStep] = useState(isOAuth ? 1 : 0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user, register: registerUser, loginWithGoogle, saveProfile } = useAuth();

  useEffect(() => {
    if (isOAuth && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        primarySport: user.profile?.primarySport || prev.primarySport,
      }));
    }
  }, [isOAuth, user]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const validateStep = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    const step = STEPS[currentStep].key;

    if (step === 'account' && !isOAuth) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      if (!formData.email.trim()) errs.email = 'Email address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Please enter a valid email address';
      if (!formData.password) errs.password = 'Password is required';
      else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 'about') {
      if (!formData.age) errs.age = 'Age is required';
      else if (Number(formData.age) < 5 || Number(formData.age) > 100) errs.age = 'Enter a valid age (5-100)';
      if (!formData.gender) errs.gender = 'Gender is required';
    }
    if (step === 'sport') {
      if (!formData.primarySport.trim()) errs.primarySport = 'Please select your primary sport';
      if (!formData.termsAccepted) errs.termsAccepted = 'Please accept athletic safety & terms';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = async () => {
    if (!validateStep()) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      setSubmitting(true);
      try {
        if (!isOAuth) {
          await registerUser({
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            profile: {
              age: formData.age ? Number(formData.age) : 19,
              gender: formData.gender,
              state: formData.state,
              city: formData.city,
              primarySport: formData.primarySport,
              experienceLevel: formData.experienceLevel,
            },
          });
        } else {
          await saveProfile({
            name: formData.fullName,
            profile: {
              age: formData.age ? Number(formData.age) : 19,
              gender: formData.gender,
              state: formData.state,
              city: formData.city,
              primarySport: formData.primarySport,
              experienceLevel: formData.experienceLevel,
            },
          });
        }
        // Direct transition to Athlete Calibration onboarding
        navigate('/calibration');
      } catch (err: any) {
        const msg = err?.message || 'Registration failed';
        if (msg.toLowerCase().includes('already in use') || msg.toLowerCase().includes('duplicate')) {
          setErrors({ email: 'This email is already registered. Please sign in.' });
          setCurrentStep(0);
        } else {
          setErrors({ email: msg });
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.onSurface,
        fontFamily: T.fontBody,
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
        padding: 'clamp(1rem, 3vw, 2.5rem) 1rem',
      }}
    >
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: T.border4,
            paddingBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: T.primaryContainer, border: T.border2, padding: '0.2rem 0.5rem', fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', boxShadow: '2px 2px 0px #1a1a1a' }}>
              <Sparkles size={12} />
              Athlete Onboarding
            </div>
            <h1 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2rem)', textTransform: 'uppercase', marginTop: '0.35rem', letterSpacing: '-0.03em' }}>
              Create Athlete Profile
            </h1>
          </div>

          <Link
            to="/login"
            style={{
              fontFamily: T.fontHeadline,
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: T.primary,
              textDecoration: 'none',
              border: T.border2,
              padding: '0.4rem 0.75rem',
              background: T.surfaceLowest,
              boxShadow: '2px 2px 0px #1a1a1a',
            }}
          >
            Sign In &rarr;
          </Link>
        </header>

        {/* Step Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {STEPS.map((s, idx) => {
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            return (
              <div
                key={s.key}
                style={{
                  background: isActive ? T.primaryContainer : isPast ? '#dcfce7' : T.surfaceLowest,
                  border: T.border3,
                  padding: '0.65rem',
                  boxShadow: isActive ? T.shadow4 : '2px 2px 0px #1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {isPast ? <CheckCircle2 size={16} color="#16a34a" /> : s.icon}
                <div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', color: T.primary }}>
                    STEP {idx + 1}
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Card */}
        <div style={neoCard}>
          {/* STEP 1: ACCOUNT BASICS */}
          {currentStep === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                style={{
                  width: '100%',
                  background: T.surfaceLowest,
                  border: T.border3,
                  boxShadow: T.shadow4,
                  padding: '0.75rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: T.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  textTransform: 'uppercase',
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
                <div style={{ flex: 1, height: '2px', background: '#d6d1c9' }} />
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.75rem', color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                  OR REGISTER WITH EMAIL
                </span>
                <div style={{ flex: 1, height: '2px', background: '#d6d1c9' }} />
              </div>

              <div>
                <label style={neoLabel}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aryan Jha"
                  value={formData.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  style={neoInput}
                />
                {errors.fullName && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{errors.fullName}</div>}
              </div>

              <div>
                <label style={neoLabel}>Email Address</label>
                <input
                  type="email"
                  placeholder="athlete@example.com"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  style={neoInput}
                />
                {errors.email && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{errors.email}</div>}
              </div>

              <div>
                <label style={neoLabel}>Password (Min 6 Characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create secure password"
                    value={formData.password}
                    onChange={(e) => update('password', e.target.value)}
                    style={neoInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.primary }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{errors.password}</div>}
              </div>

              <div>
                <label style={neoLabel}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    style={neoInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.primary }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{errors.confirmPassword}</div>}
              </div>
            </div>
          )}

          {/* STEP 2: ATHLETE INFO */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={neoLabel}>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 19"
                    value={formData.age}
                    onChange={(e) => update('age', e.target.value)}
                    style={neoInput}
                  />
                  {errors.age && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>{errors.age}</div>}
                </div>

                <div>
                  <label style={neoLabel}>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => update('gender', e.target.value)}
                    style={{ ...neoInput, cursor: 'pointer' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={neoLabel}>State / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Haryana / Delhi"
                    value={formData.state}
                    onChange={(e) => update('state', e.target.value)}
                    style={neoInput}
                  />
                </div>

                <div>
                  <label style={neoLabel}>City / District (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rohtak"
                    value={formData.city}
                    onChange={(e) => update('city', e.target.value)}
                    style={neoInput}
                  />
                </div>
              </div>

              <div>
                <label style={neoLabel}>Experience Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => update('experienceLevel', lvl)}
                      style={{
                        padding: '0.65rem',
                        border: T.border2,
                        background: formData.experienceLevel === lvl ? T.primaryContainer : T.surfaceLowest,
                        fontFamily: T.fontHeadline,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: formData.experienceLevel === lvl ? '2px 2px 0px #1a1a1a' : 'none',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SPORT & BASELINE SETUP */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={neoLabel}>Select Primary Sport</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.6rem',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '0.25rem',
                  }}
                >
                  {SPORTS_LIST.map((sp) => {
                    const isSelected = formData.primarySport === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => update('primarySport', sp.id)}
                        style={{
                          border: isSelected ? T.border3 : T.border2,
                          background: isSelected ? T.primaryContainer : T.surfaceLowest,
                          padding: '0.65rem 0.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '3px 3px 0px #1a1a1a' : 'none',
                          transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ fontSize: '1.5rem' }}>{sp.emoji}</div>
                        <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.8rem', marginTop: '0.25rem', textTransform: 'uppercase' }}>
                          {sp.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Contextual Consent */}
              <div
                style={{
                  background: T.surfaceVariant,
                  border: T.border2,
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => update('termsAccepted', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#1a1a1a', cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ fontSize: '0.82rem', color: T.onSurfaceVariant, fontWeight: 600, cursor: 'pointer' }}>
                  I agree to KreedAI athletic safety terms. Computer vision assessments run locally on device with strict privacy protection.
                </label>
              </div>
              {errors.termsAccepted && <div style={{ color: T.secondary, fontSize: '0.8rem', fontWeight: 600 }}>{errors.termsAccepted}</div>}
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  background: T.surfaceLowest,
                  border: T.border3,
                  boxShadow: '2px 2px 0px #1a1a1a',
                  padding: '0.85rem 1.25rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  color: T.primary,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={next}
              disabled={submitting}
              style={{ ...neoCTA, flex: 1 }}
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : currentStep < STEPS.length - 1 ? (
                <>
                  Next Step
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  Create Profile & Start Calibration
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
