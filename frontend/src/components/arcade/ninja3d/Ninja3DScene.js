import * as THREE from 'three';

/**
 * Japanese Dark Fantasy Blade Dojo Three.js Scene Setup
 * =====================================================
 * Establishes:
 * - 3D Perspective Arena Camera
 * - Atmospheric Volumetric Fog
 * - Dark Polished Wood Dojo Stage & Torii Gate Silhouette
 * - Glowing Hanging Lantern Point Lights (Crimson & Amber)
 * - Dynamic Floating Cherry Blossom / Firefly Embers
 * - Screen Shake Trigger on Katana Combos
 */
export class Ninja3DScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060810);
    this.scene.fog = new THREE.FogExp2(0x060810, 0.022);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.5, 17.5);
    this.camera.lookAt(0, 0.5, 0);

    this.baseCameraPos = this.camera.position.clone();
    this.shakeIntensity = 0;

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting System
    this.initLighting();

    // 5. Dark Fantasy Dojo Architecture & Props
    this.initDojoEnvironment();

    // 6. Floating Ambient Dust / Embers
    this.initAmbientEmbers();
  }

  initLighting() {
    // Ambient moonlight
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    this.scene.add(ambientLight);

    // Directional silver moonlight from top-front
    const moonLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    moonLight.position.set(5, 14, 12);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 40;
    this.scene.add(moonLight);

    // Left Crimson Lantern PointLight
    this.leftLantern = new THREE.PointLight(0xf43f5e, 2.5, 22);
    this.leftLantern.position.set(-11, 4.5, -2);
    this.scene.add(this.leftLantern);

    // Right Golden Lantern PointLight
    this.rightLantern = new THREE.PointLight(0xf59e0b, 2.2, 22);
    this.rightLantern.position.set(11, 4.5, -2);
    this.scene.add(this.rightLantern);

    // Center flash light (flashes bright white on slice)
    this.flashLight = new THREE.PointLight(0xffffff, 0, 15);
    this.flashLight.position.set(0, 0, 5);
    this.scene.add(this.flashLight);
  }

  initDojoEnvironment() {
    this.envGroup = new THREE.Group();

    // Dark Polished Wooden Dojo Stage Floor
    const floorGeo = new THREE.PlaneGeometry(36, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      metalness: 0.35,
      roughness: 0.45,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -6.8, 0);
    floorMesh.receiveShadow = true;
    this.envGroup.add(floorMesh);

    // Deep Background Torii Gate Silhouette
    const toriiMat = new THREE.MeshStandardMaterial({
      color: 0x140c14,
      metalness: 0.5,
      roughness: 0.6,
    });

    // Horizontal main crossbeam (kasagi)
    const kasagi = new THREE.Mesh(new THREE.BoxGeometry(16, 0.7, 0.8), toriiMat);
    kasagi.position.set(0, 5.2, -10);
    this.envGroup.add(kasagi);

    // Secondary crossbeam (nuki)
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.45, 0.7), toriiMat);
    nuki.position.set(0, 3.8, -10);
    this.envGroup.add(nuki);

    // Vertical pillars (hashira)
    [-5.2, 5.2].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 14, 16), toriiMat);
      pillar.position.set(x, 0, -10);
      this.envGroup.add(pillar);
    });

    // Hanging Crimson & Amber Lantern Mesh Models
    const lanternMatLeft = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 1.5,
    });
    const lanternLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.2, 12), lanternMatLeft);
    lanternLeft.position.set(-11, 4.5, -2);
    this.envGroup.add(lanternLeft);

    const lanternMatRight = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
    });
    const lanternRight = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.2, 12), lanternMatRight);
    lanternRight.position.set(11, 4.5, -2);
    this.envGroup.add(lanternRight);

    this.scene.add(this.envGroup);
  }

  initAmbientEmbers() {
    const emberCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 26;
      positions[i + 1] = (Math.random() - 0.5) * 14;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    this.emberPoints = new THREE.Points(geometry, material);
    this.scene.add(this.emberPoints);
  }

  /**
   * Triggers sudden screen vibration and white flash on high combo slice
   */
  triggerImpactEffect(intensity = 0.25) {
    this.shakeIntensity = Math.min(0.65, this.shakeIntensity + intensity);
    if (this.flashLight) {
      this.flashLight.intensity = 3.5;
    }
  }

  update(dt) {
    // 1. Lantern flicker
    const time = Date.now() * 0.003;
    if (this.leftLantern) {
      this.leftLantern.intensity = 2.2 + Math.sin(time * 3.1) * 0.4;
    }
    if (this.rightLantern) {
      this.rightLantern.intensity = 2.0 + Math.cos(time * 2.7) * 0.35;
    }

    // 2. Dissolve flash light
    if (this.flashLight && this.flashLight.intensity > 0.05) {
      this.flashLight.intensity = THREE.MathUtils.lerp(this.flashLight.intensity, 0, dt * 10);
    }

    // 3. Drift ambient dust motes
    if (this.emberPoints) {
      const pos = this.emberPoints.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += dt * 0.4;
        if (pos[i] > 8) pos[i] = -8;
      }
      this.emberPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Screen Shake Damping
    if (this.shakeIntensity > 0.002) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.set(
        this.baseCameraPos.x + shakeX,
        this.baseCameraPos.y + shakeY,
        this.baseCameraPos.z
      );
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, dt * 8);
    } else {
      this.camera.position.copy(this.baseCameraPos);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    if (!this.container) return;
    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 480;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  dispose() {
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
