import * as THREE from 'three';

/**
 * Warrior3DAnimationEngine.js — Procedural Skeletal Animation & State Machine
 * =========================================================================
 * Drives the 16-bone humanoid skeleton with fluid procedural motion:
 * - Fluid Idle with breathing chest & resting stance
 * - Stride-synced Walk & Sprint (forward & strafe)
 * - 3-Stage Light Attack Combo Chain with distinct slash trajectories
 * - Crushing Heavy Attack with dramatic wind-up and downward impact
 * - 360° Whirlwind Attack
 * - Defensive Block & Deflection Parry
 * - Tactical Dodge / Roll with invincible frames
 * - Impact Flinch & Cinematic Death fall
 * - Cloth/Cape physics simulation & blade trail synchronization
 */
export class Warrior3DAnimationEngine {
  constructor(bones, options = {}) {
    this.bones = bones; // { root, hips, spine, chest, neck, head, leftShoulder, leftUpperArm, ... }
    this.capeMesh = options.capeMesh || null;
    this.isBoss = options.isBoss || false;

    // Current animation state
    this.currentState = 'idle';
    this.previousState = 'idle';
    this.transitionTime = 0.15; // 150ms blend
    this.transitionProgress = 1.0;

    // Timers
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.walkCycle = 0;
    this.capeCycle = 0;

    // Attack combo details
    this.comboIndex = 0; // 0: none, 1, 2, 3
    this.canQueueNextCombo = false;
    this.queuedCombo = false;
    this.activeHitWindow = false; // True during the damage-dealing frames of a swing

    // Target bone rotations (Euler)
    this.targetRotations = {};
    this.currentRotations = {};
    this.boneNames = Object.keys(bones);

    // Initialize bone rotation tracking
    for (const name of this.boneNames) {
      this.targetRotations[name] = new THREE.Euler(0, 0, 0, 'XYZ');
      this.currentRotations[name] = new THREE.Euler(0, 0, 0, 'XYZ');
    }

    // Default resting hips position
    this.baseHipsY = bones.hips ? bones.hips.position.y : 1.05;
  }

  /**
   * Set animation state with transition
   */
  setState(newState, duration = 0, force = false) {
    if (this.currentState === newState && !force) return;
    if (this.currentState === 'death') return; // Cannot cancel death

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTimer = 0;
    this.stateDuration = duration > 0 ? duration : this.getDefaultDuration(newState);
    this.transitionProgress = 0;
    this.activeHitWindow = false;
    this.canQueueNextCombo = false;
  }

  getDefaultDuration(state) {
    switch (state) {
      case 'lightAttack1': return 0.38;
      case 'lightAttack2': return 0.42;
      case 'lightAttack3': return 0.55;
      case 'heavyAttack': return 0.85;
      case 'whirlwind': return 0.70;
      case 'parry': return 0.32;
      case 'dodge': return 0.45;
      case 'hit': return 0.30;
      case 'death': return 2.0;
      default: return 0;
    }
  }

