
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Context is created on demand to satisfy browser policies
  }

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
    this.startAmbient();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.5, this.ctx!.currentTime, 0.1);
    }
    return this.isMuted;
  }

  playLaunch() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  playExplosion(type: string) {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    // 1. The Low Thud
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, this.ctx.currentTime);
    filter.Q.value = 5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();

    // 2. The Sparkle Crackle
    if (type === 'Chrysanthemum' || type === 'Willow' || type === 'Spike') {
      const crackleGain = this.ctx.createGain();
      crackleGain.gain.setValueAtTime(0, this.ctx.currentTime + 0.1);
      
      // Procedural crackle
      const numCrackles = type === 'Spike' ? 5 : 15;
      for (let i = 0; i < numCrackles; i++) {
        const time = this.ctx.currentTime + 0.2 + Math.random() * 0.5;
        crackleGain.gain.setValueAtTime(0.02, time);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      }
      
      const highFilter = this.ctx.createBiquadFilter();
      highFilter.type = 'highpass';
      highFilter.frequency.value = 5000;

      const sparkleNoise = this.ctx.createBufferSource();
      sparkleNoise.buffer = buffer;
      sparkleNoise.connect(highFilter);
      highFilter.connect(crackleGain);
      crackleGain.connect(this.masterGain);
      sparkleNoise.start();
    }
  }

  private startAmbient() {
    if (!this.ctx || !this.masterGain) return;

    // Procedural Wind/Night Hum
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise approx
      lastOut = data[i];
      data[i] *= 3.5; 
    }

    const wind = this.ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 200;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.05;

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    wind.start();
  }
}
