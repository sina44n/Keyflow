import * as THREE from 'three';
import { Warrior3DCharacterBuilder } from './Warrior3DCharacterBuilder';
import { Warrior3DAnimationEngine } from './Warrior3DAnimationEngine';

/**
 * Warrior3DSingleEnemy — Individual AI Enemy Combatant
 */
class Warrior3DSingleEnemy {
  constructor(scene, audio, id, type, spawnPos) {
    this.scene = scene;
    this.audio = audio;
    this.id = id;
    this.type = type; // 'swordsman' | 'assassin' | 'knight' | 'boss'

    // Build 3D character mesh
    this.scale = type === 'boss' ? 1.45 : type === 'assassin' ? 0.95 : 1.05;
    this.character = Warrior3DCharacterBuilder.buildWarrior({
      type,
      scale: this.scale,
    });
    this.group = this.character.group;
    this.bones = this.character.bones;

    // Attach procedural animation engine
    this.animEngine = new Warrior3DAnimationEngine(this.bones, {
      capeMesh: this.character.capeMesh,
      isBoss: type === 'boss',
    });

    // World transform
    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;
    this.targetRotationY = 0;

    // Base stats per archetype
    if (type === 'boss') {
      this.maxHealth = 400;
      this.moveSpeed = 3.6;
      this.attackRange = 2.8;
      this.idealCircleDistance = 3.4;
    } else if (type === 'knight') {
      this.maxHealth = 130;
      this.moveSpeed = 3.2;
      this.attackRange = 1.9;
      this.idealCircleDistance = 3.0;
    } else if (type === 'assassin') {
      this.maxHealth = 70;
      this.moveSpeed = 5.2;
      this.attackRange = 1.8;
      this.idealCircleDistance = 4.2;
    } else {
      // swordsman
      this.maxHealth = 90;
      this.moveSpeed = 4.0;
      this.attackRange = 1.8;
      this.idealCircleDistance = 3.2;
    }

    this.health = this.maxHealth;
    this.isAlive = true;

    // AI States: 'approach' | 'circle' | 'windup' | 'attack' | 'recover' | 'stunned'
    this.aiState = 'approach';
    this.aiTimer = Math.random() * 0.8;
    this.hasAttackToken = false;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitDirection = Math.random() < 0.5 ? 1 : -1;

    // Stun / Poise
    this.isStunned = false;
    this.stunTimer = 0;

    // Attack tracking
    this.currentAttackId = null;
    this.attackCounter = 0;

    // Overhead 3D Health Bar
    this.buildHealthBar();

    // Scene addition
    this.scene.add(this.group);
    this.updateTransform();
  }

  buildHealthBar() {
    this.hpCanvas = document.createElement('canvas');
    this.hpCanvas.width = 128;
    this.hpCanvas.height = 16;
    this.hpCtx = this.hpCanvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(this.hpCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      depthTest: false,
      transparent: true,
    });
    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.scale.set(1.4 * this.scale, 0.18 * this.scale, 1.0);
    this.hpSprite.position.set(0, 2.3 * this.scale, 0);
    this.group.add(this.hpSprite);

