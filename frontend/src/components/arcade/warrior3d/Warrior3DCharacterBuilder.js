import * as THREE from 'three';

/**
 * Warrior3DCharacterBuilder.js — Procedural 3D Humanoid Fantasy Warrior Rig & Mesh
 * ==============================================================================
 * Constructs realistic armored fantasy warriors with standard humanoid skeleton,
 * articulated armor plates, glowing visors, broadswords, shields, and battle capes.
 * Supports Player, Dark Swordsman, Shadow Assassin, Armored Knight, and Dark Commander Boss.
 */
export class Warrior3DCharacterBuilder {
  /**
   * Builds an articulated, rigged humanoid warrior character.
   * @param {Object} options Configuration options
   * @param {'player'|'swordsman'|'assassin'|'knight'|'boss'} options.type Character archetype
   * @param {number} options.scale Overall scale multiplier (default 1.0)
   * @returns {Object} { group, skeleton, bones, weaponBox, eyeLight, capeMesh }
   */
  static buildWarrior(options = {}) {
    const type = options.type || 'player';
    const scale = options.scale || (type === 'boss' ? 1.45 : 1.0);

    const group = new THREE.Group();
    group.name = `Warrior_${type}`;

    // 1. Color Palettes and Materials per Archetype
    const theme = this.getTheme(type);

    // 2. Build Humanoid Bone Hierarchy (16 articulated bones)
    const bones = this.createHumanoidSkeleton();
    const skeleton = new THREE.Skeleton(Object.values(bones));

    // 3. Attach Armor Geometry and Details to Specific Bones
    const parts = this.attachArmoredBodyParts(bones, theme, type);

    // 4. Assemble Group & Scale
    group.add(bones.root);
    group.scale.set(scale, scale, scale);

    return {
      group,
      skeleton,
      bones,
      swordMesh: parts.swordMesh,
      swordBlade: parts.swordBlade,
      shieldMesh: parts.shieldMesh,
      capeMesh: parts.capeMesh,
      eyeGlow: parts.eyeGlow,
      theme,
      type,
    };
  }

  static getTheme(type) {
    switch (type) {
      case 'boss':
        return {
          primary: 0x09090b, // obsidian black
          secondary: 0x991b1b, // blood crimson
          accent: 0xf59e0b, // burning rune amber
          eyeColor: 0xff0000, // pure burning red
          bladeColor: 0x7f1d1d,
          bladeGlow: 0xef4444,
          capeColor: 0x450a0a,
          metalness: 0.9,
          roughness: 0.25,
        };
      case 'knight':
        return {
          primary: 0x1f2937, // dark fortress iron
          secondary: 0x374151,
          accent: 0xd97706, // bronze trim
          eyeColor: 0xf59e0b, // amber gaze
          bladeColor: 0x94a3b8,
          bladeGlow: 0xf59e0b,
          capeColor: 0x1e293b,
          metalness: 0.85,
          roughness: 0.35,
        };
      case 'assassin':
        return {
          primary: 0x0f172a, // midnight shadow
          secondary: 0x1e1b4b,
          accent: 0x7c3aed, // dark violet
          eyeColor: 0xa855f7, // glowing purple
          bladeColor: 0x64748b,
          bladeGlow: 0xa855f7,
          capeColor: 0x020617,
          metalness: 0.7,
          roughness: 0.5,
        };
      case 'swordsman':
        return {
          primary: 0x18181b, // charcoal steel
          secondary: 0x27272a,
          accent: 0xb91c1c, // dark blood
          eyeColor: 0xef4444, // crimson glare
          bladeColor: 0x94a3b8,
          bladeGlow: 0xef4444,
          capeColor: 0x1c1917,
          metalness: 0.85,
          roughness: 0.35,
        };
      case 'player':
      default:
        return {
          primary: 0x1e293b, // polished steel plate
          secondary: 0x334155, // slate iron
          accent: 0x0284c7, // royal azure trim
          eyeColor: 0x38bdf8, // glowing cyan gaze
          bladeColor: 0xe2e8f0, // gleaming silver
          bladeGlow: 0x38bdf8,
          capeColor: 0x1d4ed8, // royal blue cape
          metalness: 0.9,
          roughness: 0.25,
        };
    }
  }

