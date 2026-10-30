import * as THREE from 'three';

/**
 * Stickman3DCamera.js — Dynamic Combat Action Camera
 * ==================================================
 * Tailored for STICKMAN FIGHT (inspired by Reference Videos 1 & 2):
 * - Smoothly tracks between the player stickman and active enemy combatants
 * - Dynamic framing distance expanding/contracting based on fight engagement
 * - Smooth height positioning and angled combat perspective
 * - Impact screen shake with decay
 * - Target Lock support & cinematic finish framing
 */
export class Stickman3DCamera {
  constructor(camera) {
    this.camera = camera;

    // Camera target focus & position
    this.currentPosition = new THREE.Vector3(0, 3.2, 8.5);
    this.currentTarget = new THREE.Vector3(0, 1.4, 0);
    this.targetPos = new THREE.Vector3();

    // Combat framing distance
    this.baseDistance = 7.5;
    this.currentDistance = 7.5;
    this.minDistance = 5.5;
    this.maxDistance = 11.5;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 7.0;

    // Camera angle
    this.cameraAngle = 0; // horizontal angle
    this.cameraElevation = 2.4;

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  addShake(intensity = 0.25) {
    this.shakeIntensity = Math.min(0.65, this.shakeIntensity + intensity);
  }

  /**
   * Update camera per-frame based on player and enemy positions
   */
  update(delta, playerPos, enemies = []) {
    if (!playerPos) return;

    // Find active combatants to frame
    let focusX = playerPos.x;
    let focusZ = playerPos.z;
    let focusCount = 1;
    let maxDistFromPlayer = 0;

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      const d = enemy.position.distanceTo(playerPos);
      if (d < 16.0) {
        focusX += enemy.position.x;
        focusZ += enemy.position.z;
        focusCount++;
        maxDistFromPlayer = Math.max(maxDistFromPlayer, d);
      }
    }

    // Midpoint between combatants
    const midX = focusX / focusCount;
    const midZ = focusZ / focusCount;

    // Dynamic distance based on combat spacing
    const desiredDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.baseDistance + maxDistFromPlayer * 0.45)
    );
    this.currentDistance += (desiredDistance - this.currentDistance) * Math.min(1.0, delta * 5.0);

    // Target look-at (slightly above ground ~ 1.35m chest height)
    const targetY = 1.35;
    this.targetPos.set(midX, targetY, midZ);
    this.currentTarget.lerp(this.targetPos, Math.min(1.0, delta * 9.0));

    // Ideal camera position: angled side-action perspective (Z+ with slight X tilt)
    const idealX = midX + Math.sin(this.cameraAngle) * this.currentDistance;
    const idealY = targetY + this.cameraElevation + (this.currentDistance * 0.14);
    const idealZ = midZ + Math.cos(this.cameraAngle) * this.currentDistance;

    const lerpRate = Math.min(1.0, delta * 8.0);
    this.currentPosition.x += (idealX - this.currentPosition.x) * lerpRate;
    this.currentPosition.y += (idealY - this.currentPosition.y) * lerpRate;
    this.currentPosition.z += (idealZ - this.currentPosition.z) * lerpRate;

    // Screen Shake
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

    this.camera.lookAt(this.currentTarget);
  }
}
