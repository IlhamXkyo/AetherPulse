/**
 * AetherPulse // 3D WebGL Particle & Chaos Physics Simulation
 * Powered by Three.js
 */

class ParticleSimulation {
  constructor(container, audioEngine) {
    this.container = container;
    this.audio = audioEngine;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.particleSystem = null;

    // Simulation Config & State
    this.mode = 'singularity'; // 'singularity', 'attractor', 'swarm', 'lattice'
    this.speed = 1.0;
    this.gravityStrength = 1.2;
    this.particleCount = 65536;
    this.activePalette = 'cyberpunk';

    // Particle Buffers
    this.positions = null;
    this.velocities = null;
    this.initialPositions = null;
    this.colors = null;

    // Interaction states
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.pointerWorldPos = new THREE.Vector3();
    this.isPointerDown = false;
    this.pointerMode = 'attract'; // 'attract' or 'repel'

    // Shockwaves
    this.shockwaves = [];

    // Color Palettes
    this.palettes = {
      cyberpunk: [new THREE.Color('#ff007f'), new THREE.Color('#00f0ff'), new THREE.Color('#7928ca')],
      biolum: [new THREE.Color('#00ff88'), new THREE.Color('#00bfff'), new THREE.Color('#064e3b')],
      solar: [new THREE.Color('#ff4500'), new THREE.Color('#ffd700'), new THREE.Color('#ff8c00')],
      spectral: [new THREE.Color('#a855f7'), new THREE.Color('#ec4899'), new THREE.Color('#3b82f6')],
      matrix: [new THREE.Color('#00ff41'), new THREE.Color('#03a062'), new THREE.Color('#003b00')]
    };

    // Telemetry stats
    this.currentFps = 60;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.chaosIndex = 1.42;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.0035);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    this.camera.position.set(0, 45, 120);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x07090e, 1);
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 600;
    this.controls.minDistance = 15;
    this.controls.rotateSpeed = 0.8;

    // 5. Build Particles
    this.createParticleSystem();

    // 6. Central Singularity Glow Sphere
    this.createCoreMesh();

    // 7. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.setupInteraction();

    // 8. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(240, 240, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCoreMesh() {
    const geo = new THREE.SphereGeometry(4, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.95
    });
    this.coreMesh = new THREE.Mesh(geo, mat);

    // Glow aura around core
    const auraGeo = new THREE.SphereGeometry(4.8, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.coreAura = new THREE.Mesh(auraGeo, auraMat);
    this.coreMesh.add(this.coreAura);

    this.scene.add(this.coreMesh);
  }

  createParticleSystem() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleGeometry.dispose();
      this.particleMaterial.dispose();
    }

    const count = this.particleCount;
    this.particleGeometry = new THREE.BufferGeometry();

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.initialPositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);

    this.resetPositionsByMode();

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      map: this.createGlowTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.85
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  resetPositionsByMode() {
    const count = this.particleCount;
    const colors = this.palettes[this.activePalette];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x, y, z;

      if (this.mode === 'singularity') {
        // Accretion disk spiraling around center + bipolar jets
        const isJet = Math.random() < 0.15;
        if (isJet) {
          // Relativistic jet
          const jetSign = Math.random() > 0.5 ? 1 : -1;
          const r = Math.pow(Math.random(), 2) * 8;
          const theta = Math.random() * Math.PI * 2;
          x = Math.cos(theta) * r;
          z = Math.sin(theta) * r;
          y = jetSign * (10 + Math.random() * 80);
          this.velocities[i3 + 1] = jetSign * (0.8 + Math.random() * 1.5);
        } else {
          // Accretion Disk
          const radius = 10 + Math.pow(Math.random(), 0.7) * 75;
          const angle = Math.random() * Math.PI * 2;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          y = (Math.random() - 0.5) * (4 + radius * 0.08);

          // Orbital velocity perpendicular to radius
          const speed = Math.sqrt(200 / radius) * 0.6;
          this.velocities[i3] = -Math.sin(angle) * speed;
          this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
          this.velocities[i3 + 2] = Math.cos(angle) * speed;
        }
      } else if (this.mode === 'attractor') {
        // Aizawa chaotic attractor seed
        x = (Math.random() - 0.5) * 2;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 2 + 1;
        this.velocities[i3] = 0;
        this.velocities[i3 + 1] = 0;
        this.velocities[i3 + 2] = 0;
      } else if (this.mode === 'swarm') {
        // Neural Boids flock cluster
        const radius = 60 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);

        this.velocities[i3] = (Math.random() - 0.5) * 0.8;
        this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.8;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.8;
      } else {
        // Cyber Lattice
        const side = Math.cbrt(count);
        const spacing = 4.5;
        const ix = (i % side) - side / 2;
        const iy = (Math.floor(i / side) % side) - side / 2;
        const iz = (Math.floor(i / (side * side))) - side / 2;
        x = ix * spacing;
        y = iy * spacing;
        z = iz * spacing;

        this.velocities[i3] = 0;
        this.velocities[i3 + 1] = 0;
        this.velocities[i3 + 2] = 0;
      }

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.initialPositions[i3] = x;
      this.initialPositions[i3 + 1] = y;
      this.initialPositions[i3 + 2] = z;

      // Assign palette gradient
      const c1 = colors[0];
      const c2 = colors[1];
      const mixRatio = (Math.sin(x * 0.05) + Math.cos(z * 0.05) + 2) / 4;
      const col = new THREE.Color().copy(c1).lerp(c2, mixRatio);

      this.colors[i3] = col.r;
      this.colors[i3 + 1] = col.g;
      this.colors[i3 + 2] = col.b;
    }
  }

  setupInteraction() {
    const dom = this.renderer.domElement;

    const onPointerMove = (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Project pointer to 3D plane facing camera
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      this.interactionPlane.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(0, 0, 0));
      this.raycaster.ray.intersectPlane(this.interactionPlane, this.pointerWorldPos);

      if (this.isPointerDown && Math.random() < 0.15) {
        this.audio.triggerInteractionChime(this.mouse.x);
      }
    };

    dom.addEventListener('pointermove', onPointerMove);

    dom.addEventListener('pointerdown', (e) => {
      // If right click or holding
      if (e.button === 2) {
        e.preventDefault();
        this.pointerMode = 'repel';
        this.isPointerDown = true;
      } else if (e.button === 0 && e.shiftKey) {
        this.pointerMode = 'attract';
        this.isPointerDown = true;
      }
    });

    dom.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  triggerShockwave(intensity = 1.0) {
    this.shockwaves.push({
      radius: 0,
      maxRadius: 180,
      speed: 160 * this.speed,
      force: 4.5 * intensity,
      origin: this.pointerWorldPos.length() > 0 && this.isPointerDown
        ? this.pointerWorldPos.clone()
        : new THREE.Vector3(0, 0, 0)
    });

    this.audio.triggerPulseSound(intensity);
  }

  setSimulationMode(newMode) {
    this.mode = newMode;
    this.resetPositionsByMode();
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;

    if (this.coreMesh) {
      this.coreMesh.visible = (newMode === 'singularity');
    }
  }

  setPalette(paletteName) {
    if (!this.palettes[paletteName]) return;
    this.activePalette = paletteName;
    const colors = this.palettes[paletteName];
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = this.positions[i3];
      const z = this.positions[i3 + 2];
      const mixRatio = (Math.sin(x * 0.05) + Math.cos(z * 0.05) + 2) / 4;
      const col = new THREE.Color().copy(colors[0]).lerp(colors[1], mixRatio);

      this.colors[i3] = col.r;
      this.colors[i3 + 1] = col.g;
      this.colors[i3 + 2] = col.b;
    }
    this.particleGeometry.attributes.color.needsUpdate = true;

    if (this.coreAura) {
      this.coreAura.material.color.copy(colors[0]);
    }
  }

  setParticleDensity(level) {
    // 1: 32768, 2: 65536, 3: 98304
    const map = { 1: 32768, 2: 65536, 3: 98304 };
    this.particleCount = map[level] || 65536;
    this.createParticleSystem();
  }

  updatePhysics(dt) {
    const pos = this.positions;
    const vel = this.velocities;
    const count = this.particleCount;
    const dtEff = Math.min(dt, 0.05) * this.speed;

    // Update Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed * dtEff;
      if (sw.radius > sw.maxRadius) {
        this.shockwaves.splice(s, 1);
      }
    }

    let totalVelocitySq = 0;

    // Simulation updates according to selected Archetype
    if (this.mode === 'singularity') {
      const G = 150 * this.gravityStrength;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = pos[i3];
        let py = pos[i3 + 1];
        let pz = pos[i3 + 2];

        // Distance from center black hole
        const distSq = px * px + py * py + pz * pz + 10;
        const dist = Math.sqrt(distSq);

        // Gravity pull to (0,0,0)
        const force = G / distSq;
        vel[i3] -= (px / dist) * force * dtEff;
        vel[i3 + 1] -= (py / dist) * force * dtEff * 1.5; // flatten accretion
        vel[i3 + 2] -= (pz / dist) * force * dtEff;

        // Damping and tangential spin acceleration
        vel[i3] *= 0.998;
        vel[i3 + 1] *= 0.995;
        vel[i3 + 2] *= 0.998;

        // Interactive Pointer Force
        if (this.isPointerDown) {
          const dx = this.pointerWorldPos.x - px;
          const dy = this.pointerWorldPos.y - py;
          const dz = this.pointerWorldPos.z - pz;
          const ptrDist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 5;
          const pForce = (this.pointerMode === 'attract' ? 250 : -350) / (ptrDist * ptrDist);
          vel[i3] += (dx / ptrDist) * pForce * dtEff;
          vel[i3 + 1] += (dy / ptrDist) * pForce * dtEff;
          vel[i3 + 2] += (dz / ptrDist) * pForce * dtEff;
        }

        // Apply Shockwave
        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const dx = px - sw.origin.x;
          const dy = py - sw.origin.y;
          const dz = pz - sw.origin.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const diff = Math.abs(d - sw.radius);
          if (diff < 8) {
            const shockForce = sw.force * (1 - diff / 8);
            vel[i3] += (dx / (d + 1)) * shockForce;
            vel[i3 + 1] += (dy / (d + 1)) * shockForce;
            vel[i3 + 2] += (dz / (d + 1)) * shockForce;
          }
        }

        px += vel[i3] * dtEff * 10;
        py += vel[i3 + 1] * dtEff * 10;
        pz += vel[i3 + 2] * dtEff * 10;

        // If fell into singularity event horizon (dist < 4), respawn at outer rim
        if (dist < 4.5) {
          const r = 50 + Math.random() * 35;
          const a = Math.random() * Math.PI * 2;
          px = Math.cos(a) * r;
          pz = Math.sin(a) * r;
          py = (Math.random() - 0.5) * 6;
          const spd = Math.sqrt(200 / r) * 0.6;
          vel[i3] = -Math.sin(a) * spd;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.1;
          vel[i3 + 2] = Math.cos(a) * spd;
        }

        pos[i3] = px;
        pos[i3 + 1] = py;
        pos[i3 + 2] = pz;

        totalVelocitySq += vel[i3] * vel[i3] + vel[i3 + 1] * vel[i3 + 1] + vel[i3 + 2] * vel[i3 + 2];
      }
    } else if (this.mode === 'attractor') {
      // Aizawa Chaos Equations
      // dx/dt = (z - b)*x - d*y
      // dy/dt = d*x + (z - b)*y
      // dz/dt = c + a*z - (z^3)/3 - (x^2 + y^2)*(1 + e*z) + f*z*(x^3)
      const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
      const step = 0.012 * dtEff;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let x = pos[i3] * 0.05;
        let y = pos[i3 + 1] * 0.05;
        let z = pos[i3 + 2] * 0.05;

        const dx = (z - b) * x - d * y;
        const dy = d * x + (z - b) * y;
        const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * (x * x * x);

        x += dx * step;
        y += dy * step;
        z += dz * step;

        if (isNaN(x) || Math.abs(x) > 10) {
          x = (Math.random() - 0.5) * 0.8;
          y = (Math.random() - 0.5) * 0.8;
          z = (Math.random() - 0.5) * 0.8 + 1;
        }

        pos[i3] = x * 20;
        pos[i3 + 1] = y * 20;
        pos[i3 + 2] = z * 20;

        totalVelocitySq += (dx * dx + dy * dy + dz * dz);
      }
    } else if (this.mode === 'swarm') {
      // Neural Swarm (Boids with center cohesion & pointer reaction)
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = pos[i3];
        let py = pos[i3 + 1];
        let pz = pos[i3 + 2];

        // Soft center cohesion
        vel[i3] -= px * 0.0006 * dtEff;
        vel[i3 + 1] -= py * 0.0006 * dtEff;
        vel[i3 + 2] -= pz * 0.0006 * dtEff;

        // Pointer force
        if (this.isPointerDown) {
          const dx = this.pointerWorldPos.x - px;
          const dy = this.pointerWorldPos.y - py;
          const dz = this.pointerWorldPos.z - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 2;
          const f = (this.pointerMode === 'attract' ? 180 : -280) / (dist * dist);
          vel[i3] += (dx / dist) * f * dtEff;
          vel[i3 + 1] += (dy / dist) * f * dtEff;
          vel[i3 + 2] += (dz / dist) * f * dtEff;
        }

        px += vel[i3] * dtEff * 15;
        py += vel[i3 + 1] * dtEff * 15;
        pz += vel[i3 + 2] * dtEff * 15;

        // Speed limit
        vel[i3] *= 0.99;
        vel[i3 + 1] *= 0.99;
        vel[i3 + 2] *= 0.99;

        pos[i3] = px;
        pos[i3 + 1] = py;
        pos[i3 + 2] = pz;

        totalVelocitySq += vel[i3] * vel[i3] + vel[i3 + 1] * vel[i3 + 1] + vel[i3 + 2] * vel[i3 + 2];
      }
    } else {
      // Cyber Lattice (Dynamic 3D harmonic wave)
      const time = performance.now() * 0.0015 * this.speed;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ix = this.initialPositions[i3];
        const iy = this.initialPositions[i3 + 1];
        const iz = this.initialPositions[i3 + 2];

        const wave = Math.sin(ix * 0.08 + time) * Math.cos(iz * 0.08 + time) * 6;
        pos[i3] = ix;
        pos[i3 + 1] = iy + wave;
        pos[i3 + 2] = iz;

        totalVelocitySq += wave * wave;
      }
    }

    this.particleGeometry.attributes.position.needsUpdate = true;

    // Modulate audio filter with average kinetic velocity
    const avgVelocity = Math.sqrt(totalVelocitySq / count);
    const normalizedEnergy = Math.min(1.0, avgVelocity / 8.0);
    this.audio.updateFilterCutoff(normalizedEnergy);
    this.chaosIndex = (1.0 + normalizedEnergy * 2.5).toFixed(2);
  }

  animate(currentTime) {
    requestAnimationFrame(this.animate);

    const dt = 0.016; // smooth delta
    this.updatePhysics(dt);

    if (this.controls) this.controls.update();

    if (this.coreMesh && this.coreMesh.visible) {
      this.coreAura.rotation.y += 0.01 * this.speed;
      this.coreAura.rotation.z += 0.005 * this.speed;
    }

    this.renderer.render(this.scene, this.camera);

    // FPS calculation
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.ParticleSimulation = ParticleSimulation;
