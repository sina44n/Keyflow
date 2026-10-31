/**
 * Stickman2DCharacter.js
 * Iconic Martial Arts 2D Stickman Fighter.
 * Implements clean, authentic stick figure proportions from References A, B, and C:
 * - High-contrast silhouette: Round head, articulated spine, arms with fists, legs with feet.
 * - Accurate striking hitboxes calculated from limb endpoints.
 * - Real-world physics: airborne knockback arcs, gravity, ground sliding, and getting up.
 * - Energy blast beam rendering for special finishers (Reference A Frame 14/34/44).
 */

import { Stickman2DAnimator } from "./Stickman2DAnimator";

export class Stickman2DCharacter {
  constructor(options = {}) {
    this.type = options.type || "player"; // 'player' | 'enemy' | 'boss'
    this.name = options.name || (this.type === "player" ? "Crimson Fighter" : "Shadow Brawler");
    this.x = options.x || 250;
    this.y = options.y || 420; // Ground level Y
    this.groundY = options.groundY || 420;
    this.facing = options.facing || 1; // 1 = right, -1 = left
    this.scale = options.scale || 1.0;

    this.animator = new Stickman2DAnimator();

    // Health
    this.maxHp = options.maxHp || (this.type === "player" ? 150 : 180);
    this.hp = this.maxHp;
    this.isAlive = true;

    // Physics & combat states
    this.vx = 0;
    this.vy = 0;
    this.gravity = 980; // pixels / s^2
    this.isGrounded = true;

    this.state = "neutral"; // 'neutral' | 'attacking' | 'blocking' | 'stagger' | 'knockback' | 'down' | 'getting_up' | 'defeated'
    this.groundTimer = 0;
    this.invulnerableTimer = 0;
    this.hitStopTimer = 0; // Micro freeze on impact

    // Strike tracking
    this.lastStrikeId = 0;
    this.hasHitCurrentTarget = false;

    // Visual Palette
    this.setupPalette();
  }

  setupPalette() {
    if (this.type === "player") {
      this.color = "#ef4444"; // Crimson Red
      this.headColor = "#ef4444";
      this.eyeColor = "#ffffff";
      this.glowColor = "rgba(239, 68, 68, 0.4)";
      this.strokeWidth = 6.5;
    } else {
      // Enemy: Charcoal / White contrast
      this.color = "#18181b"; // Charcoal Black
      this.headColor = "#27272a";
      this.eyeColor = "#ef4444"; // Menacing red eyes
      this.glowColor = "rgba(24, 24, 27, 0.4)";
      this.strokeWidth = 6.0;
    }
  }

  update(dt) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Freeze movement during hit-stop
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Apply Gravity & Movement Physics
    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.x += this.vx * dt;

      // Check ground collision
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;

