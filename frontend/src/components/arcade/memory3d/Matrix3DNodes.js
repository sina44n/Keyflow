import * as THREE from 'three';

/**
 * Matrix3DNodes.js — 3D Holographic Neural Synapse Nodes & Fiber-Optic Pathways
 * ==============================================================================
 * Renders floating crystalline nodes along the 3D neural matrix hypercube.
 * Features strict memory isolation: zero text leakage during the blind recall shutter.
 */
export class Matrix3DNodes {
  constructor(scene) {
    this.scene = scene;
    this.nodes = [];
    this.pathways = [];
    this.time = 0;
  }

  /**
   * Spawns or updates neural nodes for the active sequence
   */
  loadSequence(sequenceWords, phase = 'viewing', userInputs = [], currentTyping = '') {
    this.clear();

    const count = sequenceWords.length;
    // Compute 3D geometric layout coordinates around hypercube
    const coords = this.computeNodeCoordinates(count);

    for (let i = 0; i < count; i++) {
      const pos = coords[i];
      const word = sequenceWords[i];
      const node = this.createNodeMesh(i, word, pos);
      this.nodes.push(node);
      this.scene.add(node.group);
    }

    // Build Connecting Fiber-Optic Synapse Pathways
    this.buildPathways(coords);

    // Update initial visual state
    this.updateVisualState(phase, sequenceWords, userInputs, currentTyping);
  }

  computeNodeCoordinates(count) {
    const list = [];
    const radius = 4.2;

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const phi = (i % 2 === 0 ? 0.35 : -0.35) * Math.PI;

      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi) + 0.3;
      const z = radius * Math.sin(theta) * Math.cos(phi);

      list.push(new THREE.Vector3(x, y, z));
    }
    return list;
  }

  createNodeMesh(index, word, position) {
    const group = new THREE.Group();
    group.position.copy(position);

    // 1. Central Crystalline Diamond Core
    const coreGeo = new THREE.OctahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan crystal
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // 2. Orbital Nano-Ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 8, 24);
    ringGeo.rotateX(Math.PI / 4);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // 3. 3D Floating Word Canvas Plaque
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const plaqueGeo = new THREE.PlaneGeometry(3.2, 1.0);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 1.15, 0);
    group.add(plaque);

    return {
      index,
      word,
      group,
      core,
      coreMat,
      ring,
      plaque,
      canvas,
      ctx,
      texture,
      basePos: position.clone(),
      pulsePhase: index * 0.7,
    };
  }

  /**
   * Connect nodes with glowing fiber-optic line segments
   */
  buildPathways(coords) {
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
    });

    for (let i = 0; i < coords.length; i++) {
      const nextIdx = (i + 1) % coords.length;
      const points = [coords[i], coords[nextIdx]];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      this.pathways.push(line);
      this.scene.add(line);
    }
  }

  /**
   * Updates visual canvas plaque and crystal emissive state across phases
   */
  updateVisualState(phase, sequenceWords, userInputs = [], currentTyping = '') {
    this.nodes.forEach((node, idx) => {
      const { canvas, ctx, texture, word } = node;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rx = 16, ry = 16, rw = canvas.width - 32, rh = canvas.height - 32;

      // Determine state for this node
      let statusColor = '#06B6D4'; // default cyan
      let displayText = '';
      let subLabel = `NODE #${idx + 1}`;
      let isActive = false;

      if (phase === 'viewing') {
        // Memorization phase: show original word with glowing aura
        displayText = word;
        statusColor = '#06B6D4';
        node.coreMat.emissive.setHex(0x0891b2);
        node.coreMat.emissiveIntensity = 1.2;
      } else if (phase === 'recalling') {
        if (idx < userInputs.length) {
          // Already typed word
          displayText = userInputs[idx];
          statusColor = '#10B981'; // Reconstructed green
          node.coreMat.emissive.setHex(0x059669);
          node.coreMat.emissiveIntensity = 1.0;
        } else if (idx === userInputs.length) {
          // Current active input node
          isActive = true;
          displayText = currentTyping ? `${currentTyping}_` : '[ RECALL ]';
          statusColor = '#F59E0B'; // Amber active
          node.coreMat.emissive.setHex(0xd97706);
          node.coreMat.emissiveIntensity = 1.6;
        } else {
          // Future locked node: strictly concealed
          displayText = '[ ? ? ? ]';
          statusColor = 'rgba(100, 116, 139, 0.4)';
          node.coreMat.emissive.setHex(0x1e293b);
          node.coreMat.emissiveIntensity = 0.2;
        }
      } else if (phase === 'review') {
        // Review phase: verify correctness
        const userTyped = userInputs[idx] || '';
        const isMatch = userTyped.toLowerCase() === word.toLowerCase();

        displayText = isMatch ? word : `${userTyped || 'MISSED'} -> ${word}`;
        statusColor = isMatch ? '#10B981' : '#EF4444';
        subLabel = isMatch ? `NODE #${idx + 1} CONFIRMED` : `NODE #${idx + 1} DESYNC`;

        node.coreMat.emissive.setHex(isMatch ? 0x059669 : 0xdc2626);
        node.coreMat.emissiveIntensity = isMatch ? 1.4 : 1.8;
      }

      // Draw background pill
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 20);
      ctx.fillStyle = isActive ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.75)';
      ctx.fill();

      // Border & Glow
      ctx.lineWidth = isActive ? 4 : 2;
      ctx.strokeStyle = statusColor;
      if (isActive || phase === 'viewing') {
        ctx.shadowColor = statusColor;
        ctx.shadowBlur = 12;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Sub-Label
      ctx.font = 'bold 22px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = statusColor;
      ctx.textAlign = 'center';
      ctx.fillText(subLabel, canvas.width / 2, ry + 32);

      // Draw Main Word Display
      ctx.font = 'bold 44px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(displayText, canvas.width / 2, ry + 78);

      texture.needsUpdate = true;
    });
  }

  update(delta, camera) {
    this.time += delta;

    this.nodes.forEach((node) => {
      // Gentle floating bob
      const t = this.time * 2.0 + node.pulsePhase;
      node.group.position.y = node.basePos.y + Math.sin(t) * 0.12;

      // Diamond core rotation
      node.core.rotation.x += delta * 0.6;
      node.core.rotation.y += delta * 0.9;

      // Ring tumble
      node.ring.rotation.z += delta * 1.4;

      // Billboard plaque facing camera
      if (camera) {
        node.plaque.quaternion.copy(camera.quaternion);
      }
    });
  }

  clear() {
    this.nodes.forEach((node) => {
      this.scene.remove(node.group);
      node.texture.dispose();
    });
    this.nodes = [];

    this.pathways.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.pathways = [];
  }
}
