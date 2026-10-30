/**
 * Stickman2DCharacter.js
 * Articulated 2D Stickman Warrior renderer and kinematic character controller.
 * Authentically replicates Reference Image B:
 * - Crimson red body (#dc2626) with solid articulated strokes
 * - Spherical head with glowing emerald cross-scar eyes
 * - Tactical reverse-grip dagger with glowing emerald cutting edge
 * - 4 Orbiting emerald crystal shards and swirling green energy ribbons
 * Also supports Shadow Assassins, Armored Brutes, and Infernal Commander Boss.
 */

import { Stickman2DAnimator } from "./Stickman2DAnimator";

export class Stickman2DCharacter {
  constructor(options = {}) {
    this.type = options.type || "player"; // 'player' | 'shadow' | 'assassin' | 'brute' | 'boss'
    this.x = options.x || 200;
    this.y = options.y || 420; // Ground plane Y
    this.facing = options.facing || 1; // 1 = right, -1 = left
    this.scale = options.scale || (this.type === "boss" ? 1.45 : this.type === "brute" ? 1.2 : 1.0);

    this.animator = new Stickman2DAnimator();

    // Stats
    this.maxHp = options.maxHp || (this.type === "boss" ? 600 : this.type === "brute" ? 220 : this.type === "assassin" ? 120 : 150);
    this.hp = this.maxHp;
    this.isAlive = true;

    // Combat states
    this.isBlocking = false;
    this.isParrying = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.invincibleTimer = 0;

    // Movement
    this.vx = 0;
    this.vy = 0;

    // Crystal shard & energy ribbon physics (for Player & Boss)
    this.shardAngle = 0;
    this.ribbonPoints = [];
    this.ribbonTimer = 0;

    // Slicing energy trail
    this.bladeTipHistory = [];

    // Visual Palette
    this.setupPalette();
  }

  setupPalette() {
    if (this.type === "player") {
      this.bodyColor = "#dc2626"; // Crimson Red
      this.headColor = "#ef4444";
      this.eyeColor = "#4ade80"; // Glowing Emerald
      this.weaponColor = "#18181b";
      this.edgeColor = "#22c55e"; // Glowing Green
      this.crystalColor = "#4ade80";
      this.ribbonColor = "rgba(34, 197, 94, 0.75)";
      this.strokeWidth = 7;
    } else if (this.type === "shadow") {
      this.bodyColor = "#18181b"; // Charcoal Black
      this.headColor = "#27272a";
      this.eyeColor = "#a855f7"; // Glowing Purple
      this.weaponColor = "#09090b";
      this.edgeColor = "#9333ea";
      this.crystalColor = null;
      this.ribbonColor = null;
      this.strokeWidth = 6;
    } else if (this.type === "assassin") {
      this.bodyColor = "#0f172a"; // Midnight Azure
      this.headColor = "#1e293b";
      this.eyeColor = "#38bdf8"; // Cyan
      this.weaponColor = "#0284c7";
      this.edgeColor = "#38bdf8";
      this.crystalColor = null;
      this.ribbonColor = null;
      this.strokeWidth = 5.5;
    } else if (this.type === "brute") {
      this.bodyColor = "#334155"; // Armored Slate
      this.headColor = "#475569";
      this.eyeColor = "#f59e0b"; // Glowing Amber
      this.weaponColor = "#1e293b";
      this.edgeColor = "#fbbf24";
      this.crystalColor = null;
      this.ribbonColor = null;
      this.strokeWidth = 9;
    } else if (this.type === "boss") {
      this.bodyColor = "#7f1d1d"; // Infernal Obsidian Crimson
      this.headColor = "#991b1b";
      this.eyeColor = "#fbbf24"; // Fiery Gold
      this.weaponColor = "#09090b";
      this.edgeColor = "#ef4444"; // Fiery Red
      this.crystalColor = "#ef4444";
      this.ribbonColor = "rgba(239, 68, 68, 0.75)";
      this.strokeWidth = 10;
    }
  }

