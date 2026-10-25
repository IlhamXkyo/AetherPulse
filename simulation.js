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
    this.coreMesh = null;
    this.coreAura = null;
    this.glowTexture = null;

    // Simulation Config & State
    // Modes: 'singularity', 'aizawa', 'lorenz', 'rossler', 'swarm', 'lattice'
    this.mode = 'singularity';
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

    // Camera shake & reactivity
    this.cameraBasePos = new THREE.Vector3(0, 45, 120);
    this.cameraShake = 0;

    // Color Palettes
    this.palettes = {
      cyberpunk: [new THREE.Color('#ff007f'), new THREE.Color('#00f0ff'), new THREE.Color('#7928ca')],
      biolum: [new THREE.Color('#00ff88'), new THREE.Color('#00bfff'), new THREE.Color('#064e3b')],
      solar: [new THREE.Color('#ff4500'), new THREE.Color('#ffd700'), new THREE.Color('#ff8c00')],
      spectral: [new THREE.Color('#a855f7'), new THREE.Color('#ec4899'), new THREE.Color('#3b82f6')],
      matrix: [new THREE.Color('#00ff41'), new THREE.Color('#03a062'), new THREE.Color('#003b00')]
    };

    // Telemetry & Timing
    this.currentFps = 60;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.lastFrameTime = performance.now();
    this.chaosIndex = 1.42;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.0032);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    this.camera.position.copy(this.cameraBasePos);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x07090e, 1);
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Right click reserved for Gravity Gun)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 600;
    this.controls.minDistance = 15;
    this.controls.rotateSpeed = 0.8;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.NONE
    };

    // 5. Pre-generate and cache procedural particle texture
    this.glowTexture = this.createGlowTexture();

    // 6. Build Particles
    this.createParticleSystem();

    // 7. Central Singularity Core Mesh
    this.createCoreMesh();

    // 8. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.setupInteraction();

    // 9. Animation Loop
    this.lastFrameTime = performance.now();
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
    gradient.addColorStop(0.2, 'rgba(240, 240, 255, 0.85)');
    gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.35)');
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

    // Dynamic aura around core
    const auraGeo = new THREE.SphereGeometry(4.8, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
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
      size: 1.85,
      vertexColors: true,
      map: this.glowTexture,
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
        // Accretion disk spiraling around black hole + bipolar relativistic jets
        const isJet = Math.random() < 0.14;
        if (isJet) {
          const jetSign = Math.random() > 0.5 ? 1 : -1;
          const r = Math.pow(Math.random(), 2) * 7.5;
          const theta = Math.random() * Math.PI * 2;
          x = Math.cos(theta) * r;
          z = Math.sin(theta) * r;
          y = jetSign * (10 + Math.random() * 85);
          this.velocities[i3 + 1] = jetSign * (0.8 + Math.random() * 1.6);
        } else {
          const radius = 10 + Math.pow(Math.random(), 0.7) * 75;
          const angle = Math.random() * Math.PI * 2;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          y = (Math.random() - 0.5) * (4 + radius * 0.08);

          const speed = Math.sqrt(220 / radius) * 0.65;
          this.velocities[i3] = -Math.sin(angle) * speed;
          this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
          this.velocities[i3 + 2] = Math.cos(angle) * speed;
        }
      } else if (this.mode === 'aizawa') {
        // Aizawa Attractor seed distribution
        x = (Math.random() - 0.5) * 2.2;
        y = (Math.random() - 0.5) * 2.2;
        z = (Math.random() - 0.5) * 2.0 + 1.2;
        this.velocities[i3] = 0;
        this.velocities[i3 + 1] = 0;
        this.velocities[i3 + 2] = 0;
      } else if (this.mode === 'lorenz') {
        // Lorenz Attractor seed distribution across dual butterfly lobes
        const sign = Math.random() > 0.5 ? 1 : -1;
        x = sign * (6 + Math.random() * 6);
        y = sign * (6 + Math.random() * 6);
        z = 20 + Math.random() * 15;
        this.velocities[i3] = 0;
        this.velocities[i3 + 1] = 0;
        this.velocities[i3 + 2] = 0;
      } else if (this.mode === 'rossler') {
        // Rössler Attractor seed distribution
        const angle = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 8;
        x = Math.cos(angle) * r;
        y = Math.sin(angle) * r;
        z = Math.random() * 5;
        this.velocities[i3] = 0;
        this.velocities[i3 + 1] = 0;
        this.velocities[i3 + 2] = 0;
      } else if (this.mode === 'swarm') {
        // Neural Boids flock cluster
        const radius = 65 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);

        this.velocities[i3] = (Math.random() - 0.5) * 0.8;
        this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.8;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.8;
      } else {
        // Cyber Lattice (3D cubic matrix)
        const side = Math.round(Math.cbrt(count));
        const spacing = 4.6;
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

      // Color gradient assignment
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
      if (this.audio) this.audio.resumeIfSuspended();

      // Right Click = Repel Gravity Gun
      if (e.button === 2) {
        e.preventDefault();
        this.pointerMode = 'repel';
        this.isPointerDown = true;
      } else if (e.button === 0 && e.shiftKey) {
        // Shift + Left Click = Attract Gravity Gun
        this.pointerMode = 'attract';
        this.isPointerDown = true;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  triggerShockwave(intensity = 1.0) {
    const origin = (this.isPointerDown && this.pointerWorldPos.length() > 0)
      ? this.pointerWorldPos.clone()
      : new THREE.Vector3(0, 0, 0);

    this.shockwaves.push({
      radius: 0,
      maxRadius: 210,
      speed: 175 * this.speed,
      force: 5.0 * intensity,
      origin: origin
    });

    // Camera trauma shake
    this.cameraShake = Math.min(1.0, this.cameraShake + 0.45 * intensity);

    if (this.audio) {
      this.audio.triggerPulseSound(intensity);
    }
  }

  setSimulationMode(newMode) {
    const validModes = ['singularity', 'aizawa', 'lorenz', 'rossler', 'swarm', 'lattice'];
    if (!validModes.includes(newMode)) return;

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
    const map = { 1: 32768, 2: 65536, 3: 98304 };
    this.particleCount = map[level] || 65536;
    this.createParticleSystem();
  }

  updatePhysics(dt) {
    const pos = this.positions;
    const vel = this.velocities;
    const count = this.particleCount;
    // Normalize effective dt relative to 60fps (0.0166s)
    const dtEff = Math.min(dt, 0.05) * this.speed;
    const speedRatio = dtEff / 0.0166;

    // Update Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed * dtEff;
      if (sw.radius > sw.maxRadius) {
        this.shockwaves.splice(s, 1);
      }
    }

    let totalVelocitySq = 0;

    if (this.mode === 'singularity') {
      const G = 150 * this.gravityStrength;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = pos[i3];
        let py = pos[i3 + 1];
        let pz = pos[i3 + 2];

        // Central gravitational attraction
        const distSq = px * px + py * py + pz * pz + 10;
        const dist = Math.sqrt(distSq);
        const force = G / distSq;

        vel[i3] -= (px / dist) * force * dtEff;
        vel[i3 + 1] -= (py / dist) * force * dtEff * 1.5;
        vel[i3 + 2] -= (pz / dist) * force * dtEff;

        vel[i3] *= 0.998;
        vel[i3 + 1] *= 0.995;
        vel[i3 + 2] *= 0.998;

        // Pointer force
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

        // Apply Shockwaves
        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const dx = px - sw.origin.x;
          const dy = py - sw.origin.y;
          const dz = pz - sw.origin.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const diff = Math.abs(d - sw.radius);
          if (diff < 9) {
            const shockForce = sw.force * (1 - diff / 9);
            vel[i3] += (dx / (d + 1)) * shockForce;
            vel[i3 + 1] += (dy / (d + 1)) * shockForce;
            vel[i3 + 2] += (dz / (d + 1)) * shockForce;
          }
        }

        px += vel[i3] * dtEff * 10;
        py += vel[i3 + 1] * dtEff * 10;
        pz += vel[i3 + 2] * dtEff * 10;

        // Event Horizon Respawn at outer accretion rim
        if (dist < 4.5) {
          const r = 50 + Math.random() * 35;
          const a = Math.random() * Math.PI * 2;
          px = Math.cos(a) * r;
          pz = Math.sin(a) * r;
          py = (Math.random() - 0.5) * 6;
          const spd = Math.sqrt(220 / r) * 0.65;
          vel[i3] = -Math.sin(a) * spd;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.1;
          vel[i3 + 2] = Math.cos(a) * spd;
        }

        pos[i3] = px;
        pos[i3 + 1] = py;
        pos[i3 + 2] = pz;

        totalVelocitySq += vel[i3] * vel[i3] + vel[i3 + 1] * vel[i3 + 1] + vel[i3 + 2] * vel[i3 + 2];
      }
    } else if (this.mode === 'aizawa') {
      // Aizawa Chaotic System
      // dx/dt = (z - b)*x - d*y
      // dy/dt = d*x + (z - b)*y
      // dz/dt = c + a*z - (z^3)/3 - (x^2 + y^2)*(1 + e*z) + f*z*(x^3)
      const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
      const step = 0.012 * speedRatio;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let x = pos[i3] * 0.05;
        let y = pos[i3 + 1] * 0.05;
        let z = pos[i3 + 2] * 0.05;

        const dx = (z - b) * x - d * y;
        const dy = d * x + (z - b) * y;
        const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * (x * x * x);

        // Perturbation accumulation from pointer & shockwaves
        let vx = vel[i3];
        let vy = vel[i3 + 1];
        let vz = vel[i3 + 2];

        if (this.isPointerDown) {
          const px = pos[i3], py = pos[i3 + 1], pz = pos[i3 + 2];
          const pdx = this.pointerWorldPos.x - px;
          const pdy = this.pointerWorldPos.y - py;
          const pdz = this.pointerWorldPos.z - pz;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) + 6;
          const f = (this.pointerMode === 'attract' ? 140 : -220) / (pDist * pDist);
          vx += (pdx / pDist) * f * dtEff;
          vy += (pdy / pDist) * f * dtEff;
          vz += (pdz / pDist) * f * dtEff;
        }

        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const sdx = pos[i3] - sw.origin.x;
          const sdy = pos[i3 + 1] - sw.origin.y;
          const sdz = pos[i3 + 2] - sw.origin.z;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
          const diff = Math.abs(sd - sw.radius);
          if (diff < 9) {
            const shockForce = sw.force * (1 - diff / 9) * 0.3;
            vx += (sdx / (sd + 1)) * shockForce;
            vy += (sdy / (sd + 1)) * shockForce;
            vz += (sdz / (sd + 1)) * shockForce;
          }
        }

        vx *= 0.94;
        vy *= 0.94;
        vz *= 0.94;
        vel[i3] = vx;
        vel[i3 + 1] = vy;
        vel[i3 + 2] = vz;

        x += (dx * step) + vx * 0.05;
        y += (dy * step) + vy * 0.05;
        z += (dz * step) + vz * 0.05;

        if (isNaN(x) || isNaN(y) || isNaN(z) || Math.abs(x) > 12) {
          x = (Math.random() - 0.5) * 2.2;
          y = (Math.random() - 0.5) * 2.2;
          z = (Math.random() - 0.5) * 2.0 + 1.2;
          vel[i3] = 0;
          vel[i3 + 1] = 0;
          vel[i3 + 2] = 0;
        }

        pos[i3] = x * 20;
        pos[i3 + 1] = y * 20;
        pos[i3 + 2] = z * 20;

        totalVelocitySq += (dx * dx + dy * dy + dz * dz);
      }
    } else if (this.mode === 'lorenz') {
      // Lorenz Strange Attractor
      // dx/dt = sigma*(y - x)
      // dy/dt = x*(rho - z) - y
      // dz/dt = x*y - beta*z
      const sigma = 10.0;
      const rho = 28.0;
      const beta = 8.0 / 3.0;
      const step = 0.006 * speedRatio;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let x = pos[i3] * 0.05;
        let y = pos[i3 + 1] * 0.05;
        let z = (pos[i3 + 2] + 25) * 0.05;

        const dx = sigma * (y - x);
        const dy = x * (rho - z) - y;
        const dz = x * y - beta * z;

        let vx = vel[i3];
        let vy = vel[i3 + 1];
        let vz = vel[i3 + 2];

        if (this.isPointerDown) {
          const px = pos[i3], py = pos[i3 + 1], pz = pos[i3 + 2];
          const pdx = this.pointerWorldPos.x - px;
          const pdy = this.pointerWorldPos.y - py;
          const pdz = this.pointerWorldPos.z - pz;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) + 6;
          const f = (this.pointerMode === 'attract' ? 140 : -220) / (pDist * pDist);
          vx += (pdx / pDist) * f * dtEff;
          vy += (pdy / pDist) * f * dtEff;
          vz += (pdz / pDist) * f * dtEff;
        }

        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const sdx = pos[i3] - sw.origin.x;
          const sdy = pos[i3 + 1] - sw.origin.y;
          const sdz = pos[i3 + 2] - sw.origin.z;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
          const diff = Math.abs(sd - sw.radius);
          if (diff < 9) {
            const shockForce = sw.force * (1 - diff / 9) * 0.3;
            vx += (sdx / (sd + 1)) * shockForce;
            vy += (sdy / (sd + 1)) * shockForce;
            vz += (sdz / (sd + 1)) * shockForce;
          }
        }

        vx *= 0.94;
        vy *= 0.94;
        vz *= 0.94;
        vel[i3] = vx;
        vel[i3 + 1] = vy;
        vel[i3 + 2] = vz;

        x += (dx * step) + vx * 0.04;
        y += (dy * step) + vy * 0.04;
        z += (dz * step) + vz * 0.04;

        if (isNaN(x) || isNaN(y) || isNaN(z) || Math.abs(x) > 35 || Math.abs(y) > 35 || z > 60 || z < -10) {
          const sign = Math.random() > 0.5 ? 1 : -1;
          x = sign * (6 + Math.random() * 6);
          y = sign * (6 + Math.random() * 6);
          z = 20 + Math.random() * 15;
          vel[i3] = 0;
          vel[i3 + 1] = 0;
          vel[i3 + 2] = 0;
        }

        pos[i3] = x * 20;
        pos[i3 + 1] = y * 20;
        pos[i3 + 2] = z * 20 - 25;

        totalVelocitySq += (dx * dx + dy * dy + dz * dz);
      }
    } else if (this.mode === 'rossler') {
      // Rössler Attractor
      // dx/dt = -y - z
      // dy/dt = x + a*y
      // dz/dt = b + z*(x - c)
      const a = 0.2;
      const b = 0.2;
      const c = 5.7;
      const step = 0.015 * speedRatio;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let x = pos[i3] * 0.05;
        let y = pos[i3 + 1] * 0.05;
        let z = pos[i3 + 2] * 0.05;

        const dx = -y - z;
        const dy = x + a * y;
        const dz = b + z * (x - c);

        let vx = vel[i3];
        let vy = vel[i3 + 1];
        let vz = vel[i3 + 2];

        if (this.isPointerDown) {
          const px = pos[i3], py = pos[i3 + 1], pz = pos[i3 + 2];
          const pdx = this.pointerWorldPos.x - px;
          const pdy = this.pointerWorldPos.y - py;
          const pdz = this.pointerWorldPos.z - pz;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) + 6;
          const f = (this.pointerMode === 'attract' ? 140 : -220) / (pDist * pDist);
          vx += (pdx / pDist) * f * dtEff;
          vy += (pdy / pDist) * f * dtEff;
          vz += (pdz / pDist) * f * dtEff;
        }

        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const sdx = pos[i3] - sw.origin.x;
          const sdy = pos[i3 + 1] - sw.origin.y;
          const sdz = pos[i3 + 2] - sw.origin.z;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
          const diff = Math.abs(sd - sw.radius);
          if (diff < 9) {
            const shockForce = sw.force * (1 - diff / 9) * 0.3;
            vx += (sdx / (sd + 1)) * shockForce;
            vy += (sdy / (sd + 1)) * shockForce;
            vz += (sdz / (sd + 1)) * shockForce;
          }
        }

        vx *= 0.94;
        vy *= 0.94;
        vz *= 0.94;
        vel[i3] = vx;
        vel[i3 + 1] = vy;
        vel[i3 + 2] = vz;

        x += (dx * step) + vx * 0.04;
        y += (dy * step) + vy * 0.04;
        z += (dz * step) + vz * 0.04;

        if (isNaN(x) || isNaN(y) || isNaN(z) || Math.abs(x) > 25 || Math.abs(y) > 25 || z > 35 || z < -5) {
          const angle = Math.random() * Math.PI * 2;
          const r = 5 + Math.random() * 8;
          x = Math.cos(angle) * r;
          y = Math.sin(angle) * r;
          z = Math.random() * 5;
          vel[i3] = 0;
          vel[i3 + 1] = 0;
          vel[i3 + 2] = 0;
        }

        pos[i3] = x * 20;
        pos[i3 + 1] = y * 20;
        pos[i3 + 2] = z * 20;

        totalVelocitySq += (dx * dx + dy * dy + dz * dz);
      }
    } else if (this.mode === 'swarm') {
      // Neural Swarm Boids
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = pos[i3];
        let py = pos[i3 + 1];
        let pz = pos[i3 + 2];

        vel[i3] -= px * 0.0006 * dtEff;
        vel[i3 + 1] -= py * 0.0006 * dtEff;
        vel[i3 + 2] -= pz * 0.0006 * dtEff;

        if (this.isPointerDown) {
          const dx = this.pointerWorldPos.x - px;
          const dy = this.pointerWorldPos.y - py;
          const dz = this.pointerWorldPos.z - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 2;
          const f = (this.pointerMode === 'attract' ? 190 : -290) / (dist * dist);
          vel[i3] += (dx / dist) * f * dtEff;
          vel[i3 + 1] += (dy / dist) * f * dtEff;
          vel[i3 + 2] += (dz / dist) * f * dtEff;
        }

        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const dx = px - sw.origin.x;
          const dy = py - sw.origin.y;
          const dz = pz - sw.origin.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const diff = Math.abs(d - sw.radius);
          if (diff < 9) {
            const shockForce = sw.force * (1 - diff / 9);
            vel[i3] += (dx / (d + 1)) * shockForce;
            vel[i3 + 1] += (dy / (d + 1)) * shockForce;
            vel[i3 + 2] += (dz / (d + 1)) * shockForce;
          }
        }

        px += vel[i3] * dtEff * 15;
        py += vel[i3 + 1] * dtEff * 15;
        pz += vel[i3 + 2] * dtEff * 15;

        vel[i3] *= 0.99;
        vel[i3 + 1] *= 0.99;
        vel[i3 + 2] *= 0.99;

        pos[i3] = px;
        pos[i3 + 1] = py;
        pos[i3 + 2] = pz;

        totalVelocitySq += vel[i3] * vel[i3] + vel[i3 + 1] * vel[i3 + 1] + vel[i3 + 2] * vel[i3 + 2];
      }
    } else {
      // Cyber Lattice 3D
      const time = performance.now() * 0.0015 * this.speed;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ix = this.initialPositions[i3];
        const iy = this.initialPositions[i3 + 1];
        const iz = this.initialPositions[i3 + 2];

        let wave = Math.sin(ix * 0.08 + time) * Math.cos(iz * 0.08 + time) * 6;

        // Pointer deformation in lattice
        if (this.isPointerDown) {
          const pdx = this.pointerWorldPos.x - ix;
          const pdz = this.pointerWorldPos.z - iz;
          const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
          if (pDist < 40) {
            const pForce = (1 - pDist / 40) * (this.pointerMode === 'attract' ? -12 : 12);
            wave += pForce;
          }
        }

        // Shockwave ripple in lattice
        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const sdx = ix - sw.origin.x;
          const sdz = iz - sw.origin.z;
          const sd = Math.sqrt(sdx * sdx + sdz * sdz);
          const diff = Math.abs(sd - sw.radius);
          if (diff < 12) {
            wave += Math.sin((diff / 12) * Math.PI) * sw.force * 2.5;
          }
        }

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
    if (this.audio) {
      this.audio.updateFilterCutoff(normalizedEnergy);
    }
    this.chaosIndex = (1.0 + normalizedEnergy * 2.5).toFixed(2);
  }

  animate(currentTime) {
    requestAnimationFrame(this.animate);

    // Dynamic framerate independent delta time
    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    this.updatePhysics(dt);

    if (this.controls) {
      this.controls.update();
    }

    if (this.coreMesh && this.coreMesh.visible) {
      this.coreAura.rotation.y += 0.01 * this.speed;
      this.coreAura.rotation.z += 0.005 * this.speed;
    }

    // Audio reactive camera shake and particle size
    if (this.audio) {
      const audioStats = this.audio.getAudioTelemetry();
      // Audio reactive bass micro-kick
      const bassTrauma = audioStats.bass * 0.15;
      const combinedShake = this.cameraShake + bassTrauma;

      if (combinedShake > 0.005) {
        const shakeMag = combinedShake * combinedShake * 2.5;
        this.camera.position.x += (Math.random() - 0.5) * shakeMag;
        this.camera.position.y += (Math.random() - 0.5) * shakeMag;
      }

      // Modulate particle size with overall audio energy
      if (this.particleMaterial) {
        this.particleMaterial.size = 1.8 + audioStats.bass * 1.2;
      }
    }

    // Camera shake decay
    this.cameraShake *= 0.92;

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

if (typeof window !== 'undefined') {
  window.ParticleSimulation = ParticleSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleSimulation;
}
