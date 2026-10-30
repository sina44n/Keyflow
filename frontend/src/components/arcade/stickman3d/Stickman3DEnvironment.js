import * as THREE from 'three';

/**
 * Stickman3DEnvironment.js — Cinematic 3D Red Forest Battlefield & Atmosphere
 * ===========================================================================
 * Creates the dark red forest battlefield directly inspired by Reference Image B:
 * - Blood-crimson atmospheric fog and dramatic rim lighting
 * - Weathered dark stone arena ground with ancient runic boundary perimeter
 * - Stylized dark silhouettes of ancient gnarled trees and stone monoliths
 * - Floating atmospheric embers and emerald spirit fireflies (matching character eyes)
 * - Progressive thematic stages: Red Cursed Forest -> Dark Ancient Battlefield -> Infernal Arena
 */
export class Stickman3DEnvironment {
  constructor(scene, stageType = 'red_forest') {
    this.scene = scene;
    this.stageType = stageType;
    this.group = new THREE.Group();
    this.arenaRadius = 25.0; // Circular arena boundary

    this.particles = null;
    this.fireflies = null;
    this.torches = [];
    this.time = 0;

    this.scene.add(this.group);
    this.buildStage(stageType);
  }

  buildStage(type) {
    this.clear();
    this.stageType = type;

    switch (type) {
      case 'infernal_arena':
        this.buildInfernalArena();
        break;
      case 'dark_battlefield':
        this.buildDarkBattlefield();
        break;
      case 'red_forest':
      default:
        this.buildRedForest();
        break;
    }
  }

