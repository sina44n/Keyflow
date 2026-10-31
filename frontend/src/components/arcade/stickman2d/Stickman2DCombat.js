/**
 * Stickman2DCombat.js
 * High-impact 2D Martial Arts Combat Resolution Engine.
 * Implements:
 * - Precise limb-to-body hit detection (fist, foot, knee, energy beam vs hurtbox).
 * - Hit-stop micro freeze (3–5 frames) for satisfying physical punch weight.
 * - Starburst impact sparks, dust clouds, comic impact lines.
 * - Directional knockback and ground slams.
 * - Floating combat typography.
 */

export class Stickman2DCombat {
  constructor() {
    this.floatingTexts = [];
    this.impactParticles = [];
    this.dustPuffs = [];
    this.hitStopActive = false;
    this.hitStopDuration = 0;
  }

  // Check collision between attacker's active strike and defender's hurtbox
  checkHit(attacker, defender) {
    if (!attacker || !defender || !defender.isAlive || defender.invulnerableTimer > 0) {
      return null;
    }
    if (defender.state === "down" || defender.state === "defeated") {
      return null;
    }
    if (attacker.hasHitCurrentTarget) {
      return null; // Prevent multi-hitting on the same strike
    }

    const strike = attacker.getActiveStrikeHitbox();
    if (!strike) return null;

    const hurtbox = defender.getHurtbox();

    let isColliding = false;
    let hitX = strike.x;
    let hitY = strike.y;

    if (strike.isBeam) {
      // Beam collision check
      const minX = Math.min(strike.startX, strike.endX);
      const maxX = Math.max(strike.startX, strike.endX);
      const withinX = defender.x >= minX - 20 && defender.x <= maxX + 20;
      const withinY = Math.abs(strike.y - (hurtbox.y + hurtbox.h / 2)) < 55;
      isColliding = withinX && withinY;
      hitX = defender.x;
      hitY = strike.y;
    } else {
      // Circle vs Rectangle collision
      const closeX = Math.max(hurtbox.x, Math.min(strike.x, hurtbox.x + hurtbox.w));
      const closeY = Math.max(hurtbox.y, Math.min(strike.y, hurtbox.y + hurtbox.h));
      const distSq = (strike.x - closeX) ** 2 + (strike.y - closeY) ** 2;
      isColliding = distSq <= strike.radius ** 2;
      hitX = closeX;
      hitY = closeY;
    }

    if (isColliding) {
      attacker.hasHitCurrentTarget = true;
      return {
        type: strike.type,
        x: hitX,
        y: hitY,
      };
    }

    return null;
  }

