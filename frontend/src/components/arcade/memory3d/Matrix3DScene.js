import * as THREE from 'three';
import { Matrix3DNodes } from './Matrix3DNodes';

/**
 * Matrix3DScene.js — 3D Holographic Neural Matrix Three.js Engine for Typing Memory
 * =================================================================================
 * Features:
 * - Rotating 3D isometric hypercube wireframe lattice with quantum dust
 * - Floating crystalline neural synapse nodes connected via fiber-optic pathways
 * - Smooth camera orbital sweep around the neural structure
 * - Clean state synchronization across Viewing, Recall Shutter, and Review phases
 */
export class Matrix3DScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.nodes = null;

    this.latticeGroup = null;
    this.quantumDust = null;

    this.animId = null;
    this.clock = new THREE.Clock();
    this.orbitAngle = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.FogExp2(0x020617, 0.02);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 9.5);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x06b6d4, 2.5, 30);
    keyLight.position.set(0, 6, 4);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 1.8, 30);
    rimLight.position.set(0, -6, -4);
    this.scene.add(rimLight);

    // 5. Build Hypercube Wireframe Lattice
    this.buildLattice();

    // 6. Build Floating Quantum Dust
    this.buildQuantumDust();

    // 7. Neural Synapse Nodes
    this.nodes = new Matrix3DNodes(this.scene);

    // 8. Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 9. Render Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  /**
   * Procedural Rotating Isometric Hypercube Lattice
   */
  buildLattice() {
    this.latticeGroup = new THREE.Group();

    // Outer Cube Wireframe
    const cubeGeo = new THREE.BoxGeometry(6.5, 6.5, 6.5);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const cube = new THREE.Mesh(cubeGeo, wireMat);
    this.latticeGroup.add(cube);

    // Inner Concentric Diamond Cage
    const octaGeo = new THREE.OctahedronGeometry(4.2, 0);
    const octaMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const octa = new THREE.Mesh(octaGeo, octaMat);
    this.latticeGroup.add(octa);

    this.scene.add(this.latticeGroup);
  }

  buildQuantumDust() {
    const particleCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
    });

    this.quantumDust = new THREE.Points(geo, mat);
    this.scene.add(this.quantumDust);
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
   * Load sequence words and sync with 3D nodes
   */
  loadSequence(sequenceWords, phase = 'viewing', userInputs = [], currentTyping = '') {
    if (this.nodes) {
      this.nodes.loadSequence(sequenceWords, phase, userInputs, currentTyping);
    }
  }

  /**
   * Update phase and typing state on nodes
   */
  syncPhase(phase, sequenceWords, userInputs = [], currentTyping = '') {
    if (this.nodes) {
      this.nodes.updateVisualState(phase, sequenceWords, userInputs, currentTyping);
    }
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Gentle Matrix Pirouette Rotation
    if (this.latticeGroup) {
      this.latticeGroup.rotation.y += delta * 0.15;
      this.latticeGroup.rotation.x += delta * 0.08;
    }

    // 2. Quantum Dust Drift
    if (this.quantumDust) {
      this.quantumDust.rotation.y -= delta * 0.05;
    }

    // 3. Smooth Camera Orbital Sweep
    this.orbitAngle += delta * 0.12;
    const camDist = 9.8;
    this.camera.position.x = Math.sin(this.orbitAngle) * camDist;
    this.camera.position.z = Math.cos(this.orbitAngle) * camDist;
    this.camera.lookAt(0, 0.2, 0);

    // 4. Update Synapse Nodes
    if (this.nodes) {
      this.nodes.update(delta, this.camera);
    }

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.nodes) {
      this.nodes.clear();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

