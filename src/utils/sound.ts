import type { RankId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.14,
    endFreq?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + Math.min(0.025, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playTick(secondsRemaining: number): void {
    if (this.muted) return;
    const urgency = Math.max(0, 6 - secondsRemaining);
    const baseFreq = 620 + urgency * 75;
    this.playTone(baseFreq, 0, 0.055, 'triangle', 0.09, baseFreq * 0.72);
  }

  public playInvalidTry(): void {
    if (this.muted) return;
    this.playTone(170, 0, 0.09, 'triangle', 0.09, 115);
  }

  public playWhoosh(intensity = 0.5): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const dur = 0.55 + intensity * 0.35;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, ctx.currentTime);
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(950 + intensity * 850, ctx.currentTime + dur * 0.42);
    filter.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + dur);

    const gain = ctx.createGain();
    const peak = 0.05 + intensity * 0.06;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + dur + 0.02);
  }

  public playRankReveal(rank: RankId): void {
    if (this.muted) return;

    switch (rank) {
      case 'iron': {
        // Cheeky sad deflating "womp-womp"
        this.playTone(235, 0.0, 0.24, 'sawtooth', 0.075, 205);
        this.playTone(196, 0.25, 0.48, 'sawtooth', 0.08, 128);
        this.playTone(98, 0.25, 0.48, 'triangle', 0.08, 65);
        break;
      }
      case 'bronze': {
        // Humble flat little blip
        this.playTone(293.66, 0, 0.14, 'triangle', 0.11, 277.18);
        break;
      }
      case 'silver': {
        // Clean two-note silver chime
        this.playTone(440, 0, 0.16, 'sine', 0.11);
        this.playTone(554.37, 0.1, 0.24, 'sine', 0.11);
        break;
      }
      case 'gold': {
        // Warm major triad
        this.playTone(440, 0, 0.18, 'triangle', 0.1);
        this.playTone(554.37, 0.08, 0.2, 'triangle', 0.1);
        this.playTone(659.25, 0.16, 0.34, 'sine', 0.13);
        break;
      }
      case 'platinum': {
        // Brisk crystal arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, idx) => this.playTone(n, idx * 0.07, 0.28, 'sine', 0.1));
        break;
      }
      case 'emerald': {
        // Sparkling emerald 9th chord
        const notes = [493.88, 622.25, 739.99, 987.77, 1108.73];
        notes.forEach((n, idx) => this.playTone(n, idx * 0.065, 0.36, 'triangle', 0.09));
        break;
      }
      case 'diamond': {
        // Sub impact + glassy diamond cascade
        this.playTone(130.81, 0, 0.35, 'sine', 0.15, 75);
        const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
        notes.forEach((n, idx) => this.playTone(n, idx * 0.06, 0.45, 'sine', 0.1));
        break;
      }
      case 'master': {
        // Bold harmonic swell + fifth fanfare
        this.playTone(110, 0, 0.45, 'sawtooth', 0.055);
        this.playTone(220, 0, 0.45, 'triangle', 0.12);
        const notes = [440, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((n, idx) => this.playTone(n, 0.04 + idx * 0.06, 0.52, 'triangle', 0.1));
        break;
      }
      case 'grandmaster': {
        // War-horn swell + crimson octave burst
        this.playTone(98, 0, 0.65, 'sawtooth', 0.07);
        this.playTone(196, 0.02, 0.65, 'triangle', 0.13);
        this.playTone(293.66, 0.08, 0.55, 'sawtooth', 0.06);
        const notes = [587.33, 783.99, 987.77, 1174.66, 1567.98];
        notes.forEach((n, idx) => this.playTone(n, 0.08 + idx * 0.055, 0.6, 'sine', 0.11));
        break;
      }
      case 'challenger': {
        // Huge multi-layered Runeterra fanfare!
        this.playTone(65.41, 0, 0.9, 'sine', 0.22, 48); // Deep timpani drop
        this.playTone(130.81, 0.02, 0.85, 'sawtooth', 0.075);
        this.playTone(196.0, 0.06, 0.85, 'triangle', 0.12);
        this.playTone(261.63, 0.1, 0.85, 'sawtooth', 0.07);
        const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
        fanfare.forEach((n, idx) => {
          this.playTone(n, 0.08 + idx * 0.065, 0.78, idx % 2 === 0 ? 'triangle' : 'sine', 0.11);
        });
        break;
      }
    }
  }

  public playRunComplete(reachedNexus: boolean): void {
    if (this.muted) return;
    if (reachedNexus) {
      this.playRankReveal('challenger');
    } else {
      const notes = [392.0, 493.88, 587.33, 783.99];
      notes.forEach((n, idx) => this.playTone(n, idx * 0.08, 0.55, 'triangle', 0.1));
    }
  }
}

export const soundEngine = new SoundEngine();
