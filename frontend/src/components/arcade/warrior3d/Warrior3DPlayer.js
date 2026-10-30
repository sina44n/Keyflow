import * as THREE from 'three';
import { Warrior3DCharacterBuilder } from './Warrior3DCharacterBuilder';
import { Warrior3DAnimationEngine } from './Warrior3DAnimationEngine';

/**
 * Warrior3DPlayer.js — Player Fantasy Warrior Controller
 * =====================================================
 * Handles camera-relative WASD locomotion, 3-hit combo attacks,
 * heavy cleaves, whirlwind specials, blocking, parrying, and evasive rolls.
 */
export class Warrior3DPlayer {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;

    // Build character model
    this.character = Warrior3DCharacterBuilder.buildWarrior({ type: 'player' });
    this.group = this.character.group;
    this.bones = this.character.bones;

    // Attach animation engine
    this.animEngine = new Warrior3DAnimationEngine(this.bones, {
      capeMesh: this.character.capeMesh,
    });

    // World Transform
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;

    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.isAlive = true;

    // Combat State
    this.isBlocking = false;
    this.isParrying = false;
    this.parryWindow = 0; // Timer during active parry frames (~0.28s)
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.dodgeCooldown = 0;
    this.staminaRechargeDelay = 0;

    // Active Attack Info
    this.currentAttackId = null;
    this.currentAttackType = null;
    this.attackCounter = 0;

    // Combo & Score tracking
    this.comboCount = 0;
    this.comboTimer = 0;
    this.totalScore = 0;

    // Footstep timer
    this.footstepTimer = 0;

