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

    // Animation & aura time
    this.animTime = 0;

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
      // Red Stickman Warrior (Reference Image 1 & 2)
      this.color = "#dc2626"; // Crimson Red
      this.headColor = "#dc2626";
      this.eyeColor = "#4ade80"; // Glowing emerald green
      this.glowColor = "rgba(74, 222, 128, 0.45)";
      this.strokeWidth = 6.8;
      this.hasWarriorAura = true;
    } else if (this.name && this.name.toLowerCase().includes("white")) {
      // Iconic White Stickman Rival from Storyboard (Reference Image 4 Frame 1-54)
      this.color = "#ffffff";
      this.headColor = "#ffffff";
      this.eyeColor = "#09090b";
      this.outlineColor = "#09090b";
      this.glowColor = "rgba(255, 255, 255, 0.4)";
      this.strokeWidth = 6.2;
      this.isWhiteFighter = true;
    } else if (this.type === "boss") {
      this.color = "#7c2d12"; // Deep bronze/dark red
      this.headColor = "#991b1b";
      this.eyeColor = "#f59e0b"; // Golden glow
      this.glowColor = "rgba(245, 158, 11, 0.45)";
      this.strokeWidth = 8.5;
    } else {
      // Enemy: Charcoal / Ninja Black
      this.color = "#18181b";
      this.headColor = "#27272a";
      this.eyeColor = "#ef4444"; // Menacing red eyes
      this.glowColor = "rgba(24, 24, 27, 0.4)";
      this.strokeWidth = 6.0;
    }
  }

  update(dt) {
    this.animTime += dt;

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

    // Joint Endpoints
    const lKneeX = hipX + Math.sin(pose.lLegUpper) * legUpperLen * facing;
    const lKneeY = hipY + Math.cos(pose.lLegUpper) * legUpperLen;
    const lFootX = lKneeX + Math.sin(pose.lLegUpper + pose.lLegLower) * legLowerLen * facing;
    const lFootY = lKneeY + Math.cos(pose.lLegUpper + pose.lLegLower) * legLowerLen;

    const lElbowX = chestX + Math.sin(pose.lArmUpper) * armUpperLen * facing;
    const lElbowY = chestY + Math.cos(pose.lArmUpper) * armUpperLen;
    const lFistX = lElbowX + Math.sin(pose.lArmUpper + pose.lArmFore) * armForeLen * facing;
    const lFistY = lElbowY + Math.cos(pose.lArmUpper + pose.lArmFore) * armForeLen;

    const rKneeX = hipX + Math.sin(pose.rLegUpper) * legUpperLen * facing;
    const rKneeY = hipY + Math.cos(pose.rLegUpper) * legUpperLen;
    const rFootX = rKneeX + Math.sin(pose.rLegUpper + pose.rLegLower) * legLowerLen * facing;
    const rFootY = rKneeY + Math.cos(pose.rLegUpper + pose.rLegLower) * legLowerLen;

    const rElbowX = chestX + Math.sin(pose.rArmUpper) * armUpperLen * facing;
    const rElbowY = chestY + Math.cos(pose.rArmUpper) * armUpperLen;
    const rFistX = rElbowX + Math.sin(pose.rArmUpper + pose.rArmFore) * armForeLen * facing;
    const rFistY = rElbowY + Math.cos(pose.rArmUpper + pose.rArmFore) * armForeLen;

    // Stroke style
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.strokeWidth * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // If White Fighter (Storyboard Rival), draw dark outline first for comic book contrast
    if (this.isWhiteFighter) {
      ctx.save();
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = (this.strokeWidth + 3.0) * scale;
      // Draw limbs outline
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(lKneeX, lKneeY);
      ctx.lineTo(lFootX, lFootY);
      ctx.moveTo(chestX, chestY);
      ctx.lineTo(lElbowX, lElbowY);
      ctx.lineTo(lFistX, lFistY);
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(chestX, chestY);
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(rKneeX, rKneeY);
      ctx.lineTo(rFootX, rFootY);
      ctx.moveTo(chestX, chestY);
      ctx.lineTo(rElbowX, rElbowY);
      ctx.lineTo(rFistX, rFistY);
      ctx.stroke();
      ctx.restore();
    }

    // --- WARRIOR FLOATING BLADES (Behind Body - Reference Image 1 & 2) ---
    if (this.hasWarriorAura && this.isAlive && this.state !== "down" && this.state !== "knockback") {
      this.renderFloatingBlades(ctx, chestX, chestY, scale, facing, this.animTime);
    }

    // --- LEFT LEG (Back) ---
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

    // Left Forearm Scars (Reference Image 1 & 2)
    if (this.hasWarriorAura) {
      this.renderForearmScars(ctx, lElbowX, lElbowY, lFistX, lFistY, scale);
    }

    // --- TORSO / SPINE ---
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(chestX, chestY);
    ctx.stroke();

    // --- RIGHT LEG (Front) ---
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

    // Right Forearm Scars (Reference Image 1 & 2)
    if (this.hasWarriorAura) {
      this.renderForearmScars(ctx, rElbowX, rElbowY, rFistX, rFistY, scale);
      // Combat Dagger held in front hand
      this.renderCombatDagger(ctx, rFistX, rFistY, pose.rArmUpper + pose.rArmFore, scale, facing);
    }

    // --- SWIRLING NEON GREEN ENERGY RIBBON (Reference Image 1 & 2) ---
    if (this.hasWarriorAura && this.isAlive && this.state !== "down" && this.state !== "knockback") {
      this.renderEnergyRibbon(ctx, chestX, chestY, hipY, scale, facing, this.animTime);
    }

    // --- HEAD & FACE ---
    this.renderHead(ctx, headX, headY, headRadius, scale, facing);

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

  // Floating Emerald Dagger Crystals (Reference Image 1 & 2)
  renderFloatingBlades(ctx, chestX, chestY, scale, facing, time) {
    const bladeConfigs = [
      { baseAngle: -0.85, dist: 78, rot: 0.35, s: 1.1 },
      { baseAngle: -0.25, dist: 95, rot: -0.22, s: 0.92 },
      { baseAngle: 2.15, dist: 82, rot: 0.75, s: 1.05 },
      { baseAngle: 2.85, dist: 68, rot: -0.45, s: 0.88 },
    ];

    bladeConfigs.forEach((b, idx) => {
      const bob = Math.sin(time * 2.4 + idx * 1.6) * 6;
      const angle = b.baseAngle + Math.cos(time * 1.5 + idx) * 0.12;
      const bx = chestX + Math.cos(angle) * b.dist * facing;
      const by = chestY + Math.sin(angle) * (b.dist * 0.65) + bob;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate((b.rot + Math.sin(time * 2.0 + idx) * 0.25) * facing);
      ctx.scale(scale * b.s, scale * b.s);

      // Translucent Emerald Body with Glow
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(16, 185, 129, 0.75)";
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(0, -22); // Top tip
      ctx.lineTo(6, -6);
      ctx.lineTo(4, 18);
      ctx.lineTo(0, 24); // Bottom tip
      ctx.lineTo(-4, 18);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp central energy spine
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 20);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.restore();
    });
  }

  // Dynamic Swirling Neon Green Ribbon (Reference Image 1 & 2)
  renderEnergyRibbon(ctx, chestX, chestY, hipY, scale, facing, time) {
    ctx.save();
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 14;

    const t = time * 2.8;

    // Outer Ribbon Spiral
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.ellipse(chestX, chestY + 8 * scale, 54 * scale, 24 * scale, (Math.PI / 6) * facing, t, t + Math.PI * 1.25);
    ctx.stroke();

    // Secondary Inner Ribbon orbiting hips/legs
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.ellipse(chestX - 6 * scale * facing, hipY + 16 * scale, 44 * scale, 18 * scale, (-Math.PI / 7) * facing, -t * 0.9, -t * 0.9 + Math.PI * 1.15);
    ctx.stroke();

    ctx.restore();
  }

  // Tactical Combat Dagger in Lead Hand (Reference Image 1 & 2)
  renderCombatDagger(ctx, fistX, fistY, armAngle, scale, facing) {
    ctx.save();
    ctx.translate(fistX, fistY);
    ctx.rotate(armAngle);

    // Dark charcoal hilt & grip
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-2 * scale, -2 * scale, 4.5 * scale, 9 * scale);

    // Guard
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(-4.5 * scale, 7 * scale, 9 * scale, 2.5 * scale);

    // Blade with glowing emerald cutting edge
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1.6 * scale;

    ctx.beginPath();
    ctx.moveTo(-1 * scale, 9 * scale);
    ctx.lineTo(15 * scale * facing, 22 * scale); // Point
    ctx.lineTo(2.5 * scale * facing, 9 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Forearm Battle Scratches (Reference Image 1 & 2)
  renderForearmScars(ctx, elbowX, elbowY, fistX, fistY, scale) {
    ctx.save();
    ctx.strokeStyle = "rgba(74, 222, 128, 0.6)";
    ctx.lineWidth = 1.0 * scale;
    const midX = (elbowX + fistX) / 2;
    const midY = (elbowY + fistY) / 2;

    ctx.beginPath();
    ctx.moveTo(midX - 4 * scale, midY - 3 * scale);
    ctx.lineTo(midX + 4 * scale, midY + 3 * scale);
    ctx.moveTo(midX - 3 * scale, midY + 4 * scale);
    ctx.lineTo(midX + 5 * scale, midY - 2 * scale);
    ctx.stroke();
    ctx.restore();
  }

  // Authentic Head Rendering: Cross Scars & Glowing Green Cross Eyes (Image 1 & 2) or White Rival (Image 4)
  renderHead(ctx, headX, headY, headRadius, scale, facing) {
    ctx.save();

    if (this.isWhiteFighter) {
      // White Stickman Rival (Image 4 Storyboard)
      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 3.0 * scale;
      ctx.stroke();

      // Sharp dark eye
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(headX + 4 * scale * facing, headY - 1 * scale, 2.8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Standard / Red Stickman Head
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.headColor;
    ctx.fill();
    ctx.strokeStyle = this.hasWarriorAura ? "#991b1b" : this.color;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    if (this.hasWarriorAura) {
      // 1. Battle Scar Scratches (faint gold/green etched lines as in Image 1/2)
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
      ctx.lineWidth = 1.0 * scale;
      ctx.beginPath();
      ctx.moveTo(headX - 6 * scale * facing, headY - 8 * scale);
      ctx.lineTo(headX + 4 * scale * facing, headY + 5 * scale);
      ctx.moveTo(headX - 2 * scale * facing, headY - 10 * scale);
      ctx.lineTo(headX + 8 * scale * facing, headY + 3 * scale);
      ctx.moveTo(headX - 7 * scale * facing, headY - 2 * scale);
      ctx.lineTo(headX + 5 * scale * facing, headY - 8 * scale);
      ctx.stroke();

      // 2. Angled dark eye socket
      const eyeX = headX + 4 * scale * facing;
      const eyeY = headY - 1 * scale;
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 4.8 * scale, 2.6 * scale, facing > 0 ? 0.3 : -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Glowing Emerald Cross Eye (Reference Image 1 & 2)
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 12;

      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2.0 * scale;
      ctx.beginPath();
      // Horizontal cross bar
      ctx.moveTo(eyeX - 4.5 * scale, eyeY);
      ctx.lineTo(eyeX + 4.5 * scale, eyeY);
      // Vertical cross bar
      ctx.moveTo(eyeX, eyeY - 4.5 * scale);
      ctx.lineTo(eyeX, eyeY + 4.5 * scale);
      ctx.stroke();

      // White central spark
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard enemy eye
      ctx.fillStyle = this.eyeColor;
      ctx.beginPath();
      ctx.arc(headX + 4 * scale * facing, headY - 1 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
