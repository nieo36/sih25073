import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff,
  Globe, User, Camera, Trophy, Shield, Lock, Award, Mail,
  RefreshCw, Sparkles, CheckCircle2, Send, ExternalLink, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   VYOMA Register — Athlete Onboarding
   Magic Link Email Verification at the end
   (Auto-verifies in 10s for demo testing)
   Stitch project 16542555991833173009
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

// ── Onboarding Steps (Verification at the very end) ──
const STEPS = [
  { key: 'account', label: 'Account', icon: <User size={18} /> },
  { key: 'about',   label: 'About You', icon: <User size={18} /> },
  { key: 'sport',   label: 'Your Sport', icon: <Trophy size={18} /> },
  { key: 'profile', label: 'Profile', icon: <Award size={18} /> },
  { key: 'privacy', label: 'Privacy', icon: <Shield size={18} /> },
  { key: 'verify',  label: 'Verification', icon: <Mail size={18} /> },
] as const;

// ── Visual Sport Cards ──────────────────────
interface SportOption {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

const SPORTS_LIST: SportOption[] = [
  { id: 'Athletics & Track', name: 'Athletics & Track', category: 'Speed & Endurance', emoji: '🏃' },
  { id: 'Football', name: 'Football (Soccer)', category: 'Team Sport', emoji: '⚽' },
  { id: 'Cricket', name: 'Cricket', category: 'Bat & Ball', emoji: '🏏' },
  { id: 'Badminton', name: 'Badminton', category: 'Racket Sport', emoji: '🏸' },
  { id: 'Basketball', name: 'Basketball', category: 'Court & Agility', emoji: '🏀' },
  { id: 'Swimming', name: 'Swimming', category: 'Aquatic Speed', emoji: '🏊' },
  { id: 'Boxing', name: 'Boxing', category: 'Combat & Power', emoji: '🥊' },
  { id: 'Wrestling', name: 'Wrestling', category: 'Mat & Strength', emoji: '🤼' },
  { id: 'Kabaddi', name: 'Kabaddi', category: 'Contact & Reflexes', emoji: '⚡' },
  { id: 'Tennis', name: 'Tennis', category: 'Racket & Precision', emoji: '🎾' },
  { id: 'Hockey', name: 'Field Hockey', category: 'Stick & Speed', emoji: '🏑' },
  { id: 'Weightlifting', name: 'Weightlifting', category: 'Pure Strength', emoji: '🏋️' },
  { id: 'Archery', name: 'Archery', category: 'Precision & Focus', emoji: '🎯' },
  { id: 'Cycling', name: 'Cycling', category: 'Velodrome & Road', emoji: '🚴' },
  { id: 'Table Tennis', name: 'Table Tennis', category: 'Fast Reflexes', emoji: '🏓' },
  { id: 'Volleyball', name: 'Volleyball', category: 'Vertical Jump', emoji: '🏐' },
];

// ── Form State Interface ──────────────────────
interface FormData {
  // Account
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // About You
  age: string;
  gender: string;
  height: string;
  weight: string;
  country: string;
  state: string;
  city: string;
  areaType: 'urban' | 'rural';
  // Sport
  primarySport: string;
  secondarySports: string;
  experienceLevel: string;
  yearsExperience: string;
  athleticGoals: string;
  // Profile
  dominantHand: 'left' | 'right';
  dominantFoot: 'left' | 'right';
  organization: string;
  achievements: string;
  bio: string;
  trainingFrequency: string;
  // Privacy
  movementInsights: boolean;
  highlightProcessing: boolean;
  recruiterDiscoverability: boolean;
  profileVisibility: 'only_me' | 'coaches' | 'verified';
  guardianConsent: boolean;
}

const initialFormData: FormData = {
  fullName: '', email: '', password: '', confirmPassword: '',
  age: '', gender: '', height: '', weight: '', country: 'in', state: '', city: '', areaType: 'urban',
  primarySport: 'Athletics & Track', secondarySports: '', experienceLevel: 'intermediate', yearsExperience: '', athleticGoals: '',
  dominantHand: 'right', dominantFoot: 'right', organization: '', achievements: '', bio: '', trainingFrequency: '3-4',
  movementInsights: true, highlightProcessing: true, recruiterDiscoverability: true, profileVisibility: 'verified', guardianConsent: false,
};

// ── SVGs ──────────────────────
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
  background: T.surface,
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.2s ease',
  borderRadius: 0,
};

const neoInputFocus: React.CSSProperties = {
  background: T.primaryContainer,
  boxShadow: T.shadow4,
};

const neoSelect: React.CSSProperties = {
  ...neoInput,
  appearance: 'none' as const,
  cursor: 'pointer',
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
  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
  padding: '1.1rem',
  boxShadow: T.shadow8,
  cursor: 'pointer',
  transition: 'all 0.1s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  letterSpacing: '-0.02em',
};

const neoSecondary: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: T.onSurfaceVariant,
  fontFamily: T.fontHeadline,
  fontWeight: 700,
  textTransform: 'uppercase',
  fontSize: '0.85rem',
  padding: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
  letterSpacing: '0.02em',
};

