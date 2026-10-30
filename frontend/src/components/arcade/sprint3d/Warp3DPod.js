import * as THREE from 'three';

/**
 * Warp3DPod.js — Procedural 3D Quantum Speed Racer Pod
 * =====================================================
 * Sleek aerodynamic hover speedcraft with dual ion thrusters,
 * dynamic banking physics, and reactive typing afterburner flares.
 */
export class Warp3DPod {
  constructor() {
    this.mesh = new THREE.Group();
    this.thrusters = [];
    this.thrusterLights = [];
    this.currentRoll = 0;
    this.targetRoll = 0;
    this.baseZ = -2.2;
    this.targetZ = -2.2;
    this.time = 0;

    this.buildPod();
  }

  buildPod() {
    // 1. Center Main Fuselage
    const fuselageGeo = new THREE.ConeGeometry(0.55, 2.4, 7);
    fuselageGeo.rotateX(Math.PI / 2);
    fuselageGeo.rotateZ(Math.PI / 7);

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate obsidian
      roughness: 0.25,
      metalness: 0.85,
    });

    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    this.mesh.add(fuselage);

    // 2. Cockpit Canopy (Tinted Cyber Glass)
    const canopyGeo = new THREE.SphereGeometry(0.32, 16, 12);
    canopyGeo.scale(0.8, 0.45, 1.6);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan glow glass
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.22, 0.15);
    this.mesh.add(canopy);

    // 3. Swept-Back Delta Wings (Left & Right)
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
    });

    const edgeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald neon wingtips
    });

    [-1, 1].forEach((side) => {
      const wingGroup = new THREE.Group();

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(side * 1.5, -0.6);
      wingShape.lineTo(side * 1.3, -1.2);
      wingShape.lineTo(0, -0.8);
      wingShape.closePath();

      const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
      const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
      wingGeo.rotateX(-Math.PI / 2);

      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      wingMesh.position.set(0, 0, 0.2);
      wingGroup.add(wingMesh);

      // Wingtip Neon Leading Edge
      const tipGeo = new THREE.BoxGeometry(0.06, 0.06, 1.1);
      const tipMesh = new THREE.Mesh(tipGeo, edgeGlowMat);
      tipMesh.position.set(side * 1.4, 0.02, -0.7);
      wingGroup.add(tipMesh);

      // Dual Wingtip Plasma Cannons / Stabilizers
      const podCyl = new THREE.CylinderGeometry(0.09, 0.11, 0.8, 8);
      podCyl.rotateX(Math.PI / 2);
      const podMesh = new THREE.Mesh(podCyl, hullMat);
      podMesh.position.set(side * 1.35, 0.04, -0.6);
      wingGroup.add(podMesh);

      this.mesh.add(wingGroup);
    });

    // 4. Dual Ion Thrusters (Rear)
    [-0.32, 0.32].forEach((xOffset) => {
      const nozzleGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.5, 12);
      nozzleGeo.rotateX(Math.PI / 2);
      const nozzleMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.4,
        metalness: 0.9,
      });
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.position.set(xOffset, 0, -1.1);
      this.mesh.add(nozzle);

      // Glowing Plasma Exhaust Plume
      const flameGeo = new THREE.ConeGeometry(0.13, 0.9, 12);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(xOffset, 0, -1.75);
      this.mesh.add(flame);
      this.thrusters.push(flame);

      // Dynamic Point Light at exhaust
      const pLight = new THREE.PointLight(0x06b6d4, 1.2, 5);
      pLight.position.set(xOffset, 0, -1.6);
      this.mesh.add(pLight);
      this.thrusterLights.push(pLight);
    });

    // Initial positioning in front of cockpit camera
    this.mesh.position.set(0, -0.35, this.baseZ);
  }

  /**
   * Called every frame to animate hover bobbing, banking roll, and exhaust glow
   */
  update(delta, wpm = 50, streak = 0) {
    this.time += delta;

    // 1. Hover Bobbing Physics (Gentle Lissajous figure-eight)
    const bobY = Math.sin(this.time * 3.5) * 0.05;
    const bobX = Math.cos(this.time * 1.8) * 0.04;
    this.mesh.position.y = -0.35 + bobY;
    this.mesh.position.x = bobX;

    // 2. Smooth Roll Banking
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, this.targetRoll, delta * 8);
    this.mesh.rotation.z = this.currentRoll + Math.sin(this.time * 2.2) * 0.015;
    this.mesh.rotation.x = Math.sin(this.time * 3.0) * 0.02;

    // Gradually return target roll to neutral
    this.targetRoll = THREE.MathUtils.lerp(this.targetRoll, 0, delta * 3);

    // 3. Dynamic Forward Thrust Surge
    const surgeZ = Math.min(0.6, (wpm / 140) * 0.5 + (streak > 5 ? 0.2 : 0));
    this.targetZ = this.baseZ + surgeZ;
    this.mesh.position.z = THREE.MathUtils.lerp(this.mesh.position.z, this.targetZ, delta * 5);

    // 4. Exhaust Plume Scaling & Flickering
    const flameScale = 1.0 + Math.min(1.8, (wpm / 100) * 0.8) + (Math.sin(this.time * 35) * 0.15);
    const flameColor = streak >= 15 ? 0xa855f7 : streak >= 5 ? 0x10b981 : 0x38bdf8;

    this.thrusters.forEach((flame) => {
      flame.scale.set(1, 1, flameScale);
      flame.material.color.setHex(flameColor);
    });

    this.thrusterLights.forEach((light) => {
      light.color.setHex(flameColor);
      light.intensity = 1.2 + flameScale * 0.8;
    });
  }

  /**
   * Bank left or right when typing characters
   */
  triggerBank(direction = 1) {
    this.targetRoll = THREE.MathUtils.clamp(this.targetRoll + direction * 0.12, -0.35, 0.35);
  }

  /**
   * Turbo pulse when completing a clean word
   */
  pulseTurbo() {
    this.targetZ = this.baseZ + 0.85;
    this.thrusters.forEach((flame) => {
      flame.scale.set(1.5, 1.5, 2.8);
    });
  }
}

