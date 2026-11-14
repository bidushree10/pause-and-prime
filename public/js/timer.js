/**
 * Pause & Prime - Drift-Free Countdown Timer Engine
 * Eliminates layout shift via JetBrains Mono fixed-width tabular formatting.
 * Implements Acceptance Criteria #4 (Time Containment) & #5 (Zero-Delay Lockout).
 */

import { audioSynth } from './audio.js';
import { timerSync } from './broadcast.js';

export class BoundedTimer {
  constructor({ durationMinutes, onTick, onComplete, onMinuteTick }) {
    this.durationMinutes = durationMinutes;
    this.totalSeconds = durationMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.onMinuteTick = onMinuteTick;

    this.timerId = null;
    this.startTime = null;
    this.targetEndTime = null;
    this.isRunning = false;
    this.lastMinuteMark = Math.floor(this.totalSeconds / 60);
  }

  // Format seconds to MM:SS string with zero-padded monospaced digits
  static formatTime(totalSecs) {
    const s = Math.max(0, Math.floor(totalSecs));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  start(microAnchor = '') {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.targetEndTime = this.startTime + (this.totalSeconds * 1000);
    this.microAnchor = microAnchor;

    audioSynth.playStartChime();

    // Trigger initial tick
    this._tick();

    // High frequency interval (200ms) to prevent drift and ensure sub-second responsiveness
    this.timerId = setInterval(() => this._tick(), 200);
  }

  _tick() {
    if (!this.isRunning) return;

    const now = Date.now();
    const millisRemaining = Math.max(0, this.targetEndTime - now);
    const prevSecs = this.remainingSeconds;
    this.remainingSeconds = Math.ceil(millisRemaining / 1000);

    const formattedTime = BoundedTimer.formatTime(this.remainingSeconds);
    const progressPercent = ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;

    // Check for minute tick
    const currentMinuteMark = Math.floor(this.remainingSeconds / 60);
    if (currentMinuteMark < this.lastMinuteMark && this.remainingSeconds > 0) {
      this.lastMinuteMark = currentMinuteMark;
      if (typeof this.onMinuteTick === 'function') {
        this.onMinuteTick(this.remainingSeconds);
      }
      audioSynth.playMinuteTick();
    }

    // Broadcast tick to sync popup window
    timerSync.broadcastTick({
      remainingSeconds: this.remainingSeconds,
      formattedTime,
      totalSeconds: this.totalSeconds,
      microAnchor: this.microAnchor
    });

    if (typeof this.onTick === 'function') {
      this.onTick({
        remainingSeconds: this.remainingSeconds,
        formattedTime,
        progressPercent,
        isUrgent: this.remainingSeconds <= 30
      });
    }

    // Zero-Delay Lockout enforcement: trigger exact moment remaining hits 0
    if (this.remainingSeconds <= 0) {
      this.stop();
      audioSynth.playCompletionBell();
      timerSync.broadcastLockout(this.microAnchor);

      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  getElapsedSeconds() {
    return this.totalSeconds - this.remainingSeconds;
  }
}
