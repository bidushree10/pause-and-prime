/**
 * Pause & Prime - Web Audio Synthesizer
 * Uses Web Audio API to synthesize organic, soothing acoustic bells and chimes.
 * Requires zero external audio files and works 100% offline.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = typeof localStorage !== 'undefined' ? localStorage.getItem('pp_muted') === 'true' : false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(val) {
    this.muted = Boolean(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pp_muted', this.muted);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Play a soothing warm singing bowl chime when starting a break
  playStartChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const fundamental = 392; // G4

      [fundamental, fundamental * 1.5, fundamental * 2.01].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.08 / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(initialVol, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play subtle minute tick
  playMinuteTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play resonant gong / re-entry bell when countdown reaches 00:00
  playCompletionBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Resonant harmonic chord: C4, E4, G4, C5
      const chords = [261.63, 329.63, 392.00, 523.25];

      chords.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.06));

        gain.gain.setValueAtTime(0.001, now + (i * 0.06));
        gain.gain.exponentialRampToValueAtTime(0.12, now + (i * 0.06) + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + (i * 0.06));
        osc.stop(now + 3.2);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

export const audioSynth = new AudioSynthesizer();
