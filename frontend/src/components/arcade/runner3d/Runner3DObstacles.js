import * as THREE from 'three';

/**
 * High-DPI Dynamic Canvas Texture for Floating Obstacle Words
 */
function createWordCanvasTexture(word, actionType, typedCount = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  drawWordOnCanvas(ctx, canvas.width, canvas.height, word, actionType, typedCount);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { canvas, ctx, texture };
}

function drawWordOnCanvas(ctx, width, height, word, actionType, typedCount) {
  ctx.clearRect(0, 0, width, height);

  // Background plaque
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;

  const grad = ctx.createLinearGradient(0, 10, 0, height - 10);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(14, 14, width - 28, height - 28, 16);
  ctx.fill();

  // Border by action type
  const borderColors = {
    jump: '#38BDF8', // Cyan
    slide: '#F59E0B', // Amber
    hack: '#E11D48', // Rose
    crystal: '#10B981', // Emerald
  };
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderColors[actionType] || '#A855F7';
  ctx.stroke();

  // Action tag on top
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillStyle = borderColors[actionType] || '#A855F7';
  ctx.textAlign = 'center';
  ctx.fillText(actionType.toUpperCase(), width / 2, 42);

  ctx.restore();

  // Draw characters with typing progress colors
  ctx.font = '900 48px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalWidth = ctx.measureText(word).width;
  let startX = width / 2 - totalWidth / 2;

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const charWidth = ctx.measureText(char).width;
    const charCenter = startX + charWidth / 2;

    if (i < typedCount) {
      // Correctly typed
      ctx.fillStyle = '#10B981'; // Green
    } else if (i === typedCount) {
      // Current target character
      ctx.fillStyle = '#FBBF24'; // Golden glow
    } else {
      // Remaining
      ctx.fillStyle = '#F8FAFC'; // White
    }

    ctx.fillText(char, charCenter, 100);
    startX += charWidth;
  }
}

/**
 * Runner3DObstacles — Manages 3D Parkour Obstacles with Floating Words
 */
export class Runner3DObstacles {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.nextId = 1;

    this.buildMaterials();
  }

  buildMaterials() {
    this.hurdleMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });

    this.gateMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });

    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.9,
    });
  }

  spawnObstacle({ word, type = 'jump', lane = 0, z = 50 }) {
    const group = new THREE.Group();
    group.position.set(lane * 3.0, 0, z);

    let obstacleMesh;

    switch (type) {
      case 'jump': {
        // Low electric hurdle
        const hurdleGeo = new THREE.BoxGeometry(2.6, 0.45, 0.3);
        obstacleMesh = new THREE.Mesh(hurdleGeo, this.hurdleMat);
        obstacleMesh.position.y = 0.25;
        group.add(obstacleMesh);
        break;
      }

      case 'slide': {
        // High laser beam suspended across lane
        const beamGeo = new THREE.BoxGeometry(2.8, 0.2, 0.2);
        obstacleMesh = new THREE.Mesh(beamGeo, this.laserMat);
        obstacleMesh.position.y = 2.1;
        group.add(obstacleMesh);

        // Posts
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
        const postL = new THREE.Mesh(postGeo, this.hurdleMat);
        postL.position.set(-1.3, 1.4, 0);
        group.add(postL);

        const postR = postL.clone();
        postR.position.x = 1.3;
        group.add(postR);
        break;
      }

      case 'hack': {
        // Cyber firewall barrier
        const gateGeo = new THREE.BoxGeometry(2.6, 2.6, 0.25);
        obstacleMesh = new THREE.Mesh(gateGeo, this.gateMat);
        obstacleMesh.position.y = 1.3;
        group.add(obstacleMesh);
        break;
      }

      case 'crystal':
      default: {
        // Floating diamond gem
        const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
        obstacleMesh = new THREE.Mesh(crystalGeo, this.crystalMat);
        obstacleMesh.position.y = 1.35;
        group.add(obstacleMesh);
        break;
      }
    }

    // Floating 3D Word Plaque above obstacle
    const { canvas, ctx, texture } = createWordCanvasTexture(word, type, 0);
    const plaqueGeo = new THREE.PlaneGeometry(3.2, 1.0);
    const plaqueMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.y = type === 'slide' ? 3.4 : 2.5;
    group.add(plaqueMesh);

    this.scene.add(group);

    const obs = {
      id: this.nextId++,
      word,
      type,
      lane,
      z,
      group,
      obstacleMesh,
      canvas,
      ctx,
      texture,
      typedCount: 0,
      cleared: false,
      hit: false,
    };

    this.obstacles.push(obs);
    return obs;
  }

  setTypedCount(obstacle, count) {
    obstacle.typedCount = count;
    drawWordOnCanvas(obstacle.ctx, obstacle.canvas.width, obstacle.canvas.height, obstacle.word, obstacle.type, count);
    obstacle.texture.needsUpdate = true;
  }

  clearObstacle(obstacle) {
    obstacle.cleared = true;
    // Animate break / dissolve upwards
    const startY = obstacle.group.position.y;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      obstacle.group.position.y = startY + progress * 2.0;
      obstacle.group.scale.multiplyScalar(0.85);
      if (progress >= 1.0) {
        clearInterval(interval);
        this.scene.remove(obstacle.group);
      }
    }, 20);
  }

  update(playerZ, dt) {
    // Rotate crystals
    for (const obs of this.obstacles) {
      if (obs.type === 'crystal' && obs.obstacleMesh) {
        obs.obstacleMesh.rotation.y += dt * 2.5;
      }
    }

    // Remove obstacles far behind player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z < playerZ - 25) {
        this.scene.remove(obs.group);
        this.obstacles.splice(i, 1);
      }
    }
  }

  dispose() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.group);
    }
    this.obstacles = [];
  }
}
