import * as THREE from 'three';
import { Warp3DPod } from './Warp3DPod';
import { Warp3DGates } from './Warp3DGates';

/**
 * Warp3DScene.js — 3D Hyperspace Warp Three.js Engine for Speed Sprint
 * ====================================================================
 * Features:
 * - Dynamic hyperdrive starfield stretching with velocity
 * - Infinite cylindrical neon quantum conduit with looping geometric ribs
 * - Floating quantum speed pod with banking kinetics & afterburners
 * - Holographic velocity gates with real-time character color feedback
 * - Dynamic FOV warp expansion (65° -> 82°) reflecting typing cadence
 */
export class Warp3DScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pod = null;
    this.gates = null;

    this.conduitRings = [];
    this.starfield = null;
    this.starPositions = null;
    this.starVelocities = null;

    this.animId = null;
    this.clock = new THREE.Clock();

    this.wpm = 45;
    this.streak = 0;
    this.targetFov = 68;
    this.baseFov = 68;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene & Deep Cosmic Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617); // Deep void obsidian
    this.scene.fog = new THREE.FogExp2(0x020617, 0.018);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(this.baseFov, width / height, 0.1, 250);
    this.camera.position.set(0, 0.35, 1.2);
    this.camera.lookAt(0, 0, -18);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(5, 8, 4);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.5);
    rimLight.position.set(-6, -4, -10);
    this.scene.add(rimLight);

    // 5. Build Sub-Systems
    this.buildConduit();
    this.buildHyperdriveStarfield();

    // Speed Pod
    this.pod = new Warp3DPod();
    this.scene.add(this.pod.mesh);

    // Gates System
    this.gates = new Warp3DGates(this.scene);

    // 6. Handle Window Resizing
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  /**
   * Procedural Infinite Cylindrical Quantum Conduit
   */
  buildConduit() {
    const ringCount = 28;
    const spacing = 7;
    const ringGeo = new THREE.TorusGeometry(5.2, 0.05, 6, 8);
    ringGeo.rotateZ(Math.PI / 8);

    for (let i = 0; i < ringCount; i++) {
      const zPos = 5 - i * spacing;
      const hue = (i * 0.04) % 1;
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue > 0.5 ? 0.55 : 0.42, 0.85, 0.55),
        transparent: true,
        opacity: 0.35,
      });

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0, zPos);
      this.conduitRings.push(ring);
      this.scene.add(ring);
    }
  }

  /**
   * Hyperdrive Starfield Particle System
   */
  buildHyperdriveStarfield() {
    const starCount = 1400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Cylinder distribution around camera tunnel
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 22;
      const z = -Math.random() * 180;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;

      // Color variation between cyan, white, and purple
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.25, 0.8, 0.85);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.starfield = new THREE.Points(geo, mat);
    this.starPositions = positions;
    this.scene.add(this.starfield);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Set words stream and load gates
   */
  loadWords(wordList) {
    if (this.gates) {
      this.gates.initGates(wordList);
    }
  }

  /**
   * Update real-time typing progress on active gate
   */
  updateTyping(input, hasError = false) {
    if (this.gates) {
      this.gates.updateProgress(input, hasError);
    }
    if (this.pod) {
      // Small banking wobble on keystroke
      const lastChar = input.slice(-1).toLowerCase();
      const isLeft = 'qazwsxedcrfvtgb'.includes(lastChar);
      this.pod.triggerBank(isLeft ? -1 : 1);
    }
  }

  /**
   * Breach active gate on completed word
   */
  breachGate(nextUpcomingWord) {
    if (this.gates) {
      this.gates.breachActiveGate();
      if (nextUpcomingWord) {
        this.gates.appendGate(nextUpcomingWord);
      }
    }
    if (this.pod) {
      this.pod.pulseTurbo();
    }
  }

  /**
   * Update speed and combo metrics
   */
  setPerformanceMetrics(wpm, streak) {
    this.wpm = wpm;
    this.streak = streak;

    // FOV dynamically widens with speed: 68° at rest up to 82° at 140+ WPM
    const clampedWpm = Math.max(30, Math.min(150, wpm));
    this.targetFov = this.baseFov + (clampedWpm - 30) * 0.11 + Math.min(6, streak * 0.3);
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const speedMultiplier = Math.max(1.0, this.wpm / 40) + Math.min(1.5, this.streak * 0.08);
    const travelSpeed = 22 * speedMultiplier;

    // 1. Advance Conduit Rings
    const spacing = 7;
    const ringWrapZ = -191; // 28 * 7 - 5
    for (let i = 0; i < this.conduitRings.length; i++) {
      const ring = this.conduitRings[i];
      ring.position.z += travelSpeed * delta;
      ring.rotation.z += delta * 0.4;

      if (ring.position.z > 8) {
        ring.position.z = ringWrapZ + (ring.position.z - 8);
      }
    }

    // 2. Advance Starfield Particles
    if (this.starPositions && this.starfield) {
      const pos = this.starPositions;
      const count = pos.length / 3;
      const starShift = travelSpeed * delta * 2.2;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 2] += starShift;
        if (pos[i * 3 + 2] > 5) {
          pos[i * 3 + 2] = -180;
        }
      }
      this.starfield.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Speed Pod
    if (this.pod) {
      this.pod.update(delta, this.wpm, this.streak);
    }

    // 4. Update Gates
    if (this.gates) {
      this.gates.update(delta, travelSpeed);
    }

    // 5. Camera Warp FOV Lerp & Subtle Rumble
    if (this.camera) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 3.5);
      this.camera.updateProjectionMatrix();

      // Camera vibration intensity with speed
      if (this.wpm > 60 || this.streak > 8) {
        const shakeMag = Math.min(0.025, (this.wpm / 150) * 0.02);
        this.camera.position.x = (Math.random() - 0.5) * shakeMag;
        this.camera.position.y = 0.35 + (Math.random() - 0.5) * shakeMag;
      } else {
        this.camera.position.x = 0;
        this.camera.position.y = 0.35;
      }
    }

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.gates) {
      this.gates.clear();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

