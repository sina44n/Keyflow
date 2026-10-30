import * as THREE from 'three';
import { NitroEffectController } from './Racing3DNitroEffects';

/**
 * Creates high-detail procedural 3D Supercars using Three.js geometries and PBR materials.
 * Full 3D articulation:
 * - 5 Supercar aerodynamic profiles (Apex GT, Cyber Phantom, Viper Venom, Shadow Specter, Solar Flare)
 * - Independent 4-wheel rotation with custom alloy finishes (Chrome, Gold, Bronze, Stealth)
 * - Dynamic dual projector headlights & glowing underglow
 * - 6 distinct nitro visual effect systems (Fire, Star, Electric, Plasma, Cosmic, Neon)
 * - Floating 3D Driver & Position Billboard badge (#1 YOU 120 WPM)
 * - Safe, polymorphic update loop with strict forward +X kinematics (never backward)
 */
export const create3DVehicle = ({
  vehicleConfig = {},
  isPlayer = false,
  driverName = 'Driver',
  lane = 0,
  initialX = 0,
}) => {
  const carGroup = new THREE.Group();
  const vehicleId = vehicleConfig.id || 'apex-gt';
  carGroup.name = `car_${vehicleId}_${driverName}`;

  // Palette resolution
  const primaryColorHex = vehicleConfig.color || (isPlayer ? '#EF4444' : '#38BDF8');
  const secondaryColorHex = vehicleConfig.secondaryColor || '#0F172A';
  const glowColorHex = vehicleConfig.glowColor || primaryColorHex;
  const wheelFinish = vehicleConfig.wheelFinish || 'chrome';
  const nitroStyle = vehicleConfig.nitroStyle || (isPlayer ? 'fire' : 'star');

  const primaryColor = new THREE.Color(primaryColorHex);
  const secondaryColor = new THREE.Color(secondaryColorHex);
  const glowColor = new THREE.Color(glowColorHex);

  // Wheel finish colors
  let rimColorHex = 0xd1d5db;
  let rimMetalness = 0.92;
  let rimRoughness = 0.15;
  if (wheelFinish === 'gold') {
    rimColorHex = 0xf59e0b;
    rimMetalness = 0.9;
    rimRoughness = 0.2;
  } else if (wheelFinish === 'bronze') {
    rimColorHex = 0xb45309;
    rimMetalness = 0.85;
    rimRoughness = 0.25;
  } else if (wheelFinish === 'stealth') {
    rimColorHex = 0x1e293b;
    rimMetalness = 0.7;
    rimRoughness = 0.35;
  }

  // PBR Materials
  const bodyPaintMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.88,
    roughness: 0.2,
  });

  const carbonAccentMaterial = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    metalness: 0.45,
    roughness: 0.48,
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
    color: rimColorHex,
    metalness: rimMetalness,
    roughness: rimRoughness,
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
  const bodyGroup = new THREE.Group();

  // Lower chassis monocoque wedge
  const lowerChassis = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.42, 1.9),
    bodyPaintMaterial
  );
  lowerChassis.position.set(0, 0.42, 0);
  lowerChassis.castShadow = true;
  lowerChassis.receiveShadow = true;
  bodyGroup.add(lowerChassis);

  // Aerodynamic Splitter & Underbody Diffuser
  const frontSplitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.08, 2.05),
    carbonAccentMaterial
  );
  frontSplitter.position.set(2.1, 0.23, 0);
  bodyGroup.add(frontSplitter);

  const rearDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.12, 1.8),
    carbonAccentMaterial
  );
  rearDiffuser.position.set(-2.1, 0.25, 0);
  bodyGroup.add(rearDiffuser);

  // Cabin Greenhouse
  const cabinMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.58, 1.45),
    glassMaterial
  );
  cabinMesh.position.set(-0.35, 0.88, 0);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  const roofCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 1.35),
    bodyPaintMaterial
  );
  roofCap.position.set(-0.38, 1.18, 0);
  bodyGroup.add(roofCap);

  // Model-specific aerodynamic contours
  if (vehicleId === 'cyber-phantom') {
    // Sharp angular cyberpunk wedge hood
    const cyberHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.24, 1.8),
      bodyPaintMaterial
    );
    cyberHood.position.set(1.2, 0.56, 0);
    cyberHood.rotation.z = -0.12;
    bodyGroup.add(cyberHood);

    // Angular roof fin
    const dorsalFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.35, 0.06),
      carbonAccentMaterial
    );
    dorsalFin.position.set(-0.5, 1.35, 0);
    bodyGroup.add(dorsalFin);
  } else if (vehicleId === 'viper-venom') {
    // Aggressive hood scoop
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.14, 0.6),
      carbonAccentMaterial
    );
    scoop.position.set(0.9, 0.72, 0);
    bodyGroup.add(scoop);

    // Flared front hood
    const venomHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.26, 1.85),
      bodyPaintMaterial
    );
    venomHood.position.set(1.15, 0.58, 0);
    venomHood.rotation.z = -0.07;
    bodyGroup.add(venomHood);
  } else if (vehicleId === 'shadow-specter') {
    // Ultra-low stealth sloping canopy
    const stealthHood = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.2, 1.82),
      bodyPaintMaterial
    );
    stealthHood.position.set(1.2, 0.54, 0);
    stealthHood.rotation.z = -0.09;
    bodyGroup.add(stealthHood);

    // Matte carbon side skirts
    [-0.96, 0.96].forEach((z) => {
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.08, 0.12),
        carbonAccentMaterial
      );
      skirt.position.set(0, 0.24, z);
      bodyGroup.add(skirt);
    });
  } else if (vehicleId === 'solar-flare') {
    // Hypercar teardrop roof channel
    const tearDrop = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 0.7),
      carbonAccentMaterial
    );
    tearDrop.position.set(-0.35, 1.22, 0);
    bodyGroup.add(tearDrop);

    const solarHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.26, 1.8),
      bodyPaintMaterial
    );
    solarHood.position.set(1.15, 0.57, 0);
    solarHood.rotation.z = -0.06;
    bodyGroup.add(solarHood);
  } else {
    // Apex GT / Default
    const apexHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.28, 1.85),
      bodyPaintMaterial
    );
    apexHood.position.set(1.15, 0.58, 0);
    apexHood.rotation.z = -0.06;
    apexHood.castShadow = true;
    bodyGroup.add(apexHood);

    // Dual carbon hood racing stripes
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

  [-0.6, 0.6].forEach((z) => {
    const wingPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.42, 0.06),
      carbonAccentMaterial
    );
    wingPillar.position.set(-1.95, 0.84, z);
    wingGroup.add(wingPillar);
  });
  bodyGroup.add(wingGroup);

  // Aerodynamic side mirrors
  [-0.85, 0.85].forEach((z) => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.22),
      carbonAccentMaterial
    );
    mirror.position.set(0.45, 0.82, z);
    bodyGroup.add(mirror);
  });

  // Dual Headlights & Taillights
  [-0.7, 0.7].forEach((z) => {
    const headlamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.35),
      headlightMaterial
    );
    headlamp.position.set(2.18, 0.5, z);
    bodyGroup.add(headlamp);

    const taillamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.42),
      taillightMaterial
    );
    taillamp.position.set(-2.18, 0.52, z);
    bodyGroup.add(taillamp);
  });

  carGroup.add(bodyGroup);

  // ==========================================
  // 2. 4 ROTATING WHEELS WITH HIGH-DETAIL RIMS
  // ==========================================
  const wheels = [];
  const wheelPositions = [
    { x: 1.35, y: 0.38, z: 0.98 },
    { x: 1.35, y: 0.38, z: -0.98 },
    { x: -1.35, y: 0.38, z: 0.98 },
    { x: -1.35, y: 0.38, z: -0.98 },
  ];

  wheelPositions.forEach((pos) => {
    const wheelAssembly = new THREE.Group();
    wheelAssembly.position.set(pos.x, pos.y, pos.z);

    const tireMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24),
      wheelRubberMaterial
    );
    tireMesh.rotation.x = Math.PI / 2;
    tireMesh.castShadow = true;
    wheelAssembly.add(tireMesh);

    const rimMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.33, 16),
      wheelAlloyMaterial
    );
    rimMesh.rotation.x = Math.PI / 2;
    wheelAssembly.add(rimMesh);

    // Rim spokes for visible rolling animation
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.22, 0.34),
        wheelAlloyMaterial
      );
      spoke.rotation.z = (s * Math.PI) / 2.5;
      wheelAssembly.add(spoke);
    }

    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.08),
      brakeCaliperMaterial
    );
    caliper.position.set(0, 0.12, pos.z > 0 ? -0.14 : 0.14);
    wheelAssembly.add(caliper);

    carGroup.add(wheelAssembly);
    wheels.push(wheelAssembly);
  });

  // ==========================================
  // 3. DYNAMIC LIGHTING & UNDERGLOW
  // ==========================================
  const headlightBeam = new THREE.SpotLight(0xffffff, isPlayer ? 1.8 : 0.9, 50, Math.PI / 6, 0.4, 1.2);
  headlightBeam.position.set(2.4, 0.6, 0);
  headlightBeam.target.position.set(16, 0, 0);
  carGroup.add(headlightBeam);
  carGroup.add(headlightBeam.target);

  const underglowLight = new THREE.PointLight(glowColor, isPlayer ? 2.8 : 1.4, 5.5, 1.8);
  underglowLight.position.set(0, 0.15, 0);
  carGroup.add(underglowLight);

  // Underglow Ground Quad Glow Mesh
  const underglowQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.0),
    new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    })
  );
  underglowQuad.rotation.x = -Math.PI / 2;
  underglowQuad.position.set(0, 0.04, 0);
  carGroup.add(underglowQuad);

  // ==========================================
  // 4. NITRO EFFECT CONTROLLER (6 STYLES)
  // ==========================================
  const nitroController = new NitroEffectController({
    scene: carGroup,
    parentGroup: carGroup,
    style: nitroStyle,
    isPlayer,
  });

  // ==========================================
  // 5. 3D FLOATING DRIVER / POSITION BILLBOARD BADGE
  // ==========================================
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 512;
  badgeCanvas.height = 128;
  const badgeCtx = badgeCanvas.getContext('2d');

  const billboardTexture = new THREE.CanvasTexture(badgeCanvas);
  billboardTexture.minFilter = THREE.LinearFilter;
  const billboardMaterial = new THREE.SpriteMaterial({
    map: billboardTexture,
    transparent: true,
    depthTest: false,
  });
  const billboardSprite = new THREE.Sprite(billboardMaterial);
  billboardSprite.scale.set(4.2, 1.05, 1);
  billboardSprite.position.set(0, 2.4, 0);
  carGroup.add(billboardSprite);

  // Position vehicle initially
  const laneZ = (lane - 1.5) * 6.0;
  carGroup.position.set(initialX, 0, laneZ);

  // Controller Object
  const vehicleController = {
    group: carGroup,
    wheels,
    headlightBeam,
    underglowLight,
    underglowQuad,
    billboardSprite,
    billboardCanvas: badgeCanvas,
    billboardCtx: badgeCtx,
    billboardTexture,
    nitroController,
    isPlayer,
    driverName,
    lane,
    laneZ,
    currentSpeed: 0,
    targetSpeed: 0,
    distance: initialX,
    placement: 1,
    nitroStyle,
    lastDrawnPlacement: null,
    lastDrawnSpeed: null,

    // Safe badge updater object (prevents undefined access)
    badge: {
      update(placement, speed) {
        vehicleController.updateBadge(placement, speed);
      },
    },

    updateBadge(placement = 1, liveSpeed = 0) {
      const roundedSpeed = Math.round(liveSpeed);
      if (this.lastDrawnPlacement === placement && this.lastDrawnSpeed === roundedSpeed) {
        return;
      }
      this.lastDrawnPlacement = placement;
      this.lastDrawnSpeed = roundedSpeed;
      this.placement = placement;

      const ctx = this.billboardCtx;
      ctx.clearRect(0, 0, 512, 128);

      // Pill Background with glowing gradient
      ctx.save();
      ctx.shadowColor = this.isPlayer ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.5)';
      ctx.shadowBlur = 12;

      ctx.fillStyle = this.isPlayer
        ? 'rgba(185, 28, 28, 0.95)'
        : 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 480, 96, 24);
      ctx.fill();

      // Border
      ctx.strokeStyle = this.isPlayer ? '#FCA5A5' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Position badge circle
      ctx.fillStyle = this.isPlayer ? '#FFFFFF' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(68, 64, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.isPlayer ? '#B91C1C' : '#0F172A';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${placement}`, 68, 64);

      // Driver Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayName = this.driverName.toUpperCase();
      ctx.fillText(displayName, 124, 52);

      // Live Speed indicator
      ctx.fillStyle = this.isPlayer ? '#FDE047' : '#94A3B8';
      ctx.font = '600 22px monospace';
      const speedLabel = this.isPlayer
        ? `${roundedSpeed} WPM • ACTIVE`
        : `${Math.round(roundedSpeed * 1.8)} MPH`;
      ctx.fillText(speedLabel, 124, 86);

      this.billboardTexture.needsUpdate = true;
    },

    setNitroStyle(newStyle) {
      this.nitroStyle = newStyle;
      this.nitroController.setStyle(newStyle);
    },

    /**
     * Polymorphic update method:
     * Accepts either object { speed, dt, isNitro, placement, currentWpm, nitroStyle }
     * or positional arguments (dt, isNitro, ...) or (speed, dt, isNitro, ...)
     */
    update(arg1, arg2, arg3, arg4, arg5) {
      let speed = this.targetSpeed || 0;
      let dt = 0.016;
      let isNitro = false;
      let placement = this.placement || 1;
      let currentWpm = 0;

      if (typeof arg1 === 'object' && arg1 !== null) {
        speed = arg1.speed ?? this.targetSpeed ?? 0;
        dt = arg1.dt ?? 0.016;
        isNitro = arg1.isNitro ?? false;
        placement = arg1.placement ?? this.placement ?? 1;
        currentWpm = arg1.currentWpm ?? 0;
        if (arg1.nitroStyle && arg1.nitroStyle !== this.nitroStyle) {
          this.setNitroStyle(arg1.nitroStyle);
        }
      } else if (typeof arg1 === 'number') {
        if (arg1 <= 0.1) {
          // Passed dt as first param: update(dt, isNitro, ...)
          dt = arg1;
          isNitro = !!arg2;
          speed = this.targetSpeed || 0;
        } else {
          // Passed speed as first param: update(speed, dt, isNitro, placement, currentWpm)
          speed = arg1;
          dt = typeof arg2 === 'number' ? arg2 : 0.016;
          isNitro = !!arg3;
          placement = typeof arg4 === 'number' ? arg4 : this.placement;
          currentWpm = typeof arg5 === 'number' ? arg5 : 0;
        }
      }

      // Smooth acceleration lerp (strictly non-negative forward speed)
      const targetSpeedClamp = Math.max(0, speed);
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeedClamp, 0.14);

      // Strict forward advancement along +X axis (NEVER moves backward!)
      carGroup.position.x = this.distance;
      carGroup.position.z = THREE.MathUtils.lerp(carGroup.position.z, this.laneZ, 0.1);

      // Dynamic suspension roll
      bodyGroup.rotation.z = -THREE.MathUtils.clamp((this.currentSpeed / 80) * 0.02, 0, 0.035);
      bodyGroup.position.y = Math.sin(Date.now() * 0.025) * 0.008 * (this.currentSpeed > 3 ? 1 : 0);

      // 4 wheels rolling animation (positive rotation around Z-axis matching +X forward travel)
      const wheelRotationStep = this.currentSpeed * 2.8 * dt;
      wheels.forEach((w) => {
        w.children.forEach((c) => {
          c.rotation.z -= wheelRotationStep;
        });
      });

      // Update Nitro Visual Effects
      this.nitroController.update(dt, isNitro, this.currentSpeed);

      // Underglow intensity boost on nitro
      if (underglowLight) {
        underglowLight.intensity = isNitro ? 4.5 : (this.isPlayer ? 2.8 : 1.4);
      }

      // Live 3D Driver badge update
      this.updateBadge(placement, this.isPlayer ? currentWpm : this.currentSpeed);
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
      nitroController.dispose();
    },
  };

  // Initial badge render
  vehicleController.updateBadge(1, 0);

  return vehicleController;
};