  /**
   * Main per-frame update loop
   */
  update(delta, moveVelocity = { x: 0, z: 0 }, isSprinting = false) {
    if (!this.bones.root) return;

    this.stateTimer += delta;
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta / this.transitionTime);
    }

    const moveSpeed = Math.hypot(moveVelocity.x, moveVelocity.z);
    const isMoving = moveSpeed > 0.05;

    // State progression logic
    this.handleStateLogic(delta, isMoving, isSprinting);

    // Calculate target bone angles based on active state
    this.computeBonePoses(delta, moveSpeed, isSprinting);

    // Apply smoothed bone rotations & positions
    this.applyBoneTransforms(delta);

    // Dynamic cape fluttering
    this.updateCapePhysics(delta, moveSpeed);
  }

  handleStateLogic(delta, isMoving, isSprinting) {
    // Attack and special action duration expiration
    switch (this.currentState) {
      case 'lightAttack1':
      case 'lightAttack2':
      case 'lightAttack3': {
        const progress = this.stateTimer / this.stateDuration;
        // Hit window: sword is actively cutting through air (30% to 75% of swing)
        this.activeHitWindow = progress >= 0.28 && progress <= 0.72;
        // Combo buffering window (after 50% of the attack has played)
        this.canQueueNextCombo = progress >= 0.48;

        if (this.stateTimer >= this.stateDuration) {
          if (this.queuedCombo && this.comboIndex < 3) {
            this.comboIndex++;
            this.queuedCombo = false;
            this.setState(`lightAttack${this.comboIndex}`, 0, true);
          } else {
            this.comboIndex = 0;
            this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
          }
        }
        break;
      }

      case 'heavyAttack': {
        const progress = this.stateTimer / this.stateDuration;
        // Heavy impact hits at 55% - 75%
        this.activeHitWindow = progress >= 0.50 && progress <= 0.75;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        }
        break;
      }

      case 'whirlwind': {
        const progress = this.stateTimer / this.stateDuration;
        this.activeHitWindow = progress >= 0.20 && progress <= 0.85;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        }
        break;
      }

      case 'parry': {
        this.activeHitWindow = false;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        }
        break;
      }

      case 'dodge': {
        this.activeHitWindow = false;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        }
        break;
      }

      case 'hit': {
        this.activeHitWindow = false;
        if (this.stateTimer >= this.stateDuration) {
          this.setState(isMoving ? (isSprinting ? 'run' : 'walk') : 'idle');
        }
        break;
      }

      case 'death': {
        this.activeHitWindow = false;
        // Freeze at final collapsed pose
        break;
      }

      case 'block': {
        this.activeHitWindow = false;
        // Held by player control
        break;
      }

      default: {
        // Locomotion
        if (isMoving) {
          const targetLocomotion = isSprinting ? 'run' : 'walk';
          if (this.currentState !== targetLocomotion && this.currentState !== 'block') {
            this.setState(targetLocomotion);
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

  /**
   * Reset all target rotations to neutral zero
   */
  resetTargetRotations() {
    for (const name of this.boneNames) {
      this.targetRotations[name].set(0, 0, 0);
    }
  }

  /**
   * Compute procedural bone angles for current state
   */
  computeBonePoses(delta, moveSpeed, isSprinting) {
    this.resetTargetRotations();

    const t = this.stateTimer;
    const p = this.stateDuration > 0 ? Math.min(1.0, t / this.stateDuration) : 0;

    switch (this.currentState) {
      case 'idle': {
        // Idle breathing and warrior stance
        const breath = Math.sin(t * 2.2) * 0.04;
        const sway = Math.sin(t * 1.2) * 0.02;

        this.targetRotations.hips.set(0.04, sway, 0);
        this.targetRotations.spine.set(-0.02 + breath * 0.5, 0, 0);
        this.targetRotations.chest.set(-0.04 + breath, -0.05, 0);
        this.targetRotations.neck.set(0.02, 0.05, 0);
        this.targetRotations.head.set(0.02, 0, 0);

        // Right arm holding sword angled forward
        this.targetRotations.rightShoulder.set(0, 0, 0);
        this.targetRotations.rightUpperArm.set(0.35, 0.15, -0.25);
        this.targetRotations.rightForearm.set(0.75, 0.35, 0.1);
        this.targetRotations.rightHand.set(-0.25, 0.1, 0.2);

        // Left arm holding shield guarding flank
        this.targetRotations.leftShoulder.set(0, 0, 0);
        this.targetRotations.leftUpperArm.set(0.25, -0.2, 0.2);
        this.targetRotations.leftForearm.set(0.85, -0.4, 0);
        this.targetRotations.leftHand.set(0, 0, 0);

        // Legs slightly staggered
        this.targetRotations.leftThigh.set(0.08, -0.1, 0);
        this.targetRotations.leftCalf.set(-0.12, 0, 0);
        this.targetRotations.rightThigh.set(-0.08, 0.1, 0);
        this.targetRotations.rightCalf.set(-0.10, 0, 0);

        // Subtle vertical hips breathing bob
        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY + Math.sin(t * 2.2) * 0.015;
        }
        break;
      }

      case 'walk':
      case 'run': {
        const isRun = this.currentState === 'run';
        const cadence = isRun ? 12.0 : 7.5;
        this.walkCycle += delta * cadence;

        const stride = Math.sin(this.walkCycle);
        const cosStride = Math.cos(this.walkCycle);
        const amp = isRun ? 0.75 : 0.45;
        const forwardLean = isRun ? 0.25 : 0.12;

        // Torso lean and counter-twist
        this.targetRotations.hips.set(forwardLean * 0.5, stride * 0.08, cosStride * 0.04);
        this.targetRotations.spine.set(forwardLean * 0.6, -stride * 0.06, 0);
        this.targetRotations.chest.set(forwardLean * 0.4, -stride * 0.08, 0);
        this.targetRotations.neck.set(-forwardLean * 0.4, stride * 0.04, 0);
        this.targetRotations.head.set(-forwardLean * 0.3, 0, 0);

        // Leg stride
        // Left Leg
        this.targetRotations.leftThigh.set(stride * amp, 0, 0);
        this.targetRotations.leftCalf.set(stride > 0 ? -stride * amp * 1.2 : -0.1, 0, 0);
        this.targetRotations.leftFoot.set(stride < -0.3 ? 0.25 : 0, 0, 0);

        // Right Leg (opposite phase)
        this.targetRotations.rightThigh.set(-stride * amp, 0, 0);
        this.targetRotations.rightCalf.set(-stride > 0 ? stride * amp * 1.2 : -0.1, 0, 0);
        this.targetRotations.rightFoot.set(-stride < -0.3 ? 0.25 : 0, 0, 0);

        // Arm counter-swing
        // Weapon arm controlled swing
        this.targetRotations.rightUpperArm.set(0.35 - stride * amp * 0.5, 0.1, -0.2);
        this.targetRotations.rightForearm.set(0.65, 0.2, 0);

        // Shield arm stabilized
        this.targetRotations.leftUpperArm.set(0.25 + stride * amp * 0.4, -0.2, 0.2);
        this.targetRotations.leftForearm.set(0.85, -0.3, 0);

        // Dynamic hips bounce
        if (this.bones.hips) {
          const bounce = Math.abs(Math.sin(this.walkCycle)) * (isRun ? 0.06 : 0.035);
          this.bones.hips.position.y = this.baseHipsY - bounce;
        }
        break;
      }

      case 'lightAttack1': {
        // Horizontal right-to-left slashing arc
        // p goes 0 -> 1
        const windup = p < 0.25 ? p / 0.25 : 1.0;
        const release = p >= 0.25 && p < 0.65 ? (p - 0.25) / 0.40 : p >= 0.65 ? 1.0 : 0.0;
        const recover = p >= 0.65 ? (p - 0.65) / 0.35 : 0.0;

        // Torso rotates right during windup, whips violently left during release
        const torsoTwist = windup * 0.55 - release * 1.25 + recover * 0.70;
        this.targetRotations.hips.set(0.08, torsoTwist * 0.5, 0);
        this.targetRotations.spine.set(0.05, torsoTwist * 0.8, 0);
        this.targetRotations.chest.set(0.08, torsoTwist, 0);

        // Right arm swings across chest
        const armX = 0.4 + windup * 0.3 - release * 0.6 + recover * 0.2;
        const armY = -0.3 + windup * 0.8 - release * 1.7 + recover * 0.9;
        const armZ = -0.2 - windup * 0.4 + release * 0.8 - recover * 0.4;
        this.targetRotations.rightUpperArm.set(armX, armY, armZ);
        this.targetRotations.rightForearm.set(0.85 - release * 0.35, 0.4, 0);
        this.targetRotations.rightHand.set(-0.3 + release * 0.6, 0.2, 0);

        // Shield pulled back for balance
        this.targetRotations.leftUpperArm.set(-0.25, -0.4, 0.4);
        this.targetRotations.leftForearm.set(0.65, -0.4, 0);

        // Braced legs
        this.targetRotations.leftThigh.set(0.2, -0.2, 0);
        this.targetRotations.leftCalf.set(-0.35, 0, 0);
        this.targetRotations.rightThigh.set(-0.15, 0.2, 0);
        this.targetRotations.rightCalf.set(-0.25, 0, 0);
        break;
      }

      case 'lightAttack2': {
        // Upward diagonal cross-cut from low left to high right
        const windup = p < 0.22 ? p / 0.22 : 1.0;
        const release = p >= 0.22 && p < 0.62 ? (p - 0.22) / 0.40 : p >= 0.62 ? 1.0 : 0.0;
        const recover = p >= 0.62 ? (p - 0.62) / 0.38 : 0.0;

        const torsoTwist = -windup * 0.65 + release * 1.35 - recover * 0.70;
        this.targetRotations.hips.set(0.05, torsoTwist * 0.4, 0);
        this.targetRotations.spine.set(0.08, torsoTwist * 0.7, 0);
        this.targetRotations.chest.set(0.12, torsoTwist, 0);

        // Upward cutting arc
        const armX = 0.2 - windup * 0.6 + release * 1.4 - recover * 0.8;
        const armY = 0.4 - windup * 0.8 + release * 1.5 - recover * 0.7;
        this.targetRotations.rightUpperArm.set(armX, armY, -0.3);
        this.targetRotations.rightForearm.set(0.55 + release * 0.5, 0.2, 0);
        this.targetRotations.rightHand.set(0.4 - release * 0.7, 0.3, 0);

        // Left arm stabilizing
        this.targetRotations.leftUpperArm.set(0.3, -0.3, 0.3);
        this.targetRotations.leftForearm.set(0.9, -0.3, 0);

        // Stance
        this.targetRotations.leftThigh.set(-0.2, -0.15, 0);
        this.targetRotations.leftCalf.set(-0.25, 0, 0);
        this.targetRotations.rightThigh.set(0.3, 0.15, 0);
        this.targetRotations.rightCalf.set(-0.4, 0, 0);
        break;
      }

      case 'lightAttack3': {
        // High-velocity 360-degree horizontal spin finisher
        const spin = p * Math.PI * 2;
        // Torso rotates full circle
        this.targetRotations.hips.set(0.1, spin * 0.6, 0);
        this.targetRotations.spine.set(0.05, spin * 0.8, 0);
        this.targetRotations.chest.set(0.08, spin * 1.0, 0);

        // Arm outstretched horizontally with blade swept outward
        this.targetRotations.rightUpperArm.set(0.2, 0.8, -0.8);
        this.targetRotations.rightForearm.set(0.25, 0, 0);
        this.targetRotations.rightHand.set(0, 0.4, 0);

        // Shield tucked close
        this.targetRotations.leftUpperArm.set(0.4, -0.5, 0.2);
        this.targetRotations.leftForearm.set(1.2, -0.2, 0);

        // Spinning footwork
        this.targetRotations.leftThigh.set(Math.sin(spin) * 0.3, 0, 0);
        this.targetRotations.rightThigh.set(-Math.sin(spin) * 0.3, 0, 0);
        break;
      }

      case 'heavyAttack': {
        // Devastating overhead cleave: long wind-up raised skyward, then crushed into earth
        const windup = p < 0.45 ? p / 0.45 : 1.0;
        const release = p >= 0.45 && p < 0.68 ? (p - 0.45) / 0.23 : p >= 0.68 ? 1.0 : 0.0;
        const recover = p >= 0.68 ? (p - 0.68) / 0.32 : 0.0;

        // Torso arches backwards during windup, slams forward on impact
        const arch = -windup * 0.35 + release * 0.85 - recover * 0.50;
        this.targetRotations.hips.set(arch * 0.6, 0, 0);
        this.targetRotations.spine.set(arch * 0.8, 0, 0);
        this.targetRotations.chest.set(arch, 0, 0);

        // Right arm raised high above head, then smashed straight down
        const armAngle = -windup * 1.6 + release * 2.8 - recover * 1.2;
        this.targetRotations.rightUpperArm.set(armAngle, 0.15, -0.15);
        this.targetRotations.rightForearm.set(windup * 0.8 - release * 0.4, 0, 0);
        this.targetRotations.rightHand.set(windup * 0.4 - release * 0.8, 0, 0);

        // Shield assists overhead thrust
        this.targetRotations.leftUpperArm.set(-windup * 1.2 + release * 1.6, -0.3, 0.2);
        this.targetRotations.leftForearm.set(1.0, -0.2, 0);

        // Heavy crouch on impact
        const crouch = release * 0.4 - recover * 0.3;
        this.targetRotations.leftThigh.set(0.25 + crouch, -0.1, 0);
        this.targetRotations.leftCalf.set(-0.45 - crouch * 1.2, 0, 0);
        this.targetRotations.rightThigh.set(0.15 + crouch, 0.1, 0);
        this.targetRotations.rightCalf.set(-0.35 - crouch * 1.2, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - crouch * 0.35;
        }
        break;
      }

      case 'whirlwind': {
        // Continuous dual spinning cleave
        const spin = (t / this.stateDuration) * Math.PI * 4; // 2 complete revolutions
        this.targetRotations.hips.set(0.12, spin, 0);
        this.targetRotations.chest.set(0.08, spin, 0);

        this.targetRotations.rightUpperArm.set(0.1, 0.9, -0.9);
        this.targetRotations.rightForearm.set(0.15, 0, 0);

        this.targetRotations.leftUpperArm.set(0.1, -0.9, 0.9);
        this.targetRotations.leftForearm.set(0.15, 0, 0);

        this.targetRotations.leftThigh.set(Math.sin(spin) * 0.25, 0, 0);
        this.targetRotations.rightThigh.set(-Math.sin(spin) * 0.25, 0, 0);
        break;
      }

      case 'block': {
        // Firm defensive guard: shield raised center, sword braced behind shield, wide stance
        this.targetRotations.hips.set(0.15, -0.18, 0);
        this.targetRotations.spine.set(0.12, -0.12, 0);
        this.targetRotations.chest.set(0.15, -0.15, 0);
        this.targetRotations.head.set(-0.15, 0.15, 0);

        // Shield raised directly in front of chest & face
        this.targetRotations.leftUpperArm.set(0.65, -0.35, 0.35);
        this.targetRotations.leftForearm.set(1.45, -0.4, 0);
        this.targetRotations.leftHand.set(0.2, 0, 0);

        // Sword held diagonally across chest supporting the guard
        this.targetRotations.rightUpperArm.set(0.55, 0.2, -0.35);
        this.targetRotations.rightForearm.set(1.25, 0.45, 0);
        this.targetRotations.rightHand.set(-0.35, 0.2, 0);

        // Solid braced wide stance
        this.targetRotations.leftThigh.set(0.35, -0.25, 0);
        this.targetRotations.leftCalf.set(-0.55, 0, 0);
        this.targetRotations.rightThigh.set(-0.25, 0.25, 0);
        this.targetRotations.rightCalf.set(-0.45, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - 0.12;
        }
        break;
      }

      case 'parry': {
        // Sharp upwards deflection snap with shield/blade
        const snap = Math.sin(p * Math.PI);
        this.targetRotations.chest.set(-snap * 0.15, -snap * 0.25, 0);

        // Shield thrusts forward and flicks upward to deflect incoming blade
        this.targetRotations.leftUpperArm.set(0.75 + snap * 0.4, -0.2, snap * 0.3);
        this.targetRotations.leftForearm.set(1.6 + snap * 0.3, -0.2, 0);

        // Sword readied for riposte
        this.targetRotations.rightUpperArm.set(0.35, 0.4, -0.4);
        this.targetRotations.rightForearm.set(1.1, 0.3, 0);
        break;
      }

      case 'dodge': {
        // Low tuck roll / evasive tumble
        const roll = p * Math.PI * 2;
        this.targetRotations.hips.set(roll, 0, 0);
        this.targetRotations.spine.set(0.45, 0, 0);
        this.targetRotations.chest.set(0.55, 0, 0);

        // Tucked limbs during roll
        this.targetRotations.rightUpperArm.set(1.2, 0, 0);
        this.targetRotations.rightForearm.set(1.5, 0, 0);
        this.targetRotations.leftUpperArm.set(1.2, 0, 0);
        this.targetRotations.leftForearm.set(1.5, 0, 0);

        this.targetRotations.leftThigh.set(1.2, 0, 0);
        this.targetRotations.leftCalf.set(-1.8, 0, 0);
        this.targetRotations.rightThigh.set(1.2, 0, 0);
        this.targetRotations.rightCalf.set(-1.8, 0, 0);

        if (this.bones.hips) {
          // Dip close to ground during roll
          const groundDip = Math.sin(p * Math.PI) * 0.55;
          this.bones.hips.position.y = this.baseHipsY - groundDip;
        }
        break;
      }

      case 'hit': {
        // Armored impact recoil: torso flinches backward violently
        const recoil = Math.sin(p * Math.PI);
        this.targetRotations.hips.set(-recoil * 0.25, 0, 0);
        this.targetRotations.spine.set(-recoil * 0.35, 0, 0);
        this.targetRotations.chest.set(-recoil * 0.45, recoil * 0.15, 0);
        this.targetRotations.neck.set(recoil * 0.3, 0, 0);
        this.targetRotations.head.set(recoil * 0.35, 0, 0);

        // Arms thrown wide by impact
        this.targetRotations.rightUpperArm.set(-recoil * 0.5, 0.3, -0.5);
        this.targetRotations.leftUpperArm.set(-recoil * 0.5, -0.3, 0.5);

        // Step back
        this.targetRotations.leftThigh.set(-recoil * 0.3, 0, 0);
        this.targetRotations.rightThigh.set(recoil * 0.2, 0, 0);
        break;
      }

      case 'death': {
        // Dramatic collapse: warrior falls to knees, drops sword, slumps face down
        const fall = Math.min(1.0, t / 1.1);
        const fallEasing = fall * fall;

        this.targetRotations.hips.set(fallEasing * 0.4, 0, 0);
        this.targetRotations.spine.set(fallEasing * 0.6, 0, 0);
        this.targetRotations.chest.set(fallEasing * 0.8, 0, 0);
        this.targetRotations.neck.set(fallEasing * 0.3, 0, 0);
        this.targetRotations.head.set(fallEasing * 0.4, 0, 0);

        // Limbs go limp
        this.targetRotations.rightUpperArm.set(fallEasing * 0.3, 0, -fallEasing * 0.4);
        this.targetRotations.rightForearm.set(fallEasing * 0.1, 0, 0);
        this.targetRotations.leftUpperArm.set(fallEasing * 0.3, 0, fallEasing * 0.4);
        this.targetRotations.leftForearm.set(fallEasing * 0.1, 0, 0);

        // Knees buckle completely to floor
        this.targetRotations.leftThigh.set(fallEasing * 1.5, 0, 0);
        this.targetRotations.leftCalf.set(-fallEasing * 2.1, 0, 0);
        this.targetRotations.rightThigh.set(fallEasing * 1.5, 0, 0);
        this.targetRotations.rightCalf.set(-fallEasing * 2.1, 0, 0);

        if (this.bones.hips) {
          this.bones.hips.position.y = this.baseHipsY - fallEasing * 0.75;
        }
        break;
      }
    }
  }

  /**
   * Smoothly apply target rotations to actual three.js bones using spherical interpolation
   */
  applyBoneTransforms(delta) {
    const lerpRate = Math.min(1.0, delta * 22.0); // Ultra-responsive smoothing

    for (const name of this.boneNames) {
      const bone = this.bones[name];
      if (!bone) continue;

      const curr = this.currentRotations[name];
      const target = this.targetRotations[name];

      // Lerp Euler angles
      curr.x += (target.x - curr.x) * lerpRate;
      curr.y += (target.y - curr.y) * lerpRate;
      curr.z += (target.z - curr.z) * lerpRate;

      bone.rotation.set(curr.x, curr.y, curr.z);
    }
  }

  /**
   * Procedural cloth/cape wave animation responding to wind and warrior movement
   */
  updateCapePhysics(delta, moveSpeed) {
    if (!this.capeMesh || !this.capeMesh.geometry) return;

    this.capeCycle += delta * (3.5 + moveSpeed * 3.0);
    const pos = this.capeMesh.geometry.attributes.position;
    if (!pos) return;

    // Flutter vertices along Z and Y
    const vertexCount = pos.count;
    const flutterAmp = 0.08 + (moveSpeed * 0.18);

    for (let i = 0; i < vertexCount; i++) {
      const y = pos.getY(i);
      // Top of cape is pinned to shoulders (y near 0), bottom flutters freely (negative y)
      const weight = Math.abs(y);
      const wave = Math.sin(this.capeCycle + weight * 4.0) * flutterAmp * weight;
      const blowback = moveSpeed * 0.18 * weight; // Blows back as character runs forward

      pos.setZ(i, -0.06 - blowback + wave);
    }

    pos.needsUpdate = true;
  }

  /**
   * Request next combo step
   */
  triggerNextCombo() {
    if (this.currentState.startsWith('lightAttack')) {
      if (this.canQueueNextCombo && this.comboIndex < 3) {
        this.queuedCombo = true;
      }
    } else if (this.currentState !== 'death') {
      this.comboIndex = 1;
      this.queuedCombo = false;
      this.setState('lightAttack1', 0, true);
    }
  }
}