        // If landing from airborne knockback, transition to lying on ground
        if (this.state === "knockback") {
          this.state = "down";
          this.groundTimer = 0.85; // Lie on ground for 0.85s before rising
          this.vx = 0;
        }
      }
    } else {
      // Ground friction
      this.x += this.vx * dt;
      this.vx *= 0.82;
    }

    // State Machine Updates
    if (this.state === "down") {
      this.groundTimer -= dt;
      if (this.groundTimer <= 0) {
        if (this.hp <= 0) {
          this.state = "defeated";
          this.isAlive = false;
          this.animator.play("defeat");
        } else {
          this.state = "getting_up";
          this.animator.play("getUp", 1.0, () => {
            this.state = "neutral";
            this.animator.play("idle");
          });
        }
      }
    }

    // Update Animator
    this.animator.update(dt);
  }

  // Execute a martial attack
  attack(moveName, speed = 1.0, onComplete = null) {
    if (!this.isAlive || this.state === "down" || this.state === "knockback" || this.state === "defeated") {
      return false;
    }
    this.state = "attacking";
    this.hasHitCurrentTarget = false;
    this.lastStrikeId++;

    this.animator.play(moveName, speed, () => {
      this.state = "neutral";
      if (onComplete) onComplete();
    });
    return true;
  }

  // Raise block
  block(duration = 0.4) {
    if (!this.isAlive || this.state === "down" || this.state === "knockback") return;
    this.state = "blocking";
    this.animator.play("block", 1.0, () => {
      this.state = "neutral";
    });
  }

  // Take damage with realistic hit reactions and knockback
  takeDamage(amount, attackType = "punch", attackerX = 0) {
    if (!this.isAlive || this.invulnerableTimer > 0) return { hit: false };

    // Check Block
    if (this.state === "blocking") {
      const reduced = Math.max(1, Math.round(amount * 0.25)); // 75% reduction
      this.hp = Math.max(0, this.hp - reduced);
      this.invulnerableTimer = 0.2;
      this.vx = (this.x > attackerX ? 1 : -1) * 60; // Pushback
      return { hit: true, blocked: true, damage: reduced };
    }

    // Apply Damage
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.22;
    const knockDir = this.x > attackerX ? 1 : -1;

    // Determine reaction based on attack severity
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.state = "knockback";
      this.isGrounded = false;
      this.vy = -360; // Launch upward into air
      this.vx = knockDir * 240;
      this.animator.play("knockback", 1.0);
      return { hit: true, dead: true, damage: amount, knockback: true };
    }

    if (attackType === "dropkick" || attackType === "energy" || attackType === "knee" || attackType === "sweep") {
      // Heavy knockback: character is launched backward into the air or knocked down!
      this.state = "knockback";
      this.isGrounded = false;
      this.vy = attackType === "sweep" ? -180 : -340;
      this.vx = knockDir * (attackType === "energy" ? 380 : 260);
      this.animator.play("knockback", 1.0);
      return { hit: true, dead: false, damage: amount, knockback: true };
    } else if (attackType === "kick") {
      // High head kick: head snap + step back
      this.state = "stagger";
      this.vx = knockDir * 160;
      this.animator.play("hitHead", 1.2, () => {
        this.state = "neutral";
      });
      return { hit: true, dead: false, damage: amount };
    } else {
      // Punch: stomach or head snap
      this.state = "stagger";
      this.vx = knockDir * 100;
      const hitAnim = Math.random() > 0.5 ? "hitHead" : "hitStomach";
      this.animator.play(hitAnim, 1.4, () => {
        this.state = "neutral";
      });
      return { hit: true, dead: false, damage: amount };
    }
  }

  // Get Body Hurtbox [head, torso, legs]
  getHurtbox() {
    const scale = this.scale;
    const w = 36 * scale;
    const h = 85 * scale;
    return {
      x: this.x - w / 2,
      y: this.y - h,
      w,
      h,
    };
  }

  // Calculate active striking hitbox position from limb endpoints
  getActiveStrikeHitbox() {
    if (this.state !== "attacking") return null;

    const pose = this.animator.getCurrentPose();
    const scale = this.scale;
    const facing = this.facing;

    const hipX = this.x;
    const hipY = this.y + pose.hipY * scale;

    const spineLen = 36 * scale;
    const chestX = hipX + Math.sin(pose.torsoAngle) * spineLen * facing;
    const chestY = hipY - Math.cos(pose.torsoAngle) * spineLen;

    const armUpperLen = 22 * scale;
    const armForeLen = 22 * scale;
    const legUpperLen = 26 * scale;
    const legLowerLen = 26 * scale;

    // 1. Fist strikes (jab, cross, hook)
    if (pose.fistContact) {
      const isRight = pose.fistContact === "right";
      const uAngle = isRight ? pose.rArmUpper : pose.lArmUpper;
      const fAngle = isRight ? pose.rArmFore : pose.lArmFore;

      const elbowX = chestX + Math.sin(uAngle) * armUpperLen * facing;
      const elbowY = chestY + Math.cos(uAngle) * armUpperLen;
      const fistX = elbowX + Math.sin(uAngle + fAngle) * armForeLen * facing;
      const fistY = elbowY + Math.cos(uAngle + fAngle) * armForeLen;

      return {
        type: "punch",
        x: fistX,
        y: fistY,
        radius: 18 * scale,
      };
    }

    // 2. Foot strikes (high kick, low sweep, dropkick)
    if (pose.footContact) {
      const kneeX = hipX + Math.sin(pose.rLegUpper) * legUpperLen * facing;
      const kneeY = hipY + Math.cos(pose.rLegUpper) * legUpperLen;
      const footX = kneeX + Math.sin(pose.rLegUpper + pose.rLegLower) * legLowerLen * facing;
      const footY = kneeY + Math.cos(pose.rLegUpper + pose.rLegLower) * legLowerLen;

      return {
        type: pose.animName === "lowSweep" ? "sweep" : "kick",
        x: footX,
        y: footY,
        radius: 22 * scale,
      };
    }

    // 3. Knee strike
    if (pose.kneeContact) {
      const kneeX = hipX + Math.sin(pose.rLegUpper) * legUpperLen * facing;
      const kneeY = hipY + Math.cos(pose.rLegUpper) * legUpperLen;
      return {
        type: "knee",
        x: kneeX,
        y: kneeY,
        radius: 20 * scale,
      };
    }

    // 4. Energy Beam (Reference A Frame 14/34/44)
    if (pose.energyBeam) {
      return {
        type: "energy",
        x: chestX + 70 * facing,
        y: chestY,
        radius: 45 * scale,
        isBeam: true,
        startX: chestX + 25 * facing,
        endX: chestX + 280 * facing,
      };
    }

    return null;
  }

  render(ctx) {
    ctx.save();

    const pose = this.animator.getCurrentPose();
    const scale = this.scale;
    const facing = this.facing;

    // Invulnerability flashing
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 25) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Ground Shadow
    ctx.beginPath();
    const shadowWidth = Math.max(12, (26 - Math.abs(this.y - this.groundY) * 0.15)) * scale;
    ctx.ellipse(this.x, this.groundY, shadowWidth, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    ctx.translate(this.x, this.y);

    // Kinematic Joints
    const hipX = 0;
    const hipY = pose.hipY * scale;

    const spineLen = 36 * scale;
    const chestX = hipX + Math.sin(pose.torsoAngle) * spineLen * facing;
    const chestY = hipY - Math.cos(pose.torsoAngle) * spineLen;

    const headRadius = 13.5 * scale;
    const neckLen = 11 * scale;
    const headX = chestX + Math.sin(pose.headAngle + pose.torsoAngle) * neckLen * facing;
    const headY = chestY - Math.cos(pose.headAngle + pose.torsoAngle) * neckLen - headRadius;

    const armUpperLen = 22 * scale;
    const armForeLen = 22 * scale;
    const legUpperLen = 26 * scale;
    const legLowerLen = 26 * scale;

    // Stroke style
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.strokeWidth * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // --- LEFT LEG (Back) ---
    const lKneeX = hipX + Math.sin(pose.lLegUpper) * legUpperLen * facing;
    const lKneeY = hipY + Math.cos(pose.lLegUpper) * legUpperLen;
    const lFootX = lKneeX + Math.sin(pose.lLegUpper + pose.lLegLower) * legLowerLen * facing;
    const lFootY = lKneeY + Math.cos(pose.lLegUpper + pose.lLegLower) * legLowerLen;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(lKneeX, lKneeY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();

    // Foot
    ctx.beginPath();
    ctx.moveTo(lFootX, lFootY);
    ctx.lineTo(lFootX + 7 * scale * facing, lFootY);
    ctx.stroke();

    // --- LEFT ARM (Back) ---
    const lElbowX = chestX + Math.sin(pose.lArmUpper) * armUpperLen * facing;
    const lElbowY = chestY + Math.cos(pose.lArmUpper) * armUpperLen;
    const lFistX = lElbowX + Math.sin(pose.lArmUpper + pose.lArmFore) * armForeLen * facing;
    const lFistY = lElbowY + Math.cos(pose.lArmUpper + pose.lArmFore) * armForeLen;

    ctx.beginPath();
    ctx.moveTo(chestX, chestY);
    ctx.lineTo(lElbowX, lElbowY);
    ctx.lineTo(lFistX, lFistY);
    ctx.stroke();

    // Fist circle
    ctx.beginPath();
    ctx.arc(lFistX, lFistY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // --- TORSO / SPINE ---
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(chestX, chestY);
    ctx.stroke();

    // --- RIGHT LEG (Front) ---
    const rKneeX = hipX + Math.sin(pose.rLegUpper) * legUpperLen * facing;
    const rKneeY = hipY + Math.cos(pose.rLegUpper) * legUpperLen;
    const rFootX = rKneeX + Math.sin(pose.rLegUpper + pose.rLegLower) * legLowerLen * facing;
    const rFootY = rKneeY + Math.cos(pose.rLegUpper + pose.rLegLower) * legLowerLen;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(rKneeX, rKneeY);
    ctx.lineTo(rFootX, rFootY);
    ctx.stroke();

    // Foot
    ctx.beginPath();
    ctx.moveTo(rFootX, rFootY);
    ctx.lineTo(rFootX + 7 * scale * facing, rFootY);
    ctx.stroke();

    // --- RIGHT ARM (Front) ---
    const rElbowX = chestX + Math.sin(pose.rArmUpper) * armUpperLen * facing;
    const rElbowY = chestY + Math.cos(pose.rArmUpper) * armUpperLen;
    const rFistX = rElbowX + Math.sin(pose.rArmUpper + pose.rArmFore) * armForeLen * facing;
    const rFistY = rElbowY + Math.cos(pose.rArmUpper + pose.rArmFore) * armForeLen;

    ctx.beginPath();
    ctx.moveTo(chestX, chestY);
    ctx.lineTo(rElbowX, rElbowY);
    ctx.lineTo(rFistX, rFistY);
    ctx.stroke();

    // Fist circle
    ctx.beginPath();
    ctx.arc(rFistX, rFistY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // --- HEAD ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.headColor;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Eye slit / glow
    ctx.fillStyle = this.eyeColor;
    ctx.beginPath();
    ctx.arc(headX + 4 * scale * facing, headY - 1 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- SPECIAL ENERGY BEAM (Reference A Frame 14, 34, 44) ---
    if (pose.energyBeam) {
      this.renderEnergyBeam(ctx, chestX, chestY);
    }

    ctx.restore();
  }

  renderEnergyBeam(ctx, chestX, chestY) {
    const facing = this.facing;
    const scale = this.scale;
    const startX = chestX + 22 * facing;
    const length = 240 * scale;
    const endX = startX + length * facing;

    ctx.save();
    // Beam Core
    const grad = ctx.createLinearGradient(startX, chestY, endX, chestY);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, this.type === "player" ? "#4ade80" : "#f87171");
    grad.addColorStop(1, this.type === "player" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)");

    ctx.beginPath();
    ctx.moveTo(startX, chestY - 10 * scale);
    ctx.lineTo(endX, chestY - 26 * scale);
    ctx.lineTo(endX, chestY + 26 * scale);
    ctx.lineTo(startX, chestY + 10 * scale);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = this.type === "player" ? "#4ade80" : "#ef4444";
    ctx.shadowBlur = 20;
    ctx.fill();

    // Swirling rings around beam
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    for (let i = 1; i <= 3; i++) {
      const rx = startX + (length / 4) * i * facing;
      ctx.beginPath();
      ctx.ellipse(rx, chestY, 8 * scale, 22 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
