import * as THREE from 'three';

/**
 * Cinematic 3D Camera Controller for Left-to-Right Racing
 * Tracks the player's supercar from an immersive side-rear perspective,
 * keeping all 4 competitors in view while dynamically responding to
 * acceleration, high-velocity streaks, and nitro boosts.
 */
export class Racing3DCamera {
  constructor({ camera, aspect = 16 / 9 }) {
    this.camera = camera;
    this.camera.fov = 45;
    this.camera.aspect = aspect;
    this.camera.near = 0.5;
    this.camera.far = 600;
    this.camera.updateProjectionMatrix();

    // Default side-rear follow offsets relative to player car (traveling in +X)
    this.baseOffsetX = -11.0; // Dynamic chase offset behind player along X
    this.baseOffsetY = 6.0;  // Elevated angle looking down onto the 4 lanes
    this.baseOffsetZ = 15.0; // Side perspective looking across track

    this.lookAheadX = 13.5;
    this.lookAheadY = 1.6;
    this.lookAheadZ = -1.0;

    this.currentPosition = new THREE.Vector3(-11, 6.0, 15);
    this.currentTarget = new THREE.Vector3(13.5, 1.6, -1.0);

    // Dynamic camera physics
    this.targetFov = 45;
    this.shakeIntensity = 0;
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Updates camera position, look-at target, dynamic FOV, and acceleration vibration.
   */
  update({
    playerX = 0,
    speed = 0,
    isNitro = false,
    dt = 0.016,
    isFinished = false,
  }) {
    // 1. Calculate desired camera position
    // As speed increases, camera pulls slightly further back for panoramic velocity
    const speedRatio = THREE.MathUtils.clamp(speed / 90, 0, 1.4);
    const dynamicOffsetX = this.baseOffsetX - speedRatio * 3.5;
    const dynamicOffsetY = this.baseOffsetY + speedRatio * 1.2;
    const dynamicOffsetZ = this.baseOffsetZ + speedRatio * 2.0;

    let targetX = playerX + dynamicOffsetX;
    let targetY = dynamicOffsetY;
    let targetZ = dynamicOffsetZ;

    // 2. Camera Vibration / Shake on Nitro or Extreme Velocity
    if (isNitro || speed > 85) {
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, isNitro ? 0.09 : 0.035, 0.2);
    } else {
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, 0.1);
    }

    if (this.shakeIntensity > 0.001) {
      const shakeTime = Date.now() * 0.04;
      targetY += Math.sin(shakeTime * 1.3) * this.shakeIntensity;
      targetZ += Math.cos(shakeTime * 1.7) * this.shakeIntensity;
    }

    // 3. Smooth Camera Interpolation (Damping)
    this.currentPosition.x = THREE.MathUtils.lerp(this.currentPosition.x, targetX, 0.09);
    this.currentPosition.y = THREE.MathUtils.lerp(this.currentPosition.y, targetY, 0.08);
    this.currentPosition.z = THREE.MathUtils.lerp(this.currentPosition.z, targetZ, 0.08);

    this.camera.position.copy(this.currentPosition);

    // 4. Smooth Look-At Target
    const lookX = playerX + this.lookAheadX + speedRatio * 4.0;
    const lookY = this.lookAheadY;
    const lookZ = this.lookAheadZ;

    this.currentTarget.x = THREE.MathUtils.lerp(this.currentTarget.x, lookX, 0.1);
    this.currentTarget.y = THREE.MathUtils.lerp(this.currentTarget.y, lookY, 0.1);
    this.currentTarget.z = THREE.MathUtils.lerp(this.currentTarget.z, lookZ, 0.1);

    this.camera.lookAt(this.currentTarget);

    // 5. Dynamic Field of View
    this.targetFov = isNitro ? 51 : 45 + speedRatio * 3.0;
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, 0.06);
      this.camera.updateProjectionMatrix();
    }
  }
}
