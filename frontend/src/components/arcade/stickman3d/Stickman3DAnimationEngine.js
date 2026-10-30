import * as THREE from 'three';

/**
 * Stickman3DAnimationEngine.js — Acrobatic Stickman Martial Arts & Blade Kinematics
 * ==============================================================================
 * Drives the 16-bone stickman humanoid rig based on Reference Video 1 & 2:
 * - Ultra-fluid bouncing ready idle with breathing torso & orbiting energy shards
 * - Low-angle ninja dash forward & evasive back-spring
 * - High-speed martial arts & sword slashes:
 *   - 'slash': horizontal high-velocity waist slash
 *   - 'strike': upward diagonal cutting thrust
 *   - 'cleave': high-arc overhead vertical smash
 *   - 'flurry': rapid 3-hit combination
 *   - 'cyclone': 360° spinning aerial blade vortex
 *   - 'bladeStorm': multi-directional energy burst
 * - Defensive cross-guard 'block' & precision 'parry'
 * - Low tumble 'dodge' / 'roll' under incoming strikes
 * - Impact stagger, tumble knockback, dramatic defeat, and victory flourish
 */
export class Stickman3DAnimationEngine {
  constructor(bones, options = {}) {
    this.bones = bones;
    this.orbitalShards = options.orbitalShards || [];
    this.energyRibbon = options.energyRibbon || null;
    this.isBoss = options.isBoss || false;

    // Active state
    this.currentState = 'idle';
    this.previousState = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.transitionProgress = 1.0;
    this.transitionTime = 0.12; // 120ms ultra-snappy martial transitions

    // Combat flags
    this.activeHitWindow = false; // True during the damage-dealing frames of a swing
    this.comboStep = 1;

    // Bone rotations tracking
    this.targetRotations = {};
    this.currentRotations = {};
    this.boneNames = Object.keys(bones);

    for (const name of this.boneNames) {
      this.targetRotations[name] = new THREE.Euler(0, 0, 0, 'XYZ');
      this.currentRotations[name] = new THREE.Euler(0, 0, 0, 'XYZ');
    }

    this.baseHipsY = bones.hips ? bones.hips.position.y : 1.05;
    this.orbitClock = 0;
  }

  /**
   * Set animation state with duration
   */
  setState(newState, duration = 0, force = false) {
    if (this.currentState === newState && !force) return;
    if (this.currentState === 'death') return; // Cannot cancel defeat

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTimer = 0;
    this.stateDuration = duration > 0 ? duration : this.getDefaultDuration(newState);
    this.transitionProgress = 0;
    this.activeHitWindow = false;
  }

  getDefaultDuration(state) {
    switch (state) {
      case 'slash': return 0.28;
      case 'strike': return 0.32;
      case 'cleave': return 0.45;
      case 'flurry': return 0.58;
      case 'cyclone': return 0.55;
      case 'bladeStorm': return 0.75;
      case 'parry': return 0.28;
      case 'block': return 0.4;
      case 'dodge': return 0.42;
      case 'advance': return 0.35;
      case 'retreat': return 0.35;
      case 'leap': return 0.55;
      case 'hit': return 0.26;
      case 'knockback': return 0.55;
      case 'death': return 1.8;
      case 'victory': return 2.0;
      default: return 0;
    }
  }

