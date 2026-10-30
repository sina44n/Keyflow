import * as THREE from 'three';

/**
 * Warp3DGates.js — 3D Quantum Velocity Ring Gates & Floating Word Canvas Plaques
 * ==============================================================================
 * Renders glowing hexagonal warp apertures along the hyperspace conduit.
 * Displays character-by-character color highlighted target words with real-time feedback.
 */
export class Warp3DGates {
  constructor(scene) {
    this.scene = scene;
    this.gates = [];
    this.gateSpacing = 28; // Spacing along Z
    this.activeWord = '';
    this.activeInput = '';
    this.hasError = false;

    // Ring Geometry (Hexagonal Torus)
    this.ringGeo = new THREE.TorusGeometry(3.2, 0.12, 8, 6);
    this.ringGeo.rotateZ(Math.PI / 6);

    // Inner Energy Field Disc
    this.discGeo = new THREE.CircleGeometry(3.0, 6);
    this.discGeo.rotateZ(Math.PI / 6);
  }

  /**
   * Initializes or refreshes gates with a word list
   */
  initGates(wordList, startZ = -18) {
    // Clear existing gates
    this.clear();

    const count = Math.min(8, wordList.length);
    for (let i = 0; i < count; i++) {
      const zPos = startZ - i * this.gateSpacing;
      const gate = this.createGateMesh(wordList[i], zPos, i === 0);
      this.gates.push(gate);
      this.scene.add(gate.group);
    }
  }