  static createHumanoidSkeleton() {
    const root = new THREE.Bone();
    root.name = 'root';
    root.position.set(0, 0, 0);

    const hips = new THREE.Bone();
    hips.name = 'hips';
    hips.position.set(0, 1.05, 0);
    root.add(hips);

    const spine = new THREE.Bone();
    spine.name = 'spine';
    spine.position.set(0, 0.28, 0);
    hips.add(spine);

    const chest = new THREE.Bone();
    chest.name = 'chest';
    chest.position.set(0, 0.32, 0);
    spine.add(chest);

    const neck = new THREE.Bone();
    neck.name = 'neck';
    neck.position.set(0, 0.22, 0);
    chest.add(neck);

    const head = new THREE.Bone();
    head.name = 'head';
    head.position.set(0, 0.16, 0);
    neck.add(head);

    // Left Arm
    const leftShoulder = new THREE.Bone();
    leftShoulder.name = 'leftShoulder';
    leftShoulder.position.set(-0.24, 0.18, 0);
    chest.add(leftShoulder);

    const leftUpperArm = new THREE.Bone();
    leftUpperArm.name = 'leftUpperArm';
    leftUpperArm.position.set(-0.18, 0, 0);
    leftShoulder.add(leftUpperArm);

    const leftForearm = new THREE.Bone();
    leftForearm.name = 'leftForearm';
    leftForearm.position.set(0, -0.32, 0);
    leftUpperArm.add(leftForearm);

    const leftHand = new THREE.Bone();
    leftHand.name = 'leftHand';
    leftHand.position.set(0, -0.28, 0);
    leftForearm.add(leftHand);

    // Right Arm (Weapon Arm)
    const rightShoulder = new THREE.Bone();
    rightShoulder.name = 'rightShoulder';
    rightShoulder.position.set(0.24, 0.18, 0);
    chest.add(rightShoulder);

    const rightUpperArm = new THREE.Bone();
    rightUpperArm.name = 'rightUpperArm';
    rightUpperArm.position.set(0.18, 0, 0);
    rightShoulder.add(rightUpperArm);

    const rightForearm = new THREE.Bone();
    rightForearm.name = 'rightForearm';
    rightForearm.position.set(0, -0.32, 0);
    rightUpperArm.add(rightForearm);

    const rightHand = new THREE.Bone();
    rightHand.name = 'rightHand';
    rightHand.position.set(0, -0.28, 0);
    rightForearm.add(rightHand);

    // Left Leg
    const leftThigh = new THREE.Bone();
    leftThigh.name = 'leftThigh';
    leftThigh.position.set(-0.2, -0.08, 0);
    hips.add(leftThigh);

    const leftCalf = new THREE.Bone();
    leftCalf.name = 'leftCalf';
    leftCalf.position.set(0, -0.46, 0);
    leftThigh.add(leftCalf);

    const leftFoot = new THREE.Bone();
    leftFoot.name = 'leftFoot';
    leftFoot.position.set(0, -0.44, 0.08);
    leftCalf.add(leftFoot);

    // Right Leg
    const rightThigh = new THREE.Bone();
    rightThigh.name = 'rightThigh';
    rightThigh.position.set(0.2, -0.08, 0);
    hips.add(rightThigh);

    const rightCalf = new THREE.Bone();
    rightCalf.name = 'rightCalf';
    rightCalf.position.set(0, -0.46, 0);
    rightThigh.add(rightCalf);

    const rightFoot = new THREE.Bone();
    rightFoot.name = 'rightFoot';
    rightFoot.position.set(0, -0.44, 0.08);
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

  static attachArmoredBodyParts(bones, theme, type) {
    const armorMat = new THREE.MeshStandardMaterial({
      color: theme.primary,
      metalness: theme.metalness,
      roughness: theme.roughness,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: theme.accent,
      metalness: 0.9,
      roughness: 0.2,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });

    // 1. Pelvis / Hips (Armored Fauld and Tassets)
    const hipsGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.28, 8);
    const hipsMesh = new THREE.Mesh(hipsGeo, armorMat);
    hipsMesh.position.set(0, 0, 0);
    bones.hips.add(hipsMesh);

    // Tassets (Front & side thigh guards)
    [-0.14, 0.14].forEach((x) => {
      const tassetGeo = new THREE.BoxGeometry(0.16, 0.28, 0.06);
      const tasset = new THREE.Mesh(tassetGeo, trimMat);
      tasset.position.set(x, -0.16, 0.14);
      tasset.rotation.x = -0.15;
      bones.hips.add(tasset);
    });

    // 2. Spine & Chest (Segmented Cuirass / Breastplate)
    const spineGeo = new THREE.CylinderGeometry(0.25, 0.26, 0.26, 8);
    const spineMesh = new THREE.Mesh(spineGeo, jointMat);
    bones.spine.add(spineMesh);

    const chestGeo = new THREE.BoxGeometry(0.56, 0.42, 0.36);
    const chestMesh = new THREE.Mesh(chestGeo, armorMat);
    chestMesh.position.set(0, 0.08, 0);
    bones.chest.add(chestMesh);

    // Front Breastplate Runic Crest
    const crestGeo = new THREE.BoxGeometry(0.38, 0.3, 0.06);
    const crestMesh = new THREE.Mesh(crestGeo, trimMat);
    crestMesh.position.set(0, 0.08, 0.19);
    bones.chest.add(crestMesh);

    // 3. Neck & Helmet (Gothic Greathelm / Sallet)
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 8);
    const neckMesh = new THREE.Mesh(neckGeo, jointMat);
    bones.neck.add(neckMesh);

