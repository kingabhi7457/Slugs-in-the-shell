/**
 * CHAOS CLICK - MASTER GAMEPLAY & ENTROPY CONTROLLER
 * Coordinates all escalation stages, micro-interactions, popups,
 * 3D perspective warping, runaway button, achievements, and Singularity.
 */

class ChaosController {
  constructor() {
    this.clickCount = 0;
    this.entropy = 0;
    this.stage = 0;
    this.popupsCount = 0;
    this.chasesCount = 0;
    this.achievements = new Set();
    this.audioEnabled = true;

    // Cache DOM Elements
    this.hudStatus = document.getElementById('hud-status');
    this.entropyBar = document.getElementById('entropy-bar');
    this.entropyPct = document.getElementById('entropy-pct');
    this.clickCountEl = document.getElementById('click-count');
    this.worldContainer = document.getElementById('world-container');
    this.worldStage = document.getElementById('world-stage');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.alarmStrobe = document.getElementById('alarm-strobe');
    this.containmentBanner = document.getElementById('containment-banner');
    this.runawayContainer = document.getElementById('runaway-container');
    this.runawayBtn = document.getElementById('runaway-btn');
    this.popupsLayer = document.getElementById('popups-layer');
    this.bsodScreen = document.getElementById('bsod-screen');
    this.toolbox = document.getElementById('chaos-toolbox');

    // Stats elements
    this.statClicks = document.getElementById('stat-clicks');
    this.statEntropy = document.getElementById('stat-entropy');
    this.statDetached = document.getElementById('stat-detached');
    this.statPopups = document.getElementById('stat-popups');
    this.statChases = document.getElementById('stat-chases');

    // Target elements that can detach into physics
    this.physicsTargets = Array.from(document.querySelectorAll('.physics-target'));
    this.originalContent = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.cacheOriginalState();
  }

  cacheOriginalState() {
    // Save original headlines and text for zalgo/scramble resets
    this.physicsTargets.forEach((el, index) => {
      this.originalContent[index] = el.innerHTML;
    });
  }

