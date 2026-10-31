/**
 * Stickman2DEnemies.js
 * Multi-Enemy Martial Arts Group AI & Progression Engine (Phase 2).
 * Features:
 * - Anti-overlap spatial separation physics (enemies maintain independent physical space).
 * - Coordinated attack token system (prevents unfair simultaneous mobbing).
 * - Flanking tactics: In 2-enemy and 3-enemy encounters, enemies take front, rear, and reserve positions.
 * - Progressive difficulty:
 *   - Encounter 1: 1 Shadow Brawler (180 HP)
 *   - Encounter 2: 2 Twin Shadows (140 HP each, flanking front & back)
 *   - Encounter 3: 3 Shadow Ninjas (130 HP each, coordinated strikes)
 *   - Encounter 4: 4 Iron Vanguards & Assassins (160 HP each)
 *   - Encounter 5: Infernal Boss (400 HP, high-impact ground stomp)
 * - Independent health, hitboxes, hit-reactions, and ground recovery for every fighter.
 */

import { Stickman2DCharacter } from "./Stickman2DCharacter";

export class Stickman2DEnemies {
  constructor(options = {}) {
    this.groundY = options.groundY || 420;
    this.onEnemyDefeated = options.onEnemyDefeated || (() => {});
    this.onEncounterCleared = options.onEncounterCleared || (() => {});

    this.enemies = [];
    this.currentEncounter = 1;
    this.cleared = false;

    // Attack token manager: guarantees only 1 enemy attacks at a time
    this.activeAttackerId = null;
    this.attackTokenCooldown = 0.8;
  }

  // Setup 1v1 Sparring Match (Phase 1)
  setup1v1(playerX = 250) {
    return this.setupEncounter(1, playerX);
  }

  // Setup Encounter
  setupEncounter(encounter = 1, playerX = 250) {
    this.currentEncounter = encounter;
    this.cleared = false;
    this.enemies = [];
    this.activeAttackerId = null;

    if (encounter === 1) {
      // Encounter 1: 1 Single Fighter (180 HP) - Iconic White Stickman Rival (Reference Image 4)
      const e = new Stickman2DCharacter({
        type: "enemy",
        name: "White Stickman Rival",
        x: playerX + 220,
        y: this.groundY,
        groundY: this.groundY,
        facing: -1,
        maxHp: 180,
      });
      e.aiRole = "front";
      e.decisionTimer = 0.5;
      e.attackCooldown = 1.4;
      e.preferredDist = 80;
      this.enemies.push(e);
    } else if (encounter === 2) {
      // Encounter 2: 2 Fighters (Flanking front & rear)
      const e1 = new Stickman2DCharacter({
        type: "enemy",
        name: "Shadow Striker A",
        x: playerX + 190,
        y: this.groundY,
        groundY: this.groundY,
        facing: -1,
        maxHp: 140,
      });
      e1.aiRole = "front";
      e1.decisionTimer = 0.4;
      e1.attackCooldown = 1.2;
      e1.preferredDist = 80;

      const e2 = new Stickman2DCharacter({
        type: "enemy",
        name: "Shadow Striker B",
        x: playerX - 170, // Behind the player
        y: this.groundY,
        groundY: this.groundY,
        facing: 1,
        maxHp: 140,
      });
      e2.aiRole = "flank";
      e2.decisionTimer = 0.9;
      e2.attackCooldown = 2.0;
      e2.preferredDist = 85;

      this.enemies.push(e1, e2);
    } else if (encounter === 3) {
      // Encounter 3: 3 Fighters (Front, Flank, and Reserve)
      const e1 = new Stickman2DCharacter({
        type: "enemy",
        name: "Ninja Front",
        x: playerX + 180,
        y: this.groundY,
        groundY: this.groundY,
        facing: -1,
        maxHp: 130,
      });
      e1.aiRole = "front";
      e1.decisionTimer = 0.3;
      e1.attackCooldown = 1.3;
      e1.preferredDist = 75;

      const e2 = new Stickman2DCharacter({
        type: "enemy",
        name: "Ninja Rear",
        x: playerX - 160,
        y: this.groundY,
        groundY: this.groundY,
        facing: 1,
        maxHp: 130,
      });
      e2.aiRole = "flank";
      e2.decisionTimer = 0.8;
      e2.attackCooldown = 2.2;
      e2.preferredDist = 85;

      const e3 = new Stickman2DCharacter({
        type: "enemy",
        name: "Ninja Reserve",
        x: playerX + 310,
        y: this.groundY,
        groundY: this.groundY,
        facing: -1,
        maxHp: 140,
      });
      e3.aiRole = "reserve";
      e3.decisionTimer = 1.4;
      e3.attackCooldown = 3.0;
      e3.preferredDist = 160; // Stands back until a comrade falls

      this.enemies.push(e1, e2, e3);
    } else if (encounter === 4) {
      // Encounter 4: 4 Fighters with Iron Vanguard
      for (let i = 0; i < 4; i++) {
        const isRear = i % 2 === 1;
        const e = new Stickman2DCharacter({
          type: "enemy",
          name: i === 0 ? "Iron Vanguard" : `Shadow Elite ${i}`,
          x: isRear ? playerX - (150 + i * 45) : playerX + (170 + i * 50),
          y: this.groundY,
          groundY: this.groundY,
          facing: isRear ? 1 : -1,
          maxHp: i === 0 ? 200 : 130,
          scale: i === 0 ? 1.15 : 1.0,
        });
        e.aiRole = i < 2 ? "front" : "reserve";
        e.decisionTimer = 0.5 + i * 0.4;
        e.attackCooldown = 1.5 + i * 0.5;
        e.preferredDist = 80 + i * 35;
        this.enemies.push(e);
      }
    } else {
      // Encounter 5+: Boss Titan
      const boss = new Stickman2DCharacter({
        type: "enemy",
        name: "Infernal Titan Boss",
        x: playerX + 240,
        y: this.groundY,
        groundY: this.groundY,
        facing: -1,
        maxHp: 420,
        scale: 1.35,
      });
      boss.aiRole = "boss";
      boss.decisionTimer = 0.4;
      boss.attackCooldown = 1.2;
      boss.preferredDist = 95;
      this.enemies.push(boss);
    }
    return this.getPrimaryEnemy();
  }