    // Add to scene
    this.scene.add(this.group);
  }

  /**
   * Reset player for a new match
   */
  reset(spawnX = 0, spawnZ = 8) {
    this.position.set(spawnX, 0, spawnZ);
    this.velocity.set(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.isAlive = true;
    this.isBlocking = false;
    this.isParrying = false;
    this.parryWindow = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.currentAttackId = null;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.totalScore = 0;
    this.animEngine.setState('idle', 0, true);
    this.updateGroupTransform();
  }

  /**
   * Consume stamina if available
   */
  consumeStamina(amount) {
    if (this.stamina >= amount) {
      this.stamina = Math.max(0, this.stamina - amount);
      this.staminaRechargeDelay = 0.85;
      return true;
    }
    return false;
  }

  /**
   * Light Attack (Combo chain: Light 1 -> Light 2 -> Light 3)
   */
  performLightAttack() {
    if (!this.isAlive || this.isBlocking || this.animEngine.currentState === 'dodge') return false;
    if (this.stamina < 10) return false;

    if (this.animEngine.currentState.startsWith('lightAttack')) {
      // Buffer next combo swing
      this.animEngine.triggerNextCombo();
      this.currentAttackId = `p_attack_${++this.attackCounter}`;
      this.currentAttackType = `light${this.animEngine.comboIndex || 1}`;
      return true;
    }

    if (this.consumeStamina(12)) {
      this.animEngine.triggerNextCombo();
      this.currentAttackId = `p_attack_${++this.attackCounter}`;
      this.currentAttackType = 'light1';
      if (this.audio) this.audio.playSwordSwing('light');
      return true;
    }
    return false;
  }

  /**
   * Heavy Attack
   */
  performHeavyAttack() {
    if (!this.isAlive || this.isBlocking || this.animEngine.currentState === 'dodge') return false;
    if (this.animEngine.currentState.startsWith('lightAttack') || this.animEngine.currentState === 'heavyAttack') return false;

    if (this.consumeStamina(24)) {
      this.animEngine.setState('heavyAttack', 0, true);
      this.currentAttackId = `p_attack_${++this.attackCounter}`;
      this.currentAttackType = 'heavy';
      if (this.audio) this.audio.playSwordSwing('heavy');
      return true;
    }
    return false;
  }

  /**
   * Whirlwind Special Attack
   */
  performWhirlwindAttack() {
    if (!this.isAlive || this.isBlocking || this.animEngine.currentState === 'dodge') return false;

    if (this.consumeStamina(30)) {
      this.animEngine.setState('whirlwind', 0, true);
      this.currentAttackId = `p_attack_${++this.attackCounter}`;
      this.currentAttackType = 'whirlwind';
      if (this.audio) this.audio.playSwordSwing('spin');
      return true;
    }
    return false;
  }

  /**
   * Start Defensive Block
   */
  startBlock() {
    if (!this.isAlive || this.animEngine.currentState === 'dodge' || this.stamina < 5) return;
    this.isBlocking = true;
    this.animEngine.setState('block');
  }

  /**
   * Stop Defensive Block
   */
  stopBlock() {
    if (this.isBlocking) {
      this.isBlocking = false;
      this.animEngine.setState('idle');
    }
  }

  /**
   * Trigger Parry window
   */
  performParry() {
    if (!this.isAlive || this.animEngine.currentState === 'dodge' || this.stamina < 15) return false;

    if (this.consumeStamina(15)) {
      this.isParrying = true;
      this.parryWindow = 0.28; // Active deflection window
      this.animEngine.setState('parry', 0, true);
      return true;
    }
    return false;
  }

  /**
   * Evasive Roll / Dodge
   */
  performDodge(moveDir) {
    if (!this.isAlive || this.dodgeCooldown > 0) return false;

    if (this.consumeStamina(20)) {
      this.isInvincible = true;
      this.invincibilityTimer = 0.35; // 350ms of invulnerability frames
      this.dodgeCooldown = 0.65;
      this.animEngine.setState('dodge', 0, true);
      if (this.audio) this.audio.playDodge();

      // Burst velocity forward or along move input
      const speed = 10.5;
      if (moveDir && (moveDir.x !== 0 || moveDir.z !== 0)) {
        this.velocity.x = moveDir.x * speed;
        this.velocity.z = moveDir.z * speed;
        this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      } else {
        const fwdX = Math.sin(this.rotationY);
        const fwdZ = Math.cos(this.rotationY);
        this.velocity.x = fwdX * speed;
        this.velocity.z = fwdZ * speed;
      }
      return true;
    }
    return false;
  }

  /**
   * Take damage
   */
  takeDamage(amount, triggerFlinch = true) {
    if (!this.isAlive || this.isInvincible) return;

    this.health = Math.max(0, this.health - amount);
    this.comboCount = 0; // Combo breaks on damage

    if (this.health <= 0) {
      this.isAlive = false;
      this.animEngine.setState('death', 0, true);
      this.velocity.set(0, 0, 0);
    } else if (triggerFlinch && !this.isBlocking) {
      this.animEngine.setState('hit', 0, true);
    }
  }

  /**
   * Successful hit callback from Combat System
   */
  onSuccessfulHit(damage, isCrit, killed) {
    this.comboCount++;
    this.comboTimer = 3.5; // Combo holds for 3.5 seconds
    const multiplier = 1 + Math.min(4.0, this.comboCount * 0.15);
    const earned = Math.round(damage * multiplier) + (killed ? 150 : 0);
    this.totalScore += earned;
  }

  /**
   * Per-frame update
   */
  update(delta, inputState, camera, environment) {
    if (!this.isAlive) {
      this.animEngine.update(delta, { x: 0, z: 0 }, false);
      return;
    }

    // Timers
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) this.isInvincible = false;
    }
    if (this.parryWindow > 0) {
      this.parryWindow -= delta;
      if (this.parryWindow <= 0) this.isParrying = false;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // Stamina regeneration
    if (this.staminaRechargeDelay > 0) {
      this.staminaRechargeDelay -= delta;
    } else if (!inputState.sprint && !this.isBlocking && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 26.0);
    }

    // Determine movement direction relative to camera
    const isAttacking = this.animEngine.currentState.startsWith('lightAttack') ||
                        this.animEngine.currentState === 'heavyAttack' ||
                        this.animEngine.currentState === 'whirlwind';
    const isDodging = this.animEngine.currentState === 'dodge';

    if (!isDodging) {
      let moveX = 0;
      let moveZ = 0;

      if (inputState.forward) {
        moveX += camera.forward.x;
        moveZ += camera.forward.z;
      }
      if (inputState.backward) {
        moveX -= camera.forward.x;
        moveZ -= camera.forward.z;
      }
      if (inputState.right) {
        moveX += camera.right.x;
        moveZ += camera.right.z;
      }
      if (inputState.left) {
        moveX -= camera.right.x;
        moveZ -= camera.right.z;
      }

      const inputLen = Math.hypot(moveX, moveZ);
      let targetSpeed = 0;

      if (inputLen > 0.05 && !isAttacking) {
        moveX /= inputLen;
        moveZ /= inputLen;

        const isSprinting = inputState.sprint && this.stamina > 5;
        if (isSprinting) {
          targetSpeed = 7.6;
          this.consumeStamina(delta * 14.0);
        } else if (this.isBlocking) {
          targetSpeed = 2.2;
        } else {
          targetSpeed = 4.4;
        }

        this.velocity.x = moveX * targetSpeed;
        this.velocity.z = moveZ * targetSpeed;

        // Face movement direction (or face target lock if locked)
        if (camera.isTargetLocked && camera.lockedTarget && camera.lockedTarget.isAlive) {
          const dx = camera.lockedTarget.position.x - this.position.x;
          const dz = camera.lockedTarget.position.z - this.position.z;
          this.targetRotationY = Math.atan2(dx, dz);
        } else {
          this.targetRotationY = Math.atan2(moveX, moveZ);
        }

        // Footsteps
        this.footstepTimer += delta;
        const stepInterval = isSprinting ? 0.28 : 0.44;
        if (this.footstepTimer >= stepInterval) {
          this.footstepTimer = 0;
          if (this.audio) this.audio.playFootstep();
        }
      } else {
        // Friction damping
        this.velocity.x *= Math.max(0, 1 - delta * 12.0);
        this.velocity.z *= Math.max(0, 1 - delta * 12.0);
      }
    } else {
      // Dodge roll decay
      this.velocity.x *= Math.max(0, 1 - delta * 4.0);
      this.velocity.z *= Math.max(0, 1 - delta * 4.0);
    }

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Arena boundary clamp
    if (environment) {
      environment.clampPosition(this.position, 0.65);
    }

    // Smooth warrior mesh rotation
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1.0, delta * 14.0);

    // Update animations
    const isSprintingNow = inputState.sprint && this.stamina > 5 && Math.hypot(this.velocity.x, this.velocity.z) > 4.5;
    this.animEngine.update(delta, this.velocity, isSprintingNow);

    // Synchronize 3D group
    this.updateGroupTransform();
  }

  updateGroupTransform() {
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