    this.redrawHealthBar();
  }

  redrawHealthBar() {
    if (!this.hpCtx) return;
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 128, 16);

    // Background border
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 128, 16);

    // Empty track
    ctx.fillStyle = '#27272a';
    ctx.fillRect(2, 2, 124, 12);

    // Health Fill
    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = this.type === 'boss' ? '#ef4444' : pct > 0.4 ? '#eab308' : '#dc2626';
    ctx.fillRect(2, 2, Math.round(124 * pct), 12);

    if (this.hpTexture) {
      this.hpTexture.needsUpdate = true;
    }
  }

  takeDamage(amount, attackType) {
    if (!this.isAlive) return false;

    this.health = Math.max(0, this.health - amount);
    this.redrawHealthBar();

    if (this.health <= 0) {
      this.isAlive = false;
      this.aiState = 'dead';
      this.animEngine.setState('death', 0, true);
      this.group.remove(this.hpSprite);
      return true; // Killed
    } else {
      // Stagger / Flinch if heavy attack or critical
      if (attackType === 'heavy') {
        this.applyStun(0.7);
      } else {
        this.animEngine.setState('hit', 0, true);
      }
      return false;
    }
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration;
    this.aiState = 'stunned';
    this.animEngine.setState('hit', duration, true);
  }

  update(delta, playerPos, otherEnemies, tokenCoordinator, environment) {
    if (!this.isAlive) {
      this.animEngine.update(delta, { x: 0, z: 0 }, false);
      return;
    }

    // Stun logic
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.aiState = 'approach';
      }
      this.animEngine.update(delta, { x: 0, z: 0 }, false);
      this.updateTransform();
      return;
    }

    // Calculate distance and direction to player
    const toPlayerX = playerPos.x - this.position.x;
    const toPlayerZ = playerPos.z - this.position.z;
    const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

    // Flocking / Repulsion force between enemies to avoid stacking
    let repulseX = 0;
    let repulseZ = 0;
    for (const other of otherEnemies) {
      if (other === this || !other.isAlive) continue;
      const dx = this.position.x - other.position.x;
      const dz = this.position.z - other.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.8 && d > 0.01) {
        const force = (1.8 - d) / d;
        repulseX += dx * force * 3.5;
        repulseZ += dz * force * 3.5;
      }
    }

    // AI State Machine
    this.aiTimer += delta;

    switch (this.aiState) {
      case 'approach': {
        // Close distance to tactical orbit range
        if (distToPlayer > this.idealCircleDistance) {
          const dirX = toPlayerX / distToPlayer;
          const dirZ = toPlayerZ / distToPlayer;
          this.velocity.x = (dirX * this.moveSpeed + repulseX);
          this.velocity.z = (dirZ * this.moveSpeed + repulseZ);
          this.targetRotationY = Math.atan2(dirX, dirZ);
        } else {
          this.aiState = 'circle';
          this.aiTimer = 0;
          this.orbitAngle = Math.atan2(this.position.z - playerPos.z, this.position.x - playerPos.x);
        }
        break;
      }

      case 'circle': {
        // Orbit and flank around player waiting for an attack opening
        this.orbitAngle += this.orbitDirection * (delta * 0.9);
        const targetX = playerPos.x + Math.cos(this.orbitAngle) * this.idealCircleDistance;
        const targetZ = playerPos.z + Math.sin(this.orbitAngle) * this.idealCircleDistance;

        const moveX = targetX - this.position.x;
        const moveZ = targetZ - this.position.z;
        const moveDist = Math.hypot(moveX, moveZ);

        if (moveDist > 0.1) {
          this.velocity.x = (moveX / moveDist) * (this.moveSpeed * 0.75) + repulseX;
          this.velocity.z = (moveZ / moveDist) * (this.moveSpeed * 0.75) + repulseZ;
        }

        // Always face player while circling
        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        // Check if we can obtain attack token from coordinator
        if (this.aiTimer > 1.2 && tokenCoordinator.requestToken(this.id)) {
          this.hasAttackToken = true;
          this.aiState = 'windup';
          this.aiTimer = 0;
        }
        break;
      }

      case 'windup': {
        // Lunge directly toward player within reach
        if (distToPlayer > this.attackRange) {
          const dirX = toPlayerX / distToPlayer;
          const dirZ = toPlayerZ / distToPlayer;
          this.velocity.x = dirX * (this.moveSpeed * 1.3);
          this.velocity.z = dirZ * (this.moveSpeed * 1.3);
          this.targetRotationY = Math.atan2(dirX, dirZ);
        } else {
          // In range! Execute attack
          this.aiState = 'attack';
          this.aiTimer = 0;
          this.velocity.set(0, 0, 0);

          const attackName = this.type === 'boss' ? 'heavyAttack' : 'lightAttack1';
          this.animEngine.setState(attackName, 0, true);
          this.currentAttackId = `e_${this.id}_${++this.attackCounter}`;

          if (this.audio) {
            if (this.type === 'boss') this.audio.playBossRoar();
            this.audio.playSwordSwing(this.type === 'boss' ? 'heavy' : 'light');
          }
        }
        break;
      }

      case 'attack': {
        this.velocity.set(0, 0, 0);
        // Face player while swinging
        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        if (this.aiTimer >= this.animEngine.stateDuration) {
          // Attack completed, release token and enter recovery
          tokenCoordinator.releaseToken(this.id);
          this.hasAttackToken = false;
          this.aiState = 'recover';
          this.aiTimer = 0;
        }
        break;
      }

      case 'recover': {
        // Backstep / withdraw slightly after striking
        const backDirX = -toPlayerX / (distToPlayer || 1);
        const backDirZ = -toPlayerZ / (distToPlayer || 1);
        this.velocity.x = backDirX * (this.moveSpeed * 0.6);
        this.velocity.z = backDirZ * (this.moveSpeed * 0.6);
        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        if (this.aiTimer > 1.0 || distToPlayer >= this.idealCircleDistance) {
          this.aiState = 'circle';
          this.aiTimer = 0;
        }
        break;
      }
    }

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    if (environment) {
      environment.clampPosition(this.position, 0.7 * this.scale);
    }

    // Smooth rotation
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1.0, delta * 12.0);

    // Update animations
    const isMoving = Math.hypot(this.velocity.x, this.velocity.z) > 0.1;
    this.animEngine.update(delta, this.velocity, false);

    // Synchronize 3D group
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

