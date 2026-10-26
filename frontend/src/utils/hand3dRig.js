import * as THREE from 'three';
import { KEY_FINGER_MAP, KEY_COORDS } from './touchTypingMap.js';

/**
 * Procedural Anatomical 3D Skinned Hand Rig Engine for KEYFLOW.
 * 
 * Implements genuine skeletal hierarchy and joint articulation for Left and Right hands (32 bones).
 * Controls natural touch-typing downstroke, key travel, and damped recovery for every keystroke.
 */

export const BONE_NAMES = [
  // Left Hand (16 bones)
  'wrist_L',
  'palm_L',
  'thumb_proximal_L',
  'thumb_distal_L',
  'index_proximal_L',
  'index_intermediate_L',
  'index_distal_L',
  'middle_proximal_L',
  'middle_intermediate_L',
  'middle_distal_L',
  'ring_proximal_L',
  'ring_intermediate_L',
  'ring_distal_L',
  'pinky_proximal_L',
  'pinky_intermediate_L',
  'pinky_distal_L',

  // Right Hand (16 bones)
  'wrist_R',
  'palm_R',
  'thumb_proximal_R',
  'thumb_distal_R',
  'index_proximal_R',
  'index_intermediate_R',
  'index_distal_R',
  'middle_proximal_R',
  'middle_intermediate_R',
  'middle_distal_R',
  'ring_proximal_R',
  'ring_intermediate_R',
  'ring_distal_R',
  'pinky_proximal_R',
  'pinky_intermediate_R',
  'pinky_distal_R',
];

export const FINGER_BONE_MAP = {
  'left-pinky': ['pinky_proximal_L', 'pinky_intermediate_L', 'pinky_distal_L'],
  'left-ring': ['ring_proximal_L', 'ring_intermediate_L', 'ring_distal_L'],
  'left-middle': ['middle_proximal_L', 'middle_intermediate_L', 'middle_distal_L'],
  'left-index': ['index_proximal_L', 'index_intermediate_L', 'index_distal_L'],
  'left-thumb': ['thumb_proximal_L', 'thumb_distal_L'],
  'right-thumb': ['thumb_proximal_R', 'thumb_distal_R'],
  'thumb': ['thumb_proximal_R', 'thumb_distal_R'],
  'right-index': ['index_proximal_R', 'index_intermediate_R', 'index_distal_R'],
  'right-middle': ['middle_proximal_R', 'middle_intermediate_R', 'middle_distal_R'],
  'right-ring': ['ring_proximal_R', 'ring_intermediate_R', 'ring_distal_R'],
  'right-pinky': ['pinky_proximal_R', 'pinky_intermediate_R', 'pinky_distal_R'],
};

// Anatomical landmark coordinates in 900x350 keyboard coordinate system
// (Centered: X = x - 450, Y = 175 - y)
const to3D = (x, y, z = 0) => new THREE.Vector3(x - 450, 175 - y, z);

export const HAND_LANDMARKS = {
  left: {
    wrist: to3D(220, 360, 5),
    palm: to3D(240, 260, 10),
    thumb: {
      base: to3D(330, 310, 8),
      mid: to3D(355, 285, 12),
      tip: to3D(379, 263, 6),
    },
    index: {
      mcp: to3D(316, 194, 12),
      pip: to3D(316, 162, 16),
      dip: to3D(317, 144, 12),
      tip: to3D(317, 130, 4),
    },
    middle: {
      mcp: to3D(260, 190, 14),
      pip: to3D(257, 151, 18),
      dip: to3D(255, 130, 13),
      tip: to3D(254, 112, 4),
    },
    ring: {
      mcp: to3D(206, 196, 13),
      pip: to3D(209, 163, 17),
      dip: to3D(211, 146, 12),
      tip: to3D(212, 131, 4),
    },
    pinky: {
      mcp: to3D(150, 212, 10),
      pip: to3D(151, 186, 14),
      dip: to3D(152, 172, 10),
      tip: to3D(153, 161, 4),
    },
  },
  right: {
    wrist: to3D(590, 360, 5),
    palm: to3D(570, 260, 10),
    thumb: {
      base: to3D(480, 310, 8),
      mid: to3D(468, 288, 12),
      tip: to3D(456, 267, 6),
    },
    index: {
      mcp: to3D(492, 194, 12),
      pip: to3D(490, 168, 16),
      dip: to3D(489, 154, 12),
      tip: to3D(488, 142, 4),
    },
    middle: {
      mcp: to3D(548, 188, 14),
      pip: to3D(546, 153, 18),
      dip: to3D(544, 134, 13),
      tip: to3D(543, 118, 4),
    },
    ring: {
      mcp: to3D(610, 192, 13),
      pip: to3D(608, 158, 17),
      dip: to3D(607, 140, 12),
      tip: to3D(606, 124, 4),
    },
    pinky: {
      mcp: to3D(675, 204, 10),
      pip: to3D(677, 173, 14),
      dip: to3D(679, 156, 10),
      tip: to3D(680, 142, 4),
    },
  },
};

