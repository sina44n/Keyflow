import * as THREE from 'three';

/**
 * Sniper3DDrones.js — Procedural 3D Flying Cyber Drones & Tactical Callsign Plaques
 * =================================================================================
 * Features:
 * - Articulated quadcopter chassis with 4 high-speed spinning rotor blades
 * - Omnidirectional optical sensor eye with downward searchlight beam
 * - 3D floating callsign plaque with character-by-character color feedback
 * - Visual target urgency decay ring
 * - Exploding debris shrapnel particle system on sniper elimination
 */
export class Sniper3DDrones {
  constructor(scene) {
    this.scene = scene;
    this.drones = new Map(); // id -> droneObj
    this.explosions = []; // active particle explosions
    this.time = 0;
  }

  /**
   * Spawns or syncs drones from game state
   */
  syncTargets(targetsList, lockedId, typedBuffer = '', targetTtl = 4.5, maxTtl = 4.5) {
    const currentIds = new Set(targetsList.map((t) => t.id));

    // Remove obsolete drones
    for (const [id, drone] of this.drones.entries()) {
      if (!currentIds.has(id)) {
        this.removeDroneMesh(id);
      }
    }

    // Add or update existing drones
    targetsList.forEach((target) => {
      let drone = this.drones.get(target.id);
      const isLocked = target.id === lockedId;

      if (!drone) {
        drone = this.createDroneMesh(target);
        this.drones.set(target.id, drone);
        this.scene.add(drone.group);
      }

      // Update callsign canvas
      drone.isLocked = isLocked;
      const ttlRatio = isLocked ? Math.max(0, targetTtl / maxTtl) : 1.0;
      this.renderCallsignCanvas(drone, isLocked ? typedBuffer : '', isLocked, ttlRatio);
    });
  }

