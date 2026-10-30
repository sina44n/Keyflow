/**
 * Stickman2DEnvironment.js
 * Multi-layer 2D Parallax Red Forest Battlefield with dynamic particle atmosphere,
 * smooth horizontal camera tracking, and screen shake system.
 */

export class Stickman2DEnvironment {
  constructor(canvasWidth = 1000, canvasHeight = 600) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.groundY = Math.round(canvasHeight * 0.72);

    // 2D Camera
    this.cameraX = 0;
    this.targetCameraX = 0;
    this.shakeIntensity = 0;
    this.shakeTime = 0;

    // Atmospheric particles
    this.particles = [];
    this.initParticles();

    // Runic Spires positions (world X coordinates)
    this.spires = [-600, -200, 300, 800, 1400, 2000, 2600];
    // Background trees positions
    this.bgTrees = [];
    for (let x = -1000; x < 3500; x += 180 + Math.random() * 120) {
      this.bgTrees.push({
        x,
        height: 160 + Math.random() * 90,
        width: 35 + Math.random() * 25,
        branches: Math.floor(2 + Math.random() * 3),
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = Math.round(height * 0.72);
  }

  initParticles() {
    this.particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const isEmerald = Math.random() > 0.65;
      this.particles.push({
        x: Math.random() * (this.width + 1200) - 600,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 20 - 15,
        vy: isEmerald ? (Math.random() - 0.5) * 15 : -25 - Math.random() * 30,
        radius: isEmerald ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 2,
        color: isEmerald ? "rgba(74, 222, 128, " : "rgba(239, 68, 68, ",
        alpha: 0.3 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 3,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  addShake(intensity = 8, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, playerX) {
    // Camera follows player smoothly
    this.targetCameraX = playerX - this.width * 0.35;
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;

    // Camera screen shake decay
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Update atmospheric particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.pulse += p.pulseSpeed * dt;

      // Wrap around screen boundaries relative to camera
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
      if (p.x < this.cameraX - 100) p.x = this.cameraX + this.width + 100;
      if (p.x > this.cameraX + this.width + 100) p.x = this.cameraX - 100;
    }
  }

  render(ctx) {
    ctx.save();

    // Calculate camera shake offset
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeIntensity > 0) {
      shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    // 1. SKY GRADIENT (Static in screen space)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, "#180608"); // Deep dark obsidian red
    skyGrad.addColorStop(0.45, "#3b0c11"); // Blood crimson
    skyGrad.addColorStop(0.85, "#5a131b"); // Fiery twilight glow
    skyGrad.addColorStop(1, "#2a0a0e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Glowing Blood Moon
    const moonX = this.width * 0.78 - (this.cameraX * 0.03);
    const moonY = this.height * 0.22;
    const moonRadius = 45;

    ctx.save();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#f87171";
    ctx.shadowColor = "rgba(239, 68, 68, 0.85)";
    ctx.shadowBlur = 40;
    ctx.fill();

    // Dark eclipse crescent
    ctx.beginPath();
    ctx.arc(moonX - 12, moonY - 6, moonRadius - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#3b0c11";
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();

    // Apply Camera Transform
    ctx.translate(-this.cameraX + shakeOffsetX, shakeOffsetY);

    // 2. LAYER 1: Distant Silhouette Mountain Range (Parallax ~0.2x)
    this.renderDistantMountains(ctx);

    // 3. LAYER 2: Midground Red Pines & Runic Spire Monoliths (Parallax ~0.5x)
    this.renderMidgroundPinesAndSpires(ctx);

    // 4. LAYER 3: Battlefield Ground Plane (1.0x full speed)
    this.renderBattlefieldGround(ctx);

    // 5. LAYER 4: Atmospheric Embers & Fireflies
    this.renderAtmosphereParticles(ctx);

    ctx.restore();
  }

  renderDistantMountains(ctx) {
    ctx.save();
    ctx.fillStyle = "#1e080b";
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 200, this.groundY);

    const startX = Math.floor((this.cameraX * 0.2) / 250) * 250 - 400;
    for (let x = startX; x < startX + this.width + 800; x += 180) {
      const peakY = this.groundY - 140 - Math.sin(x * 0.005) * 60;
      ctx.lineTo(x + this.cameraX * 0.8, peakY);
    }
    ctx.lineTo(this.cameraX + this.width + 300, this.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderMidgroundPinesAndSpires(ctx) {
    ctx.save();

    // Draw background trees
    for (const tree of this.bgTrees) {
      const screenX = tree.x;
      if (screenX < this.cameraX - 150 || screenX > this.cameraX + this.width + 150) continue;

      const topY = this.groundY - tree.height;

      // Trunk
      ctx.fillStyle = "#2d0b10";
      ctx.beginPath();
      ctx.moveTo(screenX - tree.width * 0.5, this.groundY);
      ctx.lineTo(screenX + tree.width * 0.5, this.groundY);
      ctx.lineTo(screenX + tree.width * 0.2, topY);
      ctx.lineTo(screenX - tree.width * 0.2, topY);
      ctx.closePath();
      ctx.fill();

      // Gnarled branches
      ctx.strokeStyle = "#2d0b10";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(screenX, topY + tree.height * 0.4);
      ctx.lineTo(screenX - 45, topY + tree.height * 0.25);
      ctx.moveTo(screenX, topY + tree.height * 0.6);
      ctx.lineTo(screenX + 45, topY + tree.height * 0.45);
      ctx.stroke();
    }

    // Ancient Runic Spires with glowing green runes
    for (const spireX of this.spires) {
      if (spireX < this.cameraX - 200 || spireX > this.cameraX + this.width + 200) continue;

      const spireHeight = 180;
      const spireWidth = 32;
      const topY = this.groundY - spireHeight;

      // Spire stone obelisk
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.moveTo(spireX - spireWidth / 2, this.groundY);
      ctx.lineTo(spireX - spireWidth / 3, topY);
      ctx.lineTo(spireX, topY - 20); // Pointed cap
      ctx.lineTo(spireX + spireWidth / 3, topY);
      ctx.lineTo(spireX + spireWidth / 2, this.groundY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#2e2e38";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing Emerald Runes
      ctx.save();
      ctx.strokeStyle = "#4ade80";
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;

      // Draw rune glyphs on the spire
      ctx.beginPath();
      const rY1 = topY + 40;
      ctx.moveTo(spireX - 5, rY1 - 8);
      ctx.lineTo(spireX + 5, rY1);
      ctx.lineTo(spireX - 5, rY1 + 8);

      const rY2 = topY + 80;
      ctx.moveTo(spireX - 6, rY2);
      ctx.lineTo(spireX + 6, rY2);
      ctx.moveTo(spireX, rY2 - 8);
      ctx.lineTo(spireX, rY2 + 8);

      const rY3 = topY + 120;
      ctx.arc(spireX, rY3, 5, 0, Math.PI * 2);

      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  renderBattlefieldGround(ctx) {
    ctx.save();

    // Ground platform fill
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, "#1c1417"); // Dark ancient basalt
    groundGrad.addColorStop(0.3, "#120c0f");
    groundGrad.addColorStop(1, "#080507");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(this.cameraX - 200, this.groundY, this.width + 400, this.height - this.groundY);

    // Stone flagstone edge line
    ctx.strokeStyle = "#3f1b24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 200, this.groundY);
    ctx.lineTo(this.cameraX + this.width + 200, this.groundY);
    ctx.stroke();

    // Flagstone tile seams and cracks
    ctx.strokeStyle = "#2a151b";
    ctx.lineWidth = 2;
    const tileWidth = 90;
    const startTile = Math.floor((this.cameraX - 200) / tileWidth) * tileWidth;
    for (let tx = startTile; tx < this.cameraX + this.width + 200; tx += tileWidth) {
      ctx.beginPath();
      ctx.moveTo(tx, this.groundY);
      ctx.lineTo(tx - 15, this.groundY + 35);
      ctx.stroke();
    }

    // Subtle mossy / blood stains on the battle floor
    ctx.fillStyle = "rgba(185, 28, 28, 0.15)";
    for (let bx = startTile; bx < this.cameraX + this.width + 200; bx += 180) {
      ctx.beginPath();
      ctx.ellipse(bx + 40, this.groundY + 10, 45, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderAtmosphereParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.fillStyle = p.color + alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
