import * as THREE from 'three';

/**
 * Boss3DTitan.js — Articulated 3D Mecha Titan Boss
 * ===============================================
 * Features:
 * - Armored carbon-alloy torso with glowing pulsating magma reactor core
 * - Articulated shoulder pauldrons, piston arms, and hydraulic fist
 * - Glowing optical cyclops visor with attack telegraph charge
 * - Floating counter-parry holographic shield with character color feedback
 * - Dynamic ground slam shockwave ring physics
 */
export class Boss3DTitan {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.time = 0;

    this.state = 'idle'; // 'idle', 'telegraph', 'slam', 'flinch', 'dead'
    this.telegraphTime = 0;
    this.flinchTimer = 0;

    // Sub-components
    this.torso = null;
    this.magmaCore = null;
    this.head = null;
    this.visor = null;
    this.leftArm = null;
    this.rightArm = null;
    this.rightFist = null;
    this.parryShield = null;
    this.parryCanvas = null;
    this.parryTexture = null;

    this.shockwaves = []; // expanding ground rings

    this.buildTitan();
  }

  buildTitan() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Dark carbon obsidian
      roughness: 0.35,
      metalness: 0.9,
    });

    const armorAccentMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d, // Deep crimson armor plates
      roughness: 0.4,
      metalness: 0.7,
    });

    // 1. Torso Assembly
    const torsoGeo = new THREE.BoxGeometry(3.6, 4.2, 2.4);
    this.torso = new THREE.Mesh(torsoGeo, metalMat);
    this.torso.position.set(0, 5.2, 0);
    this.group.add(this.torso);

    // Armor Breastplate
    const breastplateGeo = new THREE.BoxGeometry(3.2, 2.4, 0.6);
    const breastplate = new THREE.Mesh(breastplateGeo, armorAccentMat);
    breastplate.position.set(0, 0.4, 1.25);
    this.torso.add(breastplate);

    // Glowing Magma Core (Center of chest)
    const coreGeo = new THREE.SphereGeometry(0.7, 16, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.magmaCore = new THREE.Mesh(coreGeo, coreMat);
    this.magmaCore.position.set(0, 0.3, 1.35);
    this.torso.add(this.magmaCore);

    // 2. Head & Cyclops Visor
    const headGeo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    this.head = new THREE.Mesh(headGeo, metalMat);
    this.head.position.set(0, 2.7, 0.2);
    this.torso.add(this.head);

    const visorGeo = new THREE.BoxGeometry(1.2, 0.28, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.1, 0.8);
    this.head.add(this.visor);

    // 3. Left Arm (Shield Arm)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-2.4, 1.4, 0);

    const leftShoulderGeo = new THREE.SphereGeometry(1.1, 8, 8);
    const leftShoulder = new THREE.Mesh(leftShoulderGeo, armorAccentMat);
    this.leftArm.add(leftShoulder);

    const leftBicepGeo = new THREE.CylinderGeometry(0.55, 0.65, 3.2, 8);
    leftBicepGeo.rotateZ(0.2);
    const leftBicep = new THREE.Mesh(leftBicepGeo, metalMat);
    leftBicep.position.set(-0.4, -1.6, 0);
    this.leftArm.add(leftBicep);

    this.torso.add(this.leftArm);

    // 4. Right Arm (Ground Slam Hammer Fist)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(2.4, 1.4, 0);

    const rightShoulderGeo = new THREE.SphereGeometry(1.1, 8, 8);
    const rightShoulder = new THREE.Mesh(rightShoulderGeo, armorAccentMat);
    this.rightArm.add(rightShoulder);

    const rightBicepGeo = new THREE.CylinderGeometry(0.55, 0.65, 3.2, 8);
    const rightBicep = new THREE.Mesh(rightBicepGeo, metalMat);
    rightBicep.position.set(0.4, -1.6, 0);
    this.rightArm.add(rightBicep);

    const fistGeo = new THREE.BoxGeometry(1.4, 1.4, 1.6);
    this.rightFist = new THREE.Mesh(fistGeo, armorAccentMat);
    this.rightFist.position.set(0.4, -3.2, 0);
    this.rightArm.add(this.rightFist);

    this.torso.add(this.rightArm);

    // 5. Heavy Hydraulic Legs (Lower Body)
    [-1.2, 1.2].forEach((x) => {
      const legGeo = new THREE.CylinderGeometry(0.8, 0.9, 4.4, 8);
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(x, 2.2, 0);
      this.group.add(leg);

      const footGeo = new THREE.BoxGeometry(1.4, 0.8, 2.4);
      const foot = new THREE.Mesh(footGeo, armorAccentMat);
      foot.position.set(x, 0.4, 0.4);
      this.group.add(foot);
    });

    // 6. Holographic Counter-Parry Shield
    this.buildParryShield();

    // Position Titan in distance of colosseum
    this.group.position.set(0, 0, -26);
    this.scene.add(this.group);
  }

  buildParryShield() {
    this.parryCanvas = document.createElement('canvas');
    this.parryCanvas.width = 640;
    this.parryCanvas.height = 180;
    this.parryCtx = this.parryCanvas.getContext('2d');
    this.parryTexture = new THREE.CanvasTexture(this.parryCanvas);
    this.parryTexture.minFilter = THREE.LinearFilter;

    const shieldGeo = new THREE.PlaneGeometry(6.4, 1.8);
    const shieldMat = new THREE.MeshBasicMaterial({
      map: this.parryTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.parryShield = new THREE.Mesh(shieldGeo, shieldMat);
    this.parryShield.position.set(0, 6.2, -21); // in front of Titan chest
    this.parryShield.visible = false;
    this.scene.add(this.parryShield);
  }

  renderParryShield(phrase = '', typed = '', timeLeft = 3.0) {
    if (!this.parryShield || !this.parryCtx) return;

    if (!phrase) {
      this.parryShield.visible = false;
      return;
    }

    this.parryShield.visible = true;
    const ctx = this.parryCtx;
    const canvas = this.parryCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Hex Shield
    ctx.beginPath();
    ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 28);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();

    // Border: Pulsing Crimson Alert
    ctx.lineWidth = 4;
    ctx.strokeStyle = timeLeft < 1.0 ? '#EF4444' : '#F59E0B';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Header Tag
    ctx.font = 'bold 24px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = timeLeft < 1.0 ? '#EF4444' : '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText(`COUNTER-PARRY INCOMING (${timeLeft.toFixed(1)}s)`, canvas.width / 2, 52);

    // Phrase with Character-by-Character Color Feedback
    ctx.font = 'bold 44px "JetBrains Mono", monospace, sans-serif';
    ctx.textBaseline = 'middle';

    const chars = phrase.split('');
    const charWidths = chars.map((c) => ctx.measureText(c).width);
    const totalW = charWidths.reduce((a, b) => a + b, 0);
    let startX = (canvas.width - totalW) / 2;
    const centerY = 112;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const cw = charWidths[i];

      if (i < typed.length) {
        ctx.fillStyle = typed[i].toLowerCase() === ch.toLowerCase() ? '#10B981' : '#EF4444';
      } else if (i === typed.length) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(startX - 1, centerY + 24, cw + 2, 4);
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.fillText(ch, startX, centerY);
      startX += cw;
    }

    this.parryTexture.needsUpdate = true;
  }

  setTelegraph(isTelegraphing) {
    if (isTelegraphing && this.state !== 'telegraph') {
      this.state = 'telegraph';
      this.telegraphTime = 0;
    } else if (!isTelegraphing && this.state === 'telegraph') {
      this.state = 'idle';
    }
  }

  triggerGroundSlam() {
    this.state = 'slam';
    // Create Ground Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.05, -23);
    this.scene.add(ring);

    this.shockwaves.push({ mesh: ring, scale: 1.0, opacity: 0.95 });

    setTimeout(() => {
      if (this.state === 'slam') this.state = 'idle';
    }, 600);
  }

  triggerFlinch() {
    this.flinchTimer = 0.25;
  }

  update(delta) {
    this.time += delta;

    // 1. Idle Torso Breathing
    const bob = Math.sin(this.time * 2.5) * 0.15;
    this.torso.position.y = 5.2 + bob;

    // Core pulsing glow
    const coreScale = 1.0 + Math.sin(this.time * 4) * 0.15;
    this.magmaCore.scale.set(coreScale, coreScale, coreScale);

    // 2. Arm Kinematics based on state
    if (this.state === 'telegraph') {
      // Wind up right arm high above head!
      this.telegraphTime += delta;
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -Math.PI * 0.85, delta * 6);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0.4, delta * 6);
      this.visor.material.color.setHex(0xff0000);
    } else if (this.state === 'slam') {
      // Drive fist down violently into ground!
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, Math.PI * 0.25, delta * 18);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0, delta * 18);
    } else {
      // Gentle idle sway
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, Math.sin(this.time * 2) * 0.1, delta * 4);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0, delta * 4);
      this.leftArm.rotation.x = Math.sin(this.time * 2 + 1) * 0.1;
      this.visor.material.color.setHex(0xef4444);
    }

    // 3. Flinch Recoil
    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      this.group.position.z = -26 - (this.flinchTimer / 0.25) * 0.8;
    } else {
      this.group.position.z = -26;
    }

    // 4. Shockwave Expansion
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += delta * 24.0;
      sw.opacity -= delta * 1.5;
      sw.mesh.scale.set(sw.scale, sw.scale, 1);
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  destroy() {
    this.scene.remove(this.group);
    if (this.parryShield) {
      this.scene.remove(this.parryShield);
      this.parryTexture.dispose();
    }
    this.shockwaves.forEach((sw) => this.scene.remove(sw.mesh));
    this.shockwaves = [];
  }
}
