import * as THREE from 'three';
import { Stickman3DCharacterBuilder } from './Stickman3DCharacterBuilder';
import { Stickman3DAnimationEngine } from './Stickman3DAnimationEngine';

/**
 * Stickman3DPlayer.js — Player Stickman Warrior Controller
 * ========================================================
 * Controlled through real-time typing commands (and optional keyboard controls):
 * - Translates completed typing commands into martial strikes, acrobatic dodges, and parries
 * - Charges Flow Energy with consecutive accurate keystrokes
 * - Tracks vitality, scoring, and unbroken combo chains
 */
export class Stickman3DPlayer {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;

    // Build Reference Image B Crimson Stickman
    this.character = Stickman3DCharacterBuilder.buildStickman({ type: 'player' });
    this.group = this.character.group;
    this.bones = this.character.bones;

    // Attach procedural animation engine
    this.animEngine = new Stickman3DAnimationEngine(this.bones, {
      orbitalShards: this.character.orbitalShards,
      energyRibbon: this.character.energyRibbon,
    });

    // World Transform
    this.position = new THREE.Vector3(0, 0, 4);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = Math.PI; // Face arena center
    this.targetRotationY = Math.PI;

    // Vitals & Stats
    this.maxHealth = 100;
    this.health = 100;
    this.flowEnergy = 0; // 0 to 100
    this.maxFlowEnergy = 100;
    this.isAlive = true;

    // Combat State
    this.isBlocking = false;
    this.isParrying = false;
    this.parryWindow = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;

    // Attack details
    this.currentAttackId = null;
    this.currentAttackAction = null;
    this.attackCounter = 0;

    // Score & Stats
    this.totalScore = 0;
    this.enemiesDefeated = 0;

