import * as THREE from 'three';

/**
 * High-DPI Dynamic Canvas Texture Generator for 3D Flying Words
 * Renders crisp characters with real-time keystroke coloring:
 * - Typed letters: Emerald Green
 * - Target active letter: Bright Golden Glow
 * - Remaining letters: Crisp Bone White
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

function drawWordOnCanvas(ctx, width, height, text, typedCount, isTargeted, isLeftHalf = null) {
  ctx.clearRect(0, 0, width, height);

  // Background plaque style
  ctx.save();
  ctx.shadowColor = isTargeted ? 'rgba(244, 63, 94, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = isTargeted ? 18 : 8;

  // Plaque body with glossy gradient
  const grad = ctx.createLinearGradient(0, 16, 0, height - 16);
  if (isTargeted) {
    grad.addColorStop(0, 'rgba(56, 14, 32, 0.98)');
    grad.addColorStop(1, 'rgba(24, 6, 14, 0.98)');
  } else {
    grad.addColorStop(0, 'rgba(30, 41, 59, 0.96)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(16, 16, width - 32, height - 32, 20);
  ctx.fill();

  // Border
  ctx.lineWidth = isTargeted ? 4 : 2.5;
  ctx.strokeStyle = isTargeted ? '#F43F5E' : '#64748B';
  ctx.stroke();

  // Decorative Japanese accent borders
  ctx.strokeStyle = isTargeted ? 'rgba(251, 113, 133, 0.6)' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.restore();

  // Draw Word Characters with precise horizontal centering
  const fontSize = text.length > 7 ? 50 : 58;
  ctx.font = `900 ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalWidth = ctx.measureText(text).width;
  let startX = (width - totalWidth) / 2;

  ctx.textAlign = 'left';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = ctx.measureText(char).width;

    ctx.save();
    if (i < typedCount) {
      // Completed keystroke: glowing emerald green
      ctx.fillStyle = '#10B981';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 12;
    } else if (i === typedCount && isTargeted) {
      // Next keystroke target: glowing gold / white
      ctx.fillStyle = '#FDE047';
      ctx.shadowColor = '#FACC15';
      ctx.shadowBlur = 18;
    } else {
      // Untyped remaining: radiant white with subtle glow
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8;
    }

    ctx.fillText(char, startX, height / 2 + 2);
    ctx.restore();

    startX += charWidth;
  }
}

/**
 * 3D Word Projectile Entity
 * Manages full 3D physics, targeting auras, and the Fruit Ninja 3D split animation.
 */
