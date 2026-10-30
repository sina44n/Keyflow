import * as THREE from 'three';

/**
 * 3D Slice Effects System for Key Ninja
 * =====================================
 * Generates:
 * 1. 3D Katana Light Blade Slash Ribbon (dynamic luminous cutting plane)
 * 2. 3D Particle Spark & Ember Bursts (radiating spark physics under gravity)
 */
export class Ninja3DSliceEffects {
  constructor(scene) {
    this.scene = scene;
    this.activeSlashes = [];
    this.activeParticleSystems = [];

    // Shared geometry and materials for high-efficiency batching
    this.sparkGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    this.sparkMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xffffff }), // Core white spark
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }), // Radiant gold
      new THREE.MeshBasicMaterial({ color: 0xf43f5e }), // Crimson slash
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), // Energy cyan
    ];
  }

  /**
   * Spawns a glowing 3D Katana light slash ribbon across the sliced position
   */
  spawnKatanaSlash({ position, angle = -Math.PI / 4, length = 6.5, color = 0xf43f5e }) {
    const slashGroup = new THREE.Group();
    slashGroup.position.copy(position);
    slashGroup.rotation.z = angle;

    // Glowing core blade beam
    const coreGeo = new THREE.PlaneGeometry(length, 0.14);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    slashGroup.add(coreMesh);

    // Outer luminous energy aura
    const auraGeo = new THREE.PlaneGeometry(length * 1.15, 0.55);
    const auraMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    slashGroup.add(auraMesh);

    this.scene.add(slashGroup);

    this.activeSlashes.push({
      group: slashGroup,
      coreMat,
      auraMat,
      coreGeo,
      auraGeo,
      life: 1.0,
      decay: 5.5, // Dies in ~180ms
    });
  }

  /**
   * Spawns an explosion of 35-50 glowing 3D spark particles from the slice point
   */
  spawnSparkBurst({ position, count = 38 }) {
    const particles = [];
    const container = new THREE.Group();
    container.position.copy(position);

    for (let i = 0; i < count; i++) {
      const mat = this.sparkMaterials[Math.floor(Math.random() * this.sparkMaterials.length)];
      const mesh = new THREE.Mesh(this.sparkGeometry, mat);

      // Random spherical velocity with upward bias
      const speed = 4.0 + Math.random() * 8.5;
      const phi = Math.random() * Math.PI * 2;
      const theta = (Math.random() - 0.3) * Math.PI; // Upward bias

      const vx = Math.cos(phi) * Math.cos(theta) * speed;
      const vy = Math.abs(Math.sin(theta)) * speed + 2.0;
      const vz = (Math.random() - 0.5) * 4.0;

      const scale = 0.6 + Math.random() * 0.9;
      mesh.scale.set(scale, scale, scale);

      container.add(mesh);

      particles.push({
        mesh,
        vx,
        vy,
        vz,
        rotX: (Math.random() - 0.5) * 10,
        rotY: (Math.random() - 0.5) * 10,
        scale,
      });
    }

    this.scene.add(container);

    this.activeParticleSystems.push({
      container,
      particles,
      life: 1.0,
      decay: 2.2, // ~450ms
    });
  }

  /**
   * Updates all active slashes and particle systems
   */
  update(dt) {
    // 1. Update Katana Slashes
    for (let i = this.activeSlashes.length - 1; i >= 0; i--) {
      const s = this.activeSlashes[i];
      s.life -= dt * s.decay;

      if (s.life <= 0) {
        this.scene.remove(s.group);
        s.coreGeo.dispose();
        s.coreMat.dispose();
        s.auraGeo.dispose();
        s.auraMat.dispose();
        this.activeSlashes.splice(i, 1);
      } else {
        s.coreMat.opacity = Math.max(0, s.life);
        s.auraMat.opacity = Math.max(0, s.life * 0.85);
        // Expand length slightly as it slashes
        s.group.scale.x = 1.0 + (1.0 - s.life) * 0.4;
      }
    }

    // 2. Update Spark Particles
    for (let i = this.activeParticleSystems.length - 1; i >= 0; i--) {
      const ps = this.activeParticleSystems[i];
      ps.life -= dt * ps.decay;

      if (ps.life <= 0) {
        this.scene.remove(ps.container);
        this.activeParticleSystems.splice(i, 1);
      } else {
        const gravity = 22.0;
        ps.particles.forEach((p) => {
          p.vy -= gravity * dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;

          const currentScale = Math.max(0, p.scale * ps.life);
          p.mesh.scale.set(currentScale, currentScale, currentScale);
        });
      }
    }
  }

  dispose() {
    this.activeSlashes.forEach((s) => {
      this.scene.remove(s.group);
      s.coreGeo.dispose();
      s.coreMat.dispose();
      s.auraGeo.dispose();
      s.auraMat.dispose();
    });
    this.activeSlashes = [];

    this.activeParticleSystems.forEach((ps) => {
      this.scene.remove(ps.container);
    });
    this.activeParticleSystems = [];

    this.sparkGeometry.dispose();
    this.sparkMaterials.forEach((m) => m.dispose());
  }
}
