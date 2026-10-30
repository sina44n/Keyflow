import * as THREE from 'three';
import { Boss3DTitan } from './Boss3DTitan';

/**
 * Boss3DScene.js — 3D Obsidian Volcanic Colosseum Three.js Engine for Boss Battle
 * ===============================================================================
 * Features:
 * - Obsidian volcanic arena with lava trenches and stormy skybox
 * - Articulated Mecha Titan Boss with attack telegraphs & counter-parry shields
 * - Advancing combat soldiers with 3D word callsign plaques
 * - High-velocity energy plasma bolts connecting player to enemies
 * - Dynamic seismic screen rumble on boss ground slams
 */
export class Boss3DScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.titan = null;

    this.soldiers = new Map(); // id -> soldierMesh
    this.projectiles = []; // active plasma bolts
    this.shakeIntensity = 0;

    this.animId = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene & Volcanic Ember Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0505);
    this.scene.fog = new THREE.FogExp2(0x0a0505, 0.016);

    // 2. Camera (Player vantage looking into the arena)
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 200);
    this.camera.position.set(0, 3.2, 5.5);
    this.camera.lookAt(0, 4.0, -22);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting (Lava glow + Storm key light)
    const ambientLight = new THREE.AmbientLight(0x271010, 1.6);
    this.scene.add(ambientLight);

    const lavaLight = new THREE.DirectionalLight(0xf97316, 2.2);
    lavaLight.position.set(0, -5, -15);
    this.scene.add(lavaLight);

    const stormLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    stormLight.position.set(-15, 25, 10);
    this.scene.add(stormLight);

    // 5. Build Obsidian Colosseum Arena Floor & Lava Trenches
    this.buildColosseum();

    // 6. Spawn Mecha Titan
    this.titan = new Boss3DTitan(this.scene);

    // 7. Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // 8. Render Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  buildColosseum() {
    // 1. Volcanic Floor
    const floorGeo = new THREE.PlaneGeometry(36, 60);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1016,
      roughness: 0.85,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, -15);
    this.scene.add(floor);

    // 2. Glowing Magma Trenches (Glowing lava strips)
    [-7, 7].forEach((x) => {
      const trenchGeo = new THREE.PlaneGeometry(1.2, 58);
      trenchGeo.rotateX(-Math.PI / 2);
      const trenchMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
      });
      const trench = new THREE.Mesh(trenchGeo, trenchMat);
      trench.position.set(x, 0.02, -15);
      this.scene.add(trench);
    });

    // 3. Basalt Perimeter Columns
    const columnGeo = new THREE.CylinderGeometry(0.9, 1.1, 14, 6);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });

    for (let z = 5; z > -45; z -= 8) {
      [-14, 14].forEach((x) => {
        const col = new THREE.Mesh(columnGeo, columnMat);
        col.position.set(x, 6, z);
        this.scene.add(col);
      });
    }
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Sync active soldier meshes from 2D arena coordinates
   */
  syncSoldiers(soldiersList, activeId, typedBuffer = '') {
    const currentIds = new Set(soldiersList.map((s) => s.id));

    // Remove dead soldiers
    for (const [id, soldier] of this.soldiers.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(soldier.group);
        soldier.texture.dispose();
        this.soldiers.delete(id);
      }
    }

    // Add or update active soldiers
    soldiersList.forEach((s) => {
      let soldier = this.soldiers.get(s.id);
      const isTarget = s.id === activeId;

      // Map 2D arena (X: 0..760, Y: 0..460) to 3D world space
      // X: -10 to +10, Y: 0 to 2, Z: -24 to 2
      const worldX = ((s.x - 380) / 380) * 11;
      const worldZ = -22 + (s.y / 360) * 24;

      if (!soldier) {
        soldier = this.createSoldierMesh(s);
        this.soldiers.set(s.id, soldier);
        this.scene.add(soldier.group);
      }

      soldier.group.position.set(worldX, 0, worldZ);
      this.renderSoldierCanvas(soldier, isTarget ? typedBuffer : '', isTarget);
    });
  }

  createSoldierMesh(soldierData) {
    const group = new THREE.Group();

    // Mech Soldier Body
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.4, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: soldierData.classId === 'elite' ? 0xa855f7 : 0xef4444,
      metalness: 0.8,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.9, 0);
    group.add(body);

    // Glowing Sensor Visor
    const eyeGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 1.4, 0.3);
    group.add(eye);

    // 3D Floating Word Plaque
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const plaqueGeo = new THREE.PlaneGeometry(2.8, 0.8);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 2.1, 0);
    group.add(plaque);

    return {
      id: soldierData.id,
      word: soldierData.word,
      group,
      plaque,
      canvas,
      ctx,
      texture,
    };
  }

  renderSoldierCanvas(soldier, typed = '', isTarget = false) {
    const { canvas, ctx, texture, word } = soldier;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.roundRect(12, 12, canvas.width - 24, canvas.height - 24, 18);
    ctx.fillStyle = isTarget ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.7)';
    ctx.fill();

    ctx.lineWidth = isTarget ? 3 : 1.5;
    ctx.strokeStyle = isTarget ? '#10B981' : 'rgba(239, 68, 68, 0.4)';
    if (isTarget) {
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Render characters
    ctx.font = 'bold 46px "JetBrains Mono", monospace, sans-serif';
    ctx.textBaseline = 'middle';

    const chars = word.split('');
    const charWidths = chars.map((c) => ctx.measureText(c).width);
    const totalW = charWidths.reduce((a, b) => a + b, 0);
    let startX = (canvas.width - totalW) / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const cw = charWidths[i];

      if (!isTarget) {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
      } else if (i < typed.length) {
        ctx.fillStyle = '#10B981';
      } else if (i === typed.length) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(startX - 1, centerY + 22, cw + 2, 4);
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.fillText(ch, startX, centerY);
      startX += cw;
    }

    texture.needsUpdate = true;
  }

  /**
   * Fire player energy plasma bolt toward enemy or Titan
   */
  fireBolt(targetPosition = null) {
    const origin = new THREE.Vector3(0, 1.8, 3.5);
    const destination = targetPosition || new THREE.Vector3(0, 5.0, -26);

    const boltGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.copy(origin);

    this.scene.add(bolt);

    const dir = destination.clone().sub(origin).normalize();
    this.projectiles.push({
      mesh: bolt,
      dir,
      speed: 55,
      destination,
      life: 0.8,
    });

    if (this.titan && !targetPosition) {
      this.titan.triggerFlinch();
    }
  }

  /**
   * Sync Boss counter-parry shield
   */
  syncBossAttack(phrase = '', typed = '', timeLeft = 3.0) {
    if (this.titan) {
      this.titan.renderParryShield(phrase, typed, timeLeft);
      this.titan.setTelegraph(Boolean(phrase && timeLeft > 0));
    }
  }

  triggerBossGroundSlam() {
    if (this.titan) {
      this.titan.triggerGroundSlam();
      this.shakeIntensity = 0.35;
    }
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Titan
    if (this.titan) {
      this.titan.update(delta);
    }

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.dir, p.speed * delta);

      if (p.life <= 0 || p.mesh.position.distanceTo(p.destination) < 1.5) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // 3. Make soldier plaques billboard to camera
    for (const soldier of this.soldiers.values()) {
      soldier.plaque.quaternion.copy(this.camera.quaternion);
    }

    // 4. Camera Shake on Ground Slam
    if (this.shakeIntensity > 0) {
      this.camera.position.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y = 3.2 + (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, delta * 6);
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 3.2;
    }

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.titan) {
      this.titan.destroy();
    }
    for (const soldier of this.soldiers.values()) {
      this.scene.remove(soldier.group);
      soldier.texture.dispose();
    }
    this.soldiers.clear();
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
