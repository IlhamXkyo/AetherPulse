/**
 * AetherPulse // Generative Procedural Web Audio Engine
 * Zero external audio files: 100% synthesized in real-time.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;
    this.filter = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.subOsc = null;
    this.isPlaying = false;
    this.arpTimeout = null;

    // Musical Scale: D Dorian (Cosmic, cinematic, harmonic)
    this.scale = [146.83, 164.81, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 349.23, 440.00, 523.25];
    this.freqData = new Uint8Array(64);
  }

  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser environment.');
      return;
    }

    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Dynamics Compressor as brickwall limiter to prevent clipping
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    // Analyser Node for HUD Oscilloscope & Audio Reactivity
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.85;

    // Main Lowpass Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // Reverb Impulse Generator
    this.reverbNode = await this.createConvolverReverb(2.5, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    // Routing graph:
    // Filter -> MasterGain & ReverbNode
    // ReverbNode -> ReverbGain -> MasterGain
    // MasterGain -> Compressor -> Analyser -> Destination
    this.filter.connect(this.masterGain);
    this.filter.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Start Ambient Soundscape
    this.startDrone();
    this.startGenerativeArpeggio();
    this.isPlaying = true;
  }

  async resumeIfSuspended() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('Failed to resume AudioContext:', err);
      }
    }
  }

  async createConvolverReverb(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const envelope = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  startDrone() {
    if (!this.ctx) return;

    // Drone Oscillator 1 (D2: 73.42 Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(73.42, this.ctx.currentTime);

    // Drone Oscillator 2 (D2 with 6 cents detune)
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(73.42, this.ctx.currentTime);
    this.droneOsc2.detune.setValueAtTime(6, this.ctx.currentTime);

    // Sub Bass Oscillator (D1: 36.71 Hz)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(36.71, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.16, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    this.droneOsc1.connect(droneGain);
    this.droneOsc2.connect(droneGain);
    droneGain.connect(this.filter);

    this.subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.subOsc.start();
  }

  startGenerativeArpeggio() {
    const playNote = () => {
      if (!this.isPlaying) return;

      if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(noteGain);
        noteGain.connect(this.filter);

        osc.start(now);
        osc.stop(now + 1.25);
      }

      const cadences = [220, 330, 440, 660];
      const nextTime = cadences[Math.floor(Math.random() * cadences.length)];
      this.arpTimeout = setTimeout(playNote, nextTime);
    };

    playNote();
  }

  triggerPulseSound(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.resumeIfSuspended();

    const now = this.ctx.currentTime;
    const clampedIntensity = Math.max(0.2, Math.min(2.0, intensity));

    // Deep Sub Bass Shock Boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();

    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(150, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.85);

    boomGain.gain.setValueAtTime(0.35 * clampedIntensity, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);

    boomOsc.start(now);
    boomOsc.stop(now + 1.05);

    // Ethereal Upper Chime
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(880, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);

    chimeGain.gain.setValueAtTime(0.12 * clampedIntensity, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.reverbNode);

    chimeOsc.start(now);
    chimeOsc.stop(now + 0.8);
  }

  triggerInteractionChime(panValue = 0) {
    if (!this.ctx || this.isMuted) return;
    this.resumeIfSuspended();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    const highScale = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
    const freq = highScale[Math.floor(Math.random() * highScale.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

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
    osc.stop(now + 0.4);
  }

  updateFilterCutoff(particleVelocityNormalized) {
    if (!this.filter || !this.ctx) return;
    const targetFreq = 350 + Math.max(0, Math.min(1, particleVelocityNormalized)) * 2800;
    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
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
    if (!this.isMuted) {
      this.resumeIfSuspended();
    }
    return !this.isMuted;
  }

  getByteFrequencyData(array) {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(array);
  }

  getAudioTelemetry() {
    if (!this.analyser || this.isMuted) {
      return { bass: 0, mid: 0, treble: 0, overall: 0 };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    // Bins 0-6: Bass (~0-450Hz at 44.1k/128)
    for (let i = 0; i < 7; i++) bassSum += this.freqData[i];
    // Bins 7-24: Mid (~450-1600Hz)
    for (let i = 7; i < 25; i++) midSum += this.freqData[i];
    // Bins 25-63: Treble (>1600Hz)
    for (let i = 25; i < 64; i++) trebleSum += this.freqData[i];

    const bass = (bassSum / (7 * 255));
    const mid = (midSum / (18 * 255));
    const treble = (trebleSum / (39 * 255));
    const overall = (bass * 0.5 + mid * 0.3 + treble * 0.2);

    return { bass, mid, treble, overall };
  }

  dispose() {
    this.isPlaying = false;
    if (this.arpTimeout) {
      clearTimeout(this.arpTimeout);
      this.arpTimeout = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {
        // Safe disposal
      }
      this.ctx = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.AudioEngine = AudioEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioEngine;
}
