/**
 * AetherPulse // Main Controller & UI Coordination
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const audioModal = document.getElementById('audio-modal');
  const btnEnter = document.getElementById('btn-enter');
  const oscCanvas = document.getElementById('osc-canvas');
  const oscCtx = oscCanvas.getContext('2d');

  // Telemetry elements
  const statFps = document.getElementById('stat-fps');
  const statParticles = document.getElementById('stat-particles');
  const statChaos = document.getElementById('stat-chaos');

  // Sliders
  const sliderSpeed = document.getElementById('slider-speed');
  const valSpeed = document.getElementById('val-speed');
  const sliderDensity = document.getElementById('slider-density');
  const valDensity = document.getElementById('val-density');
  const sliderGravity = document.getElementById('slider-gravity');
  const valGravity = document.getElementById('val-gravity');
  const sliderReverb = document.getElementById('slider-audio-reverb');
  const valReverb = document.getElementById('val-audio-reverb');

  // Action buttons
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const btnScreenshot = document.getElementById('btn-screenshot');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnShockwave = document.getElementById('btn-shockwave');
  const btnCollapseDeck = document.getElementById('btn-collapse-deck');
  const hudDeck = document.querySelector('.hud-deck');
  const hudToast = document.getElementById('hud-toast');

  // Initialize Engines
  const audio = new AudioEngine();
  const sim = new ParticleSimulation(container, audio);

  // Audio start trigger (modal)
  btnEnter.addEventListener('click', async () => {
    await audio.init();
    audioModal.classList.add('hidden');
    showToast('NEURAL AUDIO MATRIX ENGAGED');
  });

  // Mode Selection
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      sim.setSimulationMode(mode);
      showToast(`ARCHETYPE: ${mode.toUpperCase()}`);
    });
  });

  // Presets
  const presetButtons = document.querySelectorAll('.preset-pill');
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      applyPreset(preset);
      showToast(`PRESET LOADED: ${btn.textContent.toUpperCase()}`);
    });
  });

  function applyPreset(name) {
    if (name === 'supernova') {
      sim.setSimulationMode('singularity');
      sim.setPalette('solar');
      sim.speed = 1.8;
      sliderSpeed.value = 1.8;
      valSpeed.textContent = '1.8x';
      sim.triggerShockwave(1.5);
    } else if (name === 'deepzen') {
      sim.setSimulationMode('swarm');
      sim.setPalette('biolum');
      sim.speed = 0.5;
      sliderSpeed.value = 0.5;
      valSpeed.textContent = '0.5x';
    } else if (name === 'cyberstorm') {
      sim.setSimulationMode('attractor');
      sim.setPalette('cyberpunk');
      sim.speed = 1.4;
      sliderSpeed.value = 1.4;
      valSpeed.textContent = '1.4x';
      sim.triggerShockwave(1.2);
    } else if (name === 'abyss') {
      sim.setSimulationMode('lattice');
      sim.setPalette('spectral');
      sim.speed = 0.8;
      sliderSpeed.value = 0.8;
      valSpeed.textContent = '0.8x';
    }
  }

  // Sliders
  sliderSpeed.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    sim.speed = val;
    valSpeed.textContent = `${val.toFixed(1)}x`;
  });

  sliderDensity.addEventListener('input', (e) => {
    const level = parseInt(e.target.value);
    sim.setParticleDensity(level);
    const labels = { 1: 'Low (32k)', 2: 'Medium (65k)', 3: 'High (98k)' };
    valDensity.textContent = labels[level];
    statParticles.textContent = sim.particleCount.toLocaleString();
    showToast(`DENSITY SET TO ${sim.particleCount.toLocaleString()} PARTICLES`);
  });

  sliderGravity.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    sim.gravityStrength = val;
    valGravity.textContent = val.toFixed(1);
  });

  sliderReverb.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.setReverbWet(val);
    valReverb.textContent = `${Math.round(val * 100)}%`;
  });

  // Palette Picker
  const paletteSwatches = document.querySelectorAll('.palette-swatch');
  paletteSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      paletteSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      const palette = swatch.dataset.palette;
      sim.setPalette(palette);
      showToast(`SPECTRUM: ${palette.toUpperCase()}`);
    });
  });

  // Shockwave Pulse Button & Key
  btnShockwave.addEventListener('click', () => {
    sim.triggerShockwave(1.2);
    showToast('QUANTUM PULSE FIRED');
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      sim.triggerShockwave(1.2);
    }
  });

  // Deck Toggle
  btnCollapseDeck.addEventListener('click', () => {
    hudDeck.classList.toggle('collapsed');
    btnCollapseDeck.textContent = hudDeck.classList.contains('collapsed') ? '+' : '_';
  });

  // Audio Mute Toggle
  btnAudioToggle.addEventListener('click', () => {
    const active = audio.toggleMute();
    btnAudioToggle.classList.toggle('active', active);
    showToast(active ? 'AUDIO SYNTH UNMUTED' : 'AUDIO SYNTH MUTED');
  });

  // High-Res Screenshot Capture
  btnScreenshot.addEventListener('click', () => {
    // Render one crisp frame
    sim.renderer.render(sim.scene, sim.camera);
    const dataUrl = sim.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AetherPulse-Cosmos-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('HQ SCREENSHOT CAPTURED');
  });

  // Fullscreen
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Toast Notification
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    hudToast.textContent = msg;
    hudToast.classList.add('show');
    toastTimer = setTimeout(() => {
      hudToast.classList.remove('show');
    }, 2400);
  }

  // Real-time Telemetry & Oscilloscope visualizer loop
  const freqData = new Uint8Array(64);
  function renderHUDLoop() {
    requestAnimationFrame(renderHUDLoop);

    // Update Telemetry
    statFps.textContent = sim.currentFps;
    statChaos.textContent = sim.chaosIndex;

    // Render Audio Frequency Oscilloscope Canvas
    oscCtx.clearRect(0, 0, oscCanvas.width, oscCanvas.height);
    if (audio.analyser && !audio.isMuted) {
      audio.getByteFrequencyData(freqData);

      const barWidth = oscCanvas.width / freqData.length;
      for (let i = 0; i < freqData.length; i++) {
        const val = freqData[i] / 255.0;
        const h = val * oscCanvas.height;
        const x = i * barWidth;
        const y = oscCanvas.height - h;

        oscCtx.fillStyle = `hsl(${180 + i * 2}, 100%, ${50 + val * 20}%)`;
        oscCtx.fillRect(x, y, barWidth - 1, h);
      }
    } else {
      // Idle wave
      oscCtx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      oscCtx.beginPath();
      oscCtx.moveTo(0, oscCanvas.height / 2);
      for (let x = 0; x < oscCanvas.width; x += 10) {
        const y = oscCanvas.height / 2 + Math.sin(x * 0.05 + performance.now() * 0.003) * 3;
        oscCtx.lineTo(x, y);
      }
      oscCtx.stroke();
    }
  }

  renderHUDLoop();
});
