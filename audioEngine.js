/**
 * AetherPulse // Generative Procedural Web Audio Engine
 * Zero external audio files — 100% synthesized in real-time.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.analyser = null;
    this.filter = null;
    this.reverbNode = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.subOsc = null;
    this.isPlaying = false;
    this.arpInterval = null;

    // Musical Scale: D Dorian (Mysterious, cosmic, cinematic)
    // MIDI note numbers: D3(50), E3(52), F3(53), G3(55), A3(57), C4(60), D4(62), E4(64), F4(65), A4(69)
    this.scale = [146.83, 164.81, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 349.23, 440.00, 523.25];
  }

  async init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    // Analyser Node for HUD Oscilloscope
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    // Main Lowpass Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // Reverb Impulse Generator
    this.reverbNode = await this.createConvolverReverb(2.5, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // Connect nodes: Synth -> Filter -> Reverb / Master -> Analyser -> Output
    this.filter.connect(this.masterGain);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Start Procedural Ambient Drones
    this.startDrone();
    this.startGenerativeArpeggio();
    this.isPlaying = true;
  }

  async createConvolverReverb(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const val = (Math.random() * 2 - 1) * Math.pow(n, decay);
      left[i] = val;
      right[i] = val;
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  startDrone() {
    // Drone Oscillator 1 (D2 - 73.42 Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(73.42, this.ctx.currentTime);

    // Drone Oscillator 2 (D2 slightly detuned +5 cents)
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(73.42, this.ctx.currentTime);
    this.droneOsc2.detune.setValueAtTime(6, this.ctx.currentTime);

    // Sub Bass Oscillator (D1 - 36.71 Hz)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(36.71, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.droneOsc1.connect(this.filter);
    this.droneOsc2.connect(this.filter);
    this.subOsc.connect(droneGain);
    droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.subOsc.start();
  }

  startGenerativeArpeggio() {
    const playNote = () => {
      if (!this.isPlaying || this.isMuted) return;

      const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(noteGain);
      noteGain.connect(this.filter);
      noteGain.connect(this.reverbNode);

      osc.start(now);
      osc.stop(now + 1.3);

      // Random rhythmic cadence (180ms to 450ms)
      const nextTime = [220, 330, 440, 660][Math.floor(Math.random() * 4)];
      this.arpInterval = setTimeout(playNote, nextTime);
    };

    playNote();
  }

  triggerPulseSound(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep Sub Bass Boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

    gain.gain.setValueAtTime(0.35 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.1);

    // Ethereal High Chime
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(880, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);

    chimeGain.gain.setValueAtTime(0.12 * intensity, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.reverbNode);

    chimeOsc.start(now);
    chimeOsc.stop(now + 0.8);
  }

  triggerInteractionChime(panValue = 0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    const highScale = [587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = highScale[Math.floor(Math.random() * highScale.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.reverbNode);
    } else {
      osc.connect(gain);
      gain.connect(this.reverbNode);
    }

    osc.start(now);
    osc.stop(now + 0.45);
  }

  updateFilterCutoff(particleVelocityNormalized) {
    if (!this.filter || !this.ctx) return;
    // Modulate cutoff between 350Hz and 3200Hz based on particle energy
    const targetFreq = 350 + particleVelocityNormalized * 2800;
    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  setReverbWet(amount) {
    if (!this.reverbGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, amount));
    this.reverbGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    if (!this.ctx) return false;
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  getByteFrequencyData(array) {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(array);
  }
}

window.AudioEngine = AudioEngine;
