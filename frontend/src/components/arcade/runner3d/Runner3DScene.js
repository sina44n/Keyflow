import * as THREE from 'three';

/**
 * Runner3DScene — High-Performance WebGL Scene & Third-Person Camera
 * =================================================================
 * Manages lighting, volumetric cyber fog, third-person camera tracking,
 * and cinematic camera shake on obstacle collision.
 */
export class Runner3DScene {
  constructor(container) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05050e);
    this.scene.fog = new THREE.FogExp2(0x05050e, 0.014);

    // 2. Camera (Third-person follow perspective)
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 350);
    this.camera.position.set(0, 3.8, -7.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // Camera Shake
    this.shakeIntensity = 0;
  }

  setupLighting() {
    // Ambient moonlight
    const ambientLight = new THREE.AmbientLight(0x27273a, 1.2);
    this.scene.add(ambientLight);

    // Directional moonbeam
    this.dirLight = new THREE.DirectionalLight(0xa5b4fc, 1.8);
    this.dirLight.position.set(15, 30, -20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);

    // Player Follow Light (Dynamic neon core illumination)
    this.playerLight = new THREE.PointLight(0xa855f7, 2.5, 20);
    this.playerLight.position.set(0, 3.0, 0);
    this.scene.add(this.playerLight);
  }

  triggerShake(intensity = 0.4) {
    this.shakeIntensity = intensity;
  }

  updateCamera(playerPos, dt) {
    // Smooth third-person chase camera
    const targetCamX = playerPos.x * 0.45;
    const targetCamY = 3.6 + (playerPos.y > 1.2 ? (playerPos.y - 1.2) * 0.4 : 0);
    const targetCamZ = playerPos.z - 7.5;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.12);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.12);
    this.camera.position.z = targetCamZ;

    // Apply trauma shake
    if (this.shakeIntensity > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.5);
    }

    // Look ahead down the track
    const lookTarget = new THREE.Vector3(
      this.camera.position.x * 0.5,
      1.6,
      playerPos.z + 14
    );
    this.camera.lookAt(lookTarget);

    // Keep dynamic light tracking with player
    this.playerLight.position.set(playerPos.x, playerPos.y + 2.0, playerPos.z);
    this.dirLight.position.z = playerPos.z - 20;
    this.dirLight.target.position.set(0, 0, playerPos.z + 10);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
