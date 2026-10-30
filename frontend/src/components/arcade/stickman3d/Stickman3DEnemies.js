import * as THREE from 'three';
import { Stickman3DCharacterBuilder } from './Stickman3DCharacterBuilder';
import { Stickman3DAnimationEngine } from './Stickman3DAnimationEngine';

/**
 * Stickman3DSingleEnemy — Individual AI Stickman Opponent
 */
class Stickman3DSingleEnemy {
  constructor(scene, audio, id, type, spawnPos) {
    this.scene = scene;
    this.audio = audio;
    this.id = id;
    this.type = type; // 'shadow' | 'assassin' | 'brute' | 'boss'

    // Build 3D stickman mesh
    this.character = Stickman3DCharacterBuilder.buildStickman({ type });
    this.group = this.character.group;
    this.bones = this.character.bones;
    this.scale = this.character.scale;

    this.animEngine = new Stickman3DAnimationEngine(this.bones, {
      orbitalShards: this.character.orbitalShards,
      energyRibbon: this.character.energyRibbon,
      isBoss: type === 'boss',
    });

    // World transform
    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;
    this.targetRotationY = 0;

    // Archetype attributes
    if (type === 'boss') {
      this.maxHealth = 420;
      this.moveSpeed = 3.6;
      this.attackRange = 2.6;
      this.circleDistance = 3.6;
    } else if (type === 'brute') {
      this.maxHealth = 140;
      this.moveSpeed = 3.2;
      this.attackRange = 2.0;
      this.circleDistance = 3.2;
    } else if (type === 'assassin') {
      this.maxHealth = 75;
      this.moveSpeed = 5.4;
      this.attackRange = 1.8;
      this.circleDistance = 4.0;
    } else {
      // shadow
      this.maxHealth = 95;
      this.moveSpeed = 4.2;
      this.attackRange = 1.9;
      this.circleDistance = 3.4;
    }

    this.health = this.maxHealth;
    this.isAlive = true;

    // AI States: 'approach' | 'circle' | 'windup' | 'attack' | 'recover' | 'stunned'
    this.aiState = 'approach';
    this.aiTimer = Math.random() * 0.7;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitDirection = Math.random() < 0.5 ? 1 : -1;
    this.hasAttackToken = false;

    // Stun
    this.isStunned = false;
    this.stunTimer = 0;

    // Attack tracking
    this.currentAttackId = null;
    this.attackCounter = 0;

    // Overhead 3D Health Bar
    this.buildHealthBar();

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
    this.hpSprite.position.set(0, 2.2 * this.scale, 0);
    this.group.add(this.hpSprite);

    this.redrawHealthBar();
  }

