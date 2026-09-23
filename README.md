# AetherPulse

A 3D generative particle simulator and audio-reactive WebGL visualizer.

AetherPulse computes physics-driven attractor calculations and vector flow fields to render thousands of dynamic glowing nodes in three-dimensional space. The simulation reacts dynamically to cursor interaction and audio frequency analysis.

## Features

- **3D Particle Dynamics**: Strange attractor equations (Lorenz, Aizawa, and Rossler) computed in real-time.
- **Audio Reactivity**: Web Audio API integration that maps bass, mid, and treble frequencies to particle dispersion and camera shaking.
- **Interactive Camera Controls**: Orbit, pan, and zoom controls powered by Three.js OrbitControls.
- **Visual Customization**: Toggle bloom post-processing, trail decay length, chromatic aberration, and particle color palettes.

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/IlhamXkyo/AetherPulse.git
   cd AetherPulse
   ```

2. Open `index.html` in your browser, or use a local static server:
   ```bash
   npx serve .
   ```

3. Navigate to `http://localhost:3000`.

## Controls

- **Left Click + Drag**: Rotate 3D viewport.
- **Right Click + Drag**: Pan camera.
- **Scroll Wheel**: Zoom in and out.
- **Microphone / Audio Button**: Enable audio reactivity from microphone input or audio file.
- **GUI Panel**: Adjust particle count, speed, and attractor parameters.

## Tech Stack

- Three.js
- WebGL
- Web Audio API

## License

MIT License. See LICENSE for details.