/**
 * Creates the complete rigged 3D SkinnedMesh with 32-bone skeletal hierarchy.
 */
export function createHandRigMesh(texture = null) {
  const bones = [];
  const boneMap = {};

  function addBone(name, pos, parent = null) {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.copy(pos);
    if (parent) {
      parent.add(bone);
    }
    bones.push(bone);
    boneMap[name] = bone;
    return bone;
  }

  // Left Hand Rig
  const wrist_L = addBone('wrist_L', HAND_LANDMARKS.left.wrist);
  const palm_L = addBone('palm_L', HAND_LANDMARKS.left.palm.clone().sub(HAND_LANDMARKS.left.wrist), wrist_L);

  const thumb_prox_L = addBone('thumb_proximal_L', HAND_LANDMARKS.left.thumb.base.clone().sub(HAND_LANDMARKS.left.palm), palm_L);
  addBone('thumb_distal_L', HAND_LANDMARKS.left.thumb.tip.clone().sub(HAND_LANDMARKS.left.thumb.base), thumb_prox_L);

  const idx_prox_L = addBone('index_proximal_L', HAND_LANDMARKS.left.index.mcp.clone().sub(HAND_LANDMARKS.left.palm), palm_L);
  const idx_int_L = addBone('index_intermediate_L', HAND_LANDMARKS.left.index.pip.clone().sub(HAND_LANDMARKS.left.index.mcp), idx_prox_L);
  addBone('index_distal_L', HAND_LANDMARKS.left.index.dip.clone().sub(HAND_LANDMARKS.left.index.pip), idx_int_L);

  const mid_prox_L = addBone('middle_proximal_L', HAND_LANDMARKS.left.middle.mcp.clone().sub(HAND_LANDMARKS.left.palm), palm_L);
  const mid_int_L = addBone('middle_intermediate_L', HAND_LANDMARKS.left.middle.pip.clone().sub(HAND_LANDMARKS.left.middle.mcp), mid_prox_L);
  addBone('middle_distal_L', HAND_LANDMARKS.left.middle.dip.clone().sub(HAND_LANDMARKS.left.middle.pip), mid_int_L);

  const ring_prox_L = addBone('ring_proximal_L', HAND_LANDMARKS.left.ring.mcp.clone().sub(HAND_LANDMARKS.left.palm), palm_L);
  const ring_int_L = addBone('ring_intermediate_L', HAND_LANDMARKS.left.ring.pip.clone().sub(HAND_LANDMARKS.left.ring.mcp), ring_prox_L);
  addBone('ring_distal_L', HAND_LANDMARKS.left.ring.dip.clone().sub(HAND_LANDMARKS.left.ring.pip), ring_int_L);

  const pinky_prox_L = addBone('pinky_proximal_L', HAND_LANDMARKS.left.pinky.mcp.clone().sub(HAND_LANDMARKS.left.palm), palm_L);
  const pinky_int_L = addBone('pinky_intermediate_L', HAND_LANDMARKS.left.pinky.pip.clone().sub(HAND_LANDMARKS.left.pinky.mcp), pinky_prox_L);
  addBone('pinky_distal_L', HAND_LANDMARKS.left.pinky.dip.clone().sub(HAND_LANDMARKS.left.pinky.pip), pinky_int_L);

  // Right Hand Rig
  const wrist_R = addBone('wrist_R', HAND_LANDMARKS.right.wrist);
  const palm_R = addBone('palm_R', HAND_LANDMARKS.right.palm.clone().sub(HAND_LANDMARKS.right.wrist), wrist_R);

  const thumb_prox_R = addBone('thumb_proximal_R', HAND_LANDMARKS.right.thumb.base.clone().sub(HAND_LANDMARKS.right.palm), palm_R);
  addBone('thumb_distal_R', HAND_LANDMARKS.right.thumb.tip.clone().sub(HAND_LANDMARKS.right.thumb.base), thumb_prox_R);

  const idx_prox_R = addBone('index_proximal_R', HAND_LANDMARKS.right.index.mcp.clone().sub(HAND_LANDMARKS.right.palm), palm_R);
  const idx_int_R = addBone('index_intermediate_R', HAND_LANDMARKS.right.index.pip.clone().sub(HAND_LANDMARKS.right.index.mcp), idx_prox_R);
  addBone('index_distal_R', HAND_LANDMARKS.right.index.dip.clone().sub(HAND_LANDMARKS.right.index.pip), idx_int_R);

  const mid_prox_R = addBone('middle_proximal_R', HAND_LANDMARKS.right.middle.mcp.clone().sub(HAND_LANDMARKS.right.palm), palm_R);
  const mid_int_R = addBone('middle_intermediate_R', HAND_LANDMARKS.right.middle.pip.clone().sub(HAND_LANDMARKS.right.middle.mcp), mid_prox_R);
  addBone('middle_distal_R', HAND_LANDMARKS.right.middle.dip.clone().sub(HAND_LANDMARKS.right.middle.pip), mid_int_R);

  const ring_prox_R = addBone('ring_proximal_R', HAND_LANDMARKS.right.ring.mcp.clone().sub(HAND_LANDMARKS.right.palm), palm_R);
  const ring_int_R = addBone('ring_intermediate_R', HAND_LANDMARKS.right.ring.pip.clone().sub(HAND_LANDMARKS.right.ring.mcp), ring_prox_R);
  addBone('ring_distal_R', HAND_LANDMARKS.right.ring.dip.clone().sub(HAND_LANDMARKS.right.ring.pip), ring_int_R);

  const pinky_prox_R = addBone('pinky_proximal_R', HAND_LANDMARKS.right.pinky.mcp.clone().sub(HAND_LANDMARKS.right.palm), palm_R);
  const pinky_int_R = addBone('pinky_intermediate_R', HAND_LANDMARKS.right.pinky.pip.clone().sub(HAND_LANDMARKS.right.pinky.mcp), pinky_prox_R);
  addBone('pinky_distal_R', HAND_LANDMARKS.right.pinky.dip.clone().sub(HAND_LANDMARKS.right.pinky.pip), pinky_int_R);

  // Mesh geometry
  const meshWidth = 750;
  const meshHeight = 364;
  const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 80, 48);
  geometry.translate(-11, -103, 0);

  // Skinning indices & weights
  const position = geometry.attributes.position;
  const skinIndices = [];
  const skinWeights = [];

  const boneWorldPos = {};
  wrist_L.updateWorldMatrix(true, true);
  wrist_R.updateWorldMatrix(true, true);
  bones.forEach((b, idx) => {
    const wp = new THREE.Vector3();
    b.getWorldPosition(wp);
    boneWorldPos[b.name] = { idx, pos: wp };
  });

  for (let i = 0; i < position.count; i++) {
    const vx = position.getX(i);
    const vy = position.getY(i);
    const vPos = new THREE.Vector3(vx, vy, 0);

    const isLeft = vx < 0;
    const prefix = isLeft ? '_L' : '_R';

    const dists = [];
    bones.forEach((b) => {
      if (b.name.endsWith(prefix)) {
        const d = vPos.distanceTo(boneWorldPos[b.name].pos);
        dists.push({ name: b.name, idx: boneWorldPos[b.name].idx, dist: d });
      }
    });

    dists.sort((a, b) => a.dist - b.dist);

    const b0 = dists[0];
    const b1 = dists[1] || b0;
    const b2 = dists[2] || b0;
    const b3 = dists[3] || b0;

    const w0 = 1 / Math.pow(Math.max(b0.dist, 4), 2.5);
    const w1 = 1 / Math.pow(Math.max(b1.dist, 4), 2.5);
    const w2 = 1 / Math.pow(Math.max(b2.dist, 4), 2.5);
    const w3 = 1 / Math.pow(Math.max(b3.dist, 4), 2.5);
    const totalW = w0 + w1 + w2 + w3;

    skinIndices.push(b0.idx, b1.idx, b2.idx, b3.idx);
    skinWeights.push(w0 / totalW, w1 / totalW, w2 / totalW, w3 / totalW);
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  // High-fidelity skin material
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skeleton = new THREE.Skeleton(bones);
  const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
  skinnedMesh.name = 'KeyflowHandsSkinnedMesh';
  skinnedMesh.add(wrist_L);
  skinnedMesh.add(wrist_R);
  skinnedMesh.bind(skeleton);

  return { skinnedMesh, skeleton, bones, boneMap };
}