  createGateMesh(word, zPos, isActive = false) {
    const group = new THREE.Group();
    group.position.set(0, 0, zPos);

    // 1. Hexagonal Outer Neon Ring
    const ringMat = new THREE.MeshStandardMaterial({
      color: isActive ? 0x10b981 : 0x0284c7,
      emissive: isActive ? 0x059669 : 0x0369a1,
      emissiveIntensity: isActive ? 1.5 : 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ringMesh = new THREE.Mesh(this.ringGeo, ringMat);
    group.add(ringMesh);

    // 2. Translucent Quantum Barrier Disc
    const discMat = new THREE.MeshBasicMaterial({
      color: isActive ? 0x059669 : 0x0369a1,
      transparent: true,
      opacity: isActive ? 0.18 : 0.08,
      side: THREE.DoubleSide,
    });
    const discMesh = new THREE.Mesh(this.discGeo, discMat);
    group.add(discMesh);

    // 3. 3D Floating Word Canvas Plaque
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const plaqueGeo = new THREE.PlaneGeometry(3.8, 1.2);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(0, 0, 0.05);
    group.add(plaqueMesh);

    const gateObj = {
      group,
      ringMesh,
      ringMat,
      discMesh,
      discMat,
      plaqueMesh,
      canvas,
      ctx,
      texture,
      word,
      isActive,
      targetZ: zPos,
      expanding: false,
      expandScale: 1.0,
      opacity: 1.0,
    };

    this.renderCanvasPlaque(gateObj, '', false);
    return gateObj;
  }

  /**
   * Render dynamic character-by-character color feedback onto gate canvas
   */
  renderCanvasPlaque(gate, input = '', hasError = false) {
    const { canvas, ctx, texture, word, isActive } = gate;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Plaque Pill
    const rx = 24, ry = 24, rw = canvas.width - 48, rh = canvas.height - 48;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 28);
    ctx.fillStyle = isActive ? 'rgba(6, 12, 28, 0.88)' : 'rgba(10, 15, 26, 0.65)';
    ctx.fill();

    ctx.lineWidth = isActive ? 4 : 2;
    ctx.strokeStyle = hasError
      ? '#EF4444'
      : isActive
      ? '#10B981'
      : 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();

    if (isActive) {
      // Glow boundary
      ctx.shadowColor = hasError ? '#EF4444' : '#10B981';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Measure and center characters
    ctx.font = 'bold 54px "JetBrains Mono", monospace, sans-serif';
    ctx.textBaseline = 'middle';

    const chars = word.split('');
    const charWidths = chars.map((ch) => ctx.measureText(ch).width);
    const totalTextWidth = charWidths.reduce((a, b) => a + b, 0);
    let startX = (canvas.width - totalTextWidth) / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chWidth = charWidths[i];

      if (!isActive) {
        // Distant preview word in soft cyan
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      } else if (i < input.length) {
        if (input[i] === ch) {
          // Correct character: Emerald Glow
          ctx.fillStyle = '#10B981';
        } else {
          // Mistyped character: Crimson Red
          ctx.fillStyle = '#EF4444';
        }
      } else if (i === input.length) {
        // Current target cursor character: Bright Amber with underline
        ctx.fillStyle = hasError ? '#EF4444' : '#F59E0B';

        // Draw cursor underline pill
        ctx.fillStyle = hasError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.35)';
        ctx.fillRect(startX - 2, centerY + 28, chWidth + 4, 6);
        ctx.fillStyle = hasError ? '#EF4444' : '#F59E0B';
      } else {
        // Untyped upcoming characters: Crisp White
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.fillText(ch, startX, centerY);
      startX += chWidth;
    }

    texture.needsUpdate = true;
  }

  /**
   * Update active word and keystroke progress
   */
  updateProgress(input, hasError = false) {
    this.activeInput = input;
    this.hasError = hasError;

    if (this.gates.length > 0) {
      this.renderCanvasPlaque(this.gates[0], input, hasError);
    }
  }

  /**
   * Trigger gate breach expansion shockwave when word is typed correctly
   */
  breachActiveGate() {
    if (this.gates.length === 0) return;

    const breachedGate = this.gates.shift();
    breachedGate.expanding = true;

    // Set the new first gate as active
    if (this.gates.length > 0) {
      const nextGate = this.gates[0];
      nextGate.isActive = true;
      nextGate.ringMat.color.setHex(0x10b981);
      nextGate.ringMat.emissive.setHex(0x059669);
      nextGate.ringMat.emissiveIntensity = 1.5;
      nextGate.discMat.color.setHex(0x059669);
      nextGate.discMat.opacity = 0.18;
      this.renderCanvasPlaque(nextGate, '', false);
    }

    // Keep dissolving breached gate in animation loop
    this.dissolvingGates = this.dissolvingGates || [];
    this.dissolvingGates.push(breachedGate);
  }

  /**
   * Spawn a new gate at the distant end to maintain conveyor buffer
   */
  appendGate(word) {
    const lastZ = this.gates.length > 0
      ? this.gates[this.gates.length - 1].group.position.z
      : -18;
    const newZ = lastZ - this.gateSpacing;
    const gate = this.createGateMesh(word, newZ, false);
    this.gates.push(gate);
    this.scene.add(gate.group);
  }

  /**
   * Per-frame update moving gates forward based on travel speed
   */
  update(delta, travelSpeed = 24) {
    const shift = travelSpeed * delta;

    // Advance active & queued gates
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i];
      g.group.position.z += shift;
      g.group.rotation.z += delta * (i % 2 === 0 ? 0.25 : -0.25);
    }

    // Animate dissolving breached gates
    if (this.dissolvingGates) {
      for (let i = this.dissolvingGates.length - 1; i >= 0; i--) {
        const bg = this.dissolvingGates[i];
        bg.expandScale += delta * 7.0;
        bg.opacity -= delta * 3.5;
        bg.group.scale.set(bg.expandScale, bg.expandScale, 1);
        bg.ringMat.opacity = Math.max(0, bg.opacity);
        bg.discMat.opacity = Math.max(0, bg.opacity * 0.2);
        bg.plaqueMesh.material.opacity = Math.max(0, bg.opacity);

        if (bg.opacity <= 0) {
          this.scene.remove(bg.group);
          bg.texture.dispose();
          this.dissolvingGates.splice(i, 1);
        }
      }
    }
  }

  clear() {
    this.gates.forEach((g) => {
      this.scene.remove(g.group);
      g.texture.dispose();
    });
    this.gates = [];

    if (this.dissolvingGates) {
      this.dissolvingGates.forEach((g) => {
        this.scene.remove(g.group);
        g.texture.dispose();
      });
      this.dissolvingGates = [];
    }
  }
}
