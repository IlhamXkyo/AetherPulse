# AetherPulse

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: Passing](https://img.shields.io/badge/tests-passing-brightgreen.svg)](test/simulation.test.js)
[![WebGL](https://img.shields.io/badge/WebGL-Three.js_r128-00f0ff.svg)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Synth-ff007f.svg)](audioEngine.js)

A high-performance 3D generative particle physics simulator and procedural spatial audio sandbox built with Three.js and the native Web Audio API. Zero external audio samples, 100% real-time synthesis and mathematical chaos simulation.

---

## Key Features

- **6 Physics Archetypes**:
  - **Singularity**: Central gravitational black hole with relativistic accretion disk and bipolar cosmic jets.
  - **Aizawa Chaos**: Real-time integration of the 3D Aizawa chaotic attractor system.
  - **Lorenz Butterfly**: Dual-lobe strange attractor exhibiting deterministic chaos ($\sigma=10, \rho=28, \beta=8/3$).
  - **Rössler Spiral**: Continuous-time dynamical system with spiral band turbulence.
  - **Neural Swarm**: High-density flocking boids with dynamic flock cohesion and obstacle evasion.
  - **Cyber Lattice**: 3D harmonic crystal matrix undergoing multi-frequency wave deformation.
- **Framerate-Independent Delta Physics**: Normalized numerical integration ensuring uniform physics whether rendered at 60Hz, 120Hz, 144Hz, or 240Hz.
- **Audio-Reactive Camera & Particles**: Dynamic bass and mid-frequency energy detection via fast Fourier transform (FFT), driving camera trauma micro-shakes and particle pulse expansion.
- **Procedural Synthesizer Architecture**:
  - D Dorian modal scales (D3 through C5).
  - Dual detuned sawtooth/triangle drone generators with sub-bass frequency stabilization.
  - Randomized cadence arpeggiators with Convolver reverb impulse modeling.
  - Dynamics compressor limiter preventing digital clipping during explosive pulse events.
- **Interactive Force Fields**:
  - **Repel Gravity Gun**: Right-click to repel particles into turbulent vortexes.
  - **Attract Gravity Gun**: Shift + Left-click to compress particles into quantum densities.
  - **Quantum Pulse Shockwaves**: Spacebar or UI trigger firing expanding pressure waves across all archetypes.
- **High-Resolution Screen Capture**: Instant PNG export with `preserveDrawingBuffer` buffer persistence.

---

## Mathematical Formulation

### 1. Lorenz Strange Attractor
$$\frac{dx}{dt} = \sigma (y - x)$$
$$\frac{dy}{dt} = x (\rho - z) - y$$
$$\frac{dz}{dt} = x y - \beta z$$

With standard parameters $\sigma = 10$, $\rho = 28$, $\beta = 8/3$.

### 2. Aizawa Attractor
$$\frac{dx}{dt} = (z - b)x - dy$$
$$\frac{dy}{dt} = dx + (z - b)y$$
$$\frac{dz}{dt} = c + az - \frac{z^3}{3} - (x^2 + y^2)(1 + ez) + f z x^3$$

With parameters $a = 0.95$, $b = 0.7$, $c = 0.6$, $d = 3.5$, $e = 0.25$, $f = 0.1$.

### 3. Rössler Attractor
$$\frac{dx}{dt} = -y - z$$
$$\frac{dy}{dt} = x + ay$$
$$\frac{dz}{dt} = b + z(x - c)$$

With parameters $a = 0.2$, $b = 0.2$, $c = 5.7$.

---

## Quickstart

### Option 1: Direct Browser
Open `index.html` directly in any modern WebGL-compatible browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local Static Server
```bash
git clone https://github.com/IlhamXkyo/AetherPulse.git
cd AetherPulse
npm start
```
Navigate to `http://localhost:3000` or the port displayed in your terminal.

### Option 3: Automated Test Suite
Run the mathematical verification suite:
```bash
npm test
```

---

## Interactive Controls

| Input | Action |
| :--- | :--- |
| **Left Click + Drag** | Orbit and rotate the 3D viewport |
| **Right Click [Hold]** | Repel Gravity Gun (pushes particles away) |
| **Shift + Left Click [Hold]** | Attract Gravity Gun (pulls particles to cursor) |
| **Scroll Wheel** | Zoom in and out |
| **Spacebar / P** | Fire Quantum Pulse Shockwave |
| **Keys 1 to 6** | Switch archetypes (1: Singularity, 2: Aizawa, 3: Lorenz, 4: Rössler, 5: Swarm, 6: Lattice) |
| **M** | Toggle procedural audio synthesizer mute |
| **S** | Capture high-resolution screenshot |
| **F** | Toggle fullscreen mode |

---

## Project Structure

```
AetherPulse/
├── index.html              # Core application entrypoint and cyberpunk HUD
├── style.css               # Cyberpunk UI, theme variables, glassmorphism deck
├── app.js                  # UI event coordinator and telemetry loop
├── simulation.js           # Three.js particle system, physics, and attractor solvers
├── audioEngine.js          # Procedural Web Audio API synth, convolver, limiter
├── package.json            # Node configuration and test runners
├── test/
│   └── simulation.test.js  # Headless physics and mathematical verification
├── LICENSE                 # MIT License
└── README.md               # Technical documentation
```

---

## License

MIT License. Designed and architected by [IlhamXkyo](https://github.com/IlhamXkyo).
