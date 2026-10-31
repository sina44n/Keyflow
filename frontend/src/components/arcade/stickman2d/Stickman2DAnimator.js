/**
 * Stickman2DAnimator.js
 * Masterpiece 2D Stickman Martial Arts Animation Engine.
 * Built directly from Reference A (54-frame storyboard), Reference B (collage),
 * and Reference C (original stick fighting video).
 *
 * Implements authentic skeletal joint kinematics:
 * - Stances: idle bounce, advance, retreat, sprint dash
 * - Punches: jab, cross, hook, uppercut, rapid flurry
 * - Kicks: front kick, high roundhouse, low sweep, flying knee, dropkick
 * - Energy: double-palm ki blast beam
 * - Defense: high block, low block, dodge back, parry
 * - Reactions: head snap, stomach recoil, airborne knockback, ground slide, getting up, defeat, victory
 */

export const MARTIAL_POSES = {
  // 1. Classic boxing/karate bouncing ready stance (Reference B Row 1 #1)
  idle: {
    duration: 0.9,
    loop: true,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4, // Right fist high by chin
        lArmUpper: 0.4,
        lArmFore: 1.6, // Left fist forward in guard
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
      {
        t: 0.5,
        torsoAngle: 0.14,
        hipY: -60, // Slight bounce upward
        headAngle: -0.02,
        rArmUpper: 0.95,
        rArmFore: 1.45,
        lArmUpper: 0.45,
        lArmFore: 1.65,
        rLegUpper: 0.25,
        rLegLower: 0.2,
        lLegUpper: -0.3,
        lLegLower: 0.25,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 2. Sprint Dash: Low torso lean, arms pumping, forward rush (Reference A Frame 5)
  dash: {
    duration: 0.35,
    loop: true,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.55, // Strong forward lean
        hipY: -56,
        headAngle: -0.25,
        rArmUpper: 1.4,
        rArmFore: 0.6,
        lArmUpper: -1.2,
        lArmFore: -0.5,
        rLegUpper: 0.9,
        rLegLower: 0.8,
        lLegUpper: -0.9,
        lLegLower: 0.4,
      },
      {
        t: 0.5,
        torsoAngle: 0.58,
        hipY: -58,
        headAngle: -0.25,
        rArmUpper: -1.1,
        rArmFore: -0.4,
        lArmUpper: 1.3,
        lArmFore: 0.7,
        rLegUpper: -0.85,
        rLegLower: 0.4,
        lLegUpper: 0.95,
        lLegLower: 0.75,
      },
      {
        t: 1.0,
        torsoAngle: 0.55,
        hipY: -56,
        headAngle: -0.25,
        rArmUpper: 1.4,
        rArmFore: 0.6,
        lArmUpper: -1.2,
        lArmFore: -0.5,
        rLegUpper: 0.9,
        rLegLower: 0.8,
        lLegUpper: -0.9,
        lLegLower: 0.4,
      },
    ],
  },

  // 3. Fast Lead Jab: Quick straight snap with lead left fist (Reference A Frame 6, Reference B Row 1 #2)
  jab: {
    duration: 0.22,
    loop: false,
    strikeFrame: 0.35,
    strikeType: "punch",
    frames: [
      // Anticipation
      {
        t: 0.0,
        torsoAngle: 0.05,
        hipY: -64,
        headAngle: 0.0,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.5,
        lArmFore: 1.5,
        rLegUpper: 0.3,
        rLegLower: 0.2,
        lLegUpper: -0.3,
        lLegLower: 0.2,
      },
      // Impact extension: Left fist snaps straight forward
      {
        t: 0.35,
        torsoAngle: 0.3,
        hipY: -62,
        headAngle: -0.1,
        rArmUpper: 0.7,
        rArmFore: 1.6, // Right fist covers jaw
        lArmUpper: 1.55,
        lArmFore: 0.05, // Fully extended forward punch
        rLegUpper: 0.5,
        rLegLower: 0.3,
        lLegUpper: -0.5,
        lLegLower: 0.2,
        fistContact: "left",
      },
      // Retraction
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 4. Heavy Cross: Deep hip drive and right fist extension to chin (Reference B Row 1 #3)
  cross: {
    duration: 0.28,
    loop: false,
    strikeFrame: 0.4,
    strikeType: "punch",
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.15, // Windup coil
        hipY: -62,
        headAngle: 0.1,
        rArmUpper: -0.4,
        rArmFore: 1.8, // Cocking right fist back
        lArmUpper: 0.8,
        lArmFore: 1.2,
        rLegUpper: -0.2,
        rLegLower: 0.4,
        lLegUpper: 0.4,
        lLegLower: 0.2,
      },
      // Impact: Explosive torso twist and full straight right punch
      {
        t: 0.4,
        torsoAngle: 0.45,
        hipY: -58,
        headAngle: -0.15,
        rArmUpper: 1.6,
        rArmFore: 0.05, // Fully extended right fist
        lArmUpper: -0.3,
        lArmFore: 1.5,
        rLegUpper: 0.7,
        rLegLower: 0.4,
        lLegUpper: -0.6,
        lLegLower: 0.2,
        fistContact: "right",
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 5. High Head Kick / Roundhouse: Torso leans back, leg extends horizontally high (Reference A Frame 7, Reference B Row 1 #4 / Row 2 #5)
  highKick: {
    duration: 0.34,
    loop: false,
    strikeFrame: 0.45,
    strikeType: "kick",
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: 0.0,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: 0.5,
        lArmFore: 1.3,
        rLegUpper: 0.2,
        rLegLower: 0.3,
        lLegUpper: -0.3,
        lLegLower: 0.2,
      },
      // Chambering knee
      {
        t: 0.2,
        torsoAngle: -0.3,
        hipY: -66,
        headAngle: 0.2,
        rArmUpper: -0.4,
        rArmFore: 1.0,
        lArmUpper: 0.8,
        lArmFore: 1.4,
        rLegUpper: 1.2,
        rLegLower: 1.8, // Knee bent high
        lLegUpper: -0.2,
        lLegLower: 0.3,
      },
      // Full horizontal high kick impact to head
      {
        t: 0.45,
        torsoAngle: -0.75, // Torso counter-balances backward
        hipY: -68,
        headAngle: 0.5,
        rArmUpper: -0.9,
        rArmFore: 0.4,
        lArmUpper: 1.1,
        lArmFore: 0.8,
        rLegUpper: 2.15, // Leg horizontal high
        rLegLower: 0.05, // Knee locked straight
        lLegUpper: -0.2,
        lLegLower: 0.35,
        footContact: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 6. Ground Leg Sweep: Crouched low, hand planted on floor, sweeping opponent's feet (Reference A Frame 11-12, Reference B Row 2 #6)
  lowSweep: {
    duration: 0.38,
    loop: false,
    strikeFrame: 0.4,
    strikeType: "sweep",
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.2,
        hipY: -55,
        headAngle: -0.1,
        rArmUpper: 0.8,
        rArmFore: 1.2,
        lArmUpper: 0.4,
        lArmFore: 1.4,
        rLegUpper: 0.6,
        rLegLower: 0.8,
        lLegUpper: -0.4,
        lLegLower: 0.6,
      },
      // Low sweep: Body drops near floor, right leg sweeps along ground
      {
        t: 0.4,
        torsoAngle: 0.7,
        hipY: -32, // Very low to floor
        headAngle: -0.3,
        rArmUpper: -0.8,
        rArmFore: 0.2, // Left hand bracing on floor
        lArmUpper: 1.4,
        lArmFore: 0.6,
        rLegUpper: 1.6, // Sweeping forward along floor
        rLegLower: 0.1,
        lLegUpper: -1.1, // Supporting crouching leg
        lLegLower: 1.4,
        footContact: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 7. Flying Knee Strike: Airborne leap with knee driving forward (Reference B Row 2 #7)
  flyingKnee: {
    duration: 0.42,
    loop: false,
    strikeFrame: 0.45,
    strikeType: "knee",
    frames: [
      // Crouch crouch before leap
      {
        t: 0.0,
        torsoAngle: 0.4,
        hipY: -48,
        headAngle: -0.2,
        rArmUpper: -0.6,
        rArmFore: 1.2,
        lArmUpper: -0.6,
        lArmFore: 1.2,
        rLegUpper: 0.8,
        rLegLower: 1.0,
        lLegUpper: 0.8,
        lLegLower: 1.0,
      },
      // Apex leap: flying knee forward in the air
      {
        t: 0.45,
        torsoAngle: -0.3,
        hipY: -92, // Airborne
        headAngle: 0.15,
        rArmUpper: -1.2,
        rArmFore: 0.3,
        lArmUpper: 1.1,
        lArmFore: 1.2,
        rLegUpper: 1.85, // Knee driving into enemy chest
        rLegLower: 1.9,
        lLegUpper: -0.7,
        lLegLower: 0.4,
        kneeContact: true,
      },
      // Landing
      {
        t: 1.0,
        torsoAngle: 0.15,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 8. Flying Dropkick: Horizontal mid-air double-foot dropkick (Reference A Frame 10, Reference B Row 3 #10)
  dropkick: {
    duration: 0.5,
    loop: false,
    strikeFrame: 0.45,
    strikeType: "kick",
    frames: [
      // Take-off
      {
        t: 0.0,
        torsoAngle: 0.3,
        hipY: -55,
        headAngle: -0.1,
        rArmUpper: 0.5,
        rArmFore: 1.0,
        lArmUpper: 0.5,
        lArmFore: 1.0,
        rLegUpper: 0.6,
        rLegLower: 0.7,
        lLegUpper: -0.4,
        lLegLower: 0.5,
      },
      // Fully horizontal in air, both legs extended into enemy chest!
      {
        t: 0.45,
        torsoAngle: -1.45, // Torso horizontal in air
        hipY: -85,
        headAngle: 0.7,
        rArmUpper: -1.5,
        rArmFore: 0.2,
        lArmUpper: -1.5,
        lArmFore: 0.2,
        rLegUpper: 1.5,
        rLegLower: 0.05, // Both legs locked straight forward
        lLegUpper: 1.5,
        lLegLower: 0.05,
        footContact: true,
      },
      // Tumble land & recover
      {
        t: 0.8,
        torsoAngle: -0.4,
        hipY: -42,
        headAngle: 0.1,
        rArmUpper: -0.5,
        rArmFore: 0.5,
        lArmUpper: -0.5,
        lArmFore: 0.5,
        rLegUpper: 0.5,
        rLegLower: 0.9,
        lLegUpper: -0.2,
        lLegLower: 0.8,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 9. Special Ki Blast / Double-Palm Energy Beam (Reference A Frame 14-15 & 34-35)
  kiBlast: {
    duration: 0.65,
    loop: false,
    strikeFrame: 0.35,
    strikeType: "energy",
    frames: [
      // Deep charge stance, hands drawn to waist
      {
        t: 0.0,
        torsoAngle: -0.25,
        hipY: -58,
        headAngle: 0.15,
        rArmUpper: -0.9,
        rArmFore: 1.6, // Palms pulled to hip
        lArmUpper: -0.9,
        lArmFore: 1.6,
        rLegUpper: -0.5,
        rLegLower: 0.6,
        lLegUpper: 0.6,
        lLegLower: 0.5,
      },
      // Double palm thrust forward, releasing massive energy beam!
      {
        t: 0.35,
        torsoAngle: 0.4,
        hipY: -56,
        headAngle: -0.15,
        rArmUpper: 1.55,
        rArmFore: 0.05, // Both palms thrust forward
        lArmUpper: 1.55,
        lArmFore: 0.05,
        rLegUpper: 0.7,
        rLegLower: 0.4,
        lLegUpper: -0.7,
        lLegLower: 0.3,
        energyBeam: true,
      },
      // Sustained beam hold
      {
        t: 0.65,
        torsoAngle: 0.35,
        hipY: -58,
        headAngle: -0.1,
        rArmUpper: 1.5,
        rArmFore: 0.1,
        lArmUpper: 1.5,
        lArmFore: 0.1,
        rLegUpper: 0.6,
        rLegLower: 0.4,
        lLegUpper: -0.6,
        lLegLower: 0.3,
        energyBeam: true,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 10. High Guard / Block (Reference A Frame 6 Defender)
  block: {
    duration: 0.35,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.15,
        hipY: -58,
        headAngle: 0.1,
        rArmUpper: 0.4,
        rArmFore: 1.7, // Forearms crossed guarding face
        lArmUpper: 0.5,
        lArmFore: 1.7,
        rLegUpper: -0.4,
        rLegLower: 0.5,
        lLegUpper: 0.5,
        lLegLower: 0.4,
      },
      {
        t: 1.0,
        torsoAngle: -0.15,
        hipY: -58,
        headAngle: 0.1,
        rArmUpper: 0.4,
        rArmFore: 1.7,
        lArmUpper: 0.5,
        lArmFore: 1.7,
        rLegUpper: -0.4,
        rLegLower: 0.5,
        lLegUpper: 0.5,
        lLegLower: 0.4,
      },
    ],
  },

  // 11. Head Snap Reaction (Reference B Row 1 #3)
  hitHead: {
    duration: 0.28,
    loop: false,
    frames: [
      // Sudden backward snap
      {
        t: 0.0,
        torsoAngle: -0.65,
        hipY: -62,
        headAngle: 0.75, // Head thrown back
        rArmUpper: -0.9,
        rArmFore: 0.4,
        lArmUpper: -0.9,
        lArmFore: 0.4,
        rLegUpper: -0.6,
        rLegLower: 0.3,
        lLegUpper: 0.5,
        lLegLower: 0.3,
      },
      {
        t: 0.5,
        torsoAngle: -0.35,
        hipY: -63,
        headAngle: 0.3,
        rArmUpper: -0.4,
        rArmFore: 0.8,
        lArmUpper: -0.4,
        lArmFore: 0.8,
        rLegUpper: -0.4,
        rLegLower: 0.2,
        lLegUpper: 0.3,
        lLegLower: 0.2,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 12. Stomach Gut Hit Reaction (Reference B Row 3 #11)
  hitStomach: {
    duration: 0.3,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: 0.7, // Hunched forward in pain
        hipY: -54,
        headAngle: -0.5,
        rArmUpper: 0.2,
        rArmFore: 1.2,
        lArmUpper: 0.2,
        lArmFore: 1.2,
        rLegUpper: 0.7,
        rLegLower: 0.7,
        lLegUpper: -0.5,
        lLegLower: 0.5,
      },
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 13. Airborne Knockback & Tumble (Reference A Frame 8, 12, 13)
  knockback: {
    duration: 0.6,
    loop: false,
    frames: [
      // Lifted off ground backward
      {
        t: 0.0,
        torsoAngle: -1.1,
        hipY: -80,
        headAngle: 0.6,
        rArmUpper: -1.3,
        rArmFore: 0.2,
        lArmUpper: -1.3,
        lArmFore: 0.2,
        rLegUpper: -0.8,
        rLegLower: 0.6,
        lLegUpper: 0.2,
        lLegLower: 0.8,
      },
      // In mid-air tumble
      {
        t: 0.5,
        torsoAngle: -1.8,
        hipY: -95, // High airborne
        headAngle: 0.4,
        rArmUpper: -1.6,
        rArmFore: 0.0,
        lArmUpper: -1.6,
        lArmFore: 0.0,
        rLegUpper: -1.2,
        rLegLower: 0.4,
        lLegUpper: -0.6,
        lLegLower: 0.5,
      },
      // Ground impact slide
      {
        t: 1.0,
        torsoAngle: -1.55, // Flat on back
        hipY: -14,
        headAngle: 0.0,
        rArmUpper: -1.5,
        rArmFore: 0.0,
        lArmUpper: -1.5,
        lArmFore: 0.0,
        rLegUpper: -1.5,
        rLegLower: 0.0,
        lLegUpper: -1.5,
        lLegLower: 0.0,
      },
    ],
  },

  // 14. Rise / Get Up from Ground (Reference A Frame 39-40, 50)
  getUp: {
    duration: 0.55,
    loop: false,
    frames: [
      // Pushing up on one knee
      {
        t: 0.0,
        torsoAngle: -0.6,
        hipY: -28,
        headAngle: -0.2,
        rArmUpper: 0.3,
        rArmFore: 0.6, // Arm pushing on floor
        lArmUpper: 0.8,
        lArmFore: 1.2,
        rLegUpper: 0.7,
        rLegLower: 1.4, // Knee on floor
        lLegUpper: -0.8,
        lLegLower: 0.9,
      },
      // Standing up
      {
        t: 0.6,
        torsoAngle: 0.3,
        hipY: -54,
        headAngle: -0.1,
        rArmUpper: 0.6,
        rArmFore: 1.3,
        lArmUpper: 0.4,
        lArmFore: 1.5,
        rLegUpper: 0.4,
        rLegLower: 0.4,
        lLegUpper: -0.4,
        lLegLower: 0.3,
      },
      // Returning to ready guard
      {
        t: 1.0,
        torsoAngle: 0.1,
        hipY: -64,
        headAngle: -0.05,
        rArmUpper: 0.9,
        rArmFore: 1.4,
        lArmUpper: 0.4,
        lArmFore: 1.6,
        rLegUpper: 0.3,
        rLegLower: 0.25,
        lLegUpper: -0.35,
        lLegLower: 0.3,
      },
    ],
  },

  // 15. Defeat Sprawl (Reference A Frame 51, 53)
  defeat: {
    duration: 0.8,
    loop: false,
    frames: [
      {
        t: 0.0,
        torsoAngle: -1.0,
        hipY: -45,
        headAngle: 0.5,
        rArmUpper: -1.2,
        rArmFore: 0.2,
        lArmUpper: -1.2,
        lArmFore: 0.2,
        rLegUpper: -0.8,
        rLegLower: 0.5,
        lLegUpper: 0.3,
        lLegLower: 0.6,
      },
      {
        t: 1.0,
        torsoAngle: -1.57, // Lifeless on floor
        hipY: -12,
        headAngle: 0.0,
        rArmUpper: -1.5,
        rArmFore: 0.0,
        lArmUpper: -1.5,
        lArmFore: 0.0,
        rLegUpper: -1.5,
        rLegLower: 0.0,
        lLegUpper: -1.5,
        lLegLower: 0.0,
      },
    ],
  },

  // 16. Victory Stance (Reference A Frame 54)
  victory: {
    duration: 1.0,
    loop: true,
    frames: [
      {
        t: 0.0,
        torsoAngle: -0.05, // Upright, proud chest
        hipY: -68,
        headAngle: 0.05,
        rArmUpper: 0.2,
        rArmFore: 1.8, // Arms crossed over chest
        lArmUpper: -0.2,
        lArmFore: 1.8,
        rLegUpper: 0.2,
        rLegLower: 0.05,
        lLegUpper: -0.2,
        lLegLower: 0.05,
      },
      {
        t: 1.0,
        torsoAngle: -0.05,
        hipY: -68,
        headAngle: 0.05,
        rArmUpper: 0.2,
        rArmFore: 1.8,
        lArmUpper: -0.2,
        lArmFore: 1.8,
        rLegUpper: 0.2,
        rLegLower: 0.05,
        lLegUpper: -0.2,
        lLegLower: 0.05,
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
    if (!MARTIAL_POSES[animName]) {
      animName = "idle";
    }
    // Don't re-trigger same looping animation
    if (this.currentAnim === animName && MARTIAL_POSES[animName].loop) {
      return;
    }
    this.currentAnim = animName;
    this.animTime = 0.0;
    this.playbackSpeed = speed;
    this.onComplete = onComplete;
  }

  update(dt) {
    const anim = MARTIAL_POSES[this.currentAnim] || MARTIAL_POSES.idle;
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
          // If not defeat or knockback, return to idle
          if (this.currentAnim !== "defeat" && this.currentAnim !== "knockback") {
            this.currentAnim = "idle";
            this.animTime = 0.0;
          }
        }
      }
    }
  }

  getCurrentPose() {
    const anim = MARTIAL_POSES[this.currentAnim] || MARTIAL_POSES.idle;
    const normT = Math.min(1.0, this.animTime / Math.max(0.001, anim.duration));
    const frames = anim.frames;

    if (frames.length === 1) return frames[0];

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
    const ease = alpha * alpha * (3 - 2 * alpha); // Smooth cubic ease
    const lerp = (a, b) => (a || 0) + ((b || 0) - (a || 0)) * ease;

    return {
      torsoAngle: lerp(f1.torsoAngle, f2.torsoAngle),
      hipY: lerp(f1.hipY, f2.hipY),
      headAngle: lerp(f1.headAngle, f2.headAngle),
      rArmUpper: lerp(f1.rArmUpper, f2.rArmUpper),
      rArmFore: lerp(f1.rArmFore, f2.rArmFore),
      lArmUpper: lerp(f1.lArmUpper, f2.lArmUpper),
      lArmFore: lerp(f1.lArmFore, f2.lArmFore),
      rLegUpper: lerp(f1.rLegUpper, f2.rLegUpper),
      rLegLower: lerp(f1.rLegLower, f2.rLegLower),
      lLegUpper: lerp(f1.lLegUpper, f2.lLegUpper),
      lLegLower: lerp(f1.lLegLower, f2.lLegLower),
      fistContact: f1.fistContact || f2.fistContact,
      footContact: !!(f1.footContact || f2.footContact),
      kneeContact: !!(f1.kneeContact || f2.kneeContact),
      energyBeam: !!(f1.energyBeam || f2.energyBeam),
      animName: this.currentAnim,
    };
  }
}
