import * as THREE from 'three';

/**
 * 6 Distinct Visual Nitro Particle & Mesh Systems for Supercars
 * 1. Fire Nitro (blazing fiery orange/red exhaust jet + smoke embers)
 * 2. Star Nitro (radiant golden starburst sparkles + shimmering trail)
 * 3. Electric Nitro (pulsing cyan lightning arcs + high-voltage sparks)
 * 4. Plasma Nitro (magenta/purple glowing plasma energy orbs + vortex rings)
 * 5. Cosmic Nitro (color-shifting rainbow nebula stardust)
 * 6. Neon Nitro (ultra-bright lime/cyan cyber laser ribbons)
 */

export const NITRO_STYLES = [
  {
    id: 'fire',
    name: 'Firestorm Flame',
    color: '#FF4500',
    accentColor: '#FFD700',
    description: 'Roaring twin combustion flame jets with glowing fiery smoke embers.',
    badge: 'Classic Heat',
  },
  {
    id: 'star',
    name: 'Starlight Surge',
    color: '#F59E0B',
    accentColor: '#FEF08A',
    description: 'Radiant golden starburst emitter casting shimmering constellation dust.',
    badge: 'Solar Glow',
  },
  {
    id: 'electric',
    name: 'Lightning Bolt',
    color: '#06B6D4',
    accentColor: '#E0F2FE',
    description: 'High-voltage electric arcs discharging erratic zigzag cyan lightning bolts.',
    badge: 'Voltage Overdrive',
  },
  {
    id: 'plasma',
    name: 'Plasma Vortex',
    color: '#A855F7',
    accentColor: '#F472B6',
    description: 'Concentrated magenta and violet plasma orbs with energetic shockwave rings.',
    badge: 'Dark Matter',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    color: '#EC4899',
    accentColor: '#6366F1',
    description: 'Multichrome rainbow nebula stardust trail with oscillating color spectrum.',
    badge: 'Deep Space',
  },
  {
    id: 'neon',
    name: 'Cyber Neon Stream',
    color: '#10B981',
    accentColor: '#22D3EE',
    description: 'Hyper-saturated green and cyan trailing laser ribbons with high-tech glow.',
    badge: 'Cyberpunk Grid',
  },
];

export class NitroEffectController {
  constructor({ scene, parentGroup, style = 'fire', isPlayer = false }) {
    this.scene = scene;
    this.parentGroup = parentGroup;
    this.style = style;
    this.isPlayer = isPlayer;
    this.active = false;
    this.group = new THREE.Group();
    this.group.name = `nitro_${style}`;
    this.parentGroup.add(this.group);

    this.particles = [];
    this.rings = [];
    this.initStyle();
  }

  setStyle(newStyle) {
    if (this.style === newStyle) return;
    this.dispose();
    this.style = newStyle;
    this.group = new THREE.Group();
    this.group.name = `nitro_${newStyle}`;
    this.parentGroup.add(this.group);
    this.initStyle();
  }

  initStyle() {
    this.particles = [];
    this.rings = [];

    switch (this.style) {
      case 'star':
        this._buildStarEmitter();
        break;
      case 'electric':
        this._buildElectricEmitter();
        break;
      case 'plasma':
        this._buildPlasmaEmitter();
        break;
      case 'cosmic':
        this._buildCosmicEmitter();
        break;
      case 'neon':
        this._buildNeonEmitter();
        break;
      case 'fire':
      default:
        this._buildFireEmitter();
        break;
    }
  }