  // Resolve damage, hit-stop, and visual reactions
  resolveHit(attacker, defender, hitInfo, stats = {}, audio = null, env = null) {
    const attackType = hitInfo.type;

    // Base Damage by Attack Type
    let baseDmg = 20;
    let isHeavy = false;
    let isCrit = false;

    if (attackType === "punch") {
      baseDmg = 18 + Math.floor(Math.random() * 8);
    } else if (attackType === "kick" || attackType === "knee") {
      baseDmg = 28 + Math.floor(Math.random() * 10);
      isHeavy = true;
    } else if (attackType === "sweep" || attackType === "dropkick") {
      baseDmg = 34 + Math.floor(Math.random() * 12);
      isHeavy = true;
    } else if (attackType === "energy") {
      baseDmg = 65 + Math.floor(Math.random() * 20);
      isHeavy = true;
      isCrit = true;
    }

    // WPM Scaling Factor: higher typing speed increases punch power!
    const wpm = stats.wpm || 30;
    let wpmMult = 1.0;
    if (wpm >= 90) wpmMult = 1.8;
    else if (wpm >= 70) wpmMult = 1.5;
    else if (wpm >= 50) wpmMult = 1.25;

    // Combo streak bonus
    const comboMult = stats.flowMultiplier || 1.0;
    if (stats.combo && stats.combo >= 15 && Math.random() < 0.25) {
      isCrit = true;
    }

    const totalDamage = Math.round(baseDmg * wpmMult * comboMult * (isCrit ? 1.6 : 1.0));

    // Apply damage to defender
    const dmgResult = defender.takeDamage(totalDamage, attackType, attacker.x);

    // Hit-Stop Micro Freeze: Freeze both characters for 50-70ms for tactile impact
    const hitStopMs = isHeavy ? 0.07 : 0.045;
    attacker.hitStopTimer = hitStopMs;
    defender.hitStopTimer = hitStopMs;

    // Screen Shake
    if (env) {
      env.addShake(isHeavy ? 10 : 5, isHeavy ? 0.25 : 0.15);
    }

    // Audio
    if (audio) {
      if (dmgResult.blocked) {
        audio.playClash();
      } else if (isHeavy || isCrit) {
        audio.playHit(true);
      } else {
        audio.playHit(false);
      }
    }

    // Floating Text & Sparks
    if (dmgResult.blocked) {
      this.spawnDamageText(hitInfo.x, hitInfo.y - 30, "BLOCKED!", "blocked");
      this.spawnImpactSparks(hitInfo.x, hitInfo.y, false, false);
    } else {
      const label = isCrit ? `CRIT! -${dmgResult.damage}` : `-${dmgResult.damage}`;
      const textStyle = isCrit ? "crit" : isHeavy ? "heavy" : "normal";
      this.spawnDamageText(hitInfo.x, hitInfo.y - 35, label, textStyle);
      this.spawnImpactSparks(hitInfo.x, hitInfo.y, isCrit, attacker.type === "player");

      if (dmgResult.knockback) {
        this.spawnDustCloud(defender.x, defender.groundY);
      }
    }

    return dmgResult;
  }

  spawnDamageText(x, y, text, type = "normal") {
    let color = "#ffffff";
    let size = 20;

    if (type === "crit") {
      color = "#facc15"; // Gold
      size = 26;
    } else if (type === "heavy") {
      color = "#ef4444"; // Red
      size = 23;
    } else if (type === "blocked") {
      color = "#94a3b8"; // Slate
      size = 17;
    }

    this.floatingTexts.push({
      x: x + (Math.random() * 16 - 8),
      y: y,
      text: String(text),
      color,
      size,
      vy: -70,
      scale: 1.4,
      alpha: 1.0,
      life: 0.75,
      maxLife: 0.75,
    });
  }

  spawnImpactSparks(x, y, isCrit = false, isPlayer = true) {
    const count = isCrit ? 18 : 10;
    const baseColor = isPlayer ? "#ef4444" : "#ffffff";

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * (isCrit ? 220 : 140);
      this.impactParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 6 + Math.random() * 8,
        color: Math.random() > 0.4 ? baseColor : "#fbbf24",
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.35,
      });
    }
  }

  spawnDustCloud(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.5;
      const speed = 40 + Math.random() * 90;
      this.dustPuffs.push({
        x: x + (Math.random() * 20 - 10),
        y: y - 5,
        vx: Math.cos(angle) * speed,
        vy: -20 - Math.random() * 40,
        radius: 8 + Math.random() * 12,
        color: "rgba(120, 113, 108, ",
        life: 0.5 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }

  update(dt) {
    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.scale > 1.0) ft.scale -= dt * 2.5;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Impact Sparks
    for (let i = this.impactParticles.length - 1; i >= 0; i--) {
      const p = this.impactParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy += 300 * dt; // Gravity

      if (p.life <= 0) {
        this.impactParticles.splice(i, 1);
      }
    }

    // Dust Puffs
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const d = this.dustPuffs[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.radius += dt * 8;
      d.vx *= 0.88;

      if (d.life <= 0) {
        this.dustPuffs.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Dust Puffs
    for (const d of this.dustPuffs) {
      const alpha = Math.max(0, d.life / d.maxLife) * 0.45;
      ctx.fillStyle = d.color + alpha + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact Sparks
    for (const p of this.impactParticles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
    }

    // Floating Texts
    ctx.globalAlpha = 1.0;
    ctx.font = "900 20px 'Cinzel', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}