  bindEvents() {
    // Any click on the interactive elements or world triggers chaos
    document.addEventListener('click', (e) => {
      // Exclude HUD and reset clicks
      if (e.target.closest('#chaos-hud') || e.target.closest('#bsod-screen') || e.target.closest('#chaos-toolbox')) {
        return;
      }
      this.handleUserClick(e);
    });

    // Sound toggle
    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        this.audioEnabled = window.chaosAudio.toggleMute();
        audioToggle.innerHTML = this.audioEnabled ? '<span>🔊</span> Sound: ON' : '<span>🔇</span> Sound: MUTED';
      });
    }

    // Quick reset
    const quickResetBtn = document.getElementById('quick-reset-btn');
    if (quickResetBtn) {
      quickResetBtn.addEventListener('click', () => this.resetUniverse());
    }

    // Big Bang Reboot Button in BSOD
    const rebootBtn = document.getElementById('big-bang-reboot-btn');
    if (rebootBtn) {
      rebootBtn.addEventListener('click', () => this.resetUniverse());
    }

    // Toolbox controls
    document.getElementById('close-toolbox-btn')?.addEventListener('click', () => {
      this.toolbox.classList.add('hidden');
    });

    document.getElementById('tool-gravity-flip')?.addEventListener('click', () => {
      window.chaosPhysics.invertGravity();
      this.triggerShake('mild');
    });

    document.getElementById('tool-spam-click')?.addEventListener('click', () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          this.handleUserClick({
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * (window.innerHeight - 100) + 70
          });
        }, i * 70);
      }
    });

    document.getElementById('tool-earthquake')?.addEventListener('click', () => {
      this.triggerShake('seismic', 2000);
    });

    document.getElementById('tool-matrix')?.addEventListener('click', () => {
      this.scrambleTextMatrix();
    });

    document.getElementById('tool-singularity')?.addEventListener('click', () => {
      this.triggerSingularity();
    });

    // 3D Perspective tilt tracking
    window.addEventListener('mousemove', (e) => {
      if (this.stage >= 3 && !window.chaosPhysics.singularityActive) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const tiltX = ((e.clientY - cy) / cy) * (this.stage * 7);
        const tiltY = -((e.clientX - cx) / cx) * (this.stage * 7);
        this.worldStage.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }

      // Runaway Emergency Stop Button evasion mechanics
      if (this.stage >= 4 && !this.runawayContainer.classList.contains('hidden')) {
        this.checkRunawayEvasion(e.clientX, e.clientY);
      }
    });

    // Runaway button click
    if (this.runawayBtn) {
      this.runawayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unlockAchievement('Cat-like Reflexes', 'Miraculously caught the runaway emergency button!');
        this.spawnRetroPopup(
          'EMERGENCY OVERRIDE INTERCEPTED',
          'Notice: Manual shutdown was declined by the Board of Directors due to quarterly profits.',
          '🛑'
        );
      });
    }
  }

  handleUserClick(e) {
    this.clickCount++;
    this.entropy = Math.min(100, Math.round(this.clickCount * 1.0));

    // Update HUD display
    this.clickCountEl.textContent = this.clickCount;
    this.entropyPct.textContent = `${this.entropy}%`;
    this.entropyBar.style.width = `${this.entropy}%`;

    // Play procedural blip
    if (window.chaosAudio) {
      window.chaosAudio.playClickBlip(this.clickCount);
    }

    // Spawn canvas particles at click coordinate
    if (e.clientX && e.clientY && window.chaosPhysics) {
      window.chaosPhysics.spawnClickParticles(e.clientX, e.clientY, 15 + Math.min(35, this.clickCount));
    }

    // Determine and advance Stage
    this.evaluateStage();

    // Trigger stage-specific click micro-effects
    this.applyClickEffects(e);
  }

  evaluateStage() {
    let nextStage = 0;
    if (this.clickCount >= 100) {
      nextStage = 5;
    } else if (this.clickCount >= 66) {
      nextStage = 4;
    } else if (this.clickCount >= 36) {
      nextStage = 3;
    } else if (this.clickCount >= 16) {
      nextStage = 2;
    } else if (this.clickCount >= 1) {
      nextStage = 1;
    }

    if (nextStage !== this.stage) {
      this.transitionToStage(nextStage);
    }
  }

  transitionToStage(newStage) {
    this.stage = newStage;
    document.body.className = `stage-${newStage}`;

    switch (newStage) {
      case 1:
        this.hudStatus.textContent = 'STATUS: UNSTABLE';
        this.hudStatus.className = 'status-badge warning';
        this.unlockAchievement('First Crack in Reality', 'The facade begins to crumble.');
        break;

      case 2:
        this.hudStatus.textContent = 'STATUS: DECOUPLING';
        this.hudStatus.className = 'status-badge warning';
        this.toolbox.classList.remove('hidden');
        this.unlockAchievement('Newton Disapproved', 'HTML elements have broken free from gravity.');
        break;

      case 3:
        this.hudStatus.textContent = 'STATUS: ANOMALY';
        this.hudStatus.className = 'status-badge critical';
        this.crtOverlay.classList.remove('hidden');
        this.unlockAchievement('Pop-up Apocalypse', 'Retro errors are invading your timeline.');
        break;

      case 4:
        this.hudStatus.textContent = 'STATUS: CONTAINMENT BREACH';
        this.hudStatus.className = 'status-badge critical';
        this.alarmStrobe.classList.remove('hidden');
        this.containmentBanner.classList.remove('hidden');
        this.spawnRunawayButton();
        if (window.chaosAudio) window.chaosAudio.startSiren();
        this.unlockAchievement('Reality Integrity 8%', 'The siren wails! Catch the emergency stop!');
        break;

      case 5:
        this.triggerSingularity();
        break;
    }
  }

  applyClickEffects(e) {
    // Stage 1: Subtle jitter & occasional font swaps
    if (this.stage === 1) {
      this.triggerShake('mild');
      if (Math.random() > 0.6) {
        this.randomizeHeadlineFont();
      }
    }

    // Stage 2: Detach random elements into 2D physics
    if (this.stage === 2) {
      this.triggerShake('mild');
      this.detachNextPhysicsTarget();
      if (Math.random() > 0.5) {
        window.chaosAudio.playGlitch();
      }
    }

    // Stage 3: Violent shakes, popups, and zalgo scramble
    if (this.stage === 3) {
      this.triggerShake('violent');
      if (Math.random() > 0.45) {
        this.spawnRetroPopup();
      }
      if (Math.random() > 0.6) {
        this.detachNextPhysicsTarget();
      }
      this.scrambleRandomText();
    }

    // Stage 4: Critical chaos
    if (this.stage === 4) {
      this.triggerShake('violent');
      if (Math.random() > 0.3) {
        this.spawnRetroPopup();
      }
      if (Math.random() > 0.4) {
        this.detachNextPhysicsTarget();
      }
      if (Math.random() > 0.7) {
        window.chaosPhysics.invertGravity();
      }
    }
  }

  triggerShake(intensity = 'mild', duration = 300) {
    const className = intensity === 'seismic' ? 'shake-seismic' : (intensity === 'violent' ? 'shake-violent' : 'shake-mild');
    document.body.classList.add(className);
    setTimeout(() => {
      document.body.classList.remove(className);
    }, duration);
  }

  randomizeHeadlineFont() {
    const fonts = ['font-comic', 'font-papyrus', 'font-mono', 'font-zalgo'];
    const el = document.getElementById('dynamic-headline');
    if (!el) return;
    fonts.forEach(f => el.classList.remove(f));
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    el.classList.add(randomFont);
  }

  scrambleRandomText() {
    const headlines = ['hero-heading', 'hero-subtitle'];
    const id = headlines[Math.floor(Math.random() * headlines.length)];
    const el = document.getElementById(id);
    if (!el) return;

    const chars = '!@#$%^&*()_+=~<>?/{}[];:01';
    let text = el.textContent;
    let scrambled = '';
    for (let i = 0; i < text.length; i++) {
      scrambled += Math.random() > 0.85 ? chars[Math.floor(Math.random() * chars.length)] : text[i];
    }
    el.textContent = scrambled;
  }

  scrambleTextMatrix() {
    const pTargets = document.querySelectorAll('.corp-element p, .corp-element h3');
    pTargets.forEach(el => {
      let original = el.textContent;
      let iterations = 0;
      const interval = setInterval(() => {
        el.textContent = original.split('').map(() => Math.random() > 0.5 ? '1' : '0').join('');
        iterations++;
        if (iterations > 6) {
          clearInterval(interval);
          el.textContent = original;
        }
      }, 50);
    });
  }

  detachNextPhysicsTarget() {
    const available = this.physicsTargets.filter(el => !el.classList.contains('physics-detached'));
    if (available.length > 0) {
      // Pick random element
      const target = available[Math.floor(Math.random() * available.length)];
      const impulseX = (Math.random() - 0.5) * 20;
      const impulseY = -(Math.random() * 10 + 6);
      window.chaosPhysics.detachElement(target, impulseX, impulseY);
      if (window.chaosAudio) window.chaosAudio.playGlitch();
    }
  }

  /**
   * Spawns Windows XP-style retro error popups
   */
  spawnRetroPopup(customTitle, customMsg, customIcon) {
    this.popupsCount++;
    if (window.chaosAudio) window.chaosAudio.playErrorChime();

    const titles = [
      'Fatal Reality Error 0x80085',
      'Quantum Leak Detected',
      'Synergy Overflow Exception',
      'DOM Boundary Broken',
      'Memory Leak into 4th Dimension',
      'User Sanity Check Failed'
    ];

    const messages = [
      'The laws of web design have encountered an unhandled paradox.',
      'Gravity has leaked onto the GPU. Please recalibrate your expectations.',
      'A catastrophic level of clicking has destabilized local spacetime.',
      'Would you like to send an apology letter to the World Wide Web Consortium?',
      'Warning: Further clicking will result in spontaneous cosmological collapse.'
    ];

    const icons = ['⚠️', '🛑', '💥', '💀', '🌀'];

    const title = customTitle || titles[Math.floor(Math.random() * titles.length)];
    const msg = customMsg || messages[Math.floor(Math.random() * messages.length)];
    const icon = customIcon || icons[Math.floor(Math.random() * icons.length)];

    const popup = document.createElement('div');
    popup.className = 'retro-popup';

    // Random position within viewport
    const x = Math.max(20, Math.min(window.innerWidth - 340, 100 + Math.random() * (window.innerWidth - 440)));
    const y = Math.max(80, Math.min(window.innerHeight - 200, 100 + Math.random() * (window.innerHeight - 280)));
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    popup.innerHTML = `
      <div class="popup-titlebar">
        <span>${title}</span>
        <div class="popup-controls">
          <button class="popup-close-btn">×</button>
        </div>
      </div>
      <div class="popup-body">
        <div class="popup-icon">${icon}</div>
        <div class="popup-message">${msg}</div>
      </div>
      <div class="popup-footer">
        <button class="popup-btn popup-ok">OK</button>
        <button class="popup-btn popup-cancel">Cancel</button>
      </div>
    `;

    // Close logic
    const close = () => {
      popup.remove();
      if (window.chaosAudio) window.chaosAudio.playClickBlip(10);
    };

    popup.querySelector('.popup-close-btn').addEventListener('click', close);
    popup.querySelector('.popup-ok').addEventListener('click', close);
    popup.querySelector('.popup-cancel').addEventListener('click', () => {
      close();
      // Hilarious gag: Cancel spawns another popup!
      if (Math.random() > 0.5) {
        setTimeout(() => this.spawnRetroPopup('Cancellation Failed', 'Cannot cancel entropy in progress.', '❌'), 200);
      }
    });

    // Make popup draggable
    const titlebar = popup.querySelector('.popup-titlebar');
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    titlebar.addEventListener('mousedown', (e) => {
      isDragging = true;
      offset.x = e.clientX - popup.offsetLeft;
      offset.y = e.clientY - popup.offsetTop;
      popup.style.zIndex = '150';
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        popup.style.left = `${e.clientX - offset.x}px`;
        popup.style.top = `${e.clientY - offset.y}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.popupsLayer.appendChild(popup);
  }

  /**
   * Runaway Emergency Stop Button (Stage 4)
   */
  spawnRunawayButton() {
    this.runawayContainer.classList.remove('hidden');
    this.runawayContainer.style.left = `${window.innerWidth / 2 - 100}px`;
    this.runawayContainer.style.top = `${window.innerHeight / 2}px`;
  }

  checkRunawayEvasion(mouseX, mouseY) {
    const rect = this.runawayContainer.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);

    // Evasion threshold radius: 130px
    if (dist < 130) {
      this.chasesCount++;
      const padding = 80;
      const newX = Math.random() * (window.innerWidth - rect.width - padding * 2) + padding;
      const newY = Math.random() * (window.innerHeight - rect.height - padding * 2 - 80) + 80;

      this.runawayContainer.style.left = `${newX}px`;
      this.runawayContainer.style.top = `${newY}px`;

      if (window.chaosAudio) window.chaosAudio.playBounce(1.8);
    }
  }

  /**
   * Stage 5: Singularity Vortex and Collapse
   */
  triggerSingularity() {
    this.stage = 5;
    this.entropy = 100;
    this.entropyPct.textContent = '100% (CRITICAL)';
    this.entropyBar.style.width = '100%';
    this.hudStatus.textContent = 'STATUS: SINGULARITY';
    this.hudStatus.className = 'status-badge critical';

    this.unlockAchievement('Entropy God', 'Reached 100 clicks and dismantled reality.');

    // Detach all remaining elements into physics for the vortex!
    this.physicsTargets.forEach(el => {
      if (!el.classList.contains('physics-detached')) {
        window.chaosPhysics.detachElement(el);
      }
    });

    // Activate vortex simulation in physics engine
    window.chaosPhysics.singularityActive = true;
    if (window.chaosAudio) {
      window.chaosAudio.stopSiren();
      window.chaosAudio.playSingularityVortex();
    }

    // Continuous seismic shake
    this.triggerShake('seismic', 3500);

    // After 3 seconds of swirling collapse, trigger Blue Screen of Death
    setTimeout(() => {
      this.showBSOD();
    }, 3200);
  }

  showBSOD() {
    // Populate stats
    this.statClicks.textContent = this.clickCount;
    this.statEntropy.textContent = '100% INFINITE';
    this.statDetached.textContent = window.chaosPhysics.bodies.length;
    this.statPopups.textContent = this.popupsCount;
    this.statChases.textContent = this.chasesCount;

    this.bsodScreen.classList.remove('hidden');
    if (window.chaosAudio) window.chaosAudio.playErrorChime();
  }

  /**
   * Reset Universe back to Stage 0
   */
  resetUniverse() {
    if (window.chaosAudio) {
      window.chaosAudio.stopSiren();
      window.chaosAudio.playRebootChime();
    }

    // Reset game state
    this.clickCount = 0;
    this.entropy = 0;
    this.stage = 0;
    this.popupsCount = 0;
    this.chasesCount = 0;

    // Reset HUD
    this.clickCountEl.textContent = '0';
    this.entropyPct.textContent = '0%';
    this.entropyBar.style.width = '0%';
    this.hudStatus.textContent = 'STATUS: STABLE';
    this.hudStatus.className = 'status-badge stable';

    // Hide overlays
    this.bsodScreen.classList.add('hidden');
    this.crtOverlay.classList.add('hidden');
    this.alarmStrobe.classList.add('hidden');
    this.containmentBanner.classList.add('hidden');
    this.runawayContainer.classList.add('hidden');
    this.toolbox.classList.add('hidden');

    // Clear popups
    this.popupsLayer.innerHTML = '';

    // Reset physics bodies back to pristine DOM flow
    window.chaosPhysics.resetAll();

    // Reset 3D transform
    this.worldStage.style.transform = 'none';

    // Restore headline fonts
    const headline = document.getElementById('dynamic-headline');
    if (headline) {
      headline.className = 'gradient-text';
      headline.textContent = 'Next-Gen Autonomous Flux';
    }

    // Restore text content
    const heading = document.getElementById('hero-heading');
    if (heading) {
      heading.innerHTML = `Holistic Synergy for <br><span class="gradient-text" id="dynamic-headline">Next-Gen Autonomous Flux</span>`;
    }

    const sub = document.getElementById('hero-subtitle');
    if (sub) {
      sub.textContent = 'Accelerate mission-critical zero-latency deliverables with decentralized paradigms. Zero maintenance. Zero instability. Totally under control.';
    }

    document.body.className = 'stage-0';
    this.unlockAchievement('Big Bang Reborn', 'Successfully reconstructed the universe from ashes.');
  }

  unlockAchievement(title, desc) {
    if (this.achievements.has(title)) return;
    this.achievements.add(title);

    const toast = document.getElementById('achievement-toast');
    const descEl = document.getElementById('achievement-desc');
    if (!toast || !descEl) return;

    descEl.textContent = `${title}: ${desc}`;
    toast.classList.remove('hidden');

    if (window.chaosAudio) window.chaosAudio.playClickBlip(40);

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.chaosController = new ChaosController();
});
