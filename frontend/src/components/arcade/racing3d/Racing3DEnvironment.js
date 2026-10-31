import * as THREE from 'three';

/**
 * Procedural 3D Environment & Racetrack Pipeline
 * Supports infinite Left-to-Right track recycling, stadium floodlights,
 * overhead LED gantry arches, crowd grandstands, and 4 thematic environments.
 */
export const create3DEnvironment = ({
  scene,
  envConfig,
  targetDistance = 1500,
}) => {
  const envGroup = new THREE.Group();
  envGroup.name = `env_${envConfig.id}`;

  // Environment palette
  const roadColor = new THREE.Color(envConfig.roadColor || '#1E232E');
  const dividerColor = new THREE.Color(envConfig.laneDividerColor || '#FFFFFF');
  const curbColor1 = new THREE.Color(envConfig.curbColors?.[0] || '#EF4444');
  const curbColor2 = new THREE.Color(envConfig.curbColors?.[1] || '#FFFFFF');
  const skyColor = new THREE.Color(envConfig.skyGradient?.[0] || '#0F172A');
  const fogColor = new THREE.Color(envConfig.skyGradient?.[1] || '#1E293B');

  // Configure Scene Sky & Fog
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(fogColor, 0.0075);

  // Global Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  envGroup.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.position.set(40, 60, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 250;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  envGroup.add(sunLight);

  // ==========================================
  // PROCEDURAL TILED HIGHWAY TRACK (LEFT TO RIGHT)
  // ==========================================
  const trackWidth = 26; // 4 lanes, each ~6 units wide
  const segmentLength = 80;
  const numSegments = 6; // Active window: 480 units along +X
  const roadSegments = [];

  // Reusable Materials
  const asphaltMaterial = new THREE.MeshStandardMaterial({
    color: roadColor,
    roughness: 0.8,
    metalness: 0.1,
  });

  const dividerMaterial = new THREE.MeshStandardMaterial({
    color: dividerColor,
    roughness: 0.3,
    metalness: 0.2,
    emissive: dividerColor,
    emissiveIntensity: 0.45,
  });

  const curbMat1 = new THREE.MeshStandardMaterial({ color: curbColor1, roughness: 0.5 });
  const curbMat2 = new THREE.MeshStandardMaterial({ color: curbColor2, roughness: 0.5 });

  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.35,
  });

  const grandstandMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.1,
  });

  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.7,
    metalness: 0.3,
  });

  // Helper to construct a single 80-unit road segment
  const buildRoadSegment = (startX) => {
    const segment = new THREE.Group();
    segment.position.x = startX;

    // 1. Main Asphalt Bed
    const roadGeo = new THREE.PlaneGeometry(segmentLength, trackWidth);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMaterial);
    road.position.set(segmentLength / 2, 0, 0);
    road.receiveShadow = true;
    segment.add(road);

    // 2. Dashed Lane Dividers (3 dividing lines for 4 lanes: Z = -6, 0, +6)
    [-6, 0, 6].forEach((zPos) => {
      for (let dx = 4; dx < segmentLength; dx += 12) {
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(6, 0.02, 0.25),
          dividerMaterial
        );
        dash.position.set(dx, 0.01, zPos);
        segment.add(dash);
      }
    });

    // 3. Red & White Curbs (North Z = -13, South Z = +13)
    const curbBlockLen = 5;
    for (let dx = 0; dx < segmentLength; dx += curbBlockLen) {
      const isAlt = Math.floor(dx / curbBlockLen) % 2 === 0;
      const mat = isAlt ? curbMat1 : curbMat2;

      // North curb
      const northCurb = new THREE.Mesh(
        new THREE.BoxGeometry(curbBlockLen, 0.12, 0.8),
        mat
      );
      northCurb.position.set(dx + curbBlockLen / 2, 0.06, -trackWidth / 2 - 0.4);
      segment.add(northCurb);

      // South curb
      const southCurb = new THREE.Mesh(
        new THREE.BoxGeometry(curbBlockLen, 0.12, 0.8),
        mat
      );
      southCurb.position.set(dx + curbBlockLen / 2, 0.06, trackWidth / 2 + 0.4);
      segment.add(southCurb);
    }

    // 4. Guardrail Metallic Crash Barriers
    [-trackWidth / 2 - 1.2, trackWidth / 2 + 1.2].forEach((zPos) => {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(segmentLength, 0.8, 0.15),
        barrierMaterial
      );
      barrier.position.set(segmentLength / 2, 0.45, zPos);
      segment.add(barrier);

      // Barrier support posts
      for (let px = 8; px < segmentLength; px += 16) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
          barrierMaterial
        );
        post.position.set(px, 0.45, zPos);
        segment.add(post);
      }
    });

    // 5. Stadium Floodlight Tower (Every 80 units along north side)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(segmentLength * 0.5, 0, -trackWidth / 2 - 6);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 18, 8),
      barrierMaterial
    );
    mast.position.y = 9;
    towerGroup.add(mast);

    // Floodlight Head Array
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.6, 0.6),
      barrierMaterial
    );
    head.position.set(0, 18, 0);
    head.rotation.x = Math.PI / 7;
    towerGroup.add(head);

    // Light emitting lamp faces
    const lampFaces = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lampFaces.position.set(0, 18, 0.32);
    lampFaces.rotation.x = Math.PI / 7;
    towerGroup.add(lampFaces);

    segment.add(towerGroup);

    // 6. Environment Specific Scenery
    if (envConfig.id === 'speedway') {
      // Grand Prix Grandstands (North side)
      const grandstand = new THREE.Mesh(
        new THREE.BoxGeometry(segmentLength * 0.95, 14, 16),
        grandstandMaterial
      );
      grandstand.position.set(segmentLength / 2, 7, -trackWidth / 2 - 16);
      segment.add(grandstand);
    } else if (envConfig.id === 'sunset') {
      // Ocean Water Plane (South side)
      const oceanGeo = new THREE.PlaneGeometry(segmentLength, 120);
      oceanGeo.rotateX(-Math.PI / 2);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a5f,
        roughness: 0.15,
        metalness: 0.8,
      });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.position.set(segmentLength / 2, -0.6, trackWidth / 2 + 65);
      segment.add(ocean);
    } else if (envConfig.id === 'neon-city') {
      // Cyberpunk Skyscrapers (Both sides)
      [-1, 1].forEach((side) => {
        const height = 35 + Math.random() * 45;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(28, height, 22),
          buildingMaterial
        );
        bldg.position.set(segmentLength / 2, height / 2, side * (trackWidth / 2 + 20));
        segment.add(bldg);

        // Glowing Neon Billboard Strip
        const neonColor = side === -1 ? 0x06b6d4 : 0xec4899;
        const neonStrip = new THREE.Mesh(
          new THREE.BoxGeometry(22, 1.2, 0.4),
          new THREE.MeshBasicMaterial({ color: neonColor })
        );
        neonStrip.position.set(segmentLength / 2, 16, side * (trackWidth / 2 + 8.8));
        segment.add(neonStrip);
      });
    } else if (envConfig.id === 'alpine') {
      // Mountain Ridge Wall (North side)
      const rockGeo = new THREE.ConeGeometry(24, 28, 6);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.95,
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(segmentLength / 2, 12, -trackWidth / 2 - 22);
      segment.add(rock);
    }

    envGroup.add(segment);
    return segment;
  };

  // Build initial pool of segments
  for (let i = 0; i < numSegments; i++) {
    const seg = buildRoadSegment((i - 1) * segmentLength);
    roadSegments.push(seg);
  }

  // ==========================================
  // CHECKERED START & FINISH LINE GANTRIES
  // ==========================================
  const buildGantry = (xPos, title, isFinish = false) => {
    const gantry = new THREE.Group();
    gantry.position.x = xPos;

    // Uprights: Anchor on the far (north) side and well outside camera cone on south
    // North pillar (Z = -trackWidth / 2 - 2)
    const northPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 14, 1.4),
      barrierMaterial
    );
    northPillar.position.set(0, 7, -trackWidth / 2 - 2.5);
    gantry.add(northPillar);

    // South pillar positioned far back (Z = trackWidth / 2 + 15) so it never clips camera
    const southPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 14, 1.4),
      barrierMaterial
    );
    southPillar.position.set(0, 7, trackWidth / 2 + 14);
    gantry.add(southPillar);

    // Overhead Bridge spanning across track
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.4, trackWidth + 18),
      new THREE.MeshStandardMaterial({
        color: isFinish ? 0xef4444 : 0x0f172a,
        metalness: 0.6,
        roughness: 0.35,
      })
    );
    bridge.position.set(0, 13, 5.5);
    gantry.add(bridge);

    // Checkered Banner Line across asphalt
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 512;
    checkerCanvas.height = 64;
    const cCtx = checkerCanvas.getContext('2d');
    for (let x = 0; x < 512; x += 32) {
      for (let y = 0; y < 64; y += 32) {
        cCtx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? '#FFFFFF' : '#000000';
        cCtx.fillRect(x, y, 32, 32);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    const lineMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, trackWidth),
      new THREE.MeshBasicMaterial({ map: checkerTex })
    );
    lineMesh.rotateX(-Math.PI / 2);
    lineMesh.position.set(0, 0.03, 0);
    gantry.add(lineMesh);

    envGroup.add(gantry);
    return gantry;
  };

  const startGantry = buildGantry(0, 'START', false);
  const finishGantry = buildGantry(targetDistance, 'FINISH', true);

  scene.add(envGroup);

  return {
    group: envGroup,
    startGantry,
    finishGantry,
    roadSegments,
    segmentLength,
    numSegments,

    /**
     * Updates road tile positions as the player advances from Left to Right.
     * Recycles passed segments with zero allocations or memory leaks.
     */
    update(arg) {
    const playerX = typeof arg === 'object' && arg !== null ? (arg.playerX ?? 0) : (Number(arg) || 0);
      // Re-position segments that fall behind player
      roadSegments.forEach((seg) => {
        if (seg.position.x + segmentLength < playerX - 100) {
          // Find the furthest segment ahead
          let maxAheadX = seg.position.x;
          roadSegments.forEach((s) => {
            if (s.position.x > maxAheadX) maxAheadX = s.position.x;
          });
          seg.position.x = maxAheadX + segmentLength;
        }
      });

      // Synchronize sunlight position with player for consistent shadows
      sunLight.position.x = playerX + 40;
      sunLight.target.position.x = playerX;
      sunLight.target.updateMatrixWorld();
    },

    dispose() {
      envGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      scene.remove(envGroup);
    },
  };
};
