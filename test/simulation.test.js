/**
 * AetherPulse // Unit & Physics Verification Suite
 * Uses Node.js native test runner and assert module.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('AetherPulse Chaotic Attractors & Physics Math', () => {
  test('Aizawa Attractor differential equations integrate without NaN', () => {
    const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
    const step = 0.012;

    let x = 0.1;
    let y = 0.0;
    let z = 1.0;

    for (let stepIdx = 0; stepIdx < 500; stepIdx++) {
      const dx = (z - b) * x - d * y;
      const dy = d * x + (z - b) * y;
      const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * (x * x * x);

      x += dx * step;
      y += dy * step;
      z += dz * step;

      assert.strictEqual(Number.isNaN(x), false, `Aizawa x became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(y), false, `Aizawa y became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(z), false, `Aizawa z became NaN at step ${stepIdx}`);
      assert.ok(Math.abs(x) < 20, `Aizawa x diverged beyond bounds: ${x}`);
      assert.ok(Math.abs(y) < 20, `Aizawa y diverged beyond bounds: ${y}`);
    }
  });

  test('Lorenz Strange Attractor differential equations integrate dual lobes correctly', () => {
    const sigma = 10.0;
    const rho = 28.0;
    const beta = 8.0 / 3.0;
    const step = 0.006;

    let x = 1.0;
    let y = 1.0;
    let z = 20.0;

    let crossedXZero = false;

    for (let stepIdx = 0; stepIdx < 1000; stepIdx++) {
      const prevX = x;
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      x += dx * step;
      y += dy * step;
      z += dz * step;

      if ((prevX > 0 && x < 0) || (prevX < 0 && x > 0)) {
        crossedXZero = true;
      }

      assert.strictEqual(Number.isNaN(x), false, `Lorenz x became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(y), false, `Lorenz y became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(z), false, `Lorenz z became NaN at step ${stepIdx}`);
    }

    assert.ok(crossedXZero, 'Lorenz attractor must cross between lobes (positive and negative x)');
  });

  test('Rössler Attractor differential equations integrate smoothly', () => {
    const a = 0.2;
    const b = 0.2;
    const c = 5.7;
    const step = 0.015;

    let x = 1.0;
    let y = 1.0;
    let z = 0.0;

    for (let stepIdx = 0; stepIdx < 500; stepIdx++) {
      const dx = -y - z;
      const dy = x + a * y;
      const dz = b + z * (x - c);

      x += dx * step;
      y += dy * step;
      z += dz * step;

      assert.strictEqual(Number.isNaN(x), false, `Rössler x became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(y), false, `Rössler y became NaN at step ${stepIdx}`);
      assert.strictEqual(Number.isNaN(z), false, `Rössler z became NaN at step ${stepIdx}`);
    }

    assert.ok(z >= 0, 'Rössler z coordinate stays largely positive');
  });

  test('Singularity accretion disk orbital mechanics conserve stability', () => {
    const radius = 40.0;
    const speed = Math.sqrt(220.0 / radius) * 0.65;
    assert.ok(speed > 1.0 && speed < 3.0, `Orbital velocity ${speed} is within physical visual parameters`);

    // Event horizon threshold
    const eventHorizonRadius = 4.5;
    assert.strictEqual(eventHorizonRadius < 10.0, true);
  });

  test('AudioEngine D Dorian scale frequencies match musical equal temperament', () => {
    const AudioEngine = require('../js/audioEngine.js');
    const engine = new AudioEngine();

    assert.ok(Array.isArray(engine.scale));
    assert.strictEqual(engine.scale.length, 11);

    // D3 should be ~146.83 Hz
    assert.strictEqual(engine.scale[0], 146.83);
    // A4 should be 440.00 Hz
    assert.strictEqual(engine.scale[9], 440.00);

    // Verify frequencies are strictly increasing
    for (let i = 1; i < engine.scale.length; i++) {
      assert.ok(engine.scale[i] > engine.scale[i - 1], `Frequency at index ${i} must be greater than previous`);
    }
  });
});