  clear() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
    this.torches = [];
  }

  /**
   * STAGE 1: Red Cursed Forest (Reference Image B primary visual atmosphere)
   */
  buildRedForest() {
    this.scene.background = new THREE.Color(0x140505);
    this.scene.fog = new THREE.FogExp2(0x140505, 0.024);

    // Red ambient & dramatic moon directional light
    const ambient = new THREE.AmbientLight(0x450a0a, 0.7);
    this.group.add(ambient);

    const rimLight = new THREE.DirectionalLight(0xef4444, 1.4);
    rimLight.position.set(18, 30, 20);
    rimLight.castShadow = true;
    rimLight.shadow.mapSize.width = 1024;
    rimLight.shadow.mapSize.height = 1024;
    rimLight.shadow.camera.near = 0.5;
    rimLight.shadow.camera.far = 70;
    const d = 28;
    rimLight.shadow.camera.left = -d;
    rimLight.shadow.camera.right = d;
    rimLight.shadow.camera.top = d;
    rimLight.shadow.camera.bottom = -d;
    this.group.add(rimLight);

    // Contrasting emerald cold accent light (matching stickman energy blades)
    const accentLight = new THREE.DirectionalLight(0x22c55e, 0.6);
    accentLight.position.set(-20, 25, -15);
    this.group.add(accentLight);

    // Arena Floor: Dark Weathered Slate Stone
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Glowing Crimson Runic Perimeter Ring
    const ringGeo = new THREE.RingGeometry(this.arenaRadius - 0.3, this.arenaRadius + 0.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);

    // Gnarled Silhouette Forest Trees & Ancient Runic Monoliths around edge
    const count = 26;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;

      if (i % 2 === 0) {
        this.createSilhouetteTree(x, z);
      } else {
        this.createRunicSpire(x, z, 0xef4444);
      }
    }

    // Floating Crimson Embers and Emerald Fireflies (Reference B particles)
    this.createAtmosphericEmbers(160, 0xef4444, 0.14);
    this.createEmeraldFireflies(75, 0x22c55e, 0.12);
  }

  /**
   * STAGE 2: Dark Ancient Battlefield (Waves 3-4)
   */
  buildDarkBattlefield() {
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.025);

    const ambient = new THREE.AmbientLight(0x1e1b4b, 0.6);
    this.group.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x818cf8, 1.3);
    moonLight.position.set(-22, 35, 18);
    moonLight.castShadow = true;
    this.group.add(moonLight);

    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.75,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ruined Fortress Pillars & Ancient Battle Braziers
    const pillars = 18;
    for (let i = 0; i < pillars; i++) {
      const angle = (i / pillars) * Math.PI * 2;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;

      const colGeo = new THREE.BoxGeometry(1.8, 6.5, 1.8);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 3.0, z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      if (i % 3 === 0) {
        this.createBrazier(x * 0.92, z * 0.92, 0x6366f1);
      }
    }

    this.createAtmosphericEmbers(180, 0x818cf8, 0.15);
  }

  /**
   * STAGE 3: Infernal Arena (Wave 5 Boss)
   */
  buildInfernalArena() {
    this.scene.background = new THREE.Color(0x1f0404);
    this.scene.fog = new THREE.FogExp2(0x1f0404, 0.028);

    const ambient = new THREE.AmbientLight(0x5c0909, 0.8);
    this.group.add(ambient);

    const infernalSun = new THREE.DirectionalLight(0xf97316, 1.5);
    infernalSun.position.set(16, 32, -18);
    infernalSun.castShadow = true;
    this.group.add(infernalSun);

    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.5,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Glowing Lava Magma Outer Chasm
    const lavaGeo = new THREE.RingGeometry(this.arenaRadius - 0.4, this.arenaRadius + 3.5, 48);
    const lavaMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = -0.15;
    this.group.add(lava);

    // Basalt Spires
    const spires = 22;
    for (let i = 0; i < spires; i++) {
      const angle = (i / spires) * Math.PI * 2;
      const x = Math.cos(angle) * (this.arenaRadius + 1.2);
      const z = Math.sin(angle) * (this.arenaRadius + 1.2);
      const h = 6.0 + Math.random() * 3.5;

      const spireGeo = new THREE.CylinderGeometry(0.6, 1.1, h, 6);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(x, h * 0.5 - 0.2, z);
      spire.castShadow = true;
      this.group.add(spire);
    }

    this.createAtmosphericEmbers(240, 0xef4444, 0.18, true);
  }

  createSilhouetteTree(x, z) {
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 5.2, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x140505, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2.3, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.22;
    trunk.rotation.x = (Math.random() - 0.5) * 0.22;
    trunk.castShadow = true;
    this.group.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(2.0, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e0606, roughness: 0.9 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(x, 4.8, z);
    foliage.castShadow = true;
    this.group.add(foliage);
  }

  createRunicSpire(x, z, glowHex) {
    const spireGeo = new THREE.BoxGeometry(1.0, 3.8, 0.7);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(x, 1.9, z);
    spire.rotation.y = Math.atan2(x, z);
    spire.castShadow = true;
    this.group.add(spire);

    // Glowing Runic Inlay
    const runeGeo = new THREE.PlaneGeometry(0.28, 1.6);
    const runeMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(x * 0.97, 1.9, z * 0.97);
    rune.rotation.y = Math.atan2(x, z) + Math.PI;
    this.group.add(rune);
  }

  createBrazier(x, z, flameHex) {
    const bowlGeo = new THREE.CylinderGeometry(0.55, 0.3, 1.2, 8);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(x, 0.6, z);
    this.group.add(bowl);

    const flameGeo = new THREE.ConeGeometry(0.32, 0.8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: flameHex });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, 1.4, z);
    this.group.add(flame);

    const light = new THREE.PointLight(flameHex, 1.2, 10, 1.8);
    light.position.set(x, 1.8, z);
    this.group.add(light);

    this.torches.push({ light, flame, baseIntensity: 1.2 });
  }

  createAtmosphericEmbers(count, colorHex, size, fast = false) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * (this.arenaRadius - 1.0);
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.particlesRiseFast = fast;
    this.group.add(this.particles);
  }

  createEmeraldFireflies(count, colorHex, size) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * (this.arenaRadius - 2.0);
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.8 + Math.random() * 5.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.group.add(this.fireflies);
  }

  clampPosition(pos, radius = 0.5) {
    const maxR = this.arenaRadius - radius;
    const currentR = Math.hypot(pos.x, pos.z);
    if (currentR > maxR) {
      const angle = Math.atan2(pos.z, pos.x);
      pos.x = Math.cos(angle) * maxR;
      pos.z = Math.sin(angle) * maxR;
      return true;
    }
    return false;
  }

  update(delta) {
    this.time += delta;

    // Torches
    for (let i = 0; i < this.torches.length; i++) {
      const t = this.torches[i];
      const flicker = Math.sin(this.time * 8.0 + i * 2.0) * 0.2;
      t.light.intensity = t.baseIntensity + flicker;
      t.flame.scale.y = 1.0 + flicker * 0.3;
    }

    // Embers
    if (this.particles && this.particles.geometry) {
      const pos = this.particles.geometry.attributes.position;
      const speed = this.particlesRiseFast ? 1.6 : 0.55;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * speed;
        if (y > 9.0) y = 0.5;
        pos.setY(i, y);

        const x = pos.getX(i) + Math.sin(this.time + i) * delta * 0.25;
        const z = pos.getZ(i) + Math.cos(this.time + i) * delta * 0.25;
        pos.setX(i, x);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    // Emerald Fireflies gentle dancing
    if (this.fireflies && this.fireflies.geometry) {
      const pos = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + Math.sin(this.time * 1.5 + i) * delta * 0.3;
        const y = pos.getY(i) + Math.cos(this.time * 2.0 + i) * delta * 0.2;
        const z = pos.getZ(i) + Math.sin(this.time * 1.8 + i) * delta * 0.3;
        pos.setX(i, x);
        pos.setY(i, Math.max(0.6, Math.min(6.5, y)));
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }
  }
}
