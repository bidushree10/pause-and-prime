/**
 * BroadcastChannel Sync for Detached Popup Windows
 * Coordinates countdown timer state and hard lockout between the main app and detached popup windows.
 */

const CHANNEL_NAME = 'pause-and-prime-timer-sync';

class TimerSyncChannel {
  constructor() {
    this.channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }
  }

  broadcastTick(payload) {
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        type: 'TIMER_TICK',
        ...payload
      });
    } catch (e) {
      console.warn('Failed to broadcast timer tick:', e);
    }
  }

  broadcastLockout(microAnchor) {
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        type: 'LOCKOUT',
        microAnchor
      });
    } catch (e) {
      console.warn('Failed to broadcast lockout:', e);
    }
  }

  onMessage(callback) {
    if (!this.channel) return;
    this.channel.onmessage = (event) => {
      if (event.data && typeof callback === 'function') {
        callback(event.data);
      }
    };
  }

  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const timerSync = new TimerSyncChannel();