  createDroneMesh(target) {
    const group = new THREE.Group();

    // Map 2D percentage coords (15..85) to 3D world space coordinates
    // X: -16 to +16, Y: -2 to +8, Z: -25 to -45
    const worldX = ((target.x - 50) / 40) * 14;
    const worldY = ((50 - target.y) / 40) * 5 + 3.0;
    const worldZ = -30 - (target.id % 4) * 4;

    group.position.set(worldX, worldY, worldZ);

    // 1. Central Spherical Cyber Core
    const bodyGeo = new THREE.SphereGeometry(0.65, 12, 10);
    bodyGeo.scale(1.2, 0.6, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.85,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 2. Optical Sensor Eye
    const eyeGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 0.6);
    group.add(eye);

    // 3. 4 Quadcopter Carbon Struts & Rotors
    const rotors = [];
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const propMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });

    [
      { x: 1.1, z: 1.1 },
      { x: -1.1, z: 1.1 },
      { x: 1.1, z: -1.1 },
      { x: -1.1, z: -1.1 },
    ].forEach((pos) => {
      // Strut Arm
      const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6);
      armGeo.rotateZ(Math.PI / 2);
      armGeo.rotateY(Math.atan2(pos.z, pos.x));
      const arm = new THREE.Mesh(armGeo, strutMat);
      arm.position.set(pos.x * 0.5, 0, pos.z * 0.5);
      group.add(arm);

      // Motor Pod
      const motorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
      const motor = new THREE.Mesh(motorGeo, strutMat);
      motor.position.set(pos.x, 0.08, pos.z);
      group.add(motor);

      // Spinning Rotor Propellor Disc
      const propGeo = new THREE.BoxGeometry(0.9, 0.02, 0.09);
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(pos.x, 0.24, pos.z);
      group.add(prop);
      rotors.push(prop);
    });

    // 4. Downward Conical Searchlight
    const lightGeo = new THREE.ConeGeometry(1.8, 8, 10, 1, true);
    lightGeo.rotateX(-Math.PI / 2);
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const searchlight = new THREE.Mesh(lightGeo, lightMat);
    searchlight.position.set(0, -4.2, 0);
    group.add(searchlight);

    // 5. 3D Callsign Word Canvas Plaque
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const plaqueGeo = new THREE.PlaneGeometry(3.6, 1.1);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 1.4, 0);
    group.add(plaque);

    return {
      id: target.id,
      word: target.word,
      group,
      rotors,
      eye,
      searchlight,
      canvas,
      ctx,
      texture,
      plaque,
      basePos: new THREE.Vector3(worldX, worldY, worldZ),
      isLocked: false,
      hoverOffset: Math.random() * Math.PI * 2,
    };
  }

  renderCallsignCanvas(drone, typed = '', isLocked = false, ttlRatio = 1.0) {
    const { canvas, ctx, texture, word } = drone;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rx = 20, ry = 20, rw = canvas.width - 40, rh = canvas.height - 40;

    // Background Container
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 24);
    ctx.fillStyle = isLocked ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    // Border: Emerald/Cyan when locked, Amber when expiring, Muted otherwise
    ctx.lineWidth = isLocked ? 4 : 2;
    let strokeColor = 'rgba(56, 189, 248, 0.35)';
    if (isLocked) {
      strokeColor = ttlRatio < 0.35 ? '#EF4444' : '#10B981';
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 14;
    }
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Countdown Progress Bar along bottom of plaque when locked
    if (isLocked) {
      const barY = ry + rh - 6;
      ctx.fillStyle = ttlRatio < 0.35 ? '#EF4444' : '#10B981';
      ctx.fillRect(rx + 16, barY, (rw - 32) * Math.max(0, ttlRatio), 4);
    }

    // Render Characters
    ctx.font = 'bold 52px "JetBrains Mono", monospace, sans-serif';
    ctx.textBaseline = 'middle';

    const chars = word.split('');
    const charWidths = chars.map((ch) => ctx.measureText(ch).width);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0);
    let startX = (canvas.width - totalWidth) / 2;
    const centerY = canvas.height / 2 - 2;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chWidth = charWidths[i];

      if (!isLocked) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      } else if (i < typed.length) {
        ctx.fillStyle = typed[i] === ch ? '#10B981' : '#EF4444';
      } else if (i === typed.length) {
        ctx.fillStyle = '#F59E0B';
        // Underline cursor
        ctx.fillRect(startX - 1, centerY + 26, chWidth + 2, 4);
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.fillText(ch, startX, centerY);
      startX += chWidth;
    }

    texture.needsUpdate = true;
  }

  /**
   * Triggers fiery explosion and 14 polygonal debris chunks at target location
   */
  explodeDrone(targetId) {
    const drone = this.drones.get(targetId);
    if (!drone) return;

    const origin = drone.group.position.clone();
    this.removeDroneMesh(targetId);

    // Create 14 Shrapnel Fragments
    const debrisGroup = new THREE.Group();
    const fragments = [];
    const fragGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const fragMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    for (let i = 0; i < 14; i++) {
      const frag = new THREE.Mesh(fragGeo, fragMat);
      frag.position.copy(origin);
      debrisGroup.add(frag);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 12 + 2,
        (Math.random() - 0.5) * 16
      );
      fragments.push({ mesh: frag, vel });
    }

    // Expanding Plasma Flash Sphere
    const flashGeo = new THREE.SphereGeometry(1.6, 12, 10);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(origin);
    debrisGroup.add(flash);

    this.scene.add(debrisGroup);

    this.explosions.push({
      group: debrisGroup,
      fragments,
      flash,
      scale: 1.0,
      opacity: 1.0,
      life: 0.75,
    });
  }

  removeDroneMesh(id) {
    const drone = this.drones.get(id);
    if (drone) {
      this.scene.remove(drone.group);
      drone.texture.dispose();
      this.drones.delete(id);
    }
  }

  update(delta, camera) {
    this.time += delta;

    // 1. Animate Drones: rotor spin, gentle hovering drift, billboard callsigns
    for (const drone of this.drones.values()) {
      // Rotor spin
      drone.rotors.forEach((prop, idx) => {
        prop.rotation.y += delta * 45 * (idx % 2 === 0 ? 1 : -1);
      });

      // Hover physics
      const t = this.time * 2.2 + drone.hoverOffset;
      drone.group.position.x = drone.basePos.x + Math.sin(t * 0.7) * 0.5;
      drone.group.position.y = drone.basePos.y + Math.cos(t) * 0.35;
      drone.group.rotation.z = Math.sin(t * 0.7) * 0.08;

      // Make callsign plaque face camera
      if (camera) {
        drone.plaque.quaternion.copy(camera.quaternion);
      }
    }

    // 2. Animate Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life -= delta;
      exp.opacity = Math.max(0, exp.life / 0.75);

      // Expand flash
      exp.scale += delta * 12;
      exp.flash.scale.set(exp.scale, exp.scale, exp.scale);
      exp.flash.material.opacity = exp.opacity;

      // Move fragments
      exp.fragments.forEach(({ mesh, vel }) => {
        vel.y -= 18 * delta; // gravity
        mesh.position.addScaledVector(vel, delta);
        mesh.rotation.x += delta * 8;
        mesh.rotation.y += delta * 10;
        mesh.material.opacity = exp.opacity;
      });

      if (exp.life <= 0) {
        this.scene.remove(exp.group);
        this.explosions.splice(i, 1);
      }
    }
  }

  clear() {
    for (const [id] of this.drones) {
      this.removeDroneMesh(id);
    }
    this.drones.clear();

    this.explosions.forEach((exp) => this.scene.remove(exp.group));
    this.explosions = [];
  }
}

