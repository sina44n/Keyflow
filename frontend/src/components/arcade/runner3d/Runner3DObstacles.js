import * as THREE from 'three';

/**
 * Action Type Metadata: Visual Colors & Labels
 */
export const ACTION_STYLES = {
  jump: { color: '#38BDF8', label: 'JUMP', sound: 'jump' },
  slide: { color: '#F59E0B', label: 'SLIDE', sound: 'slide' },
  hack: { color: '#E11D48', label: 'HACK', sound: 'breach' },
  lane_left: { color: '#818CF8', label: '← LEFT', sound: 'lane' },
  lane_right: { color: '#C084FC', label: 'RIGHT →', sound: 'lane' },
  lane_center: { color: '#2DD4BF', label: '• CENTER', sound: 'lane' },
  bridge: { color: '#06B6D4', label: '⚡ BRIDGE', sound: 'bridge' },
  boost: { color: '#10B981', label: '★ BOOST', sound: 'crystal' },
};

/**
 * High-DPI Dynamic Canvas Texture for Floating 3D Action Words
 */
function createWordCanvasTexture(word, actionType, typedCount = 0, isTargeted = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  drawWordOnCanvas(ctx, canvas.width, canvas.height, word, actionType, typedCount, isTargeted);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { canvas, ctx, texture };
}

function drawWordOnCanvas(ctx, width, height, word, actionType, typedCount, isTargeted = false) {
  ctx.clearRect(0, 0, width, height);

  const style = ACTION_STYLES[actionType] || ACTION_STYLES.jump;

  // Background Plaque Body
  ctx.save();
  ctx.shadowColor = isTargeted ? style.color : 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = isTargeted ? 18 : 10;

  const grad = ctx.createLinearGradient(0, 10, 0, height - 10);
  if (isTargeted) {
    grad.addColorStop(0, 'rgba(24, 24, 37, 0.98)');
    grad.addColorStop(1, 'rgba(10, 10, 20, 0.98)');
  } else {
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');
  }
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(12, 12, width - 24, height - 24, 18);
  ctx.fill();

  // Outer Border with targeted glow
  ctx.lineWidth = isTargeted ? 4.5 : 2.5;
  ctx.strokeStyle = isTargeted ? '#FBBF24' : style.color;
  ctx.stroke();

  // Action Tag Header
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = isTargeted ? '#FBBF24' : style.color;
  ctx.textAlign = 'center';
  ctx.fillText(style.label, width / 2, 42);

  ctx.restore();

  // Draw characters with progressive typing colors
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
      // Correctly typed character
      ctx.fillStyle = '#10B981'; // Green
    } else if (i === typedCount && isTargeted) {
      // Active targeted character
      ctx.fillStyle = '#FBBF24'; // Golden glow
    } else {
      // Remaining untyped characters
      ctx.fillStyle = '#F8FAFC'; // Crisp White
    }

    ctx.fillText(char, charCenter, 100);
    startX += charWidth;
  }
}

/**
 * Runner3DObstacles — Manages Typing-Controlled 3D Obstacles and Navigation Nodes
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

    this.laneArrowMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x6366f1,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
  }

  spawnObstacle({ word, type = 'jump', lane = 0, z = 50 }) {
    const group = new THREE.Group();
    group.position.set(lane * 3.0, 0, z);

    let obstacleMesh;

    switch (type) {
      case 'jump': {
        // Low electric hurdle spanning the lane
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
        // Cyber firewall barrier across lane
        const gateGeo = new THREE.BoxGeometry(2.6, 2.6, 0.25);
        obstacleMesh = new THREE.Mesh(gateGeo, this.gateMat);
        obstacleMesh.position.y = 1.3;
        group.add(obstacleMesh);
        break;
      }

      case 'lane_left': {
        // Left-pointing directional arrow
        const arrowGeo = new THREE.ConeGeometry(0.65, 1.2, 3);
        obstacleMesh = new THREE.Mesh(arrowGeo, this.laneArrowMat);
        obstacleMesh.rotation.z = Math.PI / 2;
        obstacleMesh.position.y = 0.8;
        group.add(obstacleMesh);
        break;
      }

      case 'lane_right': {
        // Right-pointing directional arrow
        const arrowGeo = new THREE.ConeGeometry(0.65, 1.2, 3);
        obstacleMesh = new THREE.Mesh(arrowGeo, this.laneArrowMat);
        obstacleMesh.rotation.z = -Math.PI / 2;
        obstacleMesh.position.y = 0.8;
        group.add(obstacleMesh);
        break;
      }

      case 'lane_center': {
        // Center alignment beacon
        const beaconGeo = new THREE.TorusGeometry(0.6, 0.12, 8, 24);
        obstacleMesh = new THREE.Mesh(beaconGeo, this.laneArrowMat);
        obstacleMesh.rotation.x = Math.PI / 2;
        obstacleMesh.position.y = 0.5;
        group.add(obstacleMesh);
        break;
      }

      case 'bridge': {
        // Holographic Bridge Portal
        const portalGeo = new THREE.BoxGeometry(2.8, 0.2, 0.8);
        obstacleMesh = new THREE.Mesh(portalGeo, this.bridgeMat);
        obstacleMesh.position.y = 0.1;
        group.add(obstacleMesh);
        break;
      }

      case 'boost':
      default: {
        // Floating diamond energy crystal
        const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
        obstacleMesh = new THREE.Mesh(crystalGeo, this.crystalMat);
        obstacleMesh.position.y = 1.35;
        group.add(obstacleMesh);
        break;
      }
    }

    // Floating 3D Word Plaque above obstacle
    const { canvas, ctx, texture } = createWordCanvasTexture(word, type, 0, false);
    const plaqueGeo = new THREE.PlaneGeometry(3.4, 1.05);
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
      isTargeted: false,
      cleared: false,
      hit: false,
    };

    this.obstacles.push(obs);
    return obs;
  }

  setTypedProgress(obstacle, count, isTargeted = true) {
    obstacle.typedCount = count;
    obstacle.isTargeted = isTargeted;
    drawWordOnCanvas(
      obstacle.ctx,
      obstacle.canvas.width,
      obstacle.canvas.height,
      obstacle.word,
      obstacle.type,
      count,
      isTargeted
    );
    obstacle.texture.needsUpdate = true;
  }

  clearObstacle(obstacle) {
    obstacle.cleared = true;
    // Animate break / dissolve upwards
    const startY = obstacle.group.position.y;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.12;
      obstacle.group.position.y = startY + progress * 2.2;
      obstacle.group.scale.multiplyScalar(0.82);
      if (progress >= 1.0) {
        clearInterval(interval);
        this.scene.remove(obstacle.group);
      }
    }, 20);
  }

  update(playerZ, dt) {
    // Continuous idle animation on floating icons
    for (const obs of this.obstacles) {
      if (!obs.cleared && obs.obstacleMesh) {
        if (obs.type === 'boost') {
          obs.obstacleMesh.rotation.y += dt * 2.5;
        } else if (obs.type.startsWith('lane_')) {
          obs.obstacleMesh.position.y = 0.8 + Math.sin(Date.now() * 0.006) * 0.15;
        }
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
