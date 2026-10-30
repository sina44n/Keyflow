import * as THREE from 'three';

/**
 * Stickman3DCharacterBuilder.js — Procedural 3D Stickman Warrior Rig & Meshes
 * =========================================================================
 * Faithfully constructs the sleek stickman warrior from Reference Image B:
 * - Pure crimson-red articulated stickman body with athletic proportions
 * - Spherical head with glowing emerald-green eyes & cross-slash warrior scar markings
 * - Forearm warrior etchings and high-detail energy dagger / tactical short blade
 * - Floating emerald crystalline blade shards & spiraling neon-green energy ribbons
 * - Archetypes: Player (Crimson), Shadow Warrior, Azure Assassin, Obsidian Brute, Infernal Boss
 */
export class Stickman3DCharacterBuilder {
  /**
   * Builds an articulated 3D stickman warrior.
   * @param {Object} options Configuration options
   * @param {'player'|'shadow'|'assassin'|'brute'|'boss'} options.type Archetype
   * @param {number} options.scale Overall scale multiplier
   */
  static buildStickman(options = {}) {
    const type = options.type || 'player';
    const scale = options.scale || (type === 'boss' ? 1.55 : type === 'brute' ? 1.25 : 1.0);

    const group = new THREE.Group();
    group.name = `Stickman_${type}`;

    // 1. Color Theme & Material Config
    const theme = this.getTheme(type);

    // 2. Build Humanoid Bone Hierarchy (16 articulated bones)
    const bones = this.createStickmanSkeleton();
    const skeleton = new THREE.Skeleton(Object.values(bones));

    // 3. Attach Stickman Body Mesh Parts to Bones
    const parts = this.attachStickmanMeshes(bones, theme, type);

    // 4. Assemble Group & Scale
    group.add(bones.root);
    group.scale.set(scale, scale, scale);

    return {
      group,
      skeleton,
      bones,
      swordMesh: parts.swordMesh,
      swordBlade: parts.swordBlade,
      energyRibbon: parts.energyRibbon,
      orbitalShards: parts.orbitalShards,
      eyeMesh: parts.eyeMesh,
      theme,
      type,
      scale,
    };
  }

  static getTheme(type) {
    switch (type) {
      case 'boss':
        return {
          bodyColor: 0x18181b, // Obsidian black body
          accentColor: 0xef4444, // Blood flame
          energyColor: 0xf97316, // Blazing orange-red energy
          eyeColor: 0xff0000, // Pure burning red gaze
          bladeColor: 0x991b1b,
          bladeGlow: 0xef4444,
          metalness: 0.8,
          roughness: 0.3,
          limbRadius: 0.11,
        };
      case 'brute':
        return {
          bodyColor: 0x27272a, // Heavy charcoal iron
          accentColor: 0xf59e0b, // Amber trim
          energyColor: 0xf59e0b, // Amber energy
          eyeColor: 0xf59e0b, // Glowing amber eyes
          bladeColor: 0x52525b,
          bladeGlow: 0xd97706,
          metalness: 0.85,
          roughness: 0.4,
          limbRadius: 0.12,
        };
      case 'assassin':
        return {
          bodyColor: 0x0284c7, // Electric azure
          accentColor: 0x38bdf8,
          energyColor: 0xa855f7, // Violet plasma
          eyeColor: 0x38bdf8, // Electric blue eyes
          bladeColor: 0x38bdf8,
          bladeGlow: 0x06b6d4,
          metalness: 0.7,
          roughness: 0.35,
          limbRadius: 0.08,
        };
      case 'shadow':
        return {
          bodyColor: 0x09090b, // Pure midnight shadow
          accentColor: 0x38bdf8,
          energyColor: 0x60a5fa, // Cold cyan energy
          eyeColor: 0xffffff, // Pure piercing white eyes
          bladeColor: 0x64748b,
          bladeGlow: 0x38bdf8,
          metalness: 0.75,
          roughness: 0.35,
          limbRadius: 0.088,
        };
      case 'player':
      default:
        return {
          bodyColor: 0xdc2626, // Crimson red body (exact Reference Image B match)
          accentColor: 0xef4444,
          energyColor: 0x22c55e, // Vivid neon emerald green energy
          eyeColor: 0x4ade80, // Glowing emerald eyes & scars
          bladeColor: 0x1e293b, // Tactical dark blade
          bladeGlow: 0x22c55e, // Emerald energy edge
          metalness: 0.65,
          roughness: 0.3,
          limbRadius: 0.09,
        };
    }
  }