    this.scene.add(this.group);
    this.updateTransform();
  }

  reset(spawnX = 0, spawnZ = 4) {
    this.position.set(spawnX, 0, spawnZ);
    this.velocity.set(0, 0, 0);
    this.rotationY = Math.PI;
    this.targetRotationY = Math.PI;
    this.health = this.maxHealth;
    this.flowEnergy = 0;
    this.isAlive = true;
    this.isBlocking = false;
    this.isParrying = false;
    this.parryWindow = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.currentAttackId = null;
    this.totalScore = 0;
    this.enemiesDefeated = 0;
    this.animEngine.setState('idle', 0, true);
    this.updateTransform();
  }

  /**
   * Executes a combat action triggered by typing completion
   */
  executeCombatAction(actionKey, targetEnemy = null) {
    if (!this.isAlive) return;

    this.currentAttackAction = actionKey;
    this.currentAttackId = `p_atk_${++this.attackCounter}`;

    // Face target enemy if available
    if (targetEnemy && targetEnemy.isAlive) {
      const dx = targetEnemy.position.x - this.position.x;
      const dz = targetEnemy.position.z - this.position.z;
      this.targetRotationY = Math.atan2(dx, dz);
    }

    // Charge Flow Energy
    this.flowEnergy = Math.min(this.maxFlowEnergy, this.flowEnergy + 12);

    switch (actionKey) {
      case 'slash':
        this.animEngine.setState('slash', 0, true);
        if (this.audio) this.audio.playSwordSwing('light');
        this.lungeTowards(targetEnemy, 4.5);
        break;

      case 'strike':
        this.animEngine.setState('strike', 0, true);
        if (this.audio) this.audio.playSwordSwing('light');
        this.lungeTowards(targetEnemy, 5.5);
        break;

      case 'cleave':
        this.animEngine.setState('cleave', 0, true);
        if (this.audio) this.audio.playSwordSwing('heavy');
        this.lungeTowards(targetEnemy, 6.0);
        break;

      case 'flurry':
        this.animEngine.setState('flurry', 0, true);
        if (this.audio) this.audio.playSwordSwing('spin');
        this.lungeTowards(targetEnemy, 5.0);
        break;

      case 'cyclone':
        this.animEngine.setState('cyclone', 0, true);
        if (this.audio) this.audio.playSwordSwing('spin');
        break;

      case 'bladeStorm':
        this.animEngine.setState('bladeStorm', 0, true);
        if (this.audio) this.audio.playSwordSwing('energy');
        this.lungeTowards(targetEnemy, 7.5);
        break;

      case 'block':
        this.isBlocking = true;
        this.animEngine.setState('block', 0.6, true);
        setTimeout(() => { this.isBlocking = false; }, 600);
        break;

      case 'parry':
        this.isParrying = true;
        this.parryWindow = 0.35;
        this.animEngine.setState('parry', 0, true);
        break;

      case 'dodge':
        this.isInvincible = true;
        this.invincibilityTimer = 0.4;
        this.animEngine.setState('dodge', 0, true);
        if (this.audio) this.audio.playDodge();
        // Evade sideways / backwards
        const evX = -Math.sin(this.rotationY + Math.PI / 4) * 8.0;
        const evZ = -Math.cos(this.rotationY + Math.PI / 4) * 8.0;
        this.velocity.set(evX, 0, evZ);
        break;

      case 'advance':
        this.animEngine.setState('advance', 0, true);
        this.lungeTowards(targetEnemy, 8.5);
        break;

      case 'retreat':
        this.animEngine.setState('retreat', 0, true);
        const backX = -Math.sin(this.rotationY) * 7.5;
        const backZ = -Math.cos(this.rotationY) * 7.5;
        this.velocity.set(backX, 0, backZ);
        break;

      case 'leap':
        this.animEngine.setState('leap', 0, true);
        this.lungeTowards(targetEnemy, 6.5);
        break;

      default:
        this.animEngine.setState('slash', 0, true);
        if (this.audio) this.audio.playSwordSwing('light');
        break;
    }
  }

  lungeTowards(targetEnemy, speed = 5.0) {
    if (targetEnemy && targetEnemy.isAlive) {
      const dx = targetEnemy.position.x - this.position.x;
      const dz = targetEnemy.position.z - this.position.z;
      const len = Math.hypot(dx, dz);
      if (len > 1.2) {
        this.velocity.x = (dx / len) * speed;
        this.velocity.z = (dz / len) * speed;
      }
    } else {
      const fwdX = Math.sin(this.rotationY);
      const fwdZ = Math.cos(this.rotationY);
      this.velocity.x = fwdX * (speed * 0.7);
      this.velocity.z = fwdZ * (speed * 0.7);
    }
  }

  takeDamage(amount, triggerFlinch = true) {
    if (!this.isAlive || this.isInvincible) return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.isAlive = false;
      this.animEngine.setState('death', 0, true);
      this.velocity.set(0, 0, 0);
    } else if (triggerFlinch && !this.isBlocking) {
      this.animEngine.setState('hit', 0, true);
    }
  }

  onSuccessfulHit(damage, isCrit, killed) {
    const earned = damage + (isCrit ? 50 : 0) + (killed ? 200 : 0);
    this.totalScore += earned;
    if (killed) {
      this.enemiesDefeated++;
    }
  }

  update(delta, environment) {
    if (!this.isAlive) {
      this.animEngine.update(delta, { x: 0, z: 0 }, false);
      return;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) this.isInvincible = false;
    }

    if (this.parryWindow > 0) {
      this.parryWindow -= delta;
      if (this.parryWindow <= 0) this.isParrying = false;
    }

    // Velocity friction damping
    this.velocity.x *= Math.max(0, 1 - delta * 8.0);
    this.velocity.z *= Math.max(0, 1 - delta * 8.0);

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    if (environment) {
      environment.clampPosition(this.position, 0.6);
    }

    // Smooth rotation
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1.0, delta * 14.0);

    // Update animations
    this.animEngine.update(delta, this.velocity, false);

    this.updateTransform();
  }

  updateTransform() {
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
