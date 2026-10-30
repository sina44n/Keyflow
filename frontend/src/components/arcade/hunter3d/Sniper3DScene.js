import * as THREE from 'three';
import { Sniper3DDrones } from './Sniper3DDrones';

/**
 * Sniper3DScene.js — 3D Cyber Sniper Tactical Three.js Engine for Word Hunter
 * ===========================================================================
 * Features:
 * - Cyberpunk nighttime skyline with procedural illuminated skyscrapers
 * - Smooth camera pan-and-tilt tracking toward locked target drone
 * - Instant high-energy electromagnetic railgun laser beam discharge
 * - Camera recoil kick physics and atmospheric volumetric city lighting
 */
export class Sniper3DScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.drones = null;

    this.laserBeams = [];
    this.animId = null;
    this.clock = new THREE.Clock();

    this.targetCameraLookAt = new THREE.Vector3(0, 3, -30);
    this.currentCameraLookAt = new THREE.Vector3(0, 3, -30);
    this.cameraRecoil = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617); // Night void
    this.scene.fog = new THREE.FogExp2(0x020617, 0.012);

    // 2. Camera (Sniper observation vantage point)
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 300);
    this.camera.position.set(0, 2.5, 0);
    this.camera.lookAt(this.currentCameraLookAt);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    moonLight.position.set(-15, 30, 20);
    this.scene.add(moonLight);

    // 5. Build Procedural Cityscape & Rooftop Vantage
    this.buildCityscape();

    // 6. Drones System
    this.drones = new Sniper3DDrones(this.scene);

    // 7. Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 8. Render Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  /**
   * Procedural Skyscrapers with Illuminated Cyber Windows
   */
  buildCityscape() {
    // Generate 48 skyline buildings
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.6,
      metalness: 0.8,
    });

    const windowColors = [0x38bdf8, 0x10b981, 0xf59e0b, 0xa855f7];

    for (let i = 0; i < 48; i++) {
      const bWidth = 6 + Math.random() * 8;
      const bHeight = 18 + Math.random() * 45;
      const bDepth = 6 + Math.random() * 8;

      const geo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(geo, buildingMat);

      const x = (Math.random() - 0.5) * 110;
      const z = -40 - Math.random() * 120;
      const y = -bHeight / 2 + 10;

      bMesh.position.set(x, y, z);
      this.scene.add(bMesh);

      // Add Glowing Holographic Rooftop Beacon
      if (Math.random() > 0.4) {
        const beaconGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: windowColors[i % windowColors.length],
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(x, y + bHeight / 2 + 2, z);
        this.scene.add(beacon);
      }
    }
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
   * Sync target drones with 3D positions and callsheet canvas updates
   */
  syncTargets(targetsList, lockedId, typedBuffer = '', targetTtl = 4.5, maxTtl = 4.5) {
    if (this.drones) {
      this.drones.syncTargets(targetsList, lockedId, typedBuffer, targetTtl, maxTtl);
    }

    // Update camera pan tracking to lock-on drone
    if (lockedId && this.drones) {
      const lockedDrone = this.drones.drones.get(lockedId);
      if (lockedDrone) {
        this.targetCameraLookAt.copy(lockedDrone.group.position);
      }
    }
  }

  /**
   * Fire sniper railgun laser beam and explode drone
   */
  fireSniperShot(targetId) {
    if (!this.drones) return;
    const drone = this.drones.drones.get(targetId);
    if (!drone) return;

    const targetPos = drone.group.position.clone();

    // 1. Create Glowing Electromagnetic Railgun Beam
    const origin = new THREE.Vector3(0.4, 2.0, 0.4); // sniper muzzle position
    const distance = origin.distanceTo(targetPos);

    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, distance, 8);
    beamGeo.rotateX(Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);

    // Position and orient beam along line of sight
    const midPoint = origin.clone().add(targetPos).multiplyScalar(0.5);
    beam.position.copy(midPoint);
    beam.lookAt(targetPos);

    this.scene.add(beam);
    this.laserBeams.push({ mesh: beam, life: 0.18 });

    // 2. Trigger Drone Explosion
    this.drones.explodeDrone(targetId);

    // 3. Sniper Recoil Kick
    this.cameraRecoil = 0.08;
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Smooth Camera Tracking Pan-and-Tilt
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, delta * 5.0);
    this.camera.lookAt(
      this.currentCameraLookAt.x,
      this.currentCameraLookAt.y + this.cameraRecoil,
      this.currentCameraLookAt.z
    );

    // Recoil recovery
    this.cameraRecoil = THREE.MathUtils.lerp(this.cameraRecoil, 0, delta * 8.0);

    // 2. Update Laser Beams
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const b = this.laserBeams[i];
      b.life -= delta;
      b.mesh.material.opacity = Math.max(0, b.life / 0.18);
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        this.laserBeams.splice(i, 1);
      }
    }

    // 3. Update Drones & Explosions
    if (this.drones) {
      this.drones.update(delta, this.camera);
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.drones) {
      this.drones.clear();
    }
    this.laserBeams.forEach((b) => this.scene.remove(b.mesh));
    this.laserBeams = [];

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

