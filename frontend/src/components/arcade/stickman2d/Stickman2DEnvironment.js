/**
 * Stickman2DEnvironment.js
 * High-readability 2D Martial Arts Fighting Arena.
 * Features:
 * - High-contrast dojo / dusky mountain courtyard background that highlights stickman silhouettes.
 * - Solid ground combat platform with stone seams and subtle lighting.
 * - Smooth horizontal camera tracking the active fight pocket.
 * - Dynamic camera screen shake system on heavy punches, kicks, and knockdowns.
 */

export class Stickman2DEnvironment {
  constructor(canvasWidth = 1000, canvasHeight = 560) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.groundY = Math.round(canvasHeight * 0.72);

    this.cameraX = 0;
    this.targetCameraX = 0;
    this.shakeIntensity = 0;
    this.shakeTime = 0;

    // Atmospheric particles
    this.particles = [];
    this.initAtmosphere();
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = Math.round(height * 0.72);
  }

  initAtmosphere() {
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * (this.width + 800) - 400,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 15 - 10,
        vy: -15 - Math.random() * 25,
        radius: 1.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.4,
      });
    }
  }

  addShake(intensity = 6, duration = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, focusX) {
    // Camera centers smoothly between fighters
    this.targetCameraX = focusX - this.width * 0.5;
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;

    // Screen shake decay
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Atmospheric particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < 0) p.y = this.height;
      if (p.x < this.cameraX - 100) p.x = this.cameraX + this.width + 100;
    }
  }

  render(ctx) {
    ctx.save();

    // Screen shake offsets
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    // 1. SKY / DOJO BACKDROP (Screen space)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, "#09090b"); // Pure deep obsidian night
    skyGrad.addColorStop(0.5, "#18181b"); // Slate dark
    skyGrad.addColorStop(1, "#27272a"); // Subtle horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle atmospheric moon / arena backlight
    const moonX = this.width * 0.75 - this.cameraX * 0.02;
    const moonY = this.height * 0.22;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.shadowColor = "rgba(255, 255, 255, 0.15)";
    ctx.shadowBlur = 35;
    ctx.fill();

    // 2. WORLD SPACE TRANSFORM
    ctx.translate(-this.cameraX + shakeX, shakeY);

    // Distant mountain silhouettes
    ctx.fillStyle = "#121215";
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 200, this.groundY);
    for (let x = this.cameraX - 200; x <= this.cameraX + this.width + 200; x += 150) {
      const my = this.groundY - 120 - Math.sin(x * 0.006) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(this.cameraX + this.width + 200, this.groundY);
    ctx.closePath();
    ctx.fill();

    // Arena pillars / lanterns in background
    ctx.fillStyle = "#1e1e24";
    for (let px = -600; px <= 2400; px += 350) {
      if (px < this.cameraX - 100 || px > this.cameraX + this.width + 100) continue;
      // Pillar
      ctx.fillRect(px - 14, this.groundY - 160, 28, 160);
      // Lantern glow
      ctx.beginPath();
      ctx.arc(px, this.groundY - 170, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.fillStyle = "#1e1e24";
    }

    // 3. GROUND PLATFORM (Solid martial arts stone floor)
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, "#18181b");
    groundGrad.addColorStop(0.3, "#0f172a");
    groundGrad.addColorStop(1, "#020617");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(this.cameraX - 200, this.groundY, this.width + 400, this.height - this.groundY);

    // Crisp Stone Ground Line
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 200, this.groundY);
    ctx.lineTo(this.cameraX + this.width + 200, this.groundY);
    ctx.stroke();

    // Flagstone Tile Seams
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1.5;
    const tileW = 90;
    const startX = Math.floor((this.cameraX - 200) / tileW) * tileW;
    for (let tx = startX; tx < this.cameraX + this.width + 200; tx += tileW) {
      ctx.beginPath();
      ctx.moveTo(tx, this.groundY);
      ctx.lineTo(tx - 20, this.height);
      ctx.stroke();
    }

    // 4. ATMOSPHERIC MOTES
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
