import * as THREE from 'three';

/**
 * Warrior3DEnvironment.js — Atmospheric Dark Fantasy Arena Stages & Lighting
 * =========================================================================
 * Stages:
 * 1. Cursed Forest: Gnarled ancient trees, mossy stone ground, glowing spirit wisps, slate-cyan fog.
 * 2. Dark Castle: Weathered gothic stone flagstones, iron braziers with burning fire, blood-moon lighting.
 * 3. Infernal Fortress: Volcanic basalt columns, obsidian floor with glowing lava cracks, rising ember particles.
 */
export class Warrior3DEnvironment {
  constructor(scene, stageType = 'cursed_forest') {
    this.scene = scene;
    this.stageType = stageType;
    this.group = new THREE.Group();
    this.arenaRadius = 26.0; // Circular arena boundary

    // Particles and lights
    this.particles = null;
    this.torches = [];
    this.time = 0;

    this.scene.add(this.group);
    this.buildStage(stageType);
  }

  buildStage(type) {
    this.clear();
    this.stageType = type;

    switch (type) {
      case 'dark_castle':
        this.buildDarkCastle();
        break;
      case 'infernal_fortress':
        this.buildInfernalFortress();
        break;
      case 'cursed_forest':
      default:
        this.buildCursedForest();
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
   * STAGE 1: Cursed Forest
   */
  buildCursedForest() {
    this.scene.background = new THREE.Color(0x060e17);
    this.scene.fog = new THREE.FogExp2(0x060e17, 0.022);

    // Moonlight & Ambient
    const ambient = new THREE.AmbientLight(0x1e293b, 0.6);
    this.group.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    moonLight.position.set(20, 35, 15);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 80;
    const d = 30;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    this.group.add(moonLight);

    // Forest Arena Floor: Mossy Dark Stone
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.88,
      metalness: 0.12,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Runic Boundary Stones & Gnarled Trees around perimeter
    const numPerimeter = 28;
    for (let i = 0; i < numPerimeter; i++) {
      const angle = (i / numPerimeter) * Math.PI * 2;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;

      if (i % 2 === 0) {
        // Gnarled Tree
        this.createDarkTree(x, z);
      } else {
        // Ancient Runic Monolith
        this.createRunicStone(x, z, 0x38bdf8);
      }
    }

    // Floating Spirit Wisps / Forest Fireflies
    this.createAtmosphericParticles(150, 0x38bdf8, 0.12);
  }

  /**
   * STAGE 2: Dark Castle
   */
  buildDarkCastle() {
    this.scene.background = new THREE.Color(0x0f0b14);
    this.scene.fog = new THREE.FogExp2(0x0f0b14, 0.024);

    const ambient = new THREE.AmbientLight(0x2d1b38, 0.5);
    this.group.add(ambient);

    const bloodMoon = new THREE.DirectionalLight(0xe11d48, 1.4);
    bloodMoon.position.set(-25, 40, -15);
    bloodMoon.castShadow = true;
    this.group.add(bloodMoon);

    // Weathered Castle Flagstones
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Castle Battlements & Iron Braziers
    const numPillars = 18;
    for (let i = 0; i < numPillars; i++) {
      const angle = (i / numPillars) * Math.PI * 2;
      const x = Math.cos(angle) * this.arenaRadius;
      const z = Math.sin(angle) * this.arenaRadius;

      // Stone Bastion Column
      const colGeo = new THREE.BoxGeometry(2.4, 7.5, 2.4);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 3.5, z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      // Flaming Iron Brazier on alternate columns
      if (i % 3 === 0) {
        this.createFlamingBrazier(x * 0.92, z * 0.92, 0xf97316);
      }
    }

    // Atmospheric embers
    this.createAtmosphericParticles(180, 0xf97316, 0.15);
  }

  /**
   * STAGE 3: Infernal Fortress
   */
  buildInfernalFortress() {
    this.scene.background = new THREE.Color(0x1a0606);
    this.scene.fog = new THREE.FogExp2(0x1a0606, 0.026);

    const ambient = new THREE.AmbientLight(0x450a0a, 0.7);
    this.group.add(ambient);

    const infernalSun = new THREE.DirectionalLight(0xf97316, 1.3);
    infernalSun.position.set(15, 30, -20);
    infernalSun.castShadow = true;
    this.group.add(infernalSun);

    // Obsidian Arena with glowing magma under-ring
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius + 2, this.arenaRadius + 2, 0.8, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.5,
      metalness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Magma Perimeter Ring
    const lavaGeo = new THREE.RingGeometry(this.arenaRadius - 0.5, this.arenaRadius + 3.0, 48);
    const lavaMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = -0.15;
    this.group.add(lava);

    // Volcanic Basalt Pillars
    const numBasalt = 24;
    for (let i = 0; i < numBasalt; i++) {
      const angle = (i / numBasalt) * Math.PI * 2;
      const x = Math.cos(angle) * (this.arenaRadius + 1.2);
      const z = Math.sin(angle) * (this.arenaRadius + 1.2);
      const h = 5.0 + Math.random() * 4.0;

      const basaltGeo = new THREE.CylinderGeometry(0.8, 1.2, h, 6);
      const basaltMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.6,
        metalness: 0.4,
      });
      const pillar = new THREE.Mesh(basaltGeo, basaltMat);
      pillar.position.set(x, h * 0.5 - 0.2, z);
      pillar.castShadow = true;
      this.group.add(pillar);
    }

    // Rising volcanic ash and fire embers
    this.createAtmosphericParticles(220, 0xef4444, 0.18, true);
  }

