/**
 * Stickman2DEnemies.js
 * Enemy AI, Wave progression manager, group tactical spacing,
 * and combat state machines for Stickman Fight (2D).
 */

import { Stickman2DCharacter } from "./Stickman2DCharacter";

export class Stickman2DEnemies {
  constructor(options = {}) {
    this.groundY = options.groundY || 420;
    this.currentWave = 1;
    this.enemies = [];
    this.boss = null;
    this.waveCleared = false;
    this.onEnemyDefeated = options.onEnemyDefeated || (() => {});
    this.onWaveCleared = options.onWaveCleared || (() => {});
  }

  startWave(wave = 1, playerX = 200) {
    this.currentWave = wave;
    this.enemies = [];
    this.boss = null;
    this.waveCleared = false;

    if (wave === 1) {
      // Wave 1: 1 Shadow Warrior
      this.spawnEnemy("shadow", playerX + 350, 150);
    } else if (wave === 2) {
      // Wave 2: 2 Shadow Assassins
      this.spawnEnemy("assassin", playerX + 320, 130);
      this.spawnEnemy("assassin", playerX + 460, 130);
    } else if (wave === 3) {
      // Wave 3: 3 Mixed Warriors
      this.spawnEnemy("shadow", playerX + 300, 160);
      this.spawnEnemy("assassin", playerX + 440, 140);
      this.spawnEnemy("shadow", playerX + 580, 160);
    } else if (wave === 4) {
      // Wave 4: 4 Enemies with Armored Brute
      this.spawnEnemy("shadow", playerX + 280, 180);
      this.spawnEnemy("assassin", playerX + 420, 150);
      this.spawnEnemy("brute", playerX + 560, 260);
      this.spawnEnemy("shadow", playerX + 700, 180);
    } else if (wave === 5) {
      // Wave 5: Infernal Commander Boss
      const boss = this.spawnEnemy("boss", playerX + 420, 650);
      this.boss = boss;
    } else {
      // Wave 6+ Scaling Endless Trial
      const count = Math.min(6, 2 + Math.floor(wave / 2));
      const hasBoss = wave % 5 === 0;
      if (hasBoss) {
        this.boss = this.spawnEnemy("boss", playerX + 420, 600 + wave * 50);
      } else {
        for (let i = 0; i < count; i++) {
          const type = i % 3 === 2 ? "brute" : i % 2 === 1 ? "assassin" : "shadow";
          this.spawnEnemy(type, playerX + 280 + i * 140, 160 + wave * 20);
        }
      }
    }
  }

  spawnEnemy(type, x, hp) {
    const enemy = new Stickman2DCharacter({
      type,
      x,
      y: this.groundY,
      facing: -1, // Face towards player
      maxHp: hp,
    });

    // AI state metadata
    enemy.aiState = "approach";
    enemy.stateTimer = 0.5 + Math.random() * 0.8;
    enemy.attackCooldown = 1.2 + Math.random() * 1.5;
    enemy.preferredDistance = type === "boss" ? 85 : type === "brute" ? 75 : 65;
    enemy.attackWindup = type === "boss" ? 0.6 : type === "brute" ? 0.7 : 0.45;

    this.enemies.push(enemy);
    return enemy;
  }

  update(dt, player, combat, audio) {
    if (this.waveCleared) return;

    let allDead = true;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.isAlive) {
        e.update(dt);
        continue;
      }

      allDead = false;

      // Distance to player
      const distToPlayer = Math.abs(e.x - player.x);
      const dirToPlayer = player.x > e.x ? 1 : -1;
      e.facing = dirToPlayer;

      // Multi-enemy spacing: Prevent overlapping
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        if (!other.isAlive) continue;
        const diffX = e.x - other.x;
        if (Math.abs(diffX) < 45) {
          e.x += (diffX >= 0 ? 1 : -1) * 20 * dt;
        }
      }

      // AI State Machine
      e.stateTimer -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      if (e.isStunned) {
        e.update(dt);
        continue;
      }

      switch (e.aiState) {
        case "approach":
          if (distToPlayer > e.preferredDistance + 10) {
            e.animator.play("advance", 1.0);
            e.vx = dirToPlayer * (e.type === "boss" ? 85 : e.type === "assassin" ? 140 : 100);
          } else if (distToPlayer < e.preferredDistance - 15) {
            // Back up slightly
            e.vx = -dirToPlayer * 60;
          } else {
            e.vx = 0;
            e.animator.play("idle");
            if (e.attackCooldown <= 0) {
              e.aiState = "windup";
              e.stateTimer = e.attackWindup;
              e.animator.play("slash1", 0.5); // Slow windup
            }
          }
          break;

        case "windup":
          e.vx = 0;
          if (e.stateTimer <= 0) {
            e.aiState = "attack";
            e.stateTimer = 0.35;
            e.animator.play("slash1", 1.4);
            audio.playSlash(0.9);
          }
          break;

        case "attack":
          // Strike execution
          if (e.stateTimer <= 0.15 && !e.hasDealtDamage) {
            e.hasDealtDamage = true;
            if (distToPlayer < e.preferredDistance + 25) {
              // Player takes damage or parries
              const dmgResult = player.takeDamage(e.type === "boss" ? 28 : 16);
              if (dmgResult.parried) {
                // Precision Parry!
                audio.playParry();
                combat.spawnDamageText(player.x + 30 * player.facing, player.y - 70, "PARRIED!", "parry");
                combat.spawnHitSparks(player.x + 35 * player.facing, player.y - 60, true, true);
                e.isStunned = true;
                e.stunTimer = 1.4;
                e.animator.play("hit", 0.8);
              } else if (dmgResult.blocked) {
                audio.playClash();
                combat.spawnDamageText(player.x, player.y - 60, "BLOCKED", "blocked");
                combat.spawnHitSparks(player.x + 20 * player.facing, player.y - 50, false, false);
              } else if (dmgResult.hit) {
                audio.playHit();
                combat.spawnDamageText(player.x, player.y - 60, `-${dmgResult.damage}`, "player_hurt");
                combat.spawnHitSparks(player.x, player.y - 50, false, false);
              }
            }
          }

          if (e.stateTimer <= 0) {
            e.hasDealtDamage = false;
            e.aiState = "recover";
            e.stateTimer = 0.4;
            e.animator.play("idle");
          }
          break;

        case "recover":
          e.vx = 0;
          if (e.stateTimer <= 0) {
            e.aiState = "approach";
            e.attackCooldown = 1.0 + Math.random() * 1.5;
          }
          break;
      }

      e.update(dt);
    }

    // Check wave clear condition
    if (allDead && this.enemies.length > 0) {
      this.waveCleared = true;
      audio.playWaveCleared();
      this.onWaveCleared(this.currentWave);
    }
  }

  getNearestLivingEnemy(playerX) {
    let nearest = null;
    let minDist = Infinity;
    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      const d = Math.abs(e.x - playerX);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  getLivingCount() {
    return this.enemies.filter((e) => e.isAlive).length;
  }

  render(ctx) {
    for (const e of this.enemies) {
      e.render(ctx);

      // Render Overhead Health Bar for living non-boss enemies
      if (e.isAlive && e.type !== "boss") {
        const barWidth = 38 * e.scale;
        const barHeight = 4.5;
        const barX = e.x - barWidth / 2;
        const barY = e.y - 105 * e.scale;

        ctx.save();
        // Background track
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Fill
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = e.type === "brute" ? "#f59e0b" : e.type === "assassin" ? "#38bdf8" : "#ef4444";
        ctx.fillRect(barX, barY, barWidth * pct, barHeight);
        ctx.restore();
      }
    }
  }
}