    const helmGeo = new THREE.BoxGeometry(0.34, 0.36, 0.38);
    const helmMesh = new THREE.Mesh(helmGeo, armorMat);
    helmMesh.position.set(0, 0.08, 0.02);
    bones.head.add(helmMesh);

    // Angular Visor Nose Guard
    const visorGeo = new THREE.ConeGeometry(0.16, 0.22, 4);
    visorGeo.rotateX(Math.PI / 2);
    const visorMesh = new THREE.Mesh(visorGeo, trimMat);
    visorMesh.position.set(0, 0.06, 0.22);
    bones.head.add(visorMesh);

    // Glowing Optical Eye Slit
    const eyeGeo = new THREE.BoxGeometry(0.24, 0.05, 0.06);
    const eyeMat = new THREE.MeshBasicMaterial({ color: theme.eyeColor });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.09, 0.21);
    bones.head.add(eyeMesh);

    const eyeGlow = new THREE.PointLight(theme.eyeColor, 0.8, 2.5);
    eyeGlow.position.set(0, 0.09, 0.28);
    bones.head.add(eyeGlow);

    // Boss Horned Crown
    if (type === 'boss') {
      [-0.18, 0.18].forEach((x) => {
        const hornGeo = new THREE.ConeGeometry(0.08, 0.5, 6);
        hornGeo.rotateZ(x > 0 ? -0.4 : 0.4);
        const horn = new THREE.Mesh(hornGeo, trimMat);
        horn.position.set(x, 0.32, 0);
        bones.head.add(horn);
      });
    }

    // 4. Shoulders (Articulated Layered Pauldrons)
    [-1, 1].forEach((side) => {
      const shoulderBone = side === -1 ? bones.leftShoulder : bones.rightShoulder;
      const pauldronGeo = new THREE.SphereGeometry(0.19, 8, 8);
      pauldronGeo.scale(1.2, 0.9, 1.4);
      const pauldron = new THREE.Mesh(pauldronGeo, trimMat);
      pauldron.position.set(side * 0.04, 0.06, 0);
      shoulderBone.add(pauldron);

      if (type === 'boss' || type === 'knight') {
        const spikeGeo = new THREE.ConeGeometry(0.06, 0.25, 4);
        const spike = new THREE.Mesh(spikeGeo, armorMat);
        spike.position.set(side * 0.04, 0.22, 0);
        shoulderBone.add(spike);
      }
    });

    // 5. Arms (Rerebraces & Vambraces)
    [-1, 1].forEach((side) => {
      const upperBone = side === -1 ? bones.leftUpperArm : bones.rightUpperArm;
      const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.3, 8);
      const armMesh = new THREE.Mesh(armGeo, armorMat);
      armMesh.position.set(0, -0.15, 0);
      upperBone.add(armMesh);

      const forearmBone = side === -1 ? bones.leftForearm : bones.rightForearm;
      const vambraceGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.28, 8);
      const vambrace = new THREE.Mesh(vambraceGeo, trimMat);
      vambrace.position.set(0, -0.14, 0);
      forearmBone.add(vambrace);

      const handBone = side === -1 ? bones.leftHand : bones.rightHand;
      const gauntletGeo = new THREE.BoxGeometry(0.11, 0.14, 0.11);
      const gauntlet = new THREE.Mesh(gauntletGeo, armorMat);
      gauntlet.position.set(0, -0.06, 0);
      handBone.add(gauntlet);
    });

    // 6. Weapon: Fantasy Steel Broadsword (Mounted to right hand)
    const swordMesh = new THREE.Group();
    swordMesh.name = 'Broadsword';

    // Pommel
    const pommelGeo = new THREE.OctahedronGeometry(0.06, 0);
    const pommel = new THREE.Mesh(pommelGeo, trimMat);
    pommel.position.set(0, 0.22, 0);
    swordMesh.add(pommel);

    // Grip
    const gripGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.24, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, 0.1, 0);
    swordMesh.add(grip);

    // Crossguard
    const crossGeo = new THREE.BoxGeometry(0.36, 0.05, 0.06);
    const crossguard = new THREE.Mesh(crossGeo, trimMat);
    crossguard.position.set(0, -0.03, 0);
    swordMesh.add(crossguard);

    // Blade
    const bladeGeo = new THREE.BoxGeometry(0.09, 1.25, 0.025);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: theme.bladeColor,
      metalness: 0.95,
      roughness: 0.15,
      emissive: theme.bladeGlow,
      emissiveIntensity: 0.35,
    });
    const swordBlade = new THREE.Mesh(bladeGeo, bladeMat);
    swordBlade.position.set(0, -0.68, 0);
    swordMesh.add(swordBlade);

    // Position sword firmly in right hand palm pointing forward/down
    swordMesh.rotation.x = -Math.PI / 2;
    swordMesh.rotation.y = Math.PI / 2;
    swordMesh.position.set(0, -0.08, 0);
    bones.rightHand.add(swordMesh);

    // 7. Shield (Left Arm for Knight & Player)
    let shieldMesh = null;
    if (type === 'player' || type === 'knight') {
      shieldMesh = new THREE.Group();
      shieldMesh.name = 'KiteShield';

      const sGeo = new THREE.BoxGeometry(0.48, 0.72, 0.04);
      const sMesh = new THREE.Mesh(sGeo, armorMat);
      shieldMesh.add(sMesh);

      const sRimGeo = new THREE.BoxGeometry(0.52, 0.76, 0.02);
      const sRim = new THREE.Mesh(sRimGeo, trimMat);
      sRim.position.set(0, 0, -0.015);
      shieldMesh.add(sRim);

      shieldMesh.position.set(-0.12, -0.12, 0.08);
      shieldMesh.rotation.y = Math.PI / 2;
      bones.leftForearm.add(shieldMesh);
    }

    // 8. Legs (Cuisses, Greaves, & Sabatons)
    [-1, 1].forEach((side) => {
      const thighBone = side === -1 ? bones.leftThigh : bones.rightThigh;
      const cuisseGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8);
      const cuisse = new THREE.Mesh(cuisseGeo, armorMat);
      cuisse.position.set(0, -0.22, 0);
      thighBone.add(cuisse);

      const calfBone = side === -1 ? bones.leftCalf : bones.rightCalf;
      const greaveGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.44, 8);
      const greave = new THREE.Mesh(greaveGeo, trimMat);
      greave.position.set(0, -0.22, 0);
      calfBone.add(greave);

      // Articulated Sabaton (Armored boot)
      const footBone = side === -1 ? bones.leftFoot : bones.rightFoot;
      const bootGeo = new THREE.BoxGeometry(0.14, 0.12, 0.28);
      const boot = new THREE.Mesh(bootGeo, armorMat);
      boot.position.set(0, 0.02, 0.08);
      footBone.add(boot);
    });

    // 9. Flowing Battle Cape (Attached to upper chest / back)
    const capeGeo = new THREE.PlaneGeometry(0.58, 1.35, 4, 8);
    capeGeo.rotateX(Math.PI);
    const capeMat = new THREE.MeshStandardMaterial({
      color: theme.capeColor,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.position.set(0, 0.12, -0.2);
    capeMesh.rotation.x = 0.12;
    bones.chest.add(capeMesh);

    return {
      swordMesh,
      swordBlade,
      shieldMesh,
      capeMesh,
      eyeGlow,
    };
  }
}