  update(dt, player, combat, audio, env) {
    if (this.cleared) return;

    if (this.attackTokenCooldown > 0) {
      this.attackTokenCooldown -= dt;
      if (this.attackTokenCooldown <= 0) {
        this.activeAttackerId = null;
      }
    }

    let allDefeated = true;

    // 1. Anti-Overlap Separation Physics: push overlapping enemies apart
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        const e1 = this.enemies[i];
        const e2 = this.enemies[j];
        if (!e1.isAlive || !e2.isAlive) continue;

        const diffX = e1.x - e2.x;
        const minDist = 50;
        if (Math.abs(diffX) < minDist) {
          const overlap = minDist - Math.abs(diffX);
          const push = (diffX >= 0 ? 1 : -1) * (overlap * 0.5);
          e1.x += push;
          e2.x -= push;
        }
      }
    }

    // 2. Individual AI Behavior & Combat Updates
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive && enemy.state === "defeated") {
        continue;
      }

      allDefeated = false;

      const dist = Math.abs(enemy.x - player.x);
      const dirToPlayer = player.x > enemy.x ? 1 : -1;

      // Always face player when standing
      if (enemy.state !== "knockback" && enemy.state !== "down" && enemy.state !== "getting_up") {
        enemy.facing = dirToPlayer;
      }

      // Standing & Neutral Decision Logic
      if (enemy.isAlive && enemy.state === "neutral" && enemy.isGrounded) {
        enemy.decisionTimer -= dt;
        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

        // Position according to tactical role
        let targetDist = enemy.preferredDist;
        if (enemy.aiRole === "reserve") targetDist = 170;

        if (dist > targetDist + 20) {
          enemy.animator.play("dash", 1.0);
          enemy.vx = dirToPlayer * 115;
        } else if (dist < targetDist - 25) {
          enemy.animator.play("idle", 1.0);
          enemy.vx = -dirToPlayer * 75;
        } else {
          enemy.vx = 0;

          // Action trigger when decision timer expires
          if (enemy.decisionTimer <= 0) {
            enemy.decisionTimer = 0.7 + Math.random() * 0.6;

            // Block check if player is attacking in range
            if (player.state === "attacking" && dist < 95 && Math.random() < 0.3) {
              enemy.block(0.4);
              if (audio) audio.playClash();
            } else if (
              enemy.attackCooldown <= 0 &&
              (this.activeAttackerId === null || this.activeAttackerId === i)
            ) {
              // Grab the single attack token to ensure readability
              this.activeAttackerId = i;
              this.attackTokenCooldown = 0.9;
              enemy.attackCooldown = 1.8 + Math.random() * 1.0;

              const attacks = ["jab", "cross", "highKick", "lowSweep"];
              const chosen = attacks[Math.floor(Math.random() * attacks.length)];
              enemy.attack(chosen, 1.15);
              if (audio) audio.playSlash(1.0);
            } else {
              enemy.animator.play("idle");
            }
          }
        }
      }

      // Check if this enemy strikes Player
      if (enemy.state === "attacking" && !enemy.hasHitCurrentTarget) {
        const hitInfo = combat.checkHit(enemy, player);
        if (hitInfo) {
          combat.resolveHit(enemy, player, hitInfo, { wpm: 35 }, audio, env);
        }
      }

      // Check if Player strikes this enemy
      if (player.state === "attacking" && !player.hasHitCurrentTarget) {
        const hitInfo = combat.checkHit(player, enemy);
        if (hitInfo) {
          const stats = player.currentStats || {};
          const res = combat.resolveHit(player, enemy, hitInfo, stats, audio, env);
          if (res.dead) {
            this.onEnemyDefeated(enemy);
            // If reserve enemy exists, promote it to front
            const reserve = this.enemies.find((e) => e.isAlive && e.aiRole === "reserve");
            if (reserve) reserve.aiRole = "front";
          }
        }
      }

      // Physical simulation update
      enemy.update(dt);
    }

    // Check encounter cleared condition
    if (allDefeated && this.enemies.length > 0) {
      this.cleared = true;
      if (audio) audio.playWaveCleared();
      this.onEncounterCleared(this.currentEncounter);
    }
  }

  getPrimaryEnemy() {
    return this.enemies.find((e) => e.isAlive) || this.enemies[0];
  }

  getLivingCount() {
    return this.enemies.filter((e) => e.isAlive).length;
  }

  render(ctx) {
    for (const enemy of this.enemies) {
      enemy.render(ctx);

      // Overhead Enemy Health Bar & Role Badge
      if (enemy.isAlive) {
        const barW = 46 * enemy.scale;
        const barH = 5;
        const barX = enemy.x - barW / 2;
        const barY = enemy.y - 95 * enemy.scale;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = pct > 0.4 ? "#ef4444" : "#f59e0b";
        ctx.fillRect(barX, barY, barW * pct, barH);

        // Small indicator above
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText(enemy.name, enemy.x, barY - 4);
        ctx.restore();
      }
    }
  }
}