/**
 * Interactive Touch-Typing Kinematic Animation Controller.
 * 
 * Drives natural MCP/PIP/DIP joint rotations, key reach, and damped harmonic return
 * whenever the user types any supported key.
 */
export function createHandAnimationController(boneMap) {
  // Map of active finger animations
  // key: fingerName -> { startTime, duration, targetRowOffset, restPositions }
  const activeAnimations = new Map();

  // Cache initial resting local positions and rotations
  const restTransforms = {};
  BONE_NAMES.forEach((name) => {
    const bone = boneMap[name];
    if (bone) {
      restTransforms[name] = {
        pos: bone.position.clone(),
        rot: bone.rotation.clone(),
      };
    }
  });

  function triggerKeystroke(char, options = {}) {
    if (!char) return;
    const key = char === ' ' ? ' ' : char;
    const mapping = KEY_FINGER_MAP[key] || KEY_FINGER_MAP[key.toLowerCase()];
    if (!mapping) return;

    let finger = mapping.finger;
    if (finger === 'thumb') {
      finger = options.spaceThumb || 'right-thumb'; // Default touch-typing thumb, configurable
    }

    const boneNames = FINGER_BONE_MAP[finger];
    if (!boneNames) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Determine row offset for natural reaching (Row 0: +24, Row 1: +12, Row 2: 0, Row 3: -12)
    const keyCoord = KEY_COORDS[key.toLowerCase()] || KEY_COORDS[key];
    let rowOffset = 0;
    if (keyCoord) {
      // Row 2 is home row (cy = 145)
      const diffY = 145 - keyCoord.cy;
      rowOffset = diffY * 0.28; // Subtle natural reach in Y
    }

    // Register active animation
    activeAnimations.set(finger, {
      startTime: performance.now(),
      duration: prefersReducedMotion ? 90 : 135, // ~135ms total stroke (peak downstroke at 40ms, smooth recovery)
      motionScale: prefersReducedMotion ? 0.35 : 1.0,
      rowOffset,
      bones: boneNames.map((name) => boneMap[name]).filter(Boolean),
    });
  }

  function update(now = performance.now()) {
    if (activeAnimations.size === 0) return false;

    let hasActive = false;

    for (const [finger, anim] of activeAnimations.entries()) {
      const elapsed = now - anim.startTime;
      const progress = elapsed / anim.duration;

      if (progress >= 1.0) {
        // Restore exact resting transforms
        anim.bones.forEach((bone) => {
          const rest = restTransforms[bone.name];
          if (rest) {
            bone.position.copy(rest.pos);
            bone.rotation.copy(rest.rot);
          }
        });
        activeAnimations.delete(finger);
        continue;
      }

      hasActive = true;

      // Kinematic finger stroke curve:
      // 0.0 to 0.32: rapid downstroke (ease-in-quad)
      // 0.32 to 1.0: smooth spring-damped return (cosine curve)
      let strike;
      if (progress < 0.32) {
        const p = progress / 0.32;
        strike = p * p;
      } else {
        const p = (progress - 0.32) / 0.68;
        strike = Math.cos(p * Math.PI * 0.5);
      }

      const motionScale = anim.motionScale || 1.0;
      strike = strike * motionScale;

      // Apply biological finger joint rotations:
      // Proximal (MCP): ~0.20 rad (downward flex)
      // Intermediate (PIP): ~0.16 rad (inward bend)
      // Distal (DIP): ~0.10 rad (fingertip key strike)
      const isThumb = finger.includes('thumb');
      const mcpMax = isThumb ? 0.16 : 0.22;
      const pipMax = isThumb ? 0.12 : 0.18;
      const dipMax = 0.12;

      anim.bones.forEach((bone, idx) => {
        const rest = restTransforms[bone.name];
        if (!rest) return;

        if (idx === 0) {
          // Proximal bone (MCP)
          bone.rotation.x = rest.rot.x - strike * mcpMax;
          bone.position.y = rest.pos.y + strike * anim.rowOffset;
          bone.position.z = rest.pos.z - strike * 8.0; // Keycap depression depth
        } else if (idx === 1) {
          // Intermediate bone (PIP)
          bone.rotation.x = rest.rot.x - strike * pipMax;
        } else if (idx === 2) {
          // Distal bone (DIP)
          bone.rotation.x = rest.rot.x - strike * dipMax;
        }
      });
    }

    return hasActive;
  }

  function resetAll() {
    activeAnimations.clear();
    BONE_NAMES.forEach((name) => {
      const bone = boneMap[name];
      const rest = restTransforms[name];
      if (bone && rest) {
        bone.position.copy(rest.pos);
        bone.rotation.copy(rest.rot);
      }
    });
  }

  return {
    triggerKeystroke,
    update,
    resetAll,
    getActiveCount: () => activeAnimations.size,
  };
}