  static createStickmanSkeleton() {
    const root = new THREE.Bone();
    root.name = 'root';
    root.position.set(0, 0, 0);

    const hips = new THREE.Bone();
    hips.name = 'hips';
    hips.position.set(0, 1.05, 0);
    root.add(hips);

    const spine = new THREE.Bone();
    spine.name = 'spine';
    spine.position.set(0, 0.26, 0);
    hips.add(spine);

    const chest = new THREE.Bone();
    chest.name = 'chest';
    chest.position.set(0, 0.30, 0);
    spine.add(chest);

    const neck = new THREE.Bone();
    neck.name = 'neck';
    neck.position.set(0, 0.20, 0);
    chest.add(neck);

    const head = new THREE.Bone();
    head.name = 'head';
    head.position.set(0, 0.18, 0);
    neck.add(head);

    // Left Arm (Reference B: holds tactical dagger with dynamic forward posture)
    const leftShoulder = new THREE.Bone();
    leftShoulder.name = 'leftShoulder';
    leftShoulder.position.set(-0.22, 0.14, 0);
    chest.add(leftShoulder);

    const leftUpperArm = new THREE.Bone();
    leftUpperArm.name = 'leftUpperArm';
    leftUpperArm.position.set(-0.16, 0, 0);
    leftShoulder.add(leftUpperArm);

    const leftForearm = new THREE.Bone();
    leftForearm.name = 'leftForearm';
    leftForearm.position.set(0, -0.34, 0);
    leftUpperArm.add(leftForearm);

    const leftHand = new THREE.Bone();
    leftHand.name = 'leftHand';
    leftHand.position.set(0, -0.26, 0);
    leftForearm.add(leftHand);

    // Right Arm (Open hand channeling orbital energy blades in Reference B)
    const rightShoulder = new THREE.Bone();
    rightShoulder.name = 'rightShoulder';
    rightShoulder.position.set(0.22, 0.14, 0);
    chest.add(rightShoulder);

    const rightUpperArm = new THREE.Bone();
    rightUpperArm.name = 'rightUpperArm';
    rightUpperArm.position.set(0.16, 0, 0);
    rightShoulder.add(rightUpperArm);

    const rightForearm = new THREE.Bone();
    rightForearm.name = 'rightForearm';
    rightForearm.position.set(0, -0.34, 0);
    rightUpperArm.add(rightForearm);

    const rightHand = new THREE.Bone();
    rightHand.name = 'rightHand';
    rightHand.position.set(0, -0.26, 0);
    rightForearm.add(rightHand);

    // Left Leg
    const leftThigh = new THREE.Bone();
    leftThigh.name = 'leftThigh';
    leftThigh.position.set(-0.16, -0.06, 0);
    hips.add(leftThigh);

    const leftCalf = new THREE.Bone();
    leftCalf.name = 'leftCalf';
    leftCalf.position.set(0, -0.46, 0);
    leftThigh.add(leftCalf);

    const leftFoot = new THREE.Bone();
    leftFoot.name = 'leftFoot';
    leftFoot.position.set(0, -0.42, 0.08);
    leftCalf.add(leftFoot);

    // Right Leg
    const rightThigh = new THREE.Bone();
    rightThigh.name = 'rightThigh';
    rightThigh.position.set(0.16, -0.06, 0);
    hips.add(rightThigh);

    const rightCalf = new THREE.Bone();
    rightCalf.name = 'rightCalf';
    rightCalf.position.set(0, -0.46, 0);
    rightThigh.add(rightCalf);

    const rightFoot = new THREE.Bone();
    rightFoot.name = 'rightFoot';
    rightFoot.position.set(0, -0.42, 0.08);
    rightCalf.add(rightFoot);

    return {
      root,
      hips,
      spine,
      chest,
      neck,
      head,
      leftShoulder,
      leftUpperArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightUpperArm,
      rightForearm,
      rightHand,
      leftThigh,
      leftCalf,
      leftFoot,
      rightThigh,
      rightCalf,
      rightFoot,
    };
  }