  createDarkTree(x, z) {
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 5.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2.5, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    trunk.rotation.x = (Math.random() - 0.5) * 0.25;
    trunk.castShadow = true;
    this.group.add(trunk);

    // Twisted Foliage Canopy
    const leavesGeo = new THREE.DodecahedronGeometry(2.2, 1);
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.9,
    });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, 5.2, z);
    leaves.castShadow = true;
    this.group.add(leaves);
  }

  createRunicStone(x, z, glowHex) {
    const stoneGeo = new THREE.BoxGeometry(1.2, 4.0, 0.8);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(x, 2.0, z);
    stone.rotation.y = Math.atan2(x, z);
    stone.castShadow = true;
    this.group.add(stone);

    // Runic Glowing Inlay
    const runeGeo = new THREE.PlaneGeometry(0.35, 1.8);
    const runeMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(x * 0.97, 2.0, z * 0.97);
    rune.rotation.y = Math.atan2(x, z) + Math.PI;
    this.group.add(rune);
  }

  createFlamingBrazier(x, z, flameHex) {
    // Metal pedestal
    const bowlGeo = new THREE.CylinderGeometry(0.6, 0.35, 1.4, 8);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.3 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(x, 0.7, z);
    this.group.add(bowl);

    // Flame Core
    const flameGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: flameHex });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, 1.6, z);
    this.group.add(flame);

    // Dynamic Torch Light
    const light = new THREE.PointLight(flameHex, 1.4, 12, 1.8);
    light.position.set(x, 2.1, z);
    this.group.add(light);

    this.torches.push({ light, flame, baseIntensity: 1.4, baseScaleY: 1.0 });
  }

  createAtmosphericParticles(count, colorHex, size, riseFast = false) {
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
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.particlesRiseFast = riseFast;
    this.group.add(this.particles);
  }

  /**
   * Boundary clamp utility
   */
  clampPosition(pos, characterRadius = 0.6) {
    const maxR = this.arenaRadius - characterRadius;
    const currentR = Math.hypot(pos.x, pos.z);
    if (currentR > maxR) {
      const angle = Math.atan2(pos.z, pos.x);
      pos.x = Math.cos(angle) * maxR;
      pos.z = Math.sin(angle) * maxR;
      return true; // Clamped
    }
    return false;
  }

  /**
   * Per-frame animation update
   */
  update(delta) {
    this.time += delta;

    // Torch light flicker
    for (let i = 0; i < this.torches.length; i++) {
      const t = this.torches[i];
      const flicker = Math.sin(this.time * 9.0 + i * 2.1) * 0.25 + Math.cos(this.time * 15.0 + i) * 0.15;
      t.light.intensity = t.baseIntensity + flicker;
      t.flame.scale.y = 1.0 + flicker * 0.35;
    }

    // Atmospheric particles floating
    if (this.particles && this.particles.geometry) {
      const pos = this.particles.geometry.attributes.position;
      const speed = this.particlesRiseFast ? 1.4 : 0.45;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * speed;
        if (y > 9.0) y = 0.5;
        pos.setY(i, y);

        // Gentle drift
        const x = pos.getX(i) + Math.sin(this.time + i) * delta * 0.2;
        const z = pos.getZ(i) + Math.cos(this.time + i) * delta * 0.2;
        pos.setX(i, x);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }
  }
}
