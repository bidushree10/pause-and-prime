/**
 * Pause & Prime - Core Application Orchestrator
 * Integrates all 6 PRD Developer Acceptance Criteria:
 * 1. Pre-Commitment Enforcement (>= 3 chars micro-anchor)
 * 2. Explore Filtering & Search (debounced 200ms)
 * 3. Direct Card Launch with Pre-filled Modal
 * 4. Pinned Top Timer Bar & Time Containment
 * 5. Zero-Delay Lockout at 00:00
 * 6. Clean Re-Entry resetting session state
 */

import { BoundedTimer } from './timer.js';
import { CatalogController } from './catalog.js';
import { audioSynth } from './audio.js';
import { timerSync } from './broadcast.js';

// Interactive modules
import { initSilkCanvas } from './interactive/silk.js';
import { initZenGarden } from './interactive/zen.js';
import { initMicroLogic } from './interactive/logic.js';
import { initOrbitSandbox } from './interactive/orbit.js';
import { initBreathingPacer } from './interactive/breath.js';
import { initCuriosityCards } from './interactive/curiosity.js';

class App {
  constructor() {
    this.catalog = null;
    this.timer = null;
    this.activeSession = null;
    this.currentCleanup = null;
    this.stats = { totalSessionsCompleted: 0, totalMinutesSpent: 0, totalAnchorsReturned: 0 };

    this.selectedDuration = 5;
    this.selectedExperience = null;
    this.activeTab = 'quick'; // 'quick' or 'explore'

    this.init();
  }

  async init() {
    this.cacheDom();
    this.bindEvents();
    this.initCatalog();
    await this.loadStats();
    this.renderInspirationChips();
    this.updatePreCommitmentState(this.quickAnchorInput.value, this.btnStartQuick);
  }