  static attachStickmanMeshes(bones, theme, type) {
    const r = theme.limbRadius;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: theme.bodyColor,
      metalness: theme.metalness,
      roughness: theme.roughness,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: theme.eyeColor,
    });

    const energyMat = new THREE.MeshBasicMaterial({
      color: theme.energyColor,
      transparent: true,
      opacity: 0.85,
    });

    // --- 1. HEAD (Spherical smooth stickman head with glowing eyes/scars) ---
    const headGeo = new THREE.SphereGeometry(0.24, 20, 20);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.castShadow = true;
    bones.head.add(headMesh);

    // Glowing Eyes / Slits (Reference Image B: angled glowing cross-slashes)
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 128;
    eyeCanvas.height = 128;
    const ctx = eyeCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Draw glowing cross scar eyes
    ctx.strokeStyle = type === 'player' ? '#4ade80' : '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.shadowColor = type === 'player' ? '#22c55e' : '#38bdf8';
    ctx.shadowBlur = 12;

    // Left eye slit
    ctx.beginPath();
    ctx.moveTo(32, 54);
    ctx.lineTo(54, 66);
    ctx.stroke();

    // Right eye slit
    ctx.beginPath();
    ctx.moveTo(96, 54);
    ctx.lineTo(74, 66);
    ctx.stroke();

    // Cross scar marks
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(43, 44);
    ctx.lineTo(43, 76);
    ctx.moveTo(85, 44);
    ctx.lineTo(85, 76);
    ctx.stroke();

    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
    const eyeFaceMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true,
      depthTest: true,
    });

    const eyePlaneGeo = new THREE.PlaneGeometry(0.32, 0.32);
    const eyeMesh = new THREE.Mesh(eyePlaneGeo, eyeFaceMat);
    eyeMesh.position.set(0, 0.02, 0.22);
    bones.head.add(eyeMesh);

    // Point Light for eye glow
    const eyeLight = new THREE.PointLight(theme.eyeColor, 1.2, 3.5);
    eyeLight.position.set(0, 0.02, 0.3);
    bones.head.add(eyeLight);

    // --- 2. TORSO & LIMBS (Smooth Capsule / Cylinder stickman limbs) ---
    // Neck
    const neckMesh = this.createStickLimb(0.07, 0.18, bodyMat);
    neckMesh.position.set(0, -0.09, 0);
    bones.neck.add(neckMesh);

    // Chest
    const chestMesh = this.createStickLimb(r * 1.35, 0.28, bodyMat);
    chestMesh.position.set(0, -0.14, 0);
    bones.chest.add(chestMesh);

    // Spine / Abdomen
    const spineMesh = this.createStickLimb(r * 1.15, 0.24, bodyMat);
    spineMesh.position.set(0, -0.12, 0);
    bones.spine.add(spineMesh);

    // Hips
    const hipsMesh = this.createStickLimb(r * 1.25, 0.16, bodyMat);
    hipsMesh.position.set(0, 0, 0);
    bones.hips.add(hipsMesh);

    // Left Arm
    const lUpperMesh = this.createStickLimb(r, 0.32, bodyMat);
    lUpperMesh.position.set(0, -0.16, 0);
    bones.leftUpperArm.add(lUpperMesh);

    const lForeMesh = this.createStickLimb(r * 0.9, 0.30, bodyMat);
    lForeMesh.position.set(0, -0.15, 0);
    bones.leftForearm.add(lForeMesh);

    // Left Hand (holds tactical blade)
    const lHandMesh = new THREE.Mesh(new THREE.SphereGeometry(r * 0.95, 12, 12), bodyMat);
    bones.leftHand.add(lHandMesh);

    // Right Arm
    const rUpperMesh = this.createStickLimb(r, 0.32, bodyMat);
    rUpperMesh.position.set(0, -0.16, 0);
    bones.rightUpperArm.add(rUpperMesh);

    const rForeMesh = this.createStickLimb(r * 0.9, 0.30, bodyMat);
    rForeMesh.position.set(0, -0.15, 0);
    bones.rightForearm.add(rForeMesh);

    // Right Hand (open channeling palm)
    const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(r * 0.95, 12, 12), bodyMat);
    bones.rightHand.add(rHandMesh);

    // Legs
    // Left Thigh
    const lThighMesh = this.createStickLimb(r * 1.1, 0.44, bodyMat);
    lThighMesh.position.set(0, -0.22, 0);
    bones.leftThigh.add(lThighMesh);

    const lCalfMesh = this.createStickLimb(r * 0.95, 0.42, bodyMat);
    lCalfMesh.position.set(0, -0.21, 0);
    bones.leftCalf.add(lCalfMesh);

    const lFootMesh = this.createStickFoot(r * 0.9, bodyMat);
    bones.leftFoot.add(lFootMesh);

    // Right Thigh
    const rThighMesh = this.createStickLimb(r * 1.1, 0.44, bodyMat);
    rThighMesh.position.set(0, -0.22, 0);
    bones.rightThigh.add(rThighMesh);

    const rCalfMesh = this.createStickLimb(r * 0.95, 0.42, bodyMat);
    rCalfMesh.position.set(0, -0.21, 0);
    bones.rightCalf.add(rCalfMesh);

    const rFootMesh = this.createStickFoot(r * 0.9, bodyMat);
    bones.rightFoot.add(rFootMesh);

    // --- 3. TACTICAL WEAPON (Hand Dagger / Short Sword in Left Hand, Reference B) ---
    const swordGroup = new THREE.Group();
    swordGroup.name = 'TacticalBlade';

    // Hilt
    const hiltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.set(0, 0, 0);
    swordGroup.add(hilt);

    // Guard
    const guardGeo = new THREE.BoxGeometry(0.04, 0.02, 0.14);
    const guard = new THREE.Mesh(guardGeo, hiltMat);
    guard.position.set(0, 0.1, 0);
    swordGroup.add(guard);

    // Sharp Blade
    const bladeGeo = new THREE.BoxGeometry(0.02, 0.85, 0.08);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: theme.bladeColor,
      metalness: 0.9,
      roughness: 0.2,
    });
    const swordBlade = new THREE.Mesh(bladeGeo, bladeMat);
    swordBlade.position.set(0, 0.52, 0);
    swordBlade.castShadow = true;
    swordGroup.add(swordBlade);

    // Glowing Energy Edge along the blade
    const edgeGeo = new THREE.BoxGeometry(0.025, 0.85, 0.015);
    const edge = new THREE.Mesh(edgeGeo, energyMat);
    edge.position.set(0, 0.52, 0.042);
    swordGroup.add(edge);

    // Orient and attach to hand
    swordGroup.rotation.x = Math.PI / 2;
    swordGroup.position.set(0, -0.1, 0.1);
    bones.leftHand.add(swordGroup);

    // --- 4. FLOATING ORBITAL ENERGY BLADE SHARDS (Exact Reference B Match) ---
    const orbitalShards = [];
    const numShards = 4;
    const shardGroup = new THREE.Group();
    shardGroup.name = 'OrbitalShards';

    for (let i = 0; i < numShards; i++) {
      // Angular crystalline polygon shard geometry
      const shardGeo = new THREE.ConeGeometry(0.09, 0.42, 4);
      const shardMat = new THREE.MeshStandardMaterial({
        color: theme.energyColor,
        emissive: theme.energyColor,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.rotation.z = Math.PI / 2;
      shardGroup.add(shard);

      orbitalShards.push({
        mesh: shard,
        baseAngle: (i / numShards) * Math.PI * 2,
        radius: 0.95 + (i % 2) * 0.35,
        heightOffset: (i - 1.5) * 0.35,
        orbitSpeed: 2.2 + (i * 0.4),
      });
    }
    bones.chest.add(shardGroup);

    // --- 5. SWIRLING NEON ENERGY RIBBON RING (Reference Image B) ---
    const ribbonGeo = new THREE.TorusGeometry(0.85, 0.022, 12, 48);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: theme.energyColor,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const energyRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    energyRibbon.rotation.x = Math.PI / 3;
    energyRibbon.rotation.y = Math.PI / 6;
    bones.chest.add(energyRibbon);

    return {
      swordMesh: swordGroup,
      swordBlade,
      energyRibbon,
      orbitalShards,
      eyeMesh,
    };
  }

  static createStickLimb(radius, length, material) {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 12);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return mesh;
  }

  static createStickFoot(radius, material) {
    const geo = new THREE.BoxGeometry(radius * 1.8, radius * 0.9, radius * 2.8);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, -0.05, 0.08);
    mesh.castShadow = true;
    return mesh;
  }
}