  /**
   * Main per-frame update loop
   */
  update(delta, moveVelocity = { x: 0, z: 0 }, isSprinting = false) {
    if (!this.bones.root) return;

    this.stateTimer += delta;
    this.orbitClock += delta;

    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta / this.transitionTime);
    }

    const moveSpeed = Math.hypot(moveVelocity.x, moveVelocity.z);
    const isMoving = moveSpeed > 0.05;

    // State progression logic
    this.handleStateLogic(delta, isMoving);

    // Compute target bone angles
    this.computeBonePoses(delta, moveSpeed);

    // Smoothly apply target rotations to actual Three.js bones
    this.applyBoneTransforms(delta);

    // Update floating orbital energy blade shards and swirling ribbons (Reference B)
    this.updateOrbitalFX(delta);
  }

  handleStateLogic(delta, isMoving) {
    switch (this.currentState) {
      case 'slash': {
        const p = this.stateTimer / this.stateDuration;
        this.activeHitWindow = p >= 0.25 && p <= 0.75;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'strike': {
        const p = this.stateTimer / this.stateDuration;
        this.activeHitWindow = p >= 0.22 && p <= 0.70;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'cleave': {
        const p = this.stateTimer / this.stateDuration;
        this.activeHitWindow = p >= 0.40 && p <= 0.72;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'flurry': {
        const p = this.stateTimer / this.stateDuration;
        // 3 distinct hit bursts
        this.activeHitWindow = (p >= 0.15 && p <= 0.35) || (p >= 0.45 && p <= 0.65) || (p >= 0.75 && p <= 0.92);
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'cyclone': {
        const p = this.stateTimer / this.stateDuration;
        this.activeHitWindow = p >= 0.20 && p <= 0.85;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'bladeStorm': {
        const p = this.stateTimer / this.stateDuration;
        this.activeHitWindow = p >= 0.18 && p <= 0.88;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'parry':
      case 'dodge':
      case 'advance':
      case 'retreat':
      case 'leap':
      case 'hit':
      case 'knockback': {
        this.activeHitWindow = false;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? 'run' : 'idle');
        }
        break;
      }

      case 'block': {
        this.activeHitWindow = false;
        // Held by player or AI
        break;
      }

      case 'death':
      case 'victory': {
        this.activeHitWindow = false;
        break;
      }

      default: {
        if (isMoving) {
          if (this.currentState !== 'run' && this.currentState !== 'walk' && this.currentState !== 'block') {
            this.setState('run');
          }
        } else {
          if (this.currentState !== 'idle' && this.currentState !== 'block') {
            this.setState('idle');
          }
        }
        break;
      }
    }
  }

  resetTargetRotations() {
    for (const name of this.boneNames) {
      this.targetRotations[name].set(0, 0, 0);
    }
  }

  /**
   * Compute procedural bone angles
   */
  computeBonePoses(delta, moveSpeed) {
    this.resetTargetRotations();

    const t = this.stateTimer;
    const p = this.stateDuration > 0 ? Math.min(1.0, t / this.stateDuration) : 0;

    switch (this.currentState) {
      case 'idle': {
        // High-energy bouncing anime stickman ready pose (Reference Video 1)
        const bounce = Math.abs(Math.sin(this.orbitClock * 4.5)) * 0.05;
        const sway = Math.sin(this.orbitClock * 2.2) * 0.03;

        this.targetRotations.hips.set(0.12, sway, 0);
        this.targetRotations.spine.set(-0.06, 0, 0);
        this.targetRotations.chest.set(0.08, 0.25, 0); // Torso angled forward
        this.targetRotations.head.set(-0.06, -0.22, 0); // Head focused on opponent

        // Left Arm holding tactical blade forward (Reference B posture)
        this.targetRotations.leftShoulder.set(0, 0, 0);
        this.targetRotations.leftUpperArm.set(0.55, 0.4, -0.3);
        this.targetRotations.leftForearm.set(0.95, -0.3, 0);
        this.targetRotations.leftHand.set(-0.25, 0, 0);

        // Right Arm (open palm channeling energy, Reference B)
        this.targetRotations.rightShoulder.set(0, 0, 0);
        this.targetRotations.rightUpperArm.set(-0.25, -0.5, 0.45);
        this.targetRotations.rightForearm.set(0.65, 0.4, 0);
        this.targetRotations.rightHand.set(0.35, 0.2, 0);

        // Dynamic athletic stance: knees bent ready to spring
        this.targetRotations.leftThigh.set(0.35, -0.15, 0);
        this.targetRotations.leftCalf.set(-0.65, 0, 0);
        this.targetRotations.rightThigh.set(-0.25, 0.15, 0);
        this.targetRotations.rightCalf.set(-0.45, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - bounce;
        }
        break;
      }

      case 'run':
      case 'walk': {
        // High-velocity ninja sprint: deep forward torso tilt
        const cadence = 14.0;
        const stride = Math.sin(this.orbitClock * cadence);
        const amp = 0.85;
        const forwardLean = 0.45; // Ninja lean forward

        this.targetRotations.hips.set(forwardLean * 0.6, stride * 0.12, 0);
        this.targetRotations.spine.set(forwardLean * 0.8, -stride * 0.1, 0);
        this.targetRotations.chest.set(forwardLean, -stride * 0.14, 0);
        this.targetRotations.head.set(-forwardLean * 0.7, 0, 0);

        // Legs sprint stride
        this.targetRotations.leftThigh.set(stride * amp, 0, 0);
        this.targetRotations.leftCalf.set(stride > 0 ? -stride * amp * 1.4 : -0.15, 0, 0);

        this.targetRotations.rightThigh.set(-stride * amp, 0, 0);
        this.targetRotations.rightCalf.set(-stride > 0 ? stride * amp * 1.4 : -0.15, 0, 0);

        // Weapon arm angled back in aerodynamic sprint
        this.targetRotations.leftUpperArm.set(-0.55, 0.3, -0.3);
        this.targetRotations.leftForearm.set(0.45, 0, 0);

        // Channeling arm trailing back
        this.targetRotations.rightUpperArm.set(-0.75, -0.2, 0.3);
        this.targetRotations.rightForearm.set(0.35, 0, 0);

        if (this.bones.hips) {
          const bounce = Math.abs(Math.sin(this.orbitClock * cadence)) * 0.08;
          this.bones.hips.position.y = this.baseHipsY - bounce;
        }
        break;
      }

      case 'slash': {
        // High-velocity horizontal waist slash (Video 1 & 2)
        const windup = p < 0.25 ? p / 0.25 : 1.0;
        const release = p >= 0.25 && p < 0.70 ? (p - 0.25) / 0.45 : p >= 0.70 ? 1.0 : 0.0;
        const recover = p >= 0.70 ? (p - 0.70) / 0.30 : 0.0;

        const twist = windup * 0.6 - release * 1.4 + recover * 0.8;
        this.targetRotations.hips.set(0.12, twist * 0.5, 0);
        this.targetRotations.spine.set(0.08, twist * 0.8, 0);
        this.targetRotations.chest.set(0.15, twist, 0);

        // Blade horizontal sweep across torso
        const armX = 0.4 + windup * 0.4 - release * 0.8 + recover * 0.4;
        const armY = -0.4 + windup * 0.9 - release * 1.8 + recover * 0.9;
        this.targetRotations.leftUpperArm.set(armX, armY, 0.4);
        this.targetRotations.leftForearm.set(0.95 - release * 0.4, 0.4, 0);

        // Right arm counter balance
        this.targetRotations.rightUpperArm.set(-0.4, -0.6, 0.5);

        // Braced lunge
        this.targetRotations.leftThigh.set(0.4, -0.2, 0);
        this.targetRotations.leftCalf.set(-0.6, 0, 0);
        this.targetRotations.rightThigh.set(-0.3, 0.2, 0);
        this.targetRotations.rightCalf.set(-0.35, 0, 0);
        break;
      }

      case 'strike': {
        // Fast upward diagonal piercing cut
        const windup = p < 0.22 ? p / 0.22 : 1.0;
        const release = p >= 0.22 && p < 0.65 ? (p - 0.22) / 0.43 : p >= 0.65 ? 1.0 : 0.0;
        const recover = p >= 0.65 ? (p - 0.65) / 0.35 : 0.0;

        const twist = -windup * 0.5 + release * 1.3 - recover * 0.8;
        this.targetRotations.chest.set(0.2, twist, 0);

        // Blade thrusts low to high
        const armX = -0.2 - windup * 0.5 + release * 1.5 - recover * 0.8;
        this.targetRotations.leftUpperArm.set(armX, 0.3, -0.2);
        this.targetRotations.leftForearm.set(0.6 + release * 0.5, 0.3, 0);

        this.targetRotations.leftThigh.set(-0.25, 0, 0);
        this.targetRotations.rightThigh.set(0.45, 0, 0);
        this.targetRotations.rightCalf.set(-0.7, 0, 0);
        break;
      }

      case 'cleave': {
        // High overhead leaping cleave
        const windup = p < 0.40 ? p / 0.40 : 1.0;
        const release = p >= 0.40 && p < 0.68 ? (p - 0.40) / 0.28 : p >= 0.68 ? 1.0 : 0.0;
        const recover = p >= 0.68 ? (p - 0.68) / 0.32 : 0.0;

        const arch = -windup * 0.4 + release * 0.95 - recover * 0.55;
        this.targetRotations.chest.set(arch, 0, 0);

        // Both arms raised high then slammed down
        const armAngle = -windup * 1.8 + release * 2.9 - recover * 1.1;
        this.targetRotations.leftUpperArm.set(armAngle, 0.2, -0.2);
        this.targetRotations.leftForearm.set(windup * 0.7 - release * 0.3, 0, 0);

        this.targetRotations.rightUpperArm.set(armAngle, -0.2, 0.2);
        this.targetRotations.rightForearm.set(windup * 0.7 - release * 0.3, 0, 0);

        // Crouch impact
        const crouch = release * 0.45 - recover * 0.35;
        this.targetRotations.leftThigh.set(0.3 + crouch, 0, 0);
        this.targetRotations.leftCalf.set(-0.5 - crouch * 1.2, 0, 0);
        this.targetRotations.rightThigh.set(0.3 + crouch, 0, 0);
        this.targetRotations.rightCalf.set(-0.5 - crouch * 1.2, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - crouch * 0.4;
        }
        break;
      }

      case 'flurry': {
        // Rapid 3-hit combination (Left slash -> Right kick -> Blade burst)
        const subPhase = (p * 3) % 1.0;
        const hitIdx = Math.floor(p * 3);
        const wave = Math.sin(subPhase * Math.PI);

        this.targetRotations.chest.set(0.1, (hitIdx % 2 === 0 ? 1 : -1) * wave * 0.7, 0);
        this.targetRotations.leftUpperArm.set(0.3 + wave * 0.8, -wave * 0.9, 0);
        this.targetRotations.leftForearm.set(0.7 + wave * 0.5, 0, 0);

        // Kicking leg on second hit
        if (hitIdx === 1) {
          this.targetRotations.rightThigh.set(wave * 1.2, 0, 0);
          this.targetRotations.rightCalf.set(wave * 0.3, 0, 0);
        }
        break;
      }

      case 'cyclone': {
        // 360-degree spinning aerial blade vortex
        const spin = p * Math.PI * 4; // 2 complete spins
        this.targetRotations.hips.set(0.15, spin, 0);
        this.targetRotations.chest.set(0.1, spin, 0);

        // Arms stretched out horizontally holding blades
        this.targetRotations.leftUpperArm.set(0.1, 0.95, -0.95);
        this.targetRotations.leftForearm.set(0.1, 0, 0);
        this.targetRotations.rightUpperArm.set(0.1, -0.95, 0.95);
        this.targetRotations.rightForearm.set(0.1, 0, 0);

        // Airborne tuck
        const hop = Math.sin(p * Math.PI) * 0.5;
        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY + hop;
        }
        break;
      }

      case 'bladeStorm': {
        // High-velocity multi-angle teleporting dash slashes
        const spin = p * Math.PI * 6;
        this.targetRotations.chest.set(Math.sin(spin * 2) * 0.3, spin, 0);
        this.targetRotations.leftUpperArm.set(Math.cos(spin) * 0.8, Math.sin(spin) * 0.8, 0);
        this.targetRotations.rightUpperArm.set(-Math.cos(spin) * 0.8, -Math.sin(spin) * 0.8, 0);
        break;
      }

      case 'block': {
        // Defensive cross-guard with energy blade raised
        this.targetRotations.hips.set(0.18, 0, 0);
        this.targetRotations.chest.set(0.15, 0.15, 0);

        // Left Arm blade held across chest
        this.targetRotations.leftUpperArm.set(0.75, 0.45, -0.4);
        this.targetRotations.leftForearm.set(1.45, 0.55, 0);

        // Right Arm supporting
        this.targetRotations.rightUpperArm.set(0.75, -0.45, 0.4);
        this.targetRotations.rightForearm.set(1.45, -0.55, 0);

        // Low stable stance
        this.targetRotations.leftThigh.set(0.45, -0.2, 0);
        this.targetRotations.leftCalf.set(-0.7, 0, 0);
        this.targetRotations.rightThigh.set(-0.25, 0.2, 0);
        this.targetRotations.rightCalf.set(-0.6, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - 0.14;
        }
        break;
      }

      case 'parry': {
        // Deflection snap upward
        const snap = Math.sin(p * Math.PI);
        this.targetRotations.chest.set(-snap * 0.2, 0.3 * snap, 0);
        this.targetRotations.leftUpperArm.set(0.85 + snap * 0.5, 0.4, 0.2);
        this.targetRotations.leftForearm.set(1.6 + snap * 0.4, 0, 0);
        break;
      }

      case 'dodge': {
        // Low tuck tumble roll under attacks (Reference Video 1 Frame 2)
        const roll = p * Math.PI * 2;
        this.targetRotations.hips.set(roll, 0, 0);
        this.targetRotations.chest.set(0.6, 0, 0);

        this.targetRotations.leftUpperArm.set(1.4, 0, 0);
        this.targetRotations.leftForearm.set(1.6, 0, 0);
        this.targetRotations.rightUpperArm.set(1.4, 0, 0);
        this.targetRotations.rightForearm.set(1.6, 0, 0);

        this.targetRotations.leftThigh.set(1.3, 0, 0);
        this.targetRotations.leftCalf.set(-1.9, 0, 0);
        this.targetRotations.rightThigh.set(1.3, 0, 0);
        this.targetRotations.rightCalf.set(-1.9, 0, 0);

        if (this.bones.hips) {
          const dip = Math.sin(p * Math.PI) * 0.6;
          this.bones.hips.position.y = this.baseHipsY - dip;
        }
        break;
      }

      case 'advance': {
        // Forward acrobatic dash
        const dashLean = Math.sin(p * Math.PI) * 0.6;
        this.targetRotations.chest.set(dashLean, 0, 0);
        this.targetRotations.leftUpperArm.set(-0.6, 0.2, 0);
        this.targetRotations.rightUpperArm.set(-0.6, -0.2, 0);
        this.targetRotations.leftThigh.set(0.6 * dashLean, 0, 0);
        this.targetRotations.rightThigh.set(-0.6 * dashLean, 0, 0);
        break;
      }

      case 'retreat': {
        // Evasive back-hop
        const hop = Math.sin(p * Math.PI);
        this.targetRotations.chest.set(-0.3 * hop, 0, 0);
        this.targetRotations.leftUpperArm.set(0.6 * hop, 0, 0);
        this.targetRotations.rightUpperArm.set(0.6 * hop, 0, 0);
        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY + hop * 0.35;
        }
        break;
      }

      case 'leap': {
        // High acrobatic flip
        const flip = p * Math.PI * 2;
        this.targetRotations.hips.set(flip, 0, 0);
        const arc = Math.sin(p * Math.PI) * 1.2;
        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY + arc;
        }
        break;
      }

      case 'hit': {
        // Impact recoil: torso whipped back
        const recoil = Math.sin(p * Math.PI);
        this.targetRotations.hips.set(-recoil * 0.35, 0, 0);
        this.targetRotations.chest.set(-recoil * 0.55, 0, 0);
        this.targetRotations.head.set(recoil * 0.45, 0, 0);
        this.targetRotations.leftUpperArm.set(-recoil * 0.6, 0.3, 0);
        this.targetRotations.rightUpperArm.set(-recoil * 0.6, -0.3, 0);
        break;
      }

      case 'knockback': {
        // Tumble backwards to ground
        const fall = Math.sin(p * Math.PI);
        this.targetRotations.hips.set(-fall * 1.2, 0, 0);
        this.targetRotations.chest.set(-fall * 0.8, 0, 0);
        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - fall * 0.65;
        }
        break;
      }

      case 'death': {
        // Defeat collapse: slumps forward, energy dissipates
        const fall = Math.min(1.0, t / 1.0);
        const easing = fall * fall;
        this.targetRotations.hips.set(easing * 0.5, 0, 0);
        this.targetRotations.chest.set(easing * 0.85, 0, 0);
        this.targetRotations.head.set(easing * 0.5, 0, 0);

        this.targetRotations.leftThigh.set(easing * 1.6, 0, 0);
        this.targetRotations.leftCalf.set(-easing * 2.1, 0, 0);
        this.targetRotations.rightThigh.set(easing * 1.6, 0, 0);
        this.targetRotations.rightCalf.set(-easing * 2.1, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - easing * 0.78;
        }
        break;
      }

      case 'victory': {
        // Elegant blade flourish & heroic pose
        this.targetRotations.chest.set(-0.15, -0.2, 0);
        this.targetRotations.head.set(0.1, 0.2, 0);

        // Blade raised victoriously skyward
        this.targetRotations.leftUpperArm.set(-1.6, 0.2, 0);
        this.targetRotations.leftForearm.set(-0.2, 0, 0);

        // Other arm on hip
        this.targetRotations.rightUpperArm.set(0.3, -0.3, 0.5);
        this.targetRotations.rightForearm.set(1.4, -0.4, 0);
        break;
      }
    }
  }

  applyBoneTransforms(delta) {
    const lerpRate = Math.min(1.0, delta * 24.0); // Ultra-responsive smoothing

    for (const name of this.boneNames) {
      const bone = this.bones[name];
      if (!bone) continue;

      const curr = this.currentRotations[name];
      const target = this.targetRotations[name];

      curr.x += (target.x - curr.x) * lerpRate;
      curr.y += (target.y - curr.y) * lerpRate;
      curr.z += (target.z - curr.z) * lerpRate;

      bone.rotation.set(curr.x, curr.y, curr.z);
    }
  }

  /**
   * Update floating orbital energy blade shards and swirling ribbon ring (Reference B)
   */
  updateOrbitalFX(delta) {
    // 1. Orbital Shards revolving around chest
    if (this.orbitalShards && this.orbitalShards.length > 0) {
      for (const item of this.orbitalShards) {
        const angle = item.baseAngle + this.orbitClock * item.orbitSpeed;
        const x = Math.cos(angle) * item.radius;
        const z = Math.sin(angle) * item.radius;
        const y = item.heightOffset + Math.sin(this.orbitClock * 3.5 + item.baseAngle) * 0.12;

        item.mesh.position.set(x, y, z);
        item.mesh.rotation.y = angle + Math.PI / 2;
        item.mesh.rotation.x = Math.sin(this.orbitClock * 2.0) * 0.2;
      }
    }

    // 2. Swirling Energy Ribbon Ring (Reference B)
    if (this.energyRibbon) {
      this.energyRibbon.rotation.z += delta * 1.8;
      this.energyRibbon.rotation.x = Math.PI / 3 + Math.sin(this.orbitClock * 2.0) * 0.15;
    }
  }
}