  update(dt) {
    if (!this.isAlive) {
      this.animator.update(dt);
      return;
    }

    // Update timers
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.animator.play("idle");
      }
    }

    this.animator.update(dt);

    // Update crystal rotation
    this.shardAngle = (this.shardAngle + dt * 2.8) % (Math.PI * 2);
    this.ribbonTimer += dt * 4.0;

    // Movement physics
    this.x += this.vx * dt;
    this.vx *= 0.85; // Damping
  }

  takeDamage(amount, isCrit = false) {
    if (!this.isAlive || this.invincibleTimer > 0) return { hit: false };

    if (this.isParrying) {
      return { hit: false, parried: true };
    }

    if (this.isBlocking) {
      const reduced = Math.round(amount * 0.3); // 70% damage reduction
      this.hp -= reduced;
      this.invincibleTimer = 0.2;
      if (this.hp <= 0) {
        this.hp = 0;
        this.die();
      }
      return { hit: true, blocked: true, damage: reduced };
    }

    this.hp -= amount;
    this.invincibleTimer = 0.25;

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return { hit: true, dead: true, damage: amount, isCrit };
    } else {
      this.animator.play("hit", 1.2);
      return { hit: true, dead: false, damage: amount, isCrit };
    }
  }

  die() {
    this.isAlive = false;
    this.animator.play("death", 1.0);
  }

  getHurtbox() {
    const w = 40 * this.scale;
    const h = 95 * this.scale;
    return {
      x: this.x - w / 2,
      y: this.y - h,
      w,
      h,
    };
  }

  getBladeHitbox() {
    if (this.bladeTipHistory.length < 2) return null;
    const tip = this.bladeTipHistory[this.bladeTipHistory.length - 1];
    return {
      x: Math.min(tip.x, tip.x - 30 * this.facing),
      y: tip.y - 20,
      w: 45 * this.scale,
      h: 40 * this.scale,
    };
  }

  render(ctx) {
    ctx.save();

    const pose = this.animator.getCurrentPose();
    const scale = this.scale;
    const facing = this.facing;

    // Flash white when invincible/hit
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    ctx.translate(this.x, this.y);

    // Draw shadow on ground
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // 1. Draw Background Orbiting Crystals (half of orbit behind character)
    if (this.type === "player" || this.type === "boss") {
      this.renderCrystals(ctx, true);
    }

    // 2. Kinematics calculations
    const hipX = 0;
    const hipY = pose.hipY * scale;

    const spineLength = 36 * scale;
    const chestX = hipX + Math.sin(pose.torsoAngle) * spineLength * facing;
    const chestY = hipY - Math.cos(pose.torsoAngle) * spineLength;

    const headRadius = 13 * scale;
    const neckLength = 12 * scale;
    const headX = chestX + Math.sin(pose.headAngle + pose.torsoAngle) * neckLength * facing;
    const headY = chestY - Math.cos(pose.headAngle + pose.torsoAngle) * neckLength - headRadius;

    // Upper limb segment lengths
    const armUpperLen = 22 * scale;
    const armForeLen = 20 * scale;
    const legUpperLen = 25 * scale;
    const legLowerLen = 26 * scale;

    // Setup line styles
    ctx.strokeStyle = this.bodyColor;
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

    // --- LEFT ARM (Back / Off-hand) ---
    const lElbowX = chestX + Math.sin(pose.lArmUpper) * armUpperLen * facing;
    const lElbowY = chestY + Math.cos(pose.lArmUpper) * armUpperLen;
    const lHandX = lElbowX + Math.sin(pose.lArmUpper + pose.lArmFore) * armForeLen * facing;
    const lHandY = lElbowY + Math.cos(pose.lArmUpper + pose.lArmFore) * armForeLen;

    ctx.beginPath();
    ctx.moveTo(chestX, chestY);
    ctx.lineTo(lElbowX, lElbowY);
    ctx.lineTo(lHandX, lHandY);
    ctx.stroke();

    // Left hand open palm / fingers for player martial pose
    if (this.type === "player") {
      ctx.beginPath();
      ctx.arc(lHandX, lHandY, 4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = this.bodyColor;
      ctx.fill();
    }

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

    // --- RIGHT ARM (Front / Weapon hand) ---
    const rElbowX = chestX + Math.sin(pose.rArmUpper) * armUpperLen * facing;
    const rElbowY = chestY + Math.cos(pose.rArmUpper) * armUpperLen;
    const rHandX = rElbowX + Math.sin(pose.rArmUpper + pose.rArmFore) * armForeLen * facing;
    const rHandY = rElbowY + Math.cos(pose.rArmUpper + pose.rArmFore) * armForeLen;

    ctx.beginPath();
    ctx.moveTo(chestX, chestY);
    ctx.lineTo(rElbowX, rElbowY);
    ctx.lineTo(rHandX, rHandY);
    ctx.stroke();

    // --- WEAPON (Reverse-grip Tactical Dagger / Greatsword) ---
    const bladeLen = (this.type === "boss" ? 55 : this.type === "brute" ? 38 : 28) * scale;
    const weaponAngleRad = pose.weaponAngle;
    const tipX = rHandX + Math.sin(weaponAngleRad) * bladeLen * facing;
    const tipY = rHandY - Math.cos(weaponAngleRad) * bladeLen;

    // Track blade tip for trails and hitboxes
    if (this.isAlive) {
      this.bladeTipHistory.push({ x: this.x + tipX, y: this.y + tipY });
      if (this.bladeTipHistory.length > 8) this.bladeTipHistory.shift();
    }

    // Draw Blade
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rHandX, rHandY);
    ctx.lineTo(tipX, tipY);
    ctx.lineWidth = (this.type === "boss" ? 6 : 4) * scale;
    ctx.strokeStyle = this.weaponColor;
    ctx.stroke();

    // Glowing edge
    ctx.beginPath();
    ctx.moveTo(rHandX, rHandY);
    ctx.lineTo(tipX, tipY);
    ctx.lineWidth = 2.2 * scale;
    ctx.strokeStyle = this.edgeColor;
    ctx.shadowColor = this.edgeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // --- HEAD ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.headColor;
    ctx.fill();

    // Red inner edge shading
    ctx.lineWidth = 2.5 * scale;
    ctx.strokeStyle = this.bodyColor;
    ctx.stroke();

    // EYES & SCARS (Faithful to Reference Image B!)
    if (this.type === "player") {
      const eyeOffsetX = 4 * scale * facing;
      const eyeOffsetY = -1 * scale;

      // Glowing Emerald Eyes
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 12;

      // Left eye
      ctx.beginPath();
      ctx.ellipse(headX + eyeOffsetX - 4 * scale, headY + eyeOffsetY, 2.5 * scale, 3.5 * scale, 0.2 * facing, 0, Math.PI * 2);
      ctx.fillStyle = "#4ade80";
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(headX + eyeOffsetX + 3 * scale, headY + eyeOffsetY, 2.8 * scale, 4 * scale, 0.1 * facing, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Cross-scar scratches over eyes (Reference Image B)
      ctx.strokeStyle = "rgba(74, 222, 128, 0.75)";
      ctx.lineWidth = 1.2 * scale;
      // Cross 1
      ctx.beginPath();
      ctx.moveTo(headX + eyeOffsetX - 4 * scale, headY + eyeOffsetY - 6 * scale);
      ctx.lineTo(headX + eyeOffsetX - 4 * scale, headY + eyeOffsetY + 6 * scale);
      ctx.moveTo(headX + eyeOffsetX - 8 * scale, headY + eyeOffsetY);
      ctx.lineTo(headX + eyeOffsetX, headY + eyeOffsetY);
      ctx.stroke();

      // Cross 2
      ctx.beginPath();
      ctx.moveTo(headX + eyeOffsetX + 3 * scale, headY + eyeOffsetY - 7 * scale);
      ctx.lineTo(headX + eyeOffsetX + 3 * scale, headY + eyeOffsetY + 7 * scale);
      ctx.moveTo(headX + eyeOffsetX - 1 * scale, headY + eyeOffsetY);
      ctx.lineTo(headX + eyeOffsetX + 7 * scale, headY + eyeOffsetY);
      ctx.stroke();
    } else if (this.type === "boss") {
      // Golden horned crown & blazing eyes
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(headX + 4 * scale * facing, headY - 2 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3.5 * scale;
      ctx.beginPath();
      ctx.moveTo(headX - 6 * scale, headY - headRadius);
      ctx.lineTo(headX - 12 * scale, headY - headRadius - 12 * scale);
      ctx.moveTo(headX + 6 * scale, headY - headRadius);
      ctx.lineTo(headX + 12 * scale, headY - headRadius - 12 * scale);
      ctx.stroke();
    } else {
      // Standard glowing menacing eye slits for enemies
      ctx.shadowColor = this.eyeColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.eyeColor;
      ctx.beginPath();
      ctx.ellipse(headX + 4 * scale * facing, headY - 1 * scale, 3 * scale, 2 * scale, 0.3 * facing, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Draw Foreground Orbiting Crystals & Energy Ribbons
    if (this.type === "player" || this.type === "boss") {
      this.renderCrystals(ctx, false);
      this.renderEnergyRibbons(ctx, chestX, chestY);
    }

    // 4. Draw Slash Arcs if active
    if (pose.slashArc) {
      this.renderSlashArc(ctx, tipX, tipY);
    }

    ctx.restore();
  }

  renderCrystals(ctx, isBackLayer) {
    const scale = this.scale;
    const rx = 55 * scale;
    const ry = 22 * scale;
    const centerY = -50 * scale;

    ctx.save();
    for (let i = 0; i < 4; i++) {
      const angle = this.shardAngle + (i * Math.PI) / 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      // Distinguish back vs front half of orbit
      const isBack = sinA < 0;
      if (isBack !== isBackLayer) continue;

      const cx = cosA * rx;
      const cy = centerY + sinA * ry;

      // Crystal Polygon (Emerald Diamond Shard from Reference Image B)
      const shardSize = (8 + (sinA + 1) * 2) * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 1.5);

      ctx.beginPath();
      ctx.moveTo(0, -shardSize);
      ctx.lineTo(shardSize * 0.5, 0);
      ctx.lineTo(0, shardSize);
      ctx.lineTo(-shardSize * 0.5, 0);
      ctx.closePath();

      ctx.fillStyle = this.crystalColor;
      ctx.shadowColor = this.crystalColor;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  renderEnergyRibbons(ctx, chestX, chestY) {
    const scale = this.scale;
    const t = this.ribbonTimer;

    ctx.save();
    ctx.strokeStyle = this.ribbonColor;
    ctx.lineWidth = 3.5 * scale;
    ctx.shadowColor = this.edgeColor;
    ctx.shadowBlur = 14;
    ctx.lineCap = "round";

    // Animated dynamic spiral ribbon (Reference Image B)
    ctx.beginPath();
    const rx = 60 * scale;
    const ry = 26 * scale;
    for (let a = 0; a < Math.PI * 2.2; a += 0.25) {
      const theta = a + t;
      const px = Math.cos(theta) * rx * 0.8;
      const py = chestY + Math.sin(theta) * ry + Math.cos(a) * 12 * scale;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  renderSlashArc(ctx, tipX, tipY) {
    const scale = this.scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(tipX - 10 * this.facing, tipY, 40 * scale, -0.6 * this.facing, 1.2 * this.facing, this.facing < 0);
    ctx.lineWidth = 5 * scale;
    ctx.strokeStyle = this.edgeColor;
    ctx.shadowColor = this.edgeColor;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();
  }
}
