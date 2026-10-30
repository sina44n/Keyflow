import * as THREE from 'three';

/**
 * High-DPI Dynamic Canvas Texture for Floating Meteor Word Plaques
 */
function createWordCanvasTexture(text, typedCount = 0, isTargeted = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  drawWordOnCanvas(ctx, canvas.width, canvas.height, text, typedCount, isTargeted);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { canvas, ctx, texture };
}

function drawWordOnCanvas(ctx, width, height, text, typedCount, isTargeted) {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = isTargeted ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = isTargeted ? 16 : 8;

  // Plaque body
  const grad = ctx.createLinearGradient(0, 12, 0, height - 12);
  if (isTargeted) {
    grad.addColorStop(0, 'rgba(69, 10, 10, 0.98)');
    grad.addColorStop(1, 'rgba(20, 5, 5, 0.98)');
  } else {
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.94)');
  }
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(14, 14, width - 28, height - 28, 16);
  ctx.fill();

  // Border
  ctx.lineWidth = isTargeted ? 4 : 2;
  ctx.strokeStyle = isTargeted ? '#EF4444' : '#64748B';
  ctx.stroke();

  // Target lock reticle corners if locked on
  if (isTargeted) {
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    const cornerSize = 18;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(8, 8 + cornerSize); ctx.lineTo(8, 8); ctx.lineTo(8 + cornerSize, 8);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 8 - cornerSize, 8); ctx.lineTo(width - 8, 8); ctx.lineTo(width - 8, 8 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(8, height - 8 - cornerSize); ctx.lineTo(8, height - 8); ctx.lineTo(8 + cornerSize, height - 8);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 8 - cornerSize, height - 8); ctx.lineTo(width - 8, height - 8); ctx.lineTo(width - 8, height - 8 - cornerSize);
    ctx.stroke();
  }

  ctx.restore();

  // Draw characters with progressive typing colors
  const fontSize = text.length > 7 ? 46 : 54;
  ctx.font = `900 ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalWidth = ctx.measureText(text).width;
  let startX = width / 2 - totalWidth / 2;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = ctx.measureText(char).width;
    const charCenter = startX + charWidth / 2;

    if (i < typedCount) {
      ctx.fillStyle = '#10B981'; // Green
    } else if (i === typedCount && isTargeted) {
      ctx.fillStyle = '#FBBF24'; // Golden glow
    } else {
      ctx.fillStyle = '#F8FAFC'; // Crisp white
    }

    ctx.fillText(char, charCenter, height / 2);
    startX += charWidth;
  }
}

/**
 * Meteor3DObject — 3D Atmospheric Plasma Asteroid with Floating Plaque
 */
export class Meteor3DObject {
  constructor({ id, text, startX = 0, startY = 12, startZ = 0, speed = 2.5, isArmored = false }) {
    this.id = id;
    this.text = text;
    this.speed = speed;
    this.isArmored = isArmored;
    this.typedCount = 0;
    this.isTargeted = false;
    this.isDestroyed = false;
    this.isDead = false;

    this.group = new THREE.Group();
    this.group.position.set(startX, startY, startZ);

    this.angularVel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );

    this.buildMeteorMesh();
    this.buildWordPlaque();
  }

  buildMeteorMesh() {
    // 1. Deformed Asteroid Core Geometry
    const radius = this.isArmored ? 1.3 : 0.95;
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    const pos = geo.attributes.position;

    // Displace vertices for craggy asteroid appearance
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1 + (Math.sin(vx * 4) + Math.cos(vy * 4) + Math.sin(vz * 4)) * 0.12;
      pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.isArmored ? 0x27272a : 0x451a03,
      emissive: this.isArmored ? 0xd97706 : 0xef4444,
      emissiveIntensity: 0.65,
      roughness: 0.85,
      metalness: 0.35,
    });

    this.coreMesh = new THREE.Mesh(geo, mat);
    this.coreMesh.castShadow = true;
    this.group.add(this.coreMesh);

    // 2. Fiery Re-entry Trail / Plasma Glow
    const glowGeo = new THREE.SphereGeometry(radius * 1.25, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.isArmored ? 0xf59e0b : 0xf97316,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glowMesh);
  }

  buildWordPlaque() {
    const { canvas, ctx, texture } = createWordCanvasTexture(this.text, 0, false);
    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    const plaqueWidth = Math.max(3.2, 1.8 + this.text.length * 0.42);
    const plaqueHeight = 1.05;
    const plaqueGeo = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    this.plaqueMesh.position.set(0, 1.8, 0.4);
    this.group.add(this.plaqueMesh);
  }

  setTypedProgress(count, isTargeted = true) {
    this.typedCount = count;
    this.isTargeted = isTargeted;
    drawWordOnCanvas(this.ctx, this.canvas.width, this.canvas.height, this.text, count, isTargeted);
    this.texture.needsUpdate = true;
  }

  destroyWithExplosion(scene) {
    this.isDestroyed = true;
    this.group.remove(this.plaqueMesh);
    this.group.remove(this.coreMesh);
    this.group.remove(this.glowMesh);

    // Create 12 exploding debris fragments
    this.fragments = [];
    const fragMat = new THREE.MeshBasicMaterial({
      color: this.isArmored ? 0xfbbf24 : 0xf87171,
      transparent: true,
      opacity: 1.0,
    });

    for (let i = 0; i < 12; i++) {
      const fragGeo = new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.2);
      const fragMesh = new THREE.Mesh(fragGeo, fragMat);
      fragMesh.position.copy(this.group.position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8.0,
        (Math.random() - 0.5) * 8.0,
        (Math.random() - 0.5) * 6.0
      );

      scene.add(fragMesh);
      this.fragments.push({ mesh: fragMesh, vel });
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      for (const f of this.fragments) {
        f.mesh.position.addScaledVector(f.vel, 0.035);
        f.mesh.material.opacity = Math.max(0, 1.0 - progress);
        f.mesh.rotation.x += 0.1;
      }

      if (progress >= 1.0) {
        clearInterval(interval);
        for (const f of this.fragments) {
          scene.remove(f.mesh);
          f.mesh.geometry.dispose();
        }
        this.isDead = true;
      }
    }, 25);
  }

  update(dt) {
    if (this.isDestroyed) return;

    // Fall downward toward baseline shield
    this.group.position.y -= this.speed * dt;

    // Tumble rotation
    this.coreMesh.rotation.x += this.angularVel.x * dt;
    this.coreMesh.rotation.y += this.angularVel.y * dt;
    this.coreMesh.rotation.z += this.angularVel.z * dt;

    // Word plaque stays facing camera
    this.plaqueMesh.rotation.set(0, 0, 0);

    // Pulsing plasma glow
    if (this.glowMesh) {
      this.glowMesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.008) * 0.08);
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
  }
}
