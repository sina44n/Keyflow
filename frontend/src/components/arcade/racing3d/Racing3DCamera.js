import * as THREE from 'three';

/**
 * Cinematic 3D Follow Camera Controller for Left-to-Right Racing (+X Axis).
 * Smoothly tracks the player's supercar from an elevated side-rear perspective,
 * keeping the multi-car grid in view while dynamically responding to acceleration,
 * streaks, and nitro speed boosts with dynamic FOV and subtle vibration.
 *
 * Supports polymorphic calling conventions:
 * 1. update({ playerX, speed, isNitro, dt, isFinished })
 * 2. update(playerPosOrX, isNitro, dt)
 */
export class Racing3DCamera {
  constructor({ camera, aspect = 16 / 9 }) {
    this.camera = camera;
    this.camera.fov = 45;
    this.camera.aspect = aspect;
    this.camera.near = 0.5;
    this.camera.far = 700;
    this.camera.updateProjectionMatrix();

    // Default side-rear follow offsets relative to player car (traveling in +X)
    this.baseOffsetX = -11.5; // Chase offset behind player along X
    this.baseOffsetY = 6.2;   // Elevated angle looking down onto the 4 lanes
    this.baseOffsetZ = 15.5;  // Side perspective looking across track

    this.lookAheadX = 14.0;
    this.lookAheadY = 1.6;
    this.lookAheadZ = -1.0;

    this.currentPosition = new THREE.Vector3(-11.5, 6.2, 15.5);
    this.currentTarget = new THREE.Vector3(14.0, 1.6, -1.0);

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
  update(arg1, arg2, arg3, arg4) {
    let playerX = 0;
    let speed = 20;
    let isNitro = false;
    let dt = 0.016;

    if (typeof arg1 === 'object' && arg1 !== null) {
      if ('playerX' in arg1) {
        // Object call: { playerX, speed, isNitro, dt }
        playerX = arg1.playerX ?? 0;
        speed = arg1.speed ?? 20;
        isNitro = arg1.isNitro ?? false;
        dt = arg1.dt ?? 0.016;
      } else if ('x' in arg1) {
        // Positional call passing Vector3: (playerVehicle.group.position, isNitro, dt)
        playerX = arg1.x ?? 0;
        isNitro = !!arg2;
        dt = typeof arg3 === 'number' ? arg3 : 0.016;
      }
    } else if (typeof arg1 === 'number') {
      playerX = arg1;
      isNitro = !!arg2;
      dt = typeof arg3 === 'number' ? arg3 : 0.016;
      speed = typeof arg4 === 'number' ? arg4 : 20;
    }

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
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, isNitro ? 0.08 : 0.03, 0.2);
    } else {
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, 0.1);
    }

    if (this.shakeIntensity > 0.001) {
      const shakeTime = Date.now() * 0.04;
      targetY += Math.sin(shakeTime * 1.3) * this.shakeIntensity;
      targetZ += Math.cos(shakeTime * 1.7) * this.shakeIntensity;
    }

    // 3. Smooth Camera Interpolation (Damping)
    this.currentPosition.x = THREE.MathUtils.lerp(this.currentPosition.x, targetX, 0.1);
    this.currentPosition.y = THREE.MathUtils.lerp(this.currentPosition.y, targetY, 0.08);
    this.currentPosition.z = THREE.MathUtils.lerp(this.currentPosition.z, targetZ, 0.08);

    this.camera.position.copy(this.currentPosition);

    // 4. Smooth Look-At Target
    const lookX = playerX + this.lookAheadX + speedRatio * 4.0;
    const lookY = this.lookAheadY;
    const lookZ = this.lookAheadZ;

    this.currentTarget.x = THREE.MathUtils.lerp(this.currentTarget.x, lookX, 0.12);
    this.currentTarget.y = THREE.MathUtils.lerp(this.currentTarget.y, lookY, 0.1);
    this.currentTarget.z = THREE.MathUtils.lerp(this.currentTarget.z, lookZ, 0.1);

    this.camera.lookAt(this.currentTarget);

    // 5. Dynamic Field of View
    this.targetFov = isNitro ? 52 : 45 + speedRatio * 3.5;
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, 0.08);
      this.camera.updateProjectionMatrix();
    }
  }
}
