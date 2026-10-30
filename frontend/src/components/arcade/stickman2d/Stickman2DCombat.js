/**
 * Stickman2DCombat.js
 * Combat resolution system, floating damage numbers, impact particle bursts,
 * and WPM-scaled damage calculations for Stickman Fight (2D).
 */

export class Stickman2DCombat {
  constructor() {
    this.floatingTexts = [];
    this.particles = [];
    this.shockwaves = [];
  }

  calculateDamage(attackType, stats = {}) {
    let base = 25;
    let isHeavy = false;
    let isFinisher = false;

    if (attackType === "word_complete") {
      base = 28 + Math.floor(Math.random() * 8);
    } else if (attackType === "punctuation") {
      base = 52 + Math.floor(Math.random() * 12);
      isHeavy = true;
    } else if (attackType === "blade_storm" || attackType === "finisher") {
      base = 150 + Math.floor(Math.random() * 30);
      isFinisher = true;
    } else {
      base = 14 + Math.floor(Math.random() * 6);
    }

    // WPM Scaling Factor
    const wpm = stats.wpm || 30;
    let wpmMultiplier = 1.0;
    if (wpm >= 90) wpmMultiplier = 2.6;
    else if (wpm >= 70) wpmMultiplier = 2.0;
    else if (wpm >= 50) wpmMultiplier = 1.5;
    else if (wpm >= 35) wpmMultiplier = 1.2;

    // Flow / Combo multiplier
    const comboMult = stats.flowMultiplier || 1.0;

    // Critical hit chance
    const isCrit = isFinisher || Math.random() < 0.15 || (stats.combo && stats.combo >= 20);
    const critBonus = isCrit ? 1.75 : 1.0;

    const totalDamage = Math.round(base * wpmMultiplier * comboMult * critBonus);

    return {
      damage: totalDamage,
      isCrit,
      isHeavy,
      isFinisher,
    };
  }

  spawnDamageText(x, y, text, type = "normal") {
    let color = "#ffffff";
    let size = 18;
    let vy = -60;

    if (type === "crit") {
      color = "#facc15"; // Glowing Yellow
      size = 24;
      vy = -75;
    } else if (type === "finisher") {
      color = "#4ade80"; // Bright Emerald
      size = 28;
      vy = -85;
    } else if (type === "parry") {
      color = "#38bdf8"; // Azure Blue
      size = 22;
      vy = -65;
    } else if (type === "blocked") {
      color = "#94a3b8";
      size = 16;
      vy = -50;
    } else if (type === "player_hurt") {
      color = "#ef4444";
      size = 20;
      vy = -55;
    }

    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 20,
      text: String(text),
      color,
      size,
      vy,
      alpha: 1.0,
      scale: 1.3,
      duration: 0.85,
      life: 0.85,
    });
  }

  spawnHitSparks(x, y, isCrit = false, isEmerald = true) {
    const sparkCount = isCrit ? 22 : 12;
    const baseColor = isEmerald ? "#4ade80" : "#ef4444";

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * (isCrit ? 260 : 160);
      this.particles.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 8 + Math.random() * (isCrit ? 16 : 8),
        color: baseColor,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }

    // Shockwave ring on critical hits
    if (isCrit) {
      this.shockwaves.push({
        x,
        y,
        radius: 10,
        maxRadius: 75,
        color: isEmerald ? "rgba(74, 222, 128, " : "rgba(239, 68, 68, ",
        life: 0.3,
        maxLife: 0.3,
      });
    }
  }

  spawnShadowDeathPuff(x, y) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        type: "smoke",
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 40 - 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        radius: 12 + Math.random() * 16,
        color: "rgba(24, 24, 27, ",
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  update(dt) {
    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      ft.alpha = Math.max(0, ft.life / ft.duration);
      if (ft.scale > 1.0) ft.scale -= dt * 2.0;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === "spark") {
        p.vx *= 0.9;
        p.vy += 200 * dt; // gravity
      } else if (p.type === "smoke") {
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.radius += dt * 10;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const progress = 1 - sw.life / sw.maxLife;
      sw.radius = 10 + progress * (sw.maxRadius - 10);

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render shockwaves
    for (const sw of this.shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color + alpha + ")";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      if (p.type === "spark") {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = alpha;
        ctx.stroke();
      } else if (p.type === "smoke") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + (alpha * 0.5) + ")";
        ctx.fill();
      }
    }

    // Render floating combat text
    ctx.globalAlpha = 1.0;
    ctx.font = "bold 20px 'Cinzel', 'Inter', sans-serif";
    ctx.textAlign = "center";
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}