export class Ninja3DWordObject {
  constructor({ id, text, startX = 0, startY = -6.8, vx = 0, vy = 20.0, vz = 0, gravity = 14.0 }) {
    this.id = id;
    this.text = text;
    this.gravity = gravity;

    this.position = new THREE.Vector3(startX, startY, (Math.random() - 0.5) * 1.5);
    this.velocity = new THREE.Vector3(vx, vy, vz);
    this.rotation = new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.2);
    this.angularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.5
    );

    this.isTargeted = false;
    this.typedCount = 0;
    this.isSliced = false;
    this.sliceTimer = 0;
    this.isDead = false;

    // 1. Three.js Scene Representation
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Dynamic canvas texture
    const { canvas, ctx, texture } = createWordCanvasTexture(this.text, 0, false);
    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    // Plaque dimensions based on word length
    const plaqueWidth = Math.max(3.6, Math.min(6.2, 2.2 + text.length * 0.45));
    const plaqueHeight = 1.35;
    const plaqueDepth = 0.18;

    this.plaqueWidth = plaqueWidth;
    this.plaqueHeight = plaqueHeight;
    this.plaqueDepth = plaqueDepth;

    // Intact Plaque Geometry
    this.plaqueGeo = new THREE.BoxGeometry(plaqueWidth, plaqueHeight, plaqueDepth);
    this.faceMat = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Multi-material box: front face has canvas texture
    this.intactMesh = new THREE.Mesh(this.plaqueGeo, [
      this.rimMat, // right
      this.rimMat, // left
      this.rimMat, // top
      this.rimMat, // bottom
      this.faceMat, // front (textured)
      this.rimMat, // back
    ]);
    this.intactMesh.castShadow = true;
    this.group.add(this.intactMesh);

    // Target aura ring (visible when locked on)
    const auraGeo = new THREE.RingGeometry(plaqueWidth * 0.55, plaqueWidth * 0.6, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.z = -0.05;
    this.group.add(this.auraMesh);

    // Halves references created upon split
    this.halves = null;
  }

  setTargeted(isTargeted) {
    if (this.isTargeted !== isTargeted) {
      this.isTargeted = isTargeted;
      this.redrawTexture();
      this.auraMesh.material.opacity = isTargeted ? 0.75 : 0;
    }
  }

  setTypedCount(count) {
    this.typedCount = count;
    this.redrawTexture();
  }

  redrawTexture() {
    if (this.isSliced) return;
    drawWordOnCanvas(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.text,
      this.typedCount,
      this.isTargeted
    );
    this.texture.needsUpdate = true;
  }

  /**
   * Performs the Fruit Ninja 3D slice!
   * Splits intact mesh into two independently tumbling halves.
   */
  slice() {
    if (this.isSliced) return;
    this.isSliced = true;
    this.sliceTimer = 0;

    // Hide intact mesh and aura
    this.intactMesh.visible = false;
    this.auraMesh.visible = false;

    // Split text into left and right halves
    const halfIdx = Math.ceil(this.text.length / 2);
    const leftText = this.text.slice(0, halfIdx);
    const rightText = this.text.slice(halfIdx);

    const halfWidth = this.plaqueWidth * 0.48;

    // Left Half
    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = 256;
    leftCanvas.height = 160;
    const leftCtx = leftCanvas.getContext('2d');
    drawHalfWord(leftCtx, leftCanvas.width, leftCanvas.height, leftText, true);
    const leftTex = new THREE.CanvasTexture(leftCanvas);

    const halfGeo = new THREE.BoxGeometry(halfWidth, this.plaqueHeight, this.plaqueDepth);
    const leftMat = new THREE.MeshBasicMaterial({ map: leftTex, transparent: true });

    const leftMesh = new THREE.Mesh(halfGeo, [
      this.rimMat,
      this.rimMat,
      this.rimMat,
      this.rimMat,
      leftMat,
      this.rimMat,
    ]);
    leftMesh.position.set(-halfWidth * 0.55, 0, 0);
    this.group.add(leftMesh);

    // Right Half
    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = 256;
    rightCanvas.height = 160;
    const rightCtx = rightCanvas.getContext('2d');
    drawHalfWord(rightCtx, rightCanvas.width, rightCanvas.height, rightText, false);
    const rightTex = new THREE.CanvasTexture(rightCanvas);

    const rightMat = new THREE.MeshBasicMaterial({ map: rightTex, transparent: true });
    const rightMesh = new THREE.Mesh(halfGeo, [
      this.rimMat,
      this.rimMat,
      this.rimMat,
      this.rimMat,
      rightMat,
      this.rimMat,
    ]);
    rightMesh.position.set(halfWidth * 0.55, 0, 0);
    this.group.add(rightMesh);

    // Independent ballistic kinematics for the two severed halves
    this.halves = {
      left: {
        mesh: leftMesh,
        vel: new THREE.Vector3(this.velocity.x - 4.2, this.velocity.y + 2.5, this.velocity.z + 1.0),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 8.0,
          -6.0 - Math.random() * 6.0,
          4.0 + Math.random() * 5.0
        ),
        mat: leftMat,
        tex: leftTex,
      },
      right: {
        mesh: rightMesh,
        vel: new THREE.Vector3(this.velocity.x + 4.2, this.velocity.y + 2.5, this.velocity.z - 1.0),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 8.0,
          6.0 + Math.random() * 6.0,
          -4.0 - Math.random() * 5.0
        ),
        mat: rightMat,
        tex: rightTex,
      },
      geo: halfGeo,
    };
  }

  update(dt) {
    if (this.isDead) return;

    if (!this.isSliced) {
      // 1. Intact flight along 3D parabolic arc
      this.velocity.y -= this.gravity * dt;
      this.position.addScaledVector(this.velocity, dt);

      this.rotation.x += this.angularVelocity.x * dt;
      this.rotation.y += this.angularVelocity.y * dt;
      this.rotation.z += this.angularVelocity.z * dt;

      this.group.position.copy(this.position);
      this.group.rotation.copy(this.rotation);

      if (this.isTargeted) {
        this.auraMesh.rotation.z += dt * 3.5;
      }
    } else if (this.halves) {
      // 2. Sliced halves falling independently
      this.sliceTimer += dt;
      const grav = this.gravity * 1.35;

      // Update left half
      this.halves.left.vel.y -= grav * dt;
      this.halves.left.mesh.position.addScaledVector(this.halves.left.vel, dt);
      this.halves.left.mesh.rotation.x += this.halves.left.angVel.x * dt;
      this.halves.left.mesh.rotation.y += this.halves.left.angVel.y * dt;
      this.halves.left.mesh.rotation.z += this.halves.left.angVel.z * dt;

      // Update right half
      this.halves.right.vel.y -= grav * dt;
      this.halves.right.mesh.position.addScaledVector(this.halves.right.vel, dt);
      this.halves.right.mesh.rotation.x += this.halves.right.angVel.x * dt;
      this.halves.right.mesh.rotation.y += this.halves.right.angVel.y * dt;
      this.halves.right.mesh.rotation.z += this.halves.right.angVel.z * dt;

      // Fade out after 600ms
      if (this.sliceTimer > 0.65) {
        this.isDead = true;
      }
    }
  }

  dispose() {
    this.texture.dispose();
    this.faceMat.dispose();
    this.rimMat.dispose();
    this.plaqueGeo.dispose();
    this.auraMesh.geometry.dispose();
    this.auraMesh.material.dispose();

    if (this.halves) {
      this.halves.left.mat.dispose();
      this.halves.left.tex.dispose();
      this.halves.right.mat.dispose();
      this.halves.right.tex.dispose();
      this.halves.geo.dispose();
    }
  }
}

function drawHalfWord(ctx, width, height, text, isLeft) {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(28, 10, 18, 0.95)';
  ctx.beginPath();
  ctx.roundRect(10, 14, width - 20, height - 28, 16);
  ctx.fill();

  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Cut edge glowing incinerated border
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(width - 12, 14);
    ctx.lineTo(width - 12, height - 14);
  } else {
    ctx.moveTo(12, 14);
    ctx.lineTo(12, height - 14);
  }
  ctx.stroke();

  ctx.font = '900 44px "JetBrains Mono", monospace';
  ctx.fillStyle = '#10B981';
  ctx.shadowColor = '#10B981';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
}
