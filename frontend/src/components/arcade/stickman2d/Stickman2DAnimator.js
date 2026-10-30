/**
 * Stickman2DAnimator.js
 * 2D Keyframe animation & skeletal kinematics engine for Stickman Fight.
 * Provides authentic, high-speed martial arts, sword slashes, acrobatic kicks,
 * dodges, blocks, and finishers inspired by classic stickman fighting animations.
 */

// Poses are defined by relative joint angles (in radians) and offsets.
// Body parts:
// torsoAngle, hipY (from ground 0), headAngle
// rArmUpper, rArmFore, lArmUpper, lArmFore
// rLegUpper, rLegLower, lLegUpper, lLegLower
// weaponAngle, weaponGlow

export const ANIM_POSES = {
  idle: {
    duration: 1.0,
    loop: true,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.08,
        hipY: -65,
        headAngle: -0.05,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
      {
        t: 0.5,
        torsoAngle: 0.12,
        hipY: -62,
        headAngle: -0.02,
        rArmUpper: 0.85,
        rArmFore: 1.3,
        lArmUpper: -0.55,
        lArmFore: -0.9,
        rLegUpper: 0.25,
        rLegLower: 0.15,
        lLegUpper: -0.25,
        lLegLower: 0.25,
        weaponAngle: 0.5,
      },
      {
        t: 1.0,
        torsoAngle: 0.08,
        hipY: -65,
        headAngle: -0.05,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  advance: {
    duration: 0.45,
    loop: true,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.35,
        hipY: -60,
        headAngle: -0.15,
        rArmUpper: 1.2,
        rArmFore: 0.8,
        lArmUpper: -1.0,
        lArmFore: -0.6,
        rLegUpper: 0.8,
        rLegLower: 0.6,
        lLegUpper: -0.8,
        lLegLower: 0.3,
        weaponAngle: -0.2,
      },
      {
        t: 0.5,
        torsoAngle: 0.38,
        hipY: -64,
        headAngle: -0.15,
        rArmUpper: -0.8,
        rArmFore: 0.5,
        lArmUpper: 1.1,
        lArmFore: -0.8,
        rLegUpper: -0.7,
        rLegLower: 0.4,
        lLegUpper: 0.8,
        lLegLower: 0.7,
        weaponAngle: 0.6,
      },
      {
        t: 1.0,
        torsoAngle: 0.35,
        hipY: -60,
        headAngle: -0.15,
        rArmUpper: 1.2,
        rArmFore: 0.8,
        lArmUpper: -1.0,
        lArmFore: -0.6,
        rLegUpper: 0.8,
        rLegLower: 0.6,
        lLegUpper: -0.8,
        lLegLower: 0.3,
        weaponAngle: -0.2,
      },
    ],
  },

  slash1: {
    duration: 0.28,
    loop: false,
    frames: [
      // Anticipation: Pull blade back
      {
        t: 0.0,
        torsoAngle: -0.2,
        hipY: -60,
        headAngle: 0.1,
        rArmUpper: -1.2,
        rArmFore: -1.4,
        lArmUpper: 0.8,
        lArmFore: 0.6,
        rLegUpper: -0.4,
        rLegLower: 0.3,
        lLegUpper: 0.5,
        lLegLower: 0.2,
        weaponAngle: -2.0,
        slashArc: false,
      },
      // Impact strike: Fast horizontal sweep
      {
        t: 0.4,
        torsoAngle: 0.45,
        hipY: -58,
        headAngle: -0.1,
        rArmUpper: 1.8,
        rArmFore: 0.6,
        lArmUpper: -1.2,
        lArmFore: -0.8,
        rLegUpper: 0.6,
        rLegLower: 0.5,
        lLegUpper: -0.7,
        lLegLower: 0.2,
        weaponAngle: 1.5,
        slashArc: true,
      },
      // Follow-through recovery
      {
        t: 1.0,
        torsoAngle: 0.2,
        hipY: -63,
        headAngle: 0.0,
        rArmUpper: 1.1,
        rArmFore: 1.0,
        lArmUpper: -0.4,
        lArmFore: -0.8,
        rLegUpper: 0.3,
        rLegLower: 0.2,
        lLegUpper: -0.4,
        lLegLower: 0.2,
        weaponAngle: 0.8,
        slashArc: false,
      },
    ],
  },

  slash2: {
    duration: 0.3,
    loop: false,
    frames: [
      // Low scoop anticipation
      {
        t: 0.0,
        torsoAngle: 0.3,
        hipY: -52,
        headAngle: -0.1,
        rArmUpper: 0.5,
        rArmFore: 1.8,
        lArmUpper: -0.8,
        lArmFore: -0.5,
        rLegUpper: 0.7,
        rLegLower: 0.8,
        lLegUpper: -0.5,
        lLegLower: 0.4,
        weaponAngle: 1.8,
        slashArc: false,
      },
      // Rising upward cut
      {
        t: 0.45,
        torsoAngle: -0.3,
        hipY: -72,
        headAngle: -0.3,
        rArmUpper: -1.6,
        rArmFore: -0.4,
        lArmUpper: 0.6,
        lArmFore: 0.8,
        rLegUpper: -0.2,
        rLegLower: 0.1,
        lLegUpper: 0.4,
        lLegLower: 0.1,
        weaponAngle: -1.4,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.1,
        lArmUpper: -0.5,
        lArmFore: -0.9,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
        slashArc: false,
      },
    ],
  },

  kick: {
    duration: 0.35,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.2,
        hipY: -65,
        headAngle: 0.1,
        rArmUpper: 0.5,
        rArmFore: 1.0,
        lArmUpper: -0.5,
        lArmFore: -0.8,
        rLegUpper: 0.2,
        rLegLower: 0.4,
        lLegUpper: -0.2,
        lLegLower: 0.1,
        weaponAngle: 0.3,
      },
      // High extended roundhouse
      {
        t: 0.4,
        torsoAngle: -0.6,
        hipY: -68,
        headAngle: 0.4,
        rArmUpper: -0.8,
        rArmFore: 0.2,
        lArmUpper: 1.2,
        lArmFore: 0.6,
        rLegUpper: 2.1,
        rLegLower: 0.1, // straight leg extension
        lLegUpper: -0.2,
        lLegLower: 0.3,
        weaponAngle: -0.5,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  flurry: {
    duration: 0.4,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.25,
        hipY: -62,
        headAngle: -0.1,
        rArmUpper: 1.5,
        rArmFore: 0.5,
        lArmUpper: -0.8,
        lArmFore: 1.2,
        rLegUpper: 0.4,
        rLegLower: 0.3,
        lLegUpper: -0.5,
        lLegLower: 0.2,
        weaponAngle: 1.2,
        slashArc: true,
      },
      {
        t: 0.25,
        torsoAngle: 0.3,
        hipY: -60,
        headAngle: -0.1,
        rArmUpper: -0.5,
        rArmFore: 1.8,
        lArmUpper: 1.4,
        lArmFore: 0.4,
        rLegUpper: 0.3,
        rLegLower: 0.4,
        lLegUpper: -0.4,
        lLegLower: 0.2,
        weaponAngle: -1.0,
        slashArc: true,
      },
      {
        t: 0.5,
        torsoAngle: 0.35,
        hipY: -64,
        headAngle: -0.15,
        rArmUpper: 1.7,
        rArmFore: 0.4,
        lArmUpper: -1.0,
        lArmFore: -0.5,
        rLegUpper: 0.5,
        rLegLower: 0.5,
        lLegUpper: -0.6,
        lLegLower: 0.3,
        weaponAngle: 1.6,
        slashArc: true,
      },
      {
        t: 0.75,
        torsoAngle: 0.2,
        hipY: -62,
        headAngle: 0.0,
        rArmUpper: 0.2,
        rArmFore: 1.6,
        lArmUpper: 0.8,
        lArmFore: 0.8,
        rLegUpper: 0.2,
        rLegLower: 0.3,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.2,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  cyclone: {
    duration: 0.5,
    loop: false,
    frames: [
      // Airborne leap & 360 spin
      {
        t: 0.0,
        torsoAngle: 0.1,
        hipY: -85,
        headAngle: 0.0,
        rArmUpper: 2.2,
        rArmFore: 0.1,
        lArmUpper: -2.2,
        lArmFore: -0.1,
        rLegUpper: 1.2,
        rLegLower: 0.6,
        lLegUpper: -1.2,
        lLegLower: 0.6,
        weaponAngle: 2.0,
        slashArc: true,
      },
      {
        t: 0.5,
        torsoAngle: 0.8,
        hipY: -95,
        headAngle: -0.2,
        rArmUpper: -2.0,
        rArmFore: -0.3,
        lArmUpper: 2.0,
        lArmFore: 0.3,
        rLegUpper: -0.8,
        rLegLower: 0.8,
        lLegUpper: 0.8,
        lLegLower: 0.8,
        weaponAngle: -1.8,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.15,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.3,
        rLegLower: 0.2,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  bladeStorm: {
    duration: 0.75,
    loop: false,
    frames: [
      // High vault
      {
        t: 0.0,
        torsoAngle: 0.0,
        hipY: -75,
        headAngle: -0.2,
        rArmUpper: -1.8,
        rArmFore: -0.8,
        lArmUpper: -1.8,
        lArmFore: -0.8,
        rLegUpper: 0.6,
        rLegLower: 0.8,
        lLegUpper: 0.6,
        lLegLower: 0.8,
        weaponAngle: -2.2,
      },
      // Apex charge: hovering in the air
      {
        t: 0.4,
        torsoAngle: 0.2,
        hipY: -115,
        headAngle: 0.2,
        rArmUpper: -2.4,
        rArmFore: -0.2,
        lArmUpper: 1.8,
        lArmFore: 0.5,
        rLegUpper: -0.4,
        rLegLower: 0.6,
        lLegUpper: 0.8,
        lLegLower: 0.3,
        weaponAngle: -2.8,
      },
      // Meteor Cleave impact
      {
        t: 0.7,
        torsoAngle: 0.7,
        hipY: -50,
        headAngle: -0.3,
        rArmUpper: 1.9,
        rArmFore: 0.2,
        lArmUpper: -1.5,
        lArmFore: -0.4,
        rLegUpper: 0.8,
        rLegLower: 0.9,
        lLegUpper: -0.9,
        lLegLower: 0.7,
        weaponAngle: 1.8,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  block: {
    duration: 0.3,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.15,
        hipY: -58,
        headAngle: 0.1,
        rArmUpper: 0.4,
        rArmFore: 1.6,
        lArmUpper: 0.5,
        lArmFore: 1.5,
        rLegUpper: -0.4,
        rLegLower: 0.5,
        lLegUpper: 0.5,
        lLegLower: 0.4,
        weaponAngle: 0.0,
      },
      {
        t: 1.0,
        torsoAngle: -0.18,
        hipY: -58,
        headAngle: 0.1,
        rArmUpper: 0.45,
        rArmFore: 1.7,
        lArmUpper: 0.55,
        lArmFore: 1.6,
        rLegUpper: -0.4,
        rLegLower: 0.5,
        lLegUpper: 0.5,
        lLegLower: 0.4,
        weaponAngle: 0.0,
      },
    ],
  },

  parry: {
    duration: 0.25,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.1,
        rArmUpper: 1.2,
        rArmFore: 1.2,
        lArmUpper: -0.8,
        lArmFore: -0.6,
        rLegUpper: 0.4,
        rLegLower: 0.2,
        lLegUpper: -0.4,
        lLegLower: 0.3,
        weaponAngle: 0.8,
      },
      // Sharp counter push
      {
        t: 0.4,
        torsoAngle: -0.3,
        hipY: -66,
        headAngle: 0.2,
        rArmUpper: -0.8,
        rArmFore: 0.8,
        lArmUpper: 0.8,
        lArmFore: 0.8,
        rLegUpper: -0.3,
        rLegLower: 0.1,
        lLegUpper: 0.5,
        lLegLower: 0.2,
        weaponAngle: -0.6,
        slashArc: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.08,
        hipY: -65,
        headAngle: -0.05,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  dodge: {
    duration: 0.35,
    loop: false,
    frames: [
      // Low backward slide / roll
      {
        t: 0.0,
        torsoAngle: 0.4,
        hipY: -45,
        headAngle: -0.3,
        rArmUpper: 1.2,
        rArmFore: 1.0,
        lArmUpper: -1.0,
        lArmFore: -0.6,
        rLegUpper: 1.1,
        rLegLower: 1.2,
        lLegUpper: -0.9,
        lLegLower: 0.8,
        weaponAngle: 0.8,
      },
      {
        t: 0.5,
        torsoAngle: 0.7,
        hipY: -35,
        headAngle: -0.4,
        rArmUpper: 1.8,
        rArmFore: 0.4,
        lArmUpper: -1.5,
        lArmFore: -0.2,
        rLegUpper: 1.4,
        rLegLower: 1.2,
        lLegUpper: -1.2,
        lLegLower: 0.9,
        weaponAngle: 1.2,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -65,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  hit: {
    duration: 0.25,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.5,
        hipY: -62,
        headAngle: 0.4,
        rArmUpper: -0.8,
        rArmFore: 0.6,
        lArmUpper: -1.0,
        lArmFore: 0.4,
        rLegUpper: -0.5,
        rLegLower: 0.2,
        lLegUpper: 0.6,
        lLegLower: 0.4,
        weaponAngle: -1.2,
      },
      {
        t: 1.0,
        torsoAngle: 0.08,
        hipY: -65,
        headAngle: -0.05,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: -1.0,
        rLegUpper: 0.2,
        rLegLower: 0.1,
        lLegUpper: -0.3,
        lLegLower: 0.2,
        weaponAngle: 0.4,
      },
    ],
  },

  death: {
    duration: 0.8,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.6,
        hipY: -58,
        headAngle: 0.5,
        rArmUpper: -1.0,
        rArmFore: 0.2,
        lArmUpper: -1.2,
        lArmFore: 0.3,
        rLegUpper: -0.6,
        rLegLower: 0.4,
        lLegUpper: 0.4,
        lLegLower: 0.6,
        weaponAngle: -1.5,
      },
      {
        t: 0.4,
        torsoAngle: -1.2,
        hipY: -35,
        headAngle: 0.8,
        rArmUpper: -1.5,
        rArmFore: 0.0,
        lArmUpper: -1.5,
        lArmFore: 0.0,
        rLegUpper: -0.9,
        rLegLower: 0.8,
        lLegUpper: 0.2,
        lLegLower: 0.8,
        weaponAngle: -2.0,
      },
      {
        t: 1.0,
        torsoAngle: -1.55, // Flat on ground
        hipY: -15,
        headAngle: 0.0,
        rArmUpper: -1.5,
        rArmFore: 0.0,
        lArmUpper: -1.5,
        lArmFore: 0.0,
        rLegUpper: -1.5,
        rLegLower: 0.0,
        lLegUpper: -1.5,
        lLegLower: 0.0,
        weaponAngle: -1.57,
      },
    ],
  },
};

export class Stickman2DAnimator {
  constructor() {
    this.currentAnim = "idle";
    this.animTime = 0.0;
    this.playbackSpeed = 1.0;
    this.onComplete = null;
  }

  play(animName, speed = 1.0, onComplete = null) {
    if (!ANIM_POSES[animName]) {
      animName = "idle";
    }
    if (this.currentAnim === animName && ANIM_POSES[animName].loop) {
      return;
    }
    this.currentAnim = animName;
    this.animTime = 0.0;
    this.playbackSpeed = speed;
    this.onComplete = onComplete;
  }

  update(dt) {
    const anim = ANIM_POSES[this.currentAnim] || ANIM_POSES.idle;
    this.animTime += dt * this.playbackSpeed;

    if (this.animTime >= anim.duration) {
      if (anim.loop) {
        this.animTime = this.animTime % anim.duration;
      } else {
        this.animTime = anim.duration;
        if (this.onComplete) {
          const cb = this.onComplete;
          this.onComplete = null;
          cb();
        } else {
          // Default return to idle
          this.currentAnim = "idle";
          this.animTime = 0.0;
        }
      }
    }
  }

  getCurrentPose() {
    const anim = ANIM_POSES[this.currentAnim] || ANIM_POSES.idle;
    const normT = Math.min(1.0, this.animTime / anim.duration);
    const frames = anim.frames;

    if (frames.length === 1) return frames[0];

    // Find bounding keyframes
    let f1 = frames[0];
    let f2 = frames[frames.length - 1];

    for (let i = 0; i < frames.length - 1; i++) {
      if (normT >= frames[i].t && normT <= frames[i + 1].t) {
        f1 = frames[i];
        f2 = frames[i + 1];
        break;
      }
    }

    const span = Math.max(0.001, f2.t - f1.t);
    const alpha = (normT - f1.t) / span;

    // Smooth cubic ease
    const ease = alpha * alpha * (3 - 2 * alpha);

    const lerp = (a, b) => a + (b - a) * ease;

    return {
      torsoAngle: lerp(f1.torsoAngle || 0, f2.torsoAngle || 0),
      hipY: lerp(f1.hipY || -65, f2.hipY || -65),
      headAngle: lerp(f1.headAngle || 0, f2.headAngle || 0),
      rArmUpper: lerp(f1.rArmUpper || 0, f2.rArmUpper || 0),
      rArmFore: lerp(f1.rArmFore || 0, f2.rArmFore || 0),
      lArmUpper: lerp(f1.lArmUpper || 0, f2.lArmUpper || 0),
      lArmFore: lerp(f1.lArmFore || 0, f2.lArmFore || 0),
      rLegUpper: lerp(f1.rLegUpper || 0, f2.rLegUpper || 0),
      rLegLower: lerp(f1.rLegLower || 0, f2.rLegLower || 0),
      lLegUpper: lerp(f1.lLegUpper || 0, f2.lLegUpper || 0),
      lLegLower: lerp(f1.lLegLower || 0, f2.lLegLower || 0),
      weaponAngle: lerp(f1.weaponAngle || 0, f2.weaponAngle || 0),
      slashArc: !!(f1.slashArc || f2.slashArc),
    };
  }
}
