// All sound effects and the BGM loop are synthesized at runtime with the Web
// Audio API, so the game needs no external audio files at all.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.stopBgm();
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playTone(freq, duration, type = 'square', volume = 0.15, freqEnd = null) {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playNoiseBurst(duration, volume = 0.3, filterFreq = 800) {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  playShoot(type) {
    if (type === 'mg') this.playTone(440, 0.06, 'square', 0.07, 220);
    else if (type === 'at') this.playTone(160, 0.18, 'sawtooth', 0.16, 60);
    else if (type === 'sniper') this.playTone(900, 0.08, 'sawtooth', 0.14, 200);
    else if (type === 'rocket') this.playNoiseBurst(0.2, 0.18, 900);
    else this.playTone(220, 0.12, 'triangle', 0.12, 120);
  }

  playExplosion() {
    this.playNoiseBurst(0.35, 0.3, 500);
  }

  playHit() {
    this.playTone(300, 0.05, 'square', 0.05, 150);
  }

  playClick() {
    this.playTone(600, 0.04, 'square', 0.06);
  }

  playError() {
    this.playTone(120, 0.15, 'sawtooth', 0.1, 80);
  }

  playWaveStart() {
    this.playTone(500, 0.12, 'triangle', 0.12, 700);
  }

  playVictory() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25, 'triangle', 0.15), i * 140);
    });
  }

  playDefeat() {
    [300, 260, 220, 180].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sawtooth', 0.15), i * 160);
    });
  }

  startBgm() {
    if (this.bgmTimer) return;
    this.ensureContext();
    const melody = [220, 0, 261.6, 0, 293.7, 261.6, 220, 0, 196, 0, 220, 0, 246.9, 220, 196, 0];
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const note = melody[this.bgmStep % melody.length];
      if (note > 0) this.playTone(note, 0.22, 'triangle', 0.045);
      this.bgmStep++;
    }, 260);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}