/**
 * Warrior3DEnemies — Group Enemy Coordinator & Wave Manager
 * ========================================================
 * Arbitrates attack tokens so simultaneous enemies flank and attack with tactical pacing.
 */
export class Warrior3DEnemies {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.enemies = [];
    this.currentWave = 1;
    this.maxWaves = 5;

    // Attack token arbitration
    this.activeTokens = new Set();
    this.maxSimultaneousAttackers = 1; // Scales with wave (1 -> 2)
  }

  requestToken(enemyId) {
    if (this.activeTokens.size < this.maxSimultaneousAttackers) {
      this.activeTokens.add(enemyId);
      return true;
    }
    return false;
  }

  releaseToken(enemyId) {
    this.activeTokens.delete(enemyId);
  }

  /**
   * Spawn a specific wave
   */
  startWave(waveNumber = 1) {
    this.clear();
    this.currentWave = Math.min(this.maxWaves, Math.max(1, waveNumber));
    this.maxSimultaneousAttackers = this.currentWave >= 3 ? 2 : 1;

    const spawnRadius = 14.0;
    const waveConfigs = {
      1: [{ type: 'swordsman', angle: 0 }],
      2: [
        { type: 'swordsman', angle: -0.6 },
        { type: 'assassin', angle: 0.6 },
      ],
      3: [
        { type: 'swordsman', angle: -1.2 },
        { type: 'knight', angle: 0.0 },
        { type: 'swordsman', angle: 1.2 },
      ],
      4: [
        { type: 'assassin', angle: -1.8 },
        { type: 'knight', angle: -0.6 },
        { type: 'swordsman', angle: 0.6 },
        { type: 'assassin', angle: 1.8 },
      ],
      5: [
        { type: 'boss', angle: 0.0 },
        { type: 'knight', angle: 1.6 },
      ],
    };

    const config = waveConfigs[this.currentWave] || waveConfigs[1];

    config.forEach((cfg, idx) => {
      const x = Math.sin(cfg.angle) * spawnRadius;
      const z = -Math.cos(cfg.angle) * spawnRadius;
      const enemy = new Warrior3DSingleEnemy(
        this.scene,
        this.audio,
        `enemy_${this.currentWave}_${idx}`,
        cfg.type,
        new THREE.Vector3(x, 0, z)
      );
      this.enemies.push(enemy);
    });
  }

  getAliveCount() {
    return this.enemies.filter((e) => e.isAlive).length;
  }

  getBoss() {
    return this.enemies.find((e) => e.type === 'boss' && e.isAlive) || null;
  }

  update(delta, playerPos, environment) {
    for (const enemy of this.enemies) {
      enemy.update(delta, playerPos, this.enemies, this, environment);
    }
  }

  clear() {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.activeTokens.clear();
  }
}
