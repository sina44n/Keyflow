import * as THREE from 'three';

/**
 * Creates high-detail procedural 3D Supercars using Three.js geometries and PBR materials.
 * Full 3D articulation: independent wheel rotation, dynamic headlights, glowing underglow,
 * animated nitro exhaust flames, and 3D floating driver/position HUD billboards.
 */
export const create3DVehicle = ({
  vehicleConfig,
  isPlayer = false,
  driverName = 'Driver',
  lane = 0,
  initialX = 0,
}) => {
  const carGroup = new THREE.Group();
  carGroup.name = `car_${vehicleConfig.id}_${driverName}`;

  // Palette resolution
  const primaryColor = new THREE.Color(vehicleConfig.color || (isPlayer ? '#EF4444' : '#38BDF8'));
  const secondaryColor = new THREE.Color(vehicleConfig.secondaryColor || '#0F172A');
  const glowColor = new THREE.Color(vehicleConfig.glowColor || primaryColor);

  // PBR Materials
  const bodyPaintMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.85,
    roughness: 0.22,
  });

  const carbonAccentMaterial = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    metalness: 0.4,
    roughness: 0.5,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1120,
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const wheelRubberMaterial = new THREE.MeshStandardMaterial({
    color: 0x11141a,
    metalness: 0.1,
    roughness: 0.85,
  });

  const wheelAlloyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.9,
    roughness: 0.2,
  });

  const brakeCaliperMaterial = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0xef4444 : 0xeab308,
    metalness: 0.6,
    roughness: 0.3,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.2,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0xff1133,
    emissiveIntensity: 2.5,
  });

  // ==========================================
  // 1. AERODYNAMIC MAIN CHASSIS MONOCOQUE
  // ==========================================
  // Base Dimensions: Length = 4.4, Width = 1.9, Height = 0.85
  const bodyGroup = new THREE.Group();

  // Lower chassis wedge
  const lowerChassisGeo = new THREE.BoxGeometry(4.4, 0.45, 1.9);
  const lowerChassis = new THREE.Mesh(lowerChassisGeo, bodyPaintMaterial);
  lowerChassis.position.set(0, 0.42, 0);
  lowerChassis.castShadow = true;
  lowerChassis.receiveShadow = true;
  bodyGroup.add(lowerChassis);

  // Sculpted hood with sloping nose (forward +X)
  const hoodGeo = new THREE.BufferGeometry();
  // Triangular sloping wedge for front hood
  const hoodLength = 1.8;
  const hoodWidth = 1.85;
  const hoodMesh = new THREE.Mesh(
    new THREE.BoxGeometry(hoodLength, 0.28, hoodWidth),
    bodyPaintMaterial
  );
  hoodMesh.position.set(1.15, 0.58, 0);
  hoodMesh.rotation.z = -0.06;
  hoodMesh.castShadow = true;
  bodyGroup.add(hoodMesh);

  // Front aerodynamic splitter & intake
  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 2.05),
    carbonAccentMaterial
  );
  splitter.position.set(2.1, 0.24, 0);
  bodyGroup.add(splitter);

  // Cockpit Greenhouse (Curved Cabin & Windshield)
  const cabinLength = 1.9;
  const cabinWidth = 1.45;
  const cabinHeight = 0.58;
  const cabinMesh = new THREE.Mesh(
    new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth),
    glassMaterial
  );
  cabinMesh.position.set(-0.35, 0.88, 0);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Roof cap
  const roofMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 1.35),
    bodyPaintMaterial
  );
  roofMesh.position.set(-0.38, 1.18, 0);
  bodyGroup.add(roofMesh);

  // Model-specific aerodynamic additions
  if (vehicleConfig.id === 'apex-gt' || !isPlayer) {
    // Dual hood stripes
    const stripeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.02, 0.35),
      carbonAccentMaterial
    );
    stripeMesh.position.set(1.15, 0.73, 0);
    stripeMesh.rotation.z = -0.06;
    bodyGroup.add(stripeMesh);
  }

  // Rear High-Downforce GT Spoiler Wing
  const wingGroup = new THREE.Group();
  const wingBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.06, 1.85),
    carbonAccentMaterial
  );
  wingBlade.position.set(-2.05, 1.05, 0);
  wingBlade.castShadow = true;
  wingGroup.add(wingBlade);

  // Wing uprights / mounts
  [-0.65, 0.65].forEach((zOffset) => {
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.42, 0.05),
      carbonAccentMaterial
    );
    upright.position.set(-1.95, 0.84, zOffset);
    wingGroup.add(upright);
  });
  bodyGroup.add(wingGroup);

  // Rear Diffuser
  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.15, 1.7),
    carbonAccentMaterial
  );
  diffuser.position.set(-2.15, 0.28, 0);
  bodyGroup.add(diffuser);

  // Side mirrors
  [-0.85, 0.85].forEach((zOffset) => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.22),
      carbonAccentMaterial
    );
    mirror.position.set(0.45, 0.85, zOffset);
    bodyGroup.add(mirror);
  });

  carGroup.add(bodyGroup);

  // ==========================================
  // 2. LIGHTING & OPTICAL EFFECTS
  // ==========================================
  // Front Twin Xenon Headlights
  [-0.65, 0.65].forEach((zOffset) => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.35),
      headlightMaterial
    );
    headlight.position.set(2.18, 0.48, zOffset);
    carGroup.add(headlight);
  });

  // Active forward road illumination spotlights
  const headlightBeam = new THREE.SpotLight(0xffffff, 4.5, 45, Math.PI / 6, 0.45, 1.2);
  headlightBeam.position.set(2.2, 0.5, 0);
  const beamTarget = new THREE.Object3D();
  beamTarget.position.set(25, 0, 0);
  carGroup.add(beamTarget);
  headlightBeam.target = beamTarget;
  carGroup.add(headlightBeam);

  // Rear LED Taillight Bar
  const taillight = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 1.6),
    taillightMaterial
  );
  taillight.position.set(-2.21, 0.56, 0);
  carGroup.add(taillight);

  // Chassis Underglow (Colored ground reflection)
  const underglowLight = new THREE.PointLight(glowColor, isPlayer ? 3.5 : 2.0, 6.0, 1.5);
  underglowLight.position.set(0, 0.2, 0);
  carGroup.add(underglowLight);

  // ==========================================
  // 3. ARTICULATED WHEELS & ALLOY RIMS
  // ==========================================
  const wheels = [];
  const wheelRadius = 0.38;
  const wheelWidth = 0.32;
  const wheelPositions = [
    { x: 1.35, z: 0.98, isFront: true }, // Front-Right
    { x: 1.35, z: -0.98, isFront: true }, // Front-Left
    { x: -1.35, z: 0.98, isFront: false }, // Rear-Right
    { x: -1.35, z: -0.98, isFront: false }, // Rear-Left
  ];

  wheelPositions.forEach((pos) => {
    const wheelAssembly = new THREE.Group();
    wheelAssembly.position.set(pos.x, wheelRadius, pos.z);

    // Rubber Tire (Cylinder aligned along Z-axis)
    const tireGeo = new THREE.CylinderGeometry(
      wheelRadius,
      wheelRadius,
      wheelWidth,
      24
    );
    tireGeo.rotateX(Math.PI / 2); // Rotate cylinder so flat faces point along Z
    const tireMesh = new THREE.Mesh(tireGeo, wheelRubberMaterial);
    tireMesh.castShadow = true;
    wheelAssembly.add(tireMesh);

    // Multi-spoke alloy rim
    const rimGeo = new THREE.CylinderGeometry(
      wheelRadius * 0.65,
      wheelRadius * 0.65,
      wheelWidth * 1.02,
      16
    );
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, wheelAlloyMaterial);
    wheelAssembly.add(rimMesh);

    // Visible brake disc inside
    const discGeo = new THREE.CylinderGeometry(
      wheelRadius * 0.5,
      wheelRadius * 0.5,
      wheelWidth * 0.4,
      16
    );
    discGeo.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, wheelAlloyMaterial);
    wheelAssembly.add(discMesh);

    // Brake caliper
    const caliperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.16, wheelWidth * 0.45),
      brakeCaliperMaterial
    );
    caliperMesh.position.set(0, wheelRadius * 0.28, 0);
    wheelAssembly.add(caliperMesh);

    carGroup.add(wheelAssembly);
    wheels.push(wheelAssembly);
  });

  // ==========================================
  // 4. ANIMATED 3D NITRO EXHAUST FLAME JETS
  // ==========================================
  const exhaustFlames = [];
  [-0.45, 0.45].forEach((zOffset) => {
    const flameGroup = new THREE.Group();
    flameGroup.position.set(-2.25, 0.35, zOffset);

    // Titanium exhaust pipe ring
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12),
      carbonAccentMaterial
    );
    pipe.rotation.z = Math.PI / 2;
    flameGroup.add(pipe);

    // Inner White-Blue Core Flame Jet
    const innerFlameGeo = new THREE.ConeGeometry(0.14, 1.2, 12);
    innerFlameGeo.rotateZ(Math.PI / 2); // Points backwards along -X
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.position.set(-0.6, 0, 0);
    flameGroup.add(innerFlame);

    // Outer Cyan/Orange Nitro Plume
    const outerFlameGeo = new THREE.ConeGeometry(0.24, 1.8, 12);
    outerFlameGeo.rotateZ(Math.PI / 2);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: isPlayer ? 0x06b6d4 : 0xef4444,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    outerFlame.position.set(-0.9, 0, 0);
    flameGroup.add(outerFlame);

    flameGroup.visible = false;
    carGroup.add(flameGroup);
    exhaustFlames.push({ group: flameGroup, inner: innerFlame, outer: outerFlame });
  });

  // ==========================================
  // 5. 3D FLOATING DRIVER/POSITION BILLBOARD
  // ==========================================
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const billboardTexture = new THREE.CanvasTexture(canvas);
  billboardTexture.minFilter = THREE.LinearFilter;
  const billboardMaterial = new THREE.SpriteMaterial({
    map: billboardTexture,
    transparent: true,
    depthTest: false,
  });
  const billboardSprite = new THREE.Sprite(billboardMaterial);
  billboardSprite.scale.set(3.4, 0.85, 1);
  billboardSprite.position.set(0, 2.2, 0);
  carGroup.add(billboardSprite);

  // Position vehicle initially
  const laneZ = (lane - 1.5) * 6.0;
  carGroup.position.set(initialX, 0, laneZ);

  // Return vehicle controller
  return {
    group: carGroup,
    wheels,
    exhaustFlames,
    headlightBeam,
    underglowLight,
    billboardSprite,
    billboardCanvas: canvas,
    billboardCtx: ctx,
    billboardTexture,
    isPlayer,
    driverName,
    lane,
    laneZ,
    currentSpeed: 0,
    targetSpeed: 0,
    distance: initialX,
    placement: 1,

    /**
     * Updates vehicle 3D transforms, wheel spin, exhaust flames, and driver badge every frame.
     */
    update({ speed = 0, dt = 0.016, isNitro = false, placement = 1, currentWpm = 0 }) {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, speed, 0.12);

      // 1. Advance position along +X (LEFT TO RIGHT racing)
      carGroup.position.x = this.distance;
      carGroup.position.z = THREE.MathUtils.lerp(carGroup.position.z, this.laneZ, 0.1);

      // Subtle suspension body roll on acceleration
      bodyGroup.rotation.z = -THREE.MathUtils.clamp((this.currentSpeed / 80) * 0.02, 0, 0.04);
      bodyGroup.position.y = (Math.sin(Date.now() * 0.025) * 0.008) * (this.currentSpeed > 5 ? 1 : 0);

      // 2. Rotate all 4 wheels around axle (Z-axis in Three.js coordinate system)
      const wheelAngularSpeed = (this.currentSpeed * 2.8) * dt;
      wheels.forEach((w) => {
        w.children.forEach((c) => {
          c.rotation.z += wheelAngularSpeed;
        });
      });

      // 3. Update Animated Exhaust Flames
      const showFlames = (this.isPlayer && (currentWpm > 40 || isNitro)) || (!this.isPlayer && this.currentSpeed > 35);
      exhaustFlames.forEach((flame) => {
        flame.group.visible = showFlames;
        if (showFlames) {
          const flameFlicker = 0.8 + Math.random() * 0.45;
          const nitroScale = isNitro ? 1.85 : 1.0;
          flame.inner.scale.set(flameFlicker * nitroScale, flameFlicker * nitroScale, flameFlicker);
          flame.outer.scale.set(flameFlicker * 1.2 * nitroScale, flameFlicker * 1.2 * nitroScale, flameFlicker);
        }
      });

      // 4. Update 3D Floating Position Billboard
      if (this.placement !== placement || !this._badgeInit) {
        this.placement = placement;
        this._badgeInit = true;

        const bCtx = this.billboardCtx;
        bCtx.clearRect(0, 0, 256, 64);

        // Rounded pill background
        bCtx.fillStyle = this.isPlayer ? 'rgba(239, 68, 68, 0.92)' : 'rgba(15, 23, 42, 0.88)';
        bCtx.beginPath();
        bCtx.roundRect(8, 8, 240, 48, 12);
        bCtx.fill();

        // Border
        bCtx.strokeStyle = this.isPlayer ? '#FCA5A5' : 'rgba(255, 255, 255, 0.3)';
        bCtx.lineWidth = 3;
        bCtx.stroke();

        // Position & Driver text
        bCtx.fillStyle = '#FFFFFF';
        bCtx.font = 'bold 24px monospace';
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.fillText(`#${placement} ${this.driverName}`, 128, 32);

        this.billboardTexture.needsUpdate = true;
      }
    },

    dispose() {
      carGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      billboardTexture.dispose();
    },
  };
};