// ══════════════════════════════════════════════
//  REGISTER COMPONENT
// ══════════════════════════════════════════════
export const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register: registerUser, loginWithGoogle, saveProfile } = useAuth();

  // ── Magic Link Email Verification State ──────────
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [autoVerifySeconds, setAutoVerifySeconds] = useState(10);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [linkResentMsg, setLinkResentMsg] = useState(false);

  // ── 10s Auto-Verification Effect for Testing ──
  useEffect(() => {
    let timer: any;
    if (STEPS[currentStep]?.key === 'verify' && !isEmailVerified) {
      if (autoVerifySeconds > 0) {
        timer = setInterval(() => {
          setAutoVerifySeconds((prev) => {
            if (prev <= 1) {
              setIsEmailVerified(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [currentStep, isEmailVerified, autoVerifySeconds]);

  // ── Resend cooldown countdown ──────────
  useEffect(() => {
    let cooldownTimer: any;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  // ── Step Validation ──────────────────────
  const validateStep = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    const step = STEPS[currentStep].key;

    if (step === 'account') {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      if (!formData.email.trim()) errs.email = 'Email address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Please enter a valid email address';
      if (!formData.password) errs.password = 'Password is required';
      else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 'about') {
      if (!formData.age) errs.age = 'Age is required';
      else if (Number(formData.age) < 5 || Number(formData.age) > 100) errs.age = 'Enter a valid age (5-100)';
      if (!formData.gender) errs.gender = 'Gender is required';
    }
    if (step === 'sport') {
      if (!formData.primarySport.trim()) errs.primarySport = 'Please select your primary sport';
    }
    if (step === 'privacy') {
      if (!formData.guardianConsent) errs.guardianConsent = 'Please confirm consent to complete registration';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = async () => {
    if (!validateStep()) return;

    if (currentStep === 0) {
      setSubmitting(true);
      try {
        await registerUser({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          profile: {
            age: formData.age ? Number(formData.age) : undefined,
            gender: formData.gender,
            height: formData.height,
            weight: formData.weight,
            country: formData.country,
            state: formData.state,
            city: formData.city,
            areaType: formData.areaType,
            primarySport: formData.primarySport,
            secondarySports: formData.secondarySports,
            experienceLevel: formData.experienceLevel,
            yearsExperience: formData.yearsExperience,
            athleticGoals: formData.athleticGoals,
            dominantHand: formData.dominantHand,
            dominantFoot: formData.dominantFoot,
            organization: formData.organization,
            achievements: formData.achievements,
            bio: formData.bio,
            trainingFrequency: formData.trainingFrequency,
          },
          privacy: {
            movementInsights: formData.movementInsights,
            highlightProcessing: formData.highlightProcessing,
            recruiterDiscoverability: formData.recruiterDiscoverability,
            profileVisibility: formData.profileVisibility,
            guardianConsent: formData.guardianConsent,
          },
        });
      } catch (err: any) {
        const msg = err?.message || 'Registration failed';
        if (
          msg.toLowerCase().includes('already in use') ||
          msg.toLowerCase().includes('duplicate') ||
          err?.status === 409
        ) {
          setErrors({ email: 'This email is already registered. Please sign in or use another email.' });
        } else {
          setErrors({ email: msg });
        }
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    if (currentStep > 0 && currentStep < STEPS.length - 1) {
      saveProfile({
        profile: {
          age: formData.age ? Number(formData.age) : undefined,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          areaType: formData.areaType,
          primarySport: formData.primarySport,
          secondarySports: formData.secondarySports,
          experienceLevel: formData.experienceLevel,
          yearsExperience: formData.yearsExperience,
          athleticGoals: formData.athleticGoals,
          dominantHand: formData.dominantHand,
          dominantFoot: formData.dominantFoot,
          organization: formData.organization,
          achievements: formData.achievements,
          bio: formData.bio,
          trainingFrequency: formData.trainingFrequency,
        },
        privacy: {
          movementInsights: formData.movementInsights,
          highlightProcessing: formData.highlightProcessing,
          recruiterDiscoverability: formData.recruiterDiscoverability,
          profileVisibility: formData.profileVisibility,
          guardianConsent: formData.guardianConsent,
        },
      }).catch(() => {});
    }

    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If stepping into verification, reset the 10s auto verification
      if (STEPS[nextStep].key === 'verify') {
        setAutoVerifySeconds(10);
      }
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResendLink = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setLinkResentMsg(true);
    setAutoVerifySeconds(10);
    setIsEmailVerified(false);
    setTimeout(() => setLinkResentMsg(false), 3000);
  };

  const stepProgress = ((currentStep + 1) / STEPS.length) * 100;

  const inputStyle = (field: string): React.CSSProperties => ({
    ...neoInput,
    ...(focusedField === field ? neoInputFocus : {}),
  });

  const ErrorMsg = ({ field }: { field: keyof FormData }) =>
    errors[field] ? (
      <span style={{ color: T.secondary, fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
        {errors[field]}
      </span>
    ) : null;

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
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
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;700;900&display=swap"
        rel="stylesheet"
      />

      {/* ── Top Bar ───────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: T.bg,
          borderBottom: `4px solid ${T.primary}`,
          boxShadow: T.shadow4,
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentStep > 0 && (
            <button
              onClick={back}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                border: T.border2,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceVariant}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h1
            style={{
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)',
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: T.primary,
            }}
          >
            VYOMA
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile step indicator */}
          <span
            style={{
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: T.primary,
            }}
          >
            {String(currentStep + 1).padStart(2, '0')}/{String(STEPS.length).padStart(2, '0')}
          </span>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                border: T.border2,
                padding: '0.35rem 0.6rem',
                background: 'transparent',
                color: T.primary,
                cursor: 'pointer',
              }}
            >
              <Globe size={14} />
              {lang === 'en' ? 'EN' : 'हिं'}
              <ChevronDown size={12} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {langOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  border: T.border2,
                  background: T.surfaceLowest,
                  boxShadow: T.shadow4,
                  zIndex: 60,
                  minWidth: '110px',
                }}
              >
                {(['en', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    type="button"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: lang === l ? 700 : 400,
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: l === 'en' ? `2px solid ${T.primary}` : 'none',
                      background: lang === l ? T.primaryContainer : 'transparent',
                      color: T.primary,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (lang !== l) e.currentTarget.style.background = T.surfaceVariant; }}
                    onMouseLeave={(e) => { if (lang !== l) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {l === 'en' ? 'English' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Progress Bar ───────────────── */}
      <div style={{ width: '100%', height: '6px', background: T.surfaceDim }}>
        <div
          style={{
            width: `${stepProgress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${T.primary}, ${T.primaryContainer})`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* ── Main Canvas ───────────────── */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
        <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column' }}>

          {/* ── Desktop Stepper ───────────────── */}
          <div
            className="vyoma-stepper-desktop"
            style={{
              display: 'none',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '1.5rem 0 0.5rem',
            }}
          >
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => { if (i < currentStep) setCurrentStep(i); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  background: i === currentStep ? T.primaryContainer : i < currentStep ? T.primary : 'transparent',
                  color: i === currentStep ? T.primary : i < currentStep ? T.surfaceLowest : T.surfaceDim,
                  border: i <= currentStep ? T.border2 : `2px solid ${T.surfaceDim}`,
                  boxShadow: i === currentStep ? '2px 2px 0px 0px rgba(26,26,26,1)' : 'none',
                  cursor: i < currentStep ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                {i < currentStep ? <Check size={13} /> : <span>{String(i + 1).padStart(2, '0')}</span>}
                <span className="vyoma-step-label">{s.label}</span>
              </button>
            ))}
          </div>

          {/* ── Content Grid ───────────────── */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem',
              padding: '1.5rem 0 2rem',
              alignItems: 'start',
            }}
            className="vyoma-content-grid"
          >
            {/* Left column: headline (desktop only) */}
            <div className="vyoma-hero-col" style={{ display: 'none' }}>
              <div style={{ position: 'sticky', top: '120px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: T.primary,
                    color: T.surface,
                    fontFamily: T.fontHeadline,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    padding: '0.35rem 0.75rem',
                    border: T.border2,
                    boxShadow: '2px 2px 0px 0px rgba(26,26,26,1)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Step {String(currentStep + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                </span>

                <h2
                  style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 900,
                    fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    color: T.primary,
                    marginBottom: '1rem',
                  }}
                >
                  {currentStep === 0 && "Let's build your athlete profile."}
                  {currentStep === 1 && "Tell us where you're starting."}
                  {currentStep === 2 && "Select your athletic discipline."}
                  {currentStep === 3 && "Make it yours."}
                  {currentStep === 4 && "You're in control."}
                  {currentStep === 5 && (isEmailVerified ? "Email verified successfully." : "Check your inbox to finish.")}
                </h2>

                <p
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: '1.1rem',
                    color: T.onSurfaceVariant,
                    borderLeft: `4px solid ${T.primary}`,
                    paddingLeft: '1rem',
                    lineHeight: 1.6,
                    maxWidth: '20rem',
                  }}
                >
                  {currentStep === 0 && 'A few basics and you\'ll be ready to start.'}
                  {currentStep === 1 && 'This helps us understand your athletic profile and connect you with relevant opportunities.'}
                  {currentStep === 2 && 'Pick your primary sport to calibrate the AI motion and tracking engine.'}
                  {currentStep === 3 && 'Let scouts and peers know who you are. All fields are optional.'}
                  {currentStep === 4 && 'Your videos and performance data are used only for the purposes you choose.'}
                  {currentStep === 5 && (isEmailVerified ? 'Your athlete passport is now fully activated!' : 'Click the magic link sent to your inbox to activate your account.')}
                </p>

                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    border: T.border2,
                    background: T.surfaceLowest,
                    maxWidth: '240px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: T.shadow4,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: T.primaryContainer,
                      border: T.border2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={20} color={T.primary} />
                  </div>
                  <div>
                    <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      AI TALENT PASS
                    </div>
                    <div style={{ fontSize: '0.7rem', color: T.onSurfaceVariant }}>
                      Official Onboarding
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: form */}
            <div>
              {/* Mobile headline */}
              <div className="vyoma-mobile-hero" style={{ marginBottom: '1.5rem' }}>
                <h2
                  style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 900,
                    fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    color: T.primary,
                    marginBottom: '0.6rem',
                  }}
                >
                  {currentStep === 0 && "Let's build your athlete profile."}
                  {currentStep === 1 && "Tell us where you're starting."}
                  {currentStep === 2 && "Select your sport."}
                  {currentStep === 3 && "Make it yours."}
                  {currentStep === 4 && "You're in control."}
                  {currentStep === 5 && (isEmailVerified ? "Verified successfully ✓" : "Verify your email")}
                </h2>
                <p
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: '0.95rem',
                    color: T.onSurfaceVariant,
                    borderLeft: `4px solid ${T.primary}`,
                    paddingLeft: '0.75rem',
                    lineHeight: 1.5,
                  }}
                >
                  {currentStep === 0 && 'A few basics and you\'ll be ready to start.'}
                  {currentStep === 1 && 'This helps us connect you with the right opportunities.'}
                  {currentStep === 2 && 'Choose your discipline for performance tracking.'}
                  {currentStep === 3 && 'Let scouts and peers know who you are.'}
                  {currentStep === 4 && 'Control how your data is used.'}
                  {currentStep === 5 && (isEmailVerified ? 'Your account is ready to roll.' : 'We sent a verification link to your email.')}
                </p>
              </div>

              {/* ── Form Card ───────────────── */}
              <div style={neoCard}>
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '18px',
                    height: '18px',
                    background: T.primaryContainer,
                    border: T.border2,
                  }}
                />

                {/* ══ STEP 0: ACCOUNT ══ */}
                {currentStep === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-fullName" style={neoLabel}>Full Name</label>
                        <input id="reg-fullName" type="text" placeholder="JANE DOE" value={formData.fullName}
                          onChange={(e) => update('fullName', e.target.value)}
                          onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('fullName')} />
                        <ErrorMsg field="fullName" />
                      </div>
                      <div>
                        <label htmlFor="reg-email" style={neoLabel}>Email Address</label>
                        <input id="reg-email" type="email" placeholder="JANE@EXAMPLE.COM" value={formData.email}
                          onChange={(e) => update('email', e.target.value)}
                          onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('email')} autoComplete="email" />
                        <ErrorMsg field="email" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-password" style={neoLabel}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password}
                            onChange={(e) => update('password', e.target.value)}
                            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                            style={{ ...inputStyle('password'), paddingRight: '2.5rem' }} autoComplete="new-password" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.primary, display: 'flex' }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <ErrorMsg field="password" />
                      </div>
                      <div>
                        <label htmlFor="reg-confirmPassword" style={neoLabel}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                          <input id="reg-confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword}
                            onChange={(e) => update('confirmPassword', e.target.value)}
                            onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                            style={{ ...inputStyle('confirmPassword'), paddingRight: '2.5rem' }} autoComplete="new-password" />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.primary, display: 'flex' }}>
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <ErrorMsg field="confirmPassword" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                      <div style={{ flex: 1, height: '2px', background: T.primary }} />
                      <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.primary }}>
                        OR CONNECT WITH
                      </span>
                      <div style={{ flex: 1, height: '2px', background: T.primary }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          background: T.surface, border: T.border4, padding: '0.9rem',
                          fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem',
                          color: T.primary, boxShadow: T.shadow4, cursor: 'pointer', transition: 'all 0.1s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = T.surface; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.primary; }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadow4; }}
                      >
                        <GoogleIcon /> Continue with Google
                      </button>
                    </div>
                  </div>
                )}

                {/* ══ STEP 1: ABOUT YOU ══ */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-age" style={neoLabel}>Age</label>
                        <input id="reg-age" type="number" placeholder="e.g. 24" value={formData.age}
                          onChange={(e) => update('age', e.target.value)}
                          onFocus={() => setFocusedField('age')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('age')} />
                        <ErrorMsg field="age" />
                      </div>
                      <div>
                        <label htmlFor="reg-gender" style={neoLabel}>Gender</label>
                        <select id="reg-gender" value={formData.gender}
                          onChange={(e) => update('gender', e.target.value)}
                          onFocus={() => setFocusedField('gender')} onBlur={() => setFocusedField(null)}
                          style={{ ...neoSelect, ...(focusedField === 'gender' ? neoInputFocus : {}) }}>
                          <option value="" disabled>Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer-not">Prefer not to say</option>
                        </select>
                        <ErrorMsg field="gender" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-height" style={neoLabel}>Height (cm)</label>
                        <input id="reg-height" type="number" placeholder="175" value={formData.height}
                          onChange={(e) => update('height', e.target.value)}
                          onFocus={() => setFocusedField('height')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('height')} />
                      </div>
                      <div>
                        <label htmlFor="reg-weight" style={neoLabel}>Weight (kg)</label>
                        <input id="reg-weight" type="number" placeholder="70" value={formData.weight}
                          onChange={(e) => update('weight', e.target.value)}
                          onFocus={() => setFocusedField('weight')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('weight')} />
                      </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: `2px solid ${T.primary}`, margin: '0.5rem 0' }} />

                    <div>
                      <label htmlFor="reg-country" style={neoLabel}>Country</label>
                      <select id="reg-country" value={formData.country}
                        onChange={(e) => update('country', e.target.value)}
                        onFocus={() => setFocusedField('country')} onBlur={() => setFocusedField(null)}
                        style={{ ...neoSelect, ...(focusedField === 'country' ? neoInputFocus : {}) }}>
                        <option value="in">India (SAI Portal)</option>
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="au">Australia</option>
                        <option value="ca">Canada</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-state" style={neoLabel}>State / Region</label>
                        <input id="reg-state" type="text" placeholder="State or Province" value={formData.state}
                          onChange={(e) => update('state', e.target.value)}
                          onFocus={() => setFocusedField('state')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('state')} />
                      </div>
                      <div>
                        <label htmlFor="reg-city" style={neoLabel}>City / District</label>
                        <input id="reg-city" type="text" placeholder="City name" value={formData.city}
                          onChange={(e) => update('city', e.target.value)}
                          onFocus={() => setFocusedField('city')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('city')} />
                      </div>
                    </div>

                    <div>
                      <label style={{ ...neoLabel, marginBottom: '0.6rem' }}>Area Type</label>
                      <div style={{ display: 'flex', border: T.border2 }}>
                        {(['urban', 'rural'] as const).map((type) => (
                          <button key={type} type="button" onClick={() => update('areaType', type)}
                            style={{
                              flex: 1, padding: '0.75rem', textAlign: 'center',
                              fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem',
                              background: formData.areaType === type ? T.primaryContainer : T.surface,
                              color: T.primary, border: 'none',
                              borderRight: type === 'urban' ? T.border2 : 'none',
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ STEP 2: YOUR SPORT (VISUAL CARDS) ══ */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <label style={{ ...neoLabel, marginBottom: 0 }}>
                          Select Preferred Sport
                        </label>
                        <span style={{ fontSize: '0.75rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.tertiary, textTransform: 'uppercase' }}>
                          Selected: {formData.primarySport}
                        </span>
                      </div>

                      {/* Visual Sports Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))',
                          gap: '0.75rem',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          padding: '0.35rem',
                          border: T.border2,
                          background: T.surfaceLowest,
                        }}
                      >
                        {SPORTS_LIST.map((sport) => {
                          const isSelected = formData.primarySport === sport.id;
                          return (
                            <button
                              key={sport.id}
                              type="button"
                              onClick={() => {
                                update('primarySport', sport.id);
                                setErrors((prev) => ({ ...prev, primarySport: undefined }));
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.85rem 0.5rem',
                                border: isSelected ? T.border3 : `2px solid ${T.surfaceDim}`,
                                background: isSelected ? T.primaryContainer : T.surface,
                                color: T.primary,
                                boxShadow: isSelected ? '3px 3px 0px 0px rgba(26,26,26,1)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                                transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                                position: 'relative',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = T.surfaceVariant;
                                  e.currentTarget.style.borderColor = T.primary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = T.surface;
                                  e.currentTarget.style.borderColor = T.surfaceDim;
                                }
                              }}
                            >
                              {isSelected && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '18px',
                                    height: '18px',
                                    background: T.primary,
                                    color: T.surfaceLowest,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Check size={12} />
                                </div>
                              )}

                              <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
                                {sport.emoji}
                              </div>

                              <span
                                style={{
                                  fontFamily: T.fontHeadline,
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  textAlign: 'center',
                                  lineHeight: 1.2,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {sport.name}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  color: isSelected ? T.primary : T.onSurfaceVariant,
                                  marginTop: '0.2rem',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                }}
                              >
                                {sport.category}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <ErrorMsg field="primarySport" />
                    </div>

                    <div>
                      <label htmlFor="reg-secondarySports" style={neoLabel}>Secondary Sports / Cross-Training</label>
                      <input id="reg-secondarySports" type="text" placeholder="e.g. Swimming, Yoga, Sprinting" value={formData.secondarySports}
                        onChange={(e) => update('secondarySports', e.target.value)}
                        onFocus={() => setFocusedField('secondarySports')} onBlur={() => setFocusedField(null)}
                        style={inputStyle('secondarySports')} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label htmlFor="reg-experienceLevel" style={neoLabel}>Experience Level</label>
                        <select id="reg-experienceLevel" value={formData.experienceLevel}
                          onChange={(e) => update('experienceLevel', e.target.value)}
                          onFocus={() => setFocusedField('experienceLevel')} onBlur={() => setFocusedField(null)}
                          style={{ ...neoSelect, ...(focusedField === 'experienceLevel' ? neoInputFocus : {}) }}>
                          <option value="beginner">Beginner (0-1 yrs)</option>
                          <option value="intermediate">Intermediate (2-4 yrs)</option>
                          <option value="advanced">Advanced (5+ yrs)</option>
                          <option value="professional">State / Professional</option>
                          <option value="elite">National / Elite</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="reg-yearsExperience" style={neoLabel}>Years of Active Training</label>
                        <input id="reg-yearsExperience" type="number" placeholder="e.g. 5" value={formData.yearsExperience}
                          onChange={(e) => update('yearsExperience', e.target.value)}
                          onFocus={() => setFocusedField('yearsExperience')} onBlur={() => setFocusedField(null)}
                          style={inputStyle('yearsExperience')} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-athleticGoals" style={neoLabel}>Athletic Goals & Ambitions</label>
                      <textarea id="reg-athleticGoals" placeholder="e.g. Qualify for National Trials, Improve sprint burst..." value={formData.athleticGoals}
                        onChange={(e) => update('athleticGoals', e.target.value)}
                        onFocus={() => setFocusedField('athleticGoals')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('athleticGoals'), minHeight: '90px', resize: 'none' as const }} />
                    </div>
                  </div>
                )}

                {/* ══ STEP 3: ATHLETE PROFILE ══ */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1.5rem',
                        border: T.border2,
                        background: T.surfaceLowest,
                      }}
                    >
                      <div
                        onClick={handlePhotoClick}
                        style={{
                          width: '96px',
                          height: '96px',
                          border: `3px dashed ${T.surfaceDim}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          marginBottom: '0.75rem',
                          transition: 'border-color 0.2s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = T.primary}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = T.surfaceDim}
                      >
                        {profilePhotoPreview ? (
                          <img src={profilePhotoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={32} color={T.surfaceDim} />
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                      <button type="button" onClick={handlePhotoClick}
                        style={{
                          fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
                          letterSpacing: '0.05em', color: T.tertiary, background: 'none', border: 'none', cursor: 'pointer',
                        }}>
                        Upload Profile Photo
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={neoLabel}>Dominant Hand</label>
                        <div style={{ display: 'flex', border: T.border2 }}>
                          {(['left', 'right'] as const).map((side) => (
                            <button key={side} type="button" onClick={() => update('dominantHand', side)}
                              style={{
                                flex: 1, padding: '0.65rem', textAlign: 'center',
                                fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem',
                                background: formData.dominantHand === side ? T.primaryContainer : T.surface,
                                color: T.primary, border: 'none',
                                borderRight: side === 'left' ? T.border2 : 'none',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}>
                              {side}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={neoLabel}>Dominant Foot</label>
                        <div style={{ display: 'flex', border: T.border2 }}>
                          {(['left', 'right'] as const).map((side) => (
                            <button key={side} type="button" onClick={() => update('dominantFoot', side)}
                              style={{
                                flex: 1, padding: '0.65rem', textAlign: 'center',
                                fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem',
                                background: formData.dominantFoot === side ? T.primaryContainer : T.surface,
                                color: T.primary, border: 'none',
                                borderRight: side === 'left' ? T.border2 : 'none',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}>
                              {side}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-organization" style={neoLabel}>School / Academy / Organization</label>
                      <input id="reg-organization" type="text" placeholder="School, Academy, Club..." value={formData.organization}
                        onChange={(e) => update('organization', e.target.value)}
                        onFocus={() => setFocusedField('organization')} onBlur={() => setFocusedField(null)}
                        style={inputStyle('organization')} />
                    </div>

                    <div>
                      <label htmlFor="reg-achievements" style={neoLabel}>Key Achievements</label>
                      <textarea id="reg-achievements" placeholder="List tournament medals, state records, personal bests..." value={formData.achievements}
                        onChange={(e) => update('achievements', e.target.value)}
                        onFocus={() => setFocusedField('achievements')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('achievements'), minHeight: '80px', resize: 'none' as const }} />
                    </div>

                    <div>
                      <label htmlFor="reg-bio" style={neoLabel}>Short Bio</label>
                      <textarea id="reg-bio" placeholder="Tell your athletic story..." value={formData.bio}
                        onChange={(e) => update('bio', e.target.value)}
                        onFocus={() => setFocusedField('bio')} onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle('bio'), minHeight: '80px', resize: 'none' as const }} />
                    </div>

                    <div>
                      <label htmlFor="reg-trainingFrequency" style={neoLabel}>Training Frequency</label>
                      <select id="reg-trainingFrequency" value={formData.trainingFrequency}
                        onChange={(e) => update('trainingFrequency', e.target.value)}
                        onFocus={() => setFocusedField('trainingFrequency')} onBlur={() => setFocusedField(null)}
                        style={{ ...neoSelect, ...(focusedField === 'trainingFrequency' ? neoInputFocus : {}) }}>
                        <option value="1-2">1-2 days a week</option>
                        <option value="3-4">3-4 days a week</option>
                        <option value="5+">5+ days a week</option>
                        <option value="daily">Daily High-Performance</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ══ STEP 4: PRIVACY & CONSENT ══ */}
                {currentStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { key: 'movementInsights' as const, icon: '🔬', title: 'Movement Insights', desc: 'Opt-in to automated skill tracking' },
                      { key: 'highlightProcessing' as const, icon: '🎬', title: 'Highlight Processing', desc: 'Allow AI video processing for highlights' },
                      { key: 'recruiterDiscoverability' as const, icon: '🌍', title: 'Recruiter Discoverability', desc: 'Show up in SAI / scout talent searches' },
                    ].map(({ key, icon, title, desc }) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem',
                          border: T.border2,
                          background: T.surfaceLowest,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = T.shadow4}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                          <div>
                            <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.95rem', color: T.primary }}>{title}</div>
                            <div style={{ fontSize: '0.75rem', color: T.onSurfaceVariant, marginTop: '0.1rem' }}>{desc}</div>
                          </div>
                        </div>
                        <div
                          onClick={(e) => { e.preventDefault(); update(key, !formData[key]); }}
                          style={{
                            width: '48px',
                            height: '26px',
                            borderRadius: '13px',
                            background: formData[key] ? T.performanceIndigo : T.surfaceDim,
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: T.surfaceLowest,
                              position: 'absolute',
                              top: '3px',
                              left: formData[key] ? '25px' : '3px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </div>
                      </label>
                    ))}

                    <div style={{ border: T.border2, background: T.surfaceLowest, padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Eye size={18} color={T.onSurfaceVariant} />
                        <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.95rem', color: T.primary }}>
                          Profile Visibility
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {([
                          { val: 'only_me' as const, icon: <Lock size={18} />, label: 'Only Me' },
                          { val: 'coaches' as const, icon: <User size={18} />, label: 'Coaches' },
                          { val: 'verified' as const, icon: <Shield size={18} />, label: 'Verified' },
                        ]).map(({ val, icon, label }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => update('profileVisibility', val)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.75rem 0.5rem',
                              border: formData.profileVisibility === val ? T.border2 : `2px solid ${T.surfaceDim}`,
                              background: formData.profileVisibility === val ? T.primaryContainer : 'transparent',
                              color: T.primary,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              gap: '0.25rem',
                            }}
                          >
                            {icon}
                            <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '1rem',
                        border: `2px solid ${T.surfaceDim}`,
                        background: T.surfaceVariant,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.guardianConsent}
                        onChange={(e) => update('guardianConsent', e.target.checked)}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: T.performanceIndigo,
                          marginTop: '0.15rem',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.primary }}>
                          <Shield size={16} color={T.actionTeal} />
                          Guardian Consent
                        </div>
                        <div style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, marginTop: '0.25rem', lineHeight: 1.5 }}>
                          I confirm that I am over 18, or I have received consent from a parent or legal guardian to create an account and share performance data.
                        </div>
                      </div>
                    </label>
                    {errors.guardianConsent && (
                      <span style={{ color: T.secondary, fontSize: '0.75rem', fontWeight: 600 }}>{errors.guardianConsent}</span>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════
                    STEP 5: MAGIC LINK EMAIL VERIFICATION (AT THE END)
                    ══════════════════════════════ */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
                    {/* Animated Icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          background: isEmailVerified ? '#dcfce7' : T.primaryContainer,
                          border: T.border4,
                          boxShadow: T.shadow6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        {isEmailVerified ? (
                          <CheckCircle2 size={44} color="#059669" />
                        ) : (
                          <>
                            <Mail size={38} color={T.primary} />
                            <div
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '22px',
                                height: '22px',
                                background: T.performanceIndigo,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                              }}
                            >
                              <Send size={12} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Titles */}
                    <div>
                      {isEmailVerified ? (
                        <>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#059669',
                              color: '#ffffff',
                              padding: '0.25rem 0.75rem',
                              fontFamily: T.fontHeadline,
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <Check size={14} /> Verification Complete
                          </div>
                          <h3
                            style={{
                              fontFamily: T.fontHeadline,
                              fontWeight: 900,
                              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                              textTransform: 'uppercase',
                              color: T.primary,
                              lineHeight: 1.15,
                            }}
                          >
                            Verified Successfully! ✓
                          </h3>
                          <p style={{ fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.5rem' }}>
                            Your email has been confirmed. Your VYOMA Sports Passport is now active.
                          </p>
                        </>
                      ) : (
                        <>
                          <h3
                            style={{
                              fontFamily: T.fontHeadline,
                              fontWeight: 900,
                              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
                              textTransform: 'uppercase',
                              color: T.primary,
                              lineHeight: 1.15,
                            }}
                          >
                            Check your inbox
                          </h3>
                          <p style={{ fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.4rem' }}>
                            We've sent a magic activation link to:
                          </p>
                          <div style={{ marginTop: '0.5rem' }}>
                            <span
                              style={{
                                fontFamily: T.fontHeadline,
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                color: T.primary,
                                background: T.primaryContainer,
                                padding: '0.3rem 0.75rem',
                                border: T.border2,
                                display: 'inline-block',
                              }}
                            >
                              {formData.email || 'athlete@example.com'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Waiting Card / Simulation Box */}
                    {!isEmailVerified ? (
                      <div
                        style={{
                          border: T.border2,
                          background: T.surfaceLowest,
                          padding: '1.25rem',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                          <Loader2 size={18} color={T.tertiary} className="vyoma-spin" />
                          <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            Waiting for link confirmation...
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: T.onSurfaceVariant, lineHeight: 1.5 }}>
                          Click the link inside your email message to activate your passport profile.
                        </p>

                        {/* 10s auto verification testing banner */}
                        <div
                          style={{
                            marginTop: '0.85rem',
                            padding: '0.6rem 0.8rem',
                            background: '#eff6ff',
                            border: '2px dashed #3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>
                            ⚡ Demo auto-verifying in: <strong>{autoVerifySeconds}s</strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => setIsEmailVerified(true)}
                            style={{
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              padding: '0.3rem 0.6rem',
                              fontFamily: T.fontHeadline,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            Verify Now (Instant)
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Verified state summary box */
                      <div
                        style={{
                          border: `2px solid #059669`,
                          background: '#f0fdf4',
                          padding: '1.25rem',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <CheckCircle2 size={20} color="#059669" />
                          <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.9rem', color: '#065f46', textTransform: 'uppercase' }}>
                            Sports Passport Ready
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#047857' }}>
                          Athlete: <strong>{formData.fullName || 'Aarav Sharma'}</strong> • Primary Sport: <strong>{formData.primarySport}</strong>
                        </p>
                      </div>
                    )}

                    {/* Resend & Action Row */}
                    {!isEmailVerified && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          paddingTop: '0.5rem',
                          borderTop: `1px solid ${T.surfaceDim}`,
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: T.onSurfaceVariant }}>
                          Didn't receive the email?
                        </span>

                        {linkResentMsg ? (
                          <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.8rem', color: '#059669', textTransform: 'uppercase' }}>
                            Link resent ✓
                          </span>
                        ) : resendCooldown > 0 ? (
                          <span style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600 }}>
                            Resend link in {resendCooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendLink}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontFamily: T.fontHeadline,
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              background: T.primary,
                              color: T.surfaceLowest,
                              border: T.border2,
                              padding: '0.4rem 0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            <RefreshCw size={13} />
                            Resend link
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Action Buttons ───────────────── */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {currentStep === 5 ? (
                  isEmailVerified ? (
                    <Link
                      to="/dashboard"
                      style={{
                        ...neoCTA,
                        textDecoration: 'none',
                        background: T.primaryContainer,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.primary;
                        e.currentTarget.style.color = T.surfaceLowest;
                        e.currentTarget.style.transform = 'translate(-4px, -4px)';
                        e.currentTarget.style.boxShadow = '12px 12px 0px 0px rgba(26,26,26,1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = T.primaryContainer;
                        e.currentTarget.style.color = T.primary;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = T.shadow8;
                      }}
                    >
                      Enter the Field
                      <ArrowRight size={20} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEmailVerified(true)}
                      style={{
                        ...neoCTA,
                        background: T.surfaceLowest,
                        color: T.primary,
                      }}
                    >
                      <ExternalLink size={18} />
                      Simulate Email Link Click
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    disabled={submitting}
                    style={{
                      ...neoCTA,
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = T.primary;
                        e.currentTarget.style.color = T.surfaceLowest;
                        e.currentTarget.style.transform = 'translate(-4px, -4px)';
                        e.currentTarget.style.boxShadow = '12px 12px 0px 0px rgba(26,26,26,1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = T.primaryContainer;
                        e.currentTarget.style.color = T.primary;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = T.shadow8;
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.transform = 'translate(4px, 4px)';
                        e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(26,26,26,1)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.transform = 'translate(-4px, -4px)';
                        e.currentTarget.style.boxShadow = '12px 12px 0px 0px rgba(26,26,26,1)';
                      }
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="vyoma-spin" />
                        Creating Account…
                      </>
                    ) : (
                      <>
                        {currentStep === 4 ? 'Continue to Email Verification' : 'Continue'}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                )}

                {currentStep > 0 && (
                  <button type="button" onClick={back} style={neoSecondary}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceVariant; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.onSurfaceVariant; }}
                  >
                    ← Back
                  </button>
                )}
              </div>

              {/* Sign in link (Step 0 only) */}
              {currentStep === 0 && (
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <Link
                    to="/login"
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: '0.9rem',
                      color: T.onSurfaceVariant,
                      textDecoration: 'none',
                    }}
                  >
                    Already have an account?{' '}
                    <span
                      style={{
                        fontFamily: T.fontHeadline,
                        fontWeight: 700,
                        color: T.primary,
                        borderBottom: `2px solid ${T.primary}`,
                        paddingBottom: '0.1rem',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = T.tertiary; e.currentTarget.style.borderColor = T.tertiary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.primary; }}
                    >
                      Sign In
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom decoration */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: T.primaryContainer,
          borderTop: `3px solid ${T.primary}`,
        }}
      />

      {/* Responsive and Animation Styles */}
      <style>{`
        @keyframes vyomaSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .vyoma-spin {
          animation: vyomaSpin 1.5s linear infinite;
        }
        @media (min-width: 900px) {
          .vyoma-stepper-desktop { display: flex !important; }
          .vyoma-content-grid { grid-template-columns: 5fr 7fr !important; }
          .vyoma-hero-col { display: block !important; }
          .vyoma-mobile-hero { display: none !important; }
        }
        @media (max-width: 899px) {
          .vyoma-step-label { display: none; }
        }
      `}</style>
    </div>
  );
};
