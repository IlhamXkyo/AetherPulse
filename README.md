# 🌌 AetherPulse // Interactive 3D Generative Particle Symphony & Chaos Sandbox

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![WebGL](https://img.shields.io/badge/WebGL-Three.js_r128-magenta.svg)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio_API-00ff88.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Status](https://img.shields.io/badge/Status-Live_Autonomous-blue.svg)]()

> **AetherPulse** is an interactive, browser-based 3D generative particle physics simulator and procedural spatial audio synthesizer. It transforms chaotic mathematical equations and particle swarm behaviors into an audiovisual cybernetic experience in real time.

---

## ✨ Key Highlights

- **⚡ Zero External Audio Files**: 100% of soundscapes (polyphonic ambient drones, procedural Dorian arpeggiators, spatial collision chimes, sub-bass pulse waves) are synthesized live using the **Web Audio API**.
- **🪐 Dynamic Simulation Archetypes**:
  - **Singularity (Black Hole)**: Accretion disk matter vortex with gravitational event horizon physics and relativistic bipolar particle jets.
  - **Aizawa Chaos**: Non-linear differential equations rendering strange attractor manifolds with up to 100,000 glowing particles.
  - **Neural Swarm**: Bioluminescent boids flocking behavior exhibiting collective cohesion, separation, and alignment.
  - **Cyber Lattice**: 3D volumetric kinetic harmonic wave matrix.
- **🎮 Realtime Interactive Gravity Fields**:
  - Click & drag / hold mouse to deploy gravitational attractors or repulsion fields.
  - Spacebar trigger for expanding quantum shockwaves.
- **🖥️ Cyber-HUD Interface**:
  - Glassmorphic telemetry panel (FPS counter, particle density, real-time chaos index).
  - Integrated audio frequency spectrum analyzer & oscilloscope.
  - Color palette switcher (Cyberpunk Neon, Bioluminescent Ocean, Solar Flare, Spectral Violet, Matrix Emerald).
  - Instant high-resolution PNG screenshot capture.

---

## 🕹️ Controls Guide

| Action | Control |
| :--- | :--- |
| **Orbit View** | Left Click + Drag |
| **Singularity Gravity Gun** | Right Click or `Shift` + Left Click |
| **Zoom In / Out** | Mouse Wheel / Pinch |
| **Trigger Quantum Pulse** | `Spacebar` or HUD Button |
| **Sound Toggle** | Audio icon in top-right HUD |
| **Screenshot** | Camera icon in top-right HUD |
| **Toggle Fullscreen** | Fullscreen icon in top-right HUD |

---

## 🔬 Mathematical & Audio Architecture

### 1. Aizawa Attractor Equations
The chaotic trajectory in phase space is calculated via:
$$\frac{dx}{dt} = (z - b)x - dy$$
$$\frac{dy}{dt} = dx + (z - b)y$$
$$\frac{dz}{dt} = c + az - \frac{z^3}{3} - (x^2 + y^2)(1 + ez) + fz(x^3)$$

### 2. Generative Audio Graph
```
[Sawtooth Drone Osc] ──┐
[Triangle Drone Osc] ──┼──> [Biquad Lowpass Filter (Modulated)] ──┬──> [Master Gain] ──> [Analyser Node] ──> [Destination]
[Algorithmic Arp Osc] ──┘                                         │            ▲
                                                                  └──> [Reverb]─┘
[Sub-Bass Boom Osc] ───────────────────────────────────────────────────────────┘
```

The cutoff frequency of the resonant biquad filter is continuously modulated by the particle swarm's average kinetic velocity, creating an organic feedback loop between motion and sound.

---

## 🚀 Quick Start & Local Run

No build step or Node dependencies are required. Simply clone and run any local HTTP server:

```bash
git clone https://github.com/IlhamXkyo/AetherPulse.git
cd AetherPulse

# Using Python:
python -m http.server 8080

# Or using Node:
npx serve
```

Then open `http://localhost:8080` in your web browser.

---

## 🌐 Deploy to GitHub Pages

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment**, select **Source**: `Deploy from a branch`.
3. Choose branch `main` and folder `/ (root)`.
4. Click **Save**. Your project will be live at:
   `https://ilhamxkyo.github.io/AetherPulse/`

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

Crafted with 💙 by [IlhamXkyo](https://github.com/IlhamXkyo).