  cacheDom() {
    // Navigation & Tabs
    this.tabQuick = document.getElementById('tabQuick');
    this.tabExplore = document.getElementById('tabExplore');
    this.sectionQuick = document.getElementById('sectionQuick');
    this.sectionExplore = document.getElementById('sectionExplore');

    // Quick Setup Elements
    this.quickDurationPills = document.querySelectorAll('.quick-duration-pill');
    this.quickAnchorInput = document.getElementById('quickAnchorInput');
    this.quickCharCounter = document.getElementById('quickCharCounter');
    this.btnStartQuick = document.getElementById('btnStartQuick');
    this.quickInspirationContainer = document.getElementById('quickInspirations');

    // Stats Chips in Header
    this.statSessionsEl = document.getElementById('statSessionsCount');
    this.statTimeEl = document.getElementById('statTimeCount');

    // Modal (Acceptance Criterion #3: Direct Card Launch)
    this.anchorModal = document.getElementById('anchorModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalDesc = document.getElementById('modalDesc');
    this.modalDuration = document.getElementById('modalDuration');
    this.modalAnchorInput = document.getElementById('modalAnchorInput');
    this.modalCharCounter = document.getElementById('modalCharCounter');
    this.btnModalStart = document.getElementById('btnModalStart');
    this.btnModalClose = document.getElementById('btnModalClose');
    this.modalInspirations = document.getElementById('modalInspirations');

    // Bounded Break Mode View (Acceptance Criteria #4 & #5)
    this.breakModeView = document.getElementById('breakModeView');
    this.pinnedTimerBar = document.getElementById('pinnedTimerBar');
    this.countdownClock = document.getElementById('countdownClock');
    this.pinnedAnchorText = document.getElementById('pinnedAnchorText');
    this.btnEndBreakEarly = document.getElementById('btnEndBreakEarly');
    this.btnToggleSound = document.getElementById('btnToggleSound');
    this.btnOpenPopup = document.getElementById('btnOpenPopup');
    this.breakContentArea = document.getElementById('breakContentArea');

    // Hard Re-Entry Modal (Acceptance Criterion #5 & #6)
    this.hardReEntryOverlay = document.getElementById('hardReEntryOverlay');
    this.reEntryAnchorText = document.getElementById('reEntryAnchorText');
    this.btnReturnToWork = document.getElementById('btnReturnToWork');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Tab switching
    this.tabQuick.addEventListener('click', () => this.switchTab('quick'));
    this.tabExplore.addEventListener('click', () => this.switchTab('explore'));

    // Quick Duration Selection
    this.quickDurationPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.quickDurationPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedDuration = parseInt(pill.dataset.mins, 10);
      });
    });

    // Acceptance Criterion #1: Pre-Commitment Enforcement in Quick Setup
    this.quickAnchorInput.addEventListener('input', () => {
      this.updatePreCommitmentState(this.quickAnchorInput.value, this.btnStartQuick, this.quickCharCounter);
    });

    // Start Quick Break
    this.btnStartQuick.addEventListener('click', () => {
      const anchor = this.quickAnchorInput.value.trim();
      if (anchor.length < 3) return;
      // Default to silk or selected experience
      const exp = this.selectedExperience || {
        id: 'weave-silk',
        title: 'Weave Silk Generative Canvas',
        internalExperience: 'silk',
        maxDurationMinutes: this.selectedDuration
      };
      this.startBoundedBreak(exp, anchor, this.selectedDuration);
    });

    // Modal Pre-Commitment Input
    this.modalAnchorInput.addEventListener('input', () => {
      this.updatePreCommitmentState(this.modalAnchorInput.value, this.btnModalStart, this.modalCharCounter);
    });

    // Modal Close
    this.btnModalClose.addEventListener('click', () => this.closeModal());
    this.anchorModal.addEventListener('click', (e) => {
      if (e.target === this.anchorModal) this.closeModal();
    });

    // Modal Start Break
    this.btnModalStart.addEventListener('click', () => {
      const anchor = this.modalAnchorInput.value.trim();
      if (anchor.length < 3 || !this.selectedExperience) return;
      const duration = this.selectedDuration || this.selectedExperience.maxDurationMinutes || 5;
      this.closeModal();
      this.startBoundedBreak(this.selectedExperience, anchor, duration);
    });

    // End Break Early Override (Persistent Timer Container)
    this.btnEndBreakEarly.addEventListener('click', () => {
      if (confirm('End break early and return to your 2-minute work anchor now?')) {
        this.triggerZeroDelayLockout(false);
      }
    });

    // Mute sound toggle
    this.btnToggleSound.addEventListener('click', () => {
      const muted = audioSynth.toggleMute();
      this.btnToggleSound.classList.toggle('active', !muted);
      this.btnToggleSound.title = muted ? 'Unmute chimes' : 'Mute chimes';
      this.showToast(muted ? 'Audio chimes muted' : 'Audio chimes enabled');
    });

    // Popup Sync Window Trigger
    this.btnOpenPopup.addEventListener('click', () => {
      this.openDetachedPopup();
    });

    // Acceptance Criterion #6: Clean Re-Entry
    this.btnReturnToWork.addEventListener('click', () => {
      this.handleCleanReEntry();
    });

    // Real-time catalog search & category tabs (Acceptance Criterion #2)
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (this.catalog) {
          this.catalog.setSearchQueryDebounced(e.target.value);
        }
      });
    }

    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.catalog) {
          this.catalog.setCategory(btn.dataset.cat);
        }
      });
    });

    document.querySelectorAll('.dur-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dur-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.catalog) {
          this.catalog.setMaxDuration(btn.dataset.dur || null);
        }
      });
    });
  }

  // Acceptance Criterion #1: Pre-Commitment Enforcement Helper
  updatePreCommitmentState(text, buttonEl, counterEl) {
    const trimmed = (text || '').trim();
    const length = trimmed.length;
    const isValid = length >= 3;

    buttonEl.disabled = !isValid;

    if (counterEl) {
      counterEl.textContent = `${length} / 280`;
      counterEl.classList.toggle('valid', isValid);
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.tabQuick.classList.toggle('active', tab === 'quick');
    this.tabExplore.classList.toggle('active', tab === 'explore');

    this.sectionQuick.style.display = tab === 'quick' ? 'block' : 'none';
    this.sectionExplore.style.display = tab === 'explore' ? 'block' : 'none';
  }

  initCatalog() {
    this.catalog = new CatalogController({
      containerId: 'catalogGrid',
      // Acceptance Criterion #3: Direct Card Launch Trigger
      onSelectExperience: (experience) => {
        this.openCardModal(experience);
      }
    });
    this.catalog.loadCatalog();
  }

  // Acceptance Criterion #3: Pre-fills break setup modal with experience URL & duration
  openCardModal(experience) {
    this.selectedExperience = experience;
    this.selectedDuration = experience.maxDurationMinutes || 5;

    this.modalTitle.textContent = experience.title;
    this.modalDesc.textContent = experience.description;
    this.modalDuration.textContent = `⏱️ Bounded limit: ${experience.maxDurationMinutes} minutes`;
    this.modalAnchorInput.value = '';
    this.updatePreCommitmentState('', this.btnModalStart, this.modalCharCounter);

    this.renderModalInspirations();
    this.anchorModal.classList.add('active');
    setTimeout(() => this.modalAnchorInput.focus(), 150);
  }

  closeModal() {
    this.anchorModal.classList.remove('active');
  }

  renderInspirationChips() {
    const prompts = [
      'Reply to priority client email',
      'Run the failing test suite',
      'Outline next 3 paragraphs',
      'Review PR #34 and approve',
      'Submit deployment checklist'
    ];

    const makeChips = (targetInput, targetButton, targetCounter) => {
      return prompts.map(p => {
        const chip = document.createElement('button');
        chip.className = 'inspire-chip';
        chip.textContent = `+ ${p}`;
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          targetInput.value = p;
          this.updatePreCommitmentState(p, targetButton, targetCounter);
        });
        return chip;
      });
    };

    if (this.quickInspirationContainer) {
      this.quickInspirationContainer.innerHTML = '';
      makeChips(this.quickAnchorInput, this.btnStartQuick, this.quickCharCounter).forEach(c => {
        this.quickInspirationContainer.appendChild(c);
      });
    }
  }

  renderModalInspirations() {
    if (!this.modalInspirations) return;
    this.modalInspirations.innerHTML = '';
    const prompts = [
      'Refactor helper function',
      'Update release changelog',
      'Send daily standup update'
    ];
    prompts.forEach(p => {
      const chip = document.createElement('button');
      chip.className = 'inspire-chip';
      chip.textContent = `+ ${p}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        this.modalAnchorInput.value = p;
        this.updatePreCommitmentState(p, this.btnModalStart, this.modalCharCounter);
      });
      this.modalInspirations.appendChild(chip);
    });
  }

  // Start Bounded Break Session
  async startBoundedBreak(experience, microAnchor, durationMinutes) {
    try {
      // 1. Notify Backend API to record session start
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: experience.id,
          title: experience.title,
          targetUrl: experience.targetUrl,
          microAnchor,
          durationMinutes
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to initialize session');
        return;
      }

      this.activeSession = {
        sessionId: data.sessionId,
        siteId: experience.id,
        siteTitle: experience.title,
        targetUrl: experience.targetUrl,
        internalExperience: experience.internalExperience,
        microAnchor,
        durationMinutes
      };

      // 2. Set Up Pinned Header (Acceptance Criterion #4)
      this.pinnedAnchorText.textContent = microAnchor;
      this.countdownClock.textContent = BoundedTimer.formatTime(durationMinutes * 60);
      this.countdownClock.classList.remove('urgent');

      // 3. Mount Break Content
      this.mountBreakContent(experience);

      // 4. Start Timer Engine
      this.timer = new BoundedTimer({
        durationMinutes,
        onTick: ({ formattedTime, isUrgent }) => {
          this.countdownClock.textContent = formattedTime;
          this.countdownClock.classList.toggle('urgent', isUrgent);
        },
        onComplete: () => {
          // Acceptance Criterion #5: Zero-Delay Lockout
          this.triggerZeroDelayLockout(true);
        }
      });

      // Show Fullscreen Break Mode View
      this.breakModeView.style.display = 'flex';
      this.timer.start(microAnchor);

      this.showToast(`Break started: ${durationMinutes} minutes bounded.`);
    } catch (err) {
      console.error('Error starting break:', err);
      alert('Network or server error while launching break session.');
    }
  }

  mountBreakContent(experience) {
    this.breakContentArea.innerHTML = '';
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      try { this.currentCleanup(); } catch (e) {}
      this.currentCleanup = null;
    }

    const internal = experience.internalExperience;

    // Load appropriate interactive engine or iframe
    if (internal === 'silk') {
      this.currentCleanup = initSilkCanvas(this.breakContentArea);
    } else if (internal === 'zen') {
      this.currentCleanup = initZenGarden(this.breakContentArea, audioSynth.ctx);
    } else if (internal === 'logic-sudoku' || internal === 'logic-nonogram' || internal === 'logic-binary') {
      this.currentCleanup = initMicroLogic(this.breakContentArea);
    } else if (internal === 'orbit') {
      this.currentCleanup = initOrbitSandbox(this.breakContentArea);
    } else if (internal === 'breath') {
      this.currentCleanup = initBreathingPacer(this.breakContentArea);
    } else if (internal === 'curiosity-cards') {
      this.currentCleanup = initCuriosityCards(this.breakContentArea);
    } else {
      // External site: embed in iframe with loading spinner and security fallback
      this.mountExternalIframe(experience.targetUrl);
    }
  }

  mountExternalIframe(url) {
    const spinner = document.createElement('div');
    spinner.className = 'content-loading-spinner';
    spinner.innerHTML = `
      <div class="spinner"></div>
      <p style="color: var(--sage-200); font-size: 0.95rem;">Loading bounded experience...</p>
      <button id="btnForcePopup" style="background: transparent; border: 1px solid var(--border-subtle); color: var(--text-dim); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer; margin-top: 0.5rem;">
        Site blocking embed? Open in synced popup
      </button>
    `;
    this.breakContentArea.appendChild(spinner);

    const iframe = document.createElement('iframe');
    iframe.className = 'break-iframe';
    iframe.src = url;
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

    iframe.onload = () => {
      spinner.style.opacity = '0';
      setTimeout(() => spinner.remove(), 300);
    };

    iframe.onerror = () => {
      spinner.innerHTML = `
        <p style="color: var(--accent-amber); margin-bottom: 0.5rem;">This site does not allow iframe embedding.</p>
        <button id="btnOpenPopupFallback" class="btn-start-card" style="max-width: 260px;">Open in Synced Popup Window</button>
      `;
      const popBtn = spinner.querySelector('#btnOpenPopupFallback');
      if (popBtn) popBtn.addEventListener('click', () => this.openDetachedPopup());
    };

    const forcePop = spinner.querySelector('#btnForcePopup');
    if (forcePop) forcePop.addEventListener('click', () => this.openDetachedPopup());

    this.breakContentArea.appendChild(iframe);
  }

  openDetachedPopup() {
    if (!this.activeSession) return;
    const url = `/popup.html?url=${encodeURIComponent(this.activeSession.targetUrl)}&anchor=${encodeURIComponent(this.activeSession.microAnchor)}`;
    const popup = window.open(url, 'PauseAndPrimePopup', 'width=980,height=720,menubar=no,toolbar=no');
    if (!popup) {
      alert('Popup blocker prevented opening the synced window. Please allow popups for this site.');
    } else {
      this.showToast('Opened external experience in synced window.');
    }
  }

  // Acceptance Criterion #5: Zero-Delay Lockout
  // When the countdown reaches 00:00, break content must immediately unmount/hide, rendering the Re-Entry Modal
  triggerZeroDelayLockout(completed = true) {
    if (this.timer) {
      this.timer.stop();
    }

    // 1. Immediately UNMOUNT and HIDE break content
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      try { this.currentCleanup(); } catch (e) {}
      this.currentCleanup = null;
    }
    this.breakContentArea.innerHTML = '';

    // 2. Display saved micro-anchor in Hard Re-Entry Modal
    const savedAnchor = this.activeSession ? this.activeSession.microAnchor : 'Resume your next task';
    this.reEntryAnchorText.textContent = savedAnchor;

    // 3. Render Non-Bypassable Hard Re-Entry Overlay in front of all elements
    this.hardReEntryOverlay.style.display = 'flex';
  }

  // Acceptance Criterion #6: Clean Re-Entry
  // Clicking "Return to Work Now" resets session state and returns to initial setup dashboard
  async handleCleanReEntry() {
    const elapsedSeconds = this.timer ? this.timer.getElapsedSeconds() : (this.selectedDuration * 60);

    // 1. Record completed re-entry to backend API
    if (this.activeSession) {
      try {
        const res = await fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.activeSession.sessionId,
            siteId: this.activeSession.siteId,
            siteTitle: this.activeSession.siteTitle,
            microAnchor: this.activeSession.microAnchor,
            durationMinutes: this.activeSession.durationMinutes,
            elapsedSeconds,
            completed: true,
            reEntryCompleted: true
          })
        });
        const data = await res.json();
        if (data.success && data.stats) {
          this.stats = data.stats;
          this.updateStatsDisplay();
        }
      } catch (err) {
        console.warn('Failed to record session completion:', err);
      }
    }

    // 2. Hide Hard Re-Entry Overlay and Break View
    this.hardReEntryOverlay.style.display = 'none';
    this.breakModeView.style.display = 'none';

    // 3. Reset Session State
    this.activeSession = null;
    this.timer = null;
    this.quickAnchorInput.value = '';
    this.modalAnchorInput.value = '';
    this.updatePreCommitmentState('', this.btnStartQuick, this.quickCharCounter);

    // 4. Return to Initial Dashboard & Show Success Feedback
    this.switchTab('quick');
    this.showToast('🎯 Focused re-entry complete! Crush your 2-minute task.');
  }

  async loadStats() {
    try {
      const res = await fetch('/api/sessions/history');
      const data = await res.json();
      if (data.success && data.stats) {
        this.stats = data.stats;
        this.updateStatsDisplay();
      }
    } catch (e) {
      console.warn('Could not fetch stats:', e);
    }
  }

  updateStatsDisplay() {
    if (this.statSessionsEl) {
      this.statSessionsEl.textContent = this.stats.totalSessionsCompleted || 0;
    }
    if (this.statTimeEl) {
      this.statTimeEl.textContent = `${this.stats.totalMinutesSpent || 0}m`;
    }
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--sage-primary);">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
