/**
 * CHAOS CLICK - PROCEDURAL AUDIO SYNTHESIZER
 * Pure Web Audio API engine — 100% self-contained, zero external files!
 */

class ChaosAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sirenOsc = null;
    this.sirenLfo = null;
    this.sirenGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.sirenGain) {
      this.stopSiren();
    }
    return !this.isMuted;
  }

  /**
   * Click Blip / Pop that scales pitch with clicks
   */
  playClickBlip(clicks = 1) {
    if (this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch rises with clicks, plus chromatic variations
    const baseFreq = 220 + (clicks * 14) % 1200;
    osc.type = clicks > 30 ? 'sawtooth' : (clicks > 15 ? 'triangle' : 'sine');
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Physics wall-bounce / collision "boing"
   */
  playBounce(intensity = 1) {
    if (this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = 300 * Math.min(2.5, intensity);
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Retro OS Warning / Error Chime (Dissonant chord)
   */
  playErrorChime() {
    if (this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const chords = [350, 440, 520, 660];

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq + (idx * 5), t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /**
   * Glitch noise burst
   */
  playGlitch() {
    if (this.isMuted) return;
    this.init();

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + Math.random() * 2000;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  /**
   * Emergency Siren (Stage 4)
   */
  startSiren() {
    if (this.isMuted || this.sirenOsc) return;
    this.init();

    const t = this.ctx.currentTime;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(700, t);

    // LFO frequency modulates siren pitch
    this.sirenLfo.frequency.setValueAtTime(2.5, t);
    lfoGain.gain.setValueAtTime(250, t);

    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenGain.gain.setValueAtTime(0.08, t);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);

    this.sirenOsc.start();
    this.sirenLfo.start();
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenLfo.stop();
        this.sirenOsc.disconnect();
        this.sirenLfo.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
      this.sirenLfo = null;
      this.sirenGain = null;
    }
  }

  /**
   * Black Hole Singularity Collapse (Deep rumbling sweep)
   */
  playSingularityVortex() {
    if (this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 2.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 2.5);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 3.0);
  }

  /**
   * Universe Reboot Chime (Glorious uplifting C Major 7 arpeggio)
   */
  playRebootChime() {
    if (this.isMuted) return;
    this.init();

    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99];
    const t = this.ctx.currentTime;

    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }
}

// Global audio instance
window.chaosAudio = new ChaosAudio();