  // --- 1. FIRE NITRO ---
  _buildFireEmitter() {
    // Twin conical flame meshes positioned at exhaust tips
    const positions = [
      { y: 0.38, z: -0.55 },
      { y: 0.38, z: 0.55 },
    ];

    this.jets = positions.map((pos) => {
      const jetGroup = new THREE.Group();
      jetGroup.position.set(-2.2, pos.y, pos.z);

      // Core white flame
      const innerGeo = new THREE.ConeGeometry(0.12, 1.2, 12);
      innerGeo.rotateZ(Math.PI / 2);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.position.set(-0.6, 0, 0);
      jetGroup.add(innerMesh);

      // Outer orange/red flame
      const outerGeo = new THREE.ConeGeometry(0.28, 2.2, 12);
      outerGeo.rotateZ(Math.PI / 2);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      outerMesh.position.set(-1.1, 0, 0);
      jetGroup.add(outerMesh);

      this.group.add(jetGroup);
      return { group: jetGroup, inner: innerMesh, outer: outerMesh };
    });

    // Particle embers (30 particles)
    const particleGeo = new THREE.BufferGeometry();
    const count = 36;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      posArray[i] = -2.2 - Math.random() * 2.5;
      posArray[i + 1] = 0.38 + (Math.random() - 0.5) * 0.4;
      posArray[i + 2] = (Math.random() - 0.5) * 1.4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.32,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.particleMesh = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.particleMesh);
  }

  // --- 2. STAR NITRO ---
  _buildStarEmitter() {
    const count = 48;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(0xf59e0b);
    const c2 = new THREE.Color(0xfef08a);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = -2.2 - Math.random() * 3.5;
      pos[i * 3 + 1] = 0.38 + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;

      const mixed = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.starField = new THREE.Points(geo, mat);
    this.group.add(this.starField);

    // Golden halo orbs at exhausts
    [-0.55, 0.55].forEach((z) => {
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 })
      );
      halo.position.set(-2.2, 0.38, z);
      this.group.add(halo);
    });
  }

  // --- 3. ELECTRIC NITRO ---
  _buildElectricEmitter() {
    this.lightningBolts = [];
    [-0.55, 0.55].forEach((z) => {
      const curvePoints = [];
      const segments = 8;
      for (let i = 0; i <= segments; i++) {
        const x = -2.2 - (i / segments) * 2.8;
        const y = 0.38 + (Math.random() - 0.5) * 0.3;
        const offsetZ = z + (Math.random() - 0.5) * 0.3;
        curvePoints.push(new THREE.Vector3(x, y, offsetZ));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.group.add(line);
      this.lightningBolts.push({ line, baseZ: z });
    });

    // Cyan sparks
    const count = 30;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pPos[i] = -2.2 - Math.random() * 2.5;
      pPos[i + 1] = 0.38 + (Math.random() - 0.5) * 0.5;
      pPos[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.electricSparks = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.28,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.electricSparks);
  }

  // --- 4. PLASMA NITRO ---
  _buildPlasmaEmitter() {
    this.plasmaRings = [];
    [-0.55, 0.55].forEach((z) => {
      for (let r = 0; r < 3; r++) {
        const ringGeo = new THREE.TorusGeometry(0.18 + r * 0.12, 0.04, 8, 20);
        ringGeo.rotateY(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: r % 2 === 0 ? 0xa855f7 : 0xf472b6,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(-2.2 - r * 0.7, 0.38, z);
        this.group.add(ringMesh);
        this.plasmaRings.push(ringMesh);
      }
    });

    // Central violet core
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      transparent: true,
      opacity: 0.85,
    });
    [-0.55, 0.55].forEach((z) => {
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), coreMat);
      core.position.set(-2.2, 0.38, z);
      this.group.add(core);
    });
  }

  // --- 5. COSMIC NITRO ---
  _buildCosmicEmitter() {
    const count = 64;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xec4899),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0x10b981),
      new THREE.Color(0xf59e0b),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = -2.2 - Math.random() * 4.0;
      pos[i * 3 + 1] = 0.38 + (Math.random() - 0.5) * 0.7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      const col = palette[i % palette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.cosmicPoints = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.38,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.cosmicPoints);
  }

  // --- 6. NEON NITRO ---
  _buildNeonEmitter() {
    this.neonRibbons = [];
    const positions = [
      { y: 0.38, z: -0.55, col: 0x10b981 },
      { y: 0.38, z: 0.55, col: 0x22d3ee },
    ];

    positions.forEach((p) => {
      // Cylindrical neon laser beam
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.22, 2.6, 12);
      beamGeo.rotateZ(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: p.col,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(-3.5, p.y, p.z);
      this.group.add(beamMesh);
      this.neonRibbons.push(beamMesh);
    });
  }

  update(dt, isNitroActive, currentSpeed = 0) {
    this.active = isNitroActive;
    this.group.visible = isNitroActive;
    if (!isNitroActive) return;

    const flicker = 0.85 + Math.random() * 0.3;

    if (this.style === 'fire' && this.jets) {
      this.jets.forEach((j) => {
        j.inner.scale.set(flicker * 1.6, flicker * 1.6, flicker);
        j.outer.scale.set(flicker * 2.2, flicker * 2.2, flicker);
      });
      if (this.particleMesh) {
        const attr = this.particleMesh.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          let x = attr.getX(i) - (currentSpeed * 0.8 + 8) * dt;
          if (x < -5.5) x = -2.2 - Math.random() * 0.5;
          attr.setX(i, x);
        }
        attr.needsUpdate = true;
      }
    } else if (this.style === 'star' && this.starField) {
      const attr = this.starField.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        let x = attr.getX(i) - (currentSpeed * 0.9 + 10) * dt;
        if (x < -6.5) x = -2.2 - Math.random() * 0.5;
        attr.setX(i, x);
      }
      attr.needsUpdate = true;
    } else if (this.style === 'electric' && this.lightningBolts) {
      this.lightningBolts.forEach((bolt) => {
        const pts = [];
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
          const x = -2.2 - (i / segments) * 3.2;
          const y = 0.38 + (Math.random() - 0.5) * 0.45;
          const z = bolt.baseZ + (Math.random() - 0.5) * 0.45;
          pts.push(new THREE.Vector3(x, y, z));
        }
        bolt.line.geometry.setFromPoints(pts);
      });
    } else if (this.style === 'plasma' && this.plasmaRings) {
      this.plasmaRings.forEach((r, idx) => {
        r.rotation.x += dt * (5 + idx * 2);
        r.scale.setScalar(0.9 + Math.sin(Date.now() * 0.01 + idx) * 0.25);
      });
    } else if (this.style === 'cosmic' && this.cosmicPoints) {
      const attr = this.cosmicPoints.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        let x = attr.getX(i) - (currentSpeed * 0.85 + 12) * dt;
        if (x < -7.0) x = -2.2 - Math.random() * 0.5;
        attr.setX(i, x);
      }
      attr.needsUpdate = true;
    } else if (this.style === 'neon' && this.neonRibbons) {
      this.neonRibbons.forEach((b) => {
        b.scale.x = flicker * 1.4;
      });
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.parentGroup.remove(this.group);
  }
}