  redrawHealthBar() {
    if (!this.hpCtx) return;
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 128, 16);

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 128, 16);

    ctx.fillStyle = '#27272a';
    ctx.fillRect(2, 2, 124, 12);

    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = this.type === 'boss' ? '#ef4444' : pct > 0.4 ? '#22c55e' : '#eab308';
    ctx.fillRect(2, 2, Math.round(124 * pct), 12);

    if (this.hpTexture) {
      this.hpTexture.needsUpdate = true;
    }
  }

  takeDamage(amount, attackAction) {
    if (!this.isAlive) return false;

    this.health = Math.max(0, this.health - amount);
    this.redrawHealthBar();

    if (this.health <= 0) {
      this.isAlive = false;
      this.aiState = 'dead';
      this.animEngine.setState('death', 0, true);
      this.group.remove(this.hpSprite);
      return true; // Defeated
    } else {
      if (attackAction === 'cleave' || attackAction === 'bladeStorm') {
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

  update(delta, playerPos, otherEnemies, coordinator, environment) {
    if (!this.isAlive) {
      this.animEngine.update(delta, { x: 0, z: 0 }, false);
      return;
    }

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

    const toPlayerX = playerPos.x - this.position.x;
    const toPlayerZ = playerPos.z - this.position.z;
    const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

    // Flocking repulsion between enemies to prevent stacking
    let repulseX = 0;
    let repulseZ = 0;
    for (const other of otherEnemies) {
      if (other === this || !other.isAlive) continue;
      const dx = this.position.x - other.position.x;
      const dz = this.position.z - other.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.7 && d > 0.01) {
        const force = (1.7 - d) / d;
        repulseX += dx * force * 3.2;
        repulseZ += dz * force * 3.2;
      }
    }

    this.aiTimer += delta;

    switch (this.aiState) {
      case 'approach': {
        if (distToPlayer > this.circleDistance) {
          const dirX = toPlayerX / distToPlayer;
          const dirZ = toPlayerZ / distToPlayer;
          this.velocity.x = dirX * this.moveSpeed + repulseX;
          this.velocity.z = dirZ * this.moveSpeed + repulseZ;
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
        this.orbitAngle += this.orbitDirection * (delta * 0.95);
        const targetX = playerPos.x + Math.cos(this.orbitAngle) * this.circleDistance;
        const targetZ = playerPos.z + Math.sin(this.orbitAngle) * this.circleDistance;

        const moveX = targetX - this.position.x;
        const moveZ = targetZ - this.position.z;
        const moveDist = Math.hypot(moveX, moveZ);

        if (moveDist > 0.1) {
          this.velocity.x = (moveX / moveDist) * (this.moveSpeed * 0.75) + repulseX;
          this.velocity.z = (moveZ / moveDist) * (this.moveSpeed * 0.75) + repulseZ;
        }

        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        // Request Attack Token from Coordinator
        if (this.aiTimer > 1.2 && coordinator.requestToken(this.id)) {
          this.hasAttackToken = true;
          this.aiState = 'windup';
          this.aiTimer = 0;
        }
        break;
      }

      case 'windup': {
        // Lunge forward within range
        if (distToPlayer > this.attackRange) {
          const dirX = toPlayerX / distToPlayer;
          const dirZ = toPlayerZ / distToPlayer;
          this.velocity.x = dirX * (this.moveSpeed * 1.35);
          this.velocity.z = dirZ * (this.moveSpeed * 1.35);
          this.targetRotationY = Math.atan2(dirX, dirZ);
        } else {
          // In range! Execute attack
          this.aiState = 'attack';
          this.aiTimer = 0;
          this.velocity.set(0, 0, 0);

          const attackAction = this.type === 'boss' ? 'cleave' : 'slash';
          this.animEngine.setState(attackAction, 0, true);
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
        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        if (this.aiTimer >= this.animEngine.stateDuration) {
          coordinator.releaseToken(this.id);
          this.hasAttackToken = false;
          this.aiState = 'recover';
          this.aiTimer = 0;
        }
        break;
      }

      case 'recover': {
        // Backstep after striking
        const backDirX = -toPlayerX / (distToPlayer || 1);
        const backDirZ = -toPlayerZ / (distToPlayer || 1);
        this.velocity.x = backDirX * (this.moveSpeed * 0.65);
        this.velocity.z = backDirZ * (this.moveSpeed * 0.65);
        this.targetRotationY = Math.atan2(toPlayerX, toPlayerZ);

        if (this.aiTimer > 0.95 || distToPlayer >= this.circleDistance) {
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
      environment.clampPosition(this.position, 0.6 * this.scale);
    }

    // Smooth rotation
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1.0, delta * 14.0);

    // Update animations
    const isMoving = Math.hypot(this.velocity.x, this.velocity.z) > 0.1;
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

/**
 * Stickman3DEnemies — Group Enemy Coordinator & Wave Progression Manager
 */
export class Stickman3DEnemies {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.enemies = [];
    this.currentWave = 1;
    this.maxWaves = 5;

    this.activeTokens = new Set();
    this.maxSimultaneousAttackers = 1;
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

  startWave(waveNumber = 1) {
    this.clear();
    this.currentWave = Math.min(this.maxWaves, Math.max(1, waveNumber));
    this.maxSimultaneousAttackers = this.currentWave >= 3 ? 2 : 1;

    const spawnRadius = 12.0;
    const waveConfigs = {
      1: [{ type: 'shadow', angle: 0 }],
      2: [
        { type: 'shadow', angle: -0.6 },
        { type: 'assassin', angle: 0.6 },
      ],
      3: [
        { type: 'shadow', angle: -1.2 },
        { type: 'brute', angle: 0.0 },
        { type: 'shadow', angle: 1.2 },
      ],
      4: [
        { type: 'assassin', angle: -1.8 },
        { type: 'brute', angle: -0.6 },
        { type: 'shadow', angle: 0.6 },
        { type: 'assassin', angle: 1.8 },
      ],
      5: [
        { type: 'boss', angle: 0.0 },
        { type: 'shadow', angle: 1.6 },
      ],
    };

    const config = waveConfigs[this.currentWave] || waveConfigs[1];

    config.forEach((cfg, idx) => {
      const x = Math.sin(cfg.angle) * spawnRadius;
      const z = -Math.cos(cfg.angle) * spawnRadius;
      const enemy = new Stickman3DSingleEnemy(
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

  getClosestEnemy(playerPos) {
    let closest = null;
    let minDist = Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;
      const d = enemy.position.distanceTo(playerPos);
      if (d < minDist) {
        minDist = d;
        closest = enemy;
      }
    }
    return closest;
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
