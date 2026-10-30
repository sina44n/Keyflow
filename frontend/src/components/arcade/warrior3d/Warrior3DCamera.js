import * as THREE from 'three';

/**
 * Warrior3DCamera.js — Third-Person Action Combat Camera with Target Lock & Pointer Lock
 * ======================================================================================
 * Features:
 * - Fluid orbit mouse-look rotation with Pointer Lock API
 * - Pitch clamping (-40° to +65°) preventing upside-down inversions
 * - Camera-relative directional forward and right vectors for WASD movement
 * - Dynamic shoulder offset and smooth damping follow
 * - Target-Lock System (Tab): locks view onto nearest targeted enemy
 * - Dynamic Impact Screen Shake (with decay)
 */
export class Warrior3DCamera {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Spherical coordinates around player target
    this.yaw = 0; // Horizontal rotation (radians)
    this.pitch = 0.22; // Vertical rotation (radians)
    this.distance = 4.8; // Ideal distance behind player
    this.targetDistance = 4.8;
    this.minDistance = 2.0;
    this.maxDistance = 7.5;

    // Pitch limits (radians)
    this.minPitch = -0.65; // ~ -37 deg (looking upward)
    this.maxPitch = 1.15; // ~ +66 deg (looking down at character)

    // Sensitivity
    this.mouseSensitivity = 0.0022;

    // Target lock
    this.isTargetLocked = false;
    this.lockedTarget = null; // Reference to enemy instance

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 6.0;

    // Pointer Lock State
    this.isPointerLocked = false;
    this.onLockChangeCallbacks = new Set();

    // Smoothed camera positions
    this.currentPosition = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
    this.lookAtPos = new THREE.Vector3();

    // Direction vectors for player movement calculation
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();

    this.bindEvents();
  }

  bindEvents() {
    this._onMouseMove = (e) => {
      if (!this.isPointerLocked) return;

      const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

      if (!this.isTargetLocked) {
        this.yaw -= movementX * this.mouseSensitivity;
        this.pitch += movementY * this.mouseSensitivity;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      } else {
        // Subtle micro-aim adjustment even when target locked
        this.pitch += movementY * this.mouseSensitivity * 0.3;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      }
    };

    this._onPointerLockChange = () => {
      const locked =
        document.pointerLockElement === this.domElement ||
        document.mozPointerLockElement === this.domElement ||
        document.webkitPointerLockElement === this.domElement;

      this.isPointerLocked = Boolean(locked);
      this.onLockChangeCallbacks.forEach((cb) => cb(this.isPointerLocked));
    };

    this._onWheel = (e) => {
      if (!this.isPointerLocked) return;
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance + e.deltaY * 0.003));
    };

    window.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mozpointerlockchange', this._onPointerLockChange);
    document.addEventListener('webkitpointerlockchange', this._onPointerLockChange);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: true });
  }

  requestLock() {
    if (!this.domElement) return;
    try {
      if (this.domElement.requestPointerLock) {
        this.domElement.requestPointerLock();
      } else if (this.domElement.mozRequestPointerLock) {
        this.domElement.mozRequestPointerLock();
      } else if (this.domElement.webkitRequestPointerLock) {
        this.domElement.webkitRequestPointerLock();
      }
    } catch (e) {
      console.warn('Pointer lock request error:', e);
    }
  }

  exitLock() {
    try {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch (e) {
      console.warn('Exit pointer lock error:', e);
    }
  }

  onLockChange(cb) {
    this.onLockChangeCallbacks.add(cb);
  }

  /**
   * Toggle target lock on closest active enemy
   */
  toggleTargetLock(enemies = [], playerPos) {
    if (this.isTargetLocked) {
      this.isTargetLocked = false;
      this.lockedTarget = null;
      return null;
    }

    // Find nearest alive enemy within 28 meters
    let closestEnemy = null;
    let minDist = 28.0;

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      const d = enemy.position.distanceTo(playerPos);
      if (d < minDist) {
        minDist = d;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      this.isTargetLocked = true;
      this.lockedTarget = closestEnemy;
      return closestEnemy;
    }

    return null;
  }

  /**
   * Trigger screen shake on heavy impacts
   */
  addShake(intensity = 0.25) {
    this.shakeIntensity = Math.min(0.6, this.shakeIntensity + intensity);
  }

  /**
   * Per-frame camera update
   */
  update(delta, playerPos) {
    if (!playerPos) return;

    // Smooth distance zoom
    this.distance += (this.targetDistance - this.distance) * Math.min(1.0, delta * 8.0);

    // If target locked, align yaw toward target
    if (this.isTargetLocked && this.lockedTarget && this.lockedTarget.isAlive) {
      const enemyPos = this.lockedTarget.position;
      const dx = enemyPos.x - playerPos.x;
      const dz = enemyPos.z - playerPos.z;
      const desiredYaw = Math.atan2(dx, dz) + Math.PI;

      // Smooth yaw rotation toward target
      let diff = desiredYaw - this.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.yaw += diff * Math.min(1.0, delta * 9.0);
    } else if (this.isTargetLocked && (!this.lockedTarget || !this.lockedTarget.isAlive)) {
      this.isTargetLocked = false;
      this.lockedTarget = null;
    }

    // Compute player focus point (chest height ~ 1.55m)
    const targetY = playerPos.y + 1.55;
    this.currentTarget.set(playerPos.x, targetY, playerPos.z);

    // Calculate spherical camera offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Slightly offset over right shoulder for classic third-person action view
    const shoulderOffset = 0.45;
    const rightX = -cosYaw * shoulderOffset;
    const rightZ = sinYaw * shoulderOffset;

    const camX = playerPos.x + sinYaw * cosPitch * this.distance + rightX;
    const camY = Math.max(0.6, targetY + sinPitch * this.distance);
    const camZ = playerPos.z + cosYaw * cosPitch * this.distance + rightZ;

    // Smooth camera motion
    const lerpFactor = Math.min(1.0, delta * 14.0);
    this.currentPosition.lerp(new THREE.Vector3(camX, camY, camZ), lerpFactor);

    // Apply Screen Shake if active
    if (this.shakeIntensity > 0.001) {
      const sx = (Math.random() * 2 - 1) * this.shakeIntensity;
      const sy = (Math.random() * 2 - 1) * this.shakeIntensity;
      const sz = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.camera.position.set(
        this.currentPosition.x + sx,
        this.currentPosition.y + sy,
        this.currentPosition.z + sz
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta * this.shakeIntensity);
    } else {
      this.camera.position.copy(this.currentPosition);
    }

    // Set camera look-at slightly above character center
    this.lookAtPos.lerp(new THREE.Vector3(playerPos.x, targetY + 0.1, playerPos.z), lerpFactor);
    this.camera.lookAt(this.lookAtPos);

    // Update horizontal forward and right directions for movement
    this.forward.set(-sinYaw, 0, -cosYaw).normalize();
    this.right.set(cosYaw, 0, -sinYaw).normalize();
  }

  destroy() {
    window.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mozpointerlockchange', this._onPointerLockChange);
    document.removeEventListener('webkitpointerlockchange', this._onPointerLockChange);
    if (this.domElement) {
      this.domElement.removeEventListener('wheel', this._onWheel);
    }
    this.onLockChangeCallbacks.clear();
  }
}
