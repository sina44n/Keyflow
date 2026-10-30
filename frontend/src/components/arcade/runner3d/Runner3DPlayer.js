import * as THREE from 'three';

/**
 * Runner3DPlayer — Articulated 3D Cybernetic Parkour Runner
 * =========================================================
 * Full procedural skeletal structure with fluid animations:
 * - Running: natural running stride with arm swing and vertical bob
 * - Jump: realistic tuck jump arc reaching 2.8m height
 * - Slide: low ground-skimming posture with boot spark trails
 * - Hack / Breach: forward energy punch shield shatter
 * - Stumble: momentary stagger on obstacle impact
 */
export class Runner3DPlayer {
  constructor() {
    this.group = new THREE.Group();

    // State machine
    this.state = 'running'; // running | jumping | sliding | hacking | stumbling
    this.stateTimer = 0;
    this.stridePhase = 0;
    this.speed = 14.0; // units/sec
    this.lane = 0; // -1 (left), 0 (center), +1 (right)
    this.currentLaneX = 0;

    this.buildCharacter();
  }

  buildCharacter() {
    // Materials
    this.suitMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.75,
    });

    this.neonArmorMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.9,
    });

    this.visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.95,
    });

    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
    });

    // Root Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.05;
    this.group.add(this.pelvis);

    // Torso / Chest Armor
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, this.suitMat);
    this.torso.position.y = 0.45;
    this.pelvis.add(this.torso);

    // Glowing Chest Core Reactor
    const coreGeo = new THREE.BoxGeometry(0.22, 0.28, 0.05);
    const core = new THREE.Mesh(coreGeo, this.neonArmorMat);
    core.position.set(0, 0.05, 0.16);
    this.torso.add(core);

    // Cyber Backpack / Thruster
    const packGeo = new THREE.BoxGeometry(0.35, 0.45, 0.15);
    const pack = new THREE.Mesh(packGeo, this.neonArmorMat);
    pack.position.set(0, 0.05, -0.2);
    this.torso.add(pack);

    // Thruster exhaust light
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 12);
    const exhaustL = new THREE.Mesh(exhaustGeo, this.visorMat);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.1, -0.15, -0.26);
    this.torso.add(exhaustL);

    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.1;
    this.torso.add(exhaustR);

    // Neck & Head with Cyber Helmet
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.45;
    this.torso.add(headGroup);

    const helmetGeo = new THREE.BoxGeometry(0.32, 0.35, 0.34);
    const helmet = new THREE.Mesh(helmetGeo, this.suitMat);
    headGroup.add(helmet);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
    const visor = new THREE.Mesh(visorGeo, this.visorMat);
    visor.position.set(0, 0.02, 0.18);
    headGroup.add(visor);

    // ARMS
    this.armL = this.createLimb(-0.38, 0.32, true);
    this.armR = this.createLimb(0.38, 0.32, true);
    this.torso.add(this.armL.shoulder);
    this.torso.add(this.armR.shoulder);

    // LEGS
    this.legL = this.createLimb(-0.18, 0, false);
    this.legR = this.createLimb(0.18, 0, false);
    this.pelvis.add(this.legL.hip);
    this.pelvis.add(this.legR.hip);

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.group.add(this.shadow);
  }

  createLimb(xOffset, yOffset, isArm) {
    if (isArm) {
      const shoulder = new THREE.Group();
      shoulder.position.set(xOffset, yOffset, 0);

      const upperGeo = new THREE.BoxGeometry(0.14, 0.35, 0.14);
      const upper = new THREE.Mesh(upperGeo, this.suitMat);
      upper.position.y = -0.16;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -0.32;
      shoulder.add(elbow);

      const foreGeo = new THREE.BoxGeometry(0.12, 0.32, 0.12);
      const forearm = new THREE.Mesh(foreGeo, this.neonArmorMat);
      forearm.position.y = -0.14;
      elbow.add(forearm);

      return { shoulder, elbow };
    } else {
      const hip = new THREE.Group();
      hip.position.set(xOffset, yOffset, 0);

      const thighGeo = new THREE.BoxGeometry(0.18, 0.48, 0.18);
      const thigh = new THREE.Mesh(thighGeo, this.suitMat);
      thigh.position.y = -0.22;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.45;
      hip.add(knee);

      const shinGeo = new THREE.BoxGeometry(0.16, 0.44, 0.16);
      const shin = new THREE.Mesh(shinGeo, this.neonArmorMat);
      shin.position.y = -0.2;
      knee.add(shin);

      // Foot / Sneaker
      const footGeo = new THREE.BoxGeometry(0.18, 0.12, 0.32);
      const foot = new THREE.Mesh(footGeo, this.visorMat);
      foot.position.set(0, -0.42, 0.08);
      knee.add(foot);

      return { hip, knee };
    }
  }

  jump() {
    if (this.state === 'jumping') return;
    this.state = 'jumping';
    this.stateTimer = 0;
  }

  slide() {
    if (this.state === 'sliding') return;
    this.state = 'sliding';
    this.stateTimer = 0;
  }

  hack() {
    this.state = 'hacking';
    this.stateTimer = 0;
  }

  stumble() {
    this.state = 'stumbling';
    this.stateTimer = 0;
  }

  changeLane(targetLane) {
    this.lane = Math.max(-1, Math.min(1, targetLane));
  }

  update(dt) {
    this.stateTimer += dt;

    // Smooth lane interpolation with dynamic banking lean
    const targetX = this.lane * 3.0;
    const diffX = targetX - this.currentLaneX;
    this.currentLaneX = THREE.MathUtils.lerp(this.currentLaneX, targetX, 0.2);
    this.group.position.x = this.currentLaneX;

    const targetBank = THREE.MathUtils.clamp(-diffX * 0.18, -0.35, 0.35);
    this.pelvis.rotation.z = THREE.MathUtils.lerp(this.pelvis.rotation.z, targetBank, 0.25);

    // Animation state machine
    switch (this.state) {
      case 'jumping': {
        const jumpDuration = 0.72;
        const progress = Math.min(1.0, this.stateTimer / jumpDuration);
        // Parabolic rise and fall
        const jumpHeight = Math.sin(progress * Math.PI) * 2.8;
        this.pelvis.position.y = 1.05 + jumpHeight;

        // Tuck legs in air
        this.legL.hip.rotation.x = -0.95;
        this.legR.hip.rotation.x = -0.85;
        this.legL.knee.rotation.x = 1.4;
        this.legR.knee.rotation.x = 1.3;

        // Arms reach forward for balance
        this.armL.shoulder.rotation.x = -0.8;
        this.armR.shoulder.rotation.x = -0.8;
        this.torso.rotation.x = 0.15;

        // Shadow scales down when high in the air
        const shadowScale = Math.max(0.35, 1.0 - jumpHeight * 0.25);
        this.shadow.scale.set(shadowScale, shadowScale, shadowScale);

        if (progress >= 1.0) {
          this.state = 'running';
          this.pelvis.position.y = 1.05;
          this.shadow.scale.set(1, 1, 1);
        }
        break;
      }

      case 'sliding': {
        const slideDuration = 0.65;
        const progress = Math.min(1.0, this.stateTimer / slideDuration);

        // Character ducks down low
        this.pelvis.position.y = 0.45;
        this.torso.rotation.x = -0.85; // Lean back

        // Front leg forward, back leg tucked
        this.legL.hip.rotation.x = -1.2;
        this.legL.knee.rotation.x = 0.2;
        this.legR.hip.rotation.x = 0.6;
        this.legR.knee.rotation.x = 1.6;

        this.armL.shoulder.rotation.x = 0.8;
        this.armR.shoulder.rotation.x = 0.8;

        if (progress >= 1.0) {
          this.state = 'running';
          this.pelvis.position.y = 1.05;
          this.torso.rotation.x = 0;
        }
        break;
      }

      case 'hacking': {
        const hackDuration = 0.45;
        const progress = Math.min(1.0, this.stateTimer / hackDuration);

        // Forward punch
        this.torso.rotation.y = Math.sin(progress * Math.PI) * 0.4;
        this.armR.shoulder.rotation.x = -1.5;
        this.armR.elbow.rotation.x = -0.2;

        if (progress >= 1.0) {
          this.state = 'running';
          this.torso.rotation.y = 0;
        }
        break;
      }

      case 'stumbling': {
        const stumbleDuration = 0.55;
        const progress = Math.min(1.0, this.stateTimer / stumbleDuration);

        this.torso.rotation.x = Math.sin(progress * Math.PI * 4) * 0.25 - 0.2;
        this.pelvis.position.y = 1.05 - Math.sin(progress * Math.PI) * 0.25;

        if (progress >= 1.0) {
          this.state = 'running';
          this.torso.rotation.x = 0;
          this.pelvis.position.y = 1.05;
        }
        break;
      }

      case 'running':
      default: {
        const strideSpeed = this.speed * 0.85;
        this.stridePhase += dt * strideSpeed;

        // Alternating leg swing
        const legSwing = Math.sin(this.stridePhase);
        this.legL.hip.rotation.x = legSwing * 0.72;
        this.legR.hip.rotation.x = -legSwing * 0.72;

        // Knees bend during backward kick
        this.legL.knee.rotation.x = Math.max(0, -legSwing * 0.95);
        this.legR.knee.rotation.x = Math.max(0, legSwing * 0.95);

        // Opposing arm swings
        this.armL.shoulder.rotation.x = -legSwing * 0.65;
        this.armR.shoulder.rotation.x = legSwing * 0.65;
        this.armL.elbow.rotation.x = -0.45;
        this.armR.elbow.rotation.x = -0.45;

        // Running bounce & forward lean
        this.pelvis.position.y = 1.05 + Math.abs(Math.sin(this.stridePhase * 2)) * 0.12;
        this.torso.rotation.x = 0.14; // Forward aerodynamic posture
        break;
      }
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

