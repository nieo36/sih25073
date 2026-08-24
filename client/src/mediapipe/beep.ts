/**
 * Beep Audio Utility — Web Audio API
 * Plays short audible beeps tied to on-screen coaching instructions.
 * No audio files required — synthesised entirely in the browser.
 */

type BeepType = 'info' | 'success' | 'warning';

interface BeepConfig {
  frequency: number;   // Hz
  duration: number;    // ms
  gain: number;        // 0-1
  type: OscillatorType;
  fadeOut: number;     // ms of fade-out envelope
}

const BEEP_CONFIGS: Record<BeepType, BeepConfig> = {
  /** Neutral coaching cue — mid-tone ping */
  info: {
    frequency: 523,  // C5
    duration: 120,
    gain: 0.18,
    type: 'sine',
    fadeOut: 60,
  },
  /** Good form / completed rep — bright chime */
  success: {
    frequency: 880,  // A5
    duration: 180,
    gain: 0.22,
    type: 'sine',
    fadeOut: 100,
  },
  /** Form warning / error — lower alert tone */
  warning: {
    frequency: 220,  // A3
    duration: 140,
    gain: 0.20,
    type: 'triangle',
    fadeOut: 70,
  },
};

class BeepPlayer {
  private ctx: AudioContext | null = null;
  private lastBeepTime = 0;
  private minInterval = 350; // ms — prevents spam beeping

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play(type: BeepType = 'info'): void {
    const now = performance.now();
    if (now - this.lastBeepTime < this.minInterval) return;
    this.lastBeepTime = now;

    try {
      const ctx = this.getContext();
      const config = BEEP_CONFIGS[type];

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      const startTime = ctx.currentTime;
      const endTime = startTime + config.duration / 1000;
      const fadeOutStart = endTime - config.fadeOut / 1000;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(config.gain, startTime + 0.005);
      gainNode.gain.setValueAtTime(config.gain, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    } catch (err) {
      // Silently ignore — audio is enhancement only
    }
  }

  public setMinInterval(ms: number): void {
    this.minInterval = Math.max(100, ms);
  }
}

// Singleton export
export const beepPlayer = new BeepPlayer();

/**
 * Play a beep sound matched to the feedback type.
 * @param type 'info' = coaching cue, 'success' = good rep, 'warning' = form error
 */
export function playBeep(type: BeepType = 'info'): void {
  beepPlayer.play(type);
}

export type { BeepType };
