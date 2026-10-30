import * as THREE from 'three';

/**
 * Meteor3DScene — Orbital Defense Space Perimeter & Laser Turret
 * ==============================================================
 * Deep space environment with planetary curve, defense grid,
 * pivoting laser cannon turret, and laser beam strikes.
 */
export class Meteor3DScene {
  constructor(container) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03030a);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 200);
    this.camera.position.set(0, 2.0, 15.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 4. Lighting & Environment
    this.setupEnvironment();

    // 5. Orbital Laser Turret
    this.setupTurret();

    // Active laser beams array
    this.activeBeams = [];
    this.shakeIntensity = 0;
  }

  setupEnvironment() {
    // Ambient starlight
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.2);
    this.scene.add(ambientLight);

    // Distant star sun
    const dirLight = new THREE.DirectionalLight(0xa5b4fc, 1.5);
    dirLight.position.set(20, 25, 10);
    this.scene.add(dirLight);

    // Starfield Particle Cloud
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 80;
      starPos[i + 1] = (Math.random() - 0.5) * 60;
      starPos[i + 2] = -15 - Math.random() * 40;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // Planetary Atmosphere Rim (Lower curve)
    const planetGeo = new THREE.SphereGeometry(32, 32, 16);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.7,
      metalness: 0.2,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(0, -36.5, -5);
    this.scene.add(planet);

    // Planetary Atmosphere Glow Horizon
    const glowGeo = new THREE.RingGeometry(31.8, 33.2, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const atmGlow = new THREE.Mesh(glowGeo, glowMat);
    atmGlow.position.set(0, -36.5, -4.5);
    this.scene.add(atmGlow);

    // Defensive Energy Grid Barrier Line at Y = -4.5
    const shieldGeo = new THREE.PlaneGeometry(24, 0.25);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    this.shieldLine = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldLine.position.set(0, -4.5, 0);
    this.scene.add(this.shieldLine);

    // Shield Grid Honeycomb Grid Plane
    const gridGeo = new THREE.PlaneGeometry(24, 2.5);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0, -5.6, 0);
    this.scene.add(gridMesh);
  }

  setupTurret() {
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.set(0, -5.2, 1.0);

    // Turret Base
    const baseGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.4, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    this.turretGroup.add(base);

    // Pivoting Cannon Mount
    this.cannonPivot = new THREE.Group();
    this.cannonPivot.position.y = 0.3;
    this.turretGroup.add(this.cannonPivot);

    const cannonGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.2, 12);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    });
    const cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.position.y = 0.6;
    this.cannonPivot.add(cannon);

    this.scene.add(this.turretGroup);
  }

  aimTurretAt(targetPos) {
    if (!this.cannonPivot || !targetPos) return;
    const dx = targetPos.x - this.turretGroup.position.x;
    const dy = targetPos.y - this.turretGroup.position.y;
    const angle = Math.atan2(dx, dy);
    this.cannonPivot.rotation.z = -angle;
  }

  fireLaserAt(targetPos) {
    const muzzlePos = new THREE.Vector3(0, -4.6, 1.0);
    const dir = new THREE.Vector3().subVectors(targetPos, muzzlePos);
    const length = dir.length();

    // Laser Beam Geometry
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);

    // Position & orient beam midway between muzzle and target
    const midPos = new THREE.Vector3().addVectors(muzzlePos, targetPos).multiplyScalar(0.5);
    beam.position.copy(midPos);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

    this.scene.add(beam);
    this.activeBeams.push({ mesh: beam, life: 0.15 });

    // Aim turret at target
    this.aimTurretAt(targetPos);
  }

  triggerShake(intensity = 0.4) {
    this.shakeIntensity = intensity;
  }

  update(dt) {
    // Stars rotation
    if (this.stars) {
      this.stars.rotation.y += dt * 0.015;
    }

    // Shield line pulse
    if (this.shieldLine) {
      this.shieldLine.material.opacity = 0.7 + Math.sin(Date.now() * 0.008) * 0.25;
    }

    // Camera trauma shake
    if (this.shakeIntensity > 0.01) {
      this.camera.position.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y = 2.0 + (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.0);
    } else {
      this.camera.position.set(0, 2.0, 15.5);
    }

    // Active laser beams decay
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const b = this.activeBeams[i];
      b.life -= dt;
      b.mesh.material.opacity = b.life / 0.15;
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.activeBeams.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
