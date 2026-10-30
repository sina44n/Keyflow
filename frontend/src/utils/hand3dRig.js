import * as THREE from 'three';
import { resolveKeyToFinger } from './touchTypingMap.js';

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
    palm: to3D(240, 275, 10),
    thumb: {
      base: to3D(330, 310, 8),
      mid: to3D(355, 280, 12),
      tip: to3D(380, 255, 6),
    },
    index: {
      mcp: to3D(316, 230, 12),
      pip: to3D(318, 202, 16),
      dip: to3D(320, 180, 12),
      tip: to3D(321, 161, 4),
    },
    middle: {
      mcp: to3D(266, 225, 14),
      pip: to3D(268, 198, 18),
      dip: to3D(270, 175, 13),
      tip: to3D(272, 155, 4),
    },
    ring: {
      mcp: to3D(210, 222, 13),
      pip: to3D(214, 195, 17),
      dip: to3D(218, 175, 12),
      tip: to3D(221, 157, 4),
    },
    pinky: {
      mcp: to3D(154, 218, 10),
      pip: to3D(150, 192, 14),
      dip: to3D(148, 168, 10),
      tip: to3D(147, 146, 4),
    },
  },
  right: {
    wrist: to3D(590, 360, 5),
    palm: to3D(570, 275, 10),
    thumb: {
      base: to3D(490, 310, 8),
      mid: to3D(475, 280, 12),
      tip: to3D(460, 255, 6),
    },
    index: {
      mcp: to3D(498, 222, 12),
      pip: to3D(496, 195, 16),
      dip: to3D(494, 170, 12),
      tip: to3D(492, 145, 4),
    },
    middle: {
      mcp: to3D(552, 220, 14),
      pip: to3D(550, 192, 18),
      dip: to3D(548, 165, 13),
      tip: to3D(546, 140, 4),
    },
    ring: {
      mcp: to3D(606, 222, 13),
      pip: to3D(604, 194, 17),
      dip: to3D(602, 168, 12),
      tip: to3D(600, 142, 4),
    },
    pinky: {
      mcp: to3D(658, 215, 10),
      pip: to3D(662, 188, 14),
      dip: to3D(664, 162, 10),
      tip: to3D(665, 137, 4),
    },
  },
};

/**
 * Helper: Distance from a 2D point to a line segment [a, b].
 */
function distToSegment(p, a, b) {
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const apX = p.x - a.x;
  const apY = p.y - a.y;
  const abLenSq = abX * abX + abY * abY;
  if (abLenSq === 0) return Math.hypot(apX, apY);
  let t = (apX * abX + apY * abY) / abLenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * abX;
  const projY = a.y + t * abY;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Helper: Minimum distance from a point to a finger centerline chain.
 */
function fingerDist(p, fingerChain) {
  let minDist = Infinity;
  for (let i = 0; i < fingerChain.length - 1; i++) {
    const d = distToSegment(p, fingerChain[i], fingerChain[i + 1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Computes strictly isolated linear-blend skinning weights.
 * 
 * Enforces anatomical one-finger isolation:
 * - Every vertex on any finger is influenced strictly by its own finger's bones + palm.
 * - Under no circumstances does a finger vertex receive weight from an adjacent finger.
 * - This eliminates cross-finger deformation where two or more fingers move together or appear stuck.
 */
export function computeIsolatedSkinWeights(geometry, bones, landmarks) {
  const position = geometry.attributes.position;
  const skinIndices = [];
  const skinWeights = [];

  const boneWorldPos = {};
  bones.forEach((b, idx) => {
    const wp = new THREE.Vector3();
    b.getWorldPosition(wp);
    boneWorldPos[b.name] = { idx, pos: wp };
  });

  const L = landmarks.left;
  const R = landmarks.right;

  const leftChains = {
    'left-pinky': [L.pinky.mcp, L.pinky.pip, L.pinky.dip, L.pinky.tip],
    'left-ring': [L.ring.mcp, L.ring.pip, L.ring.dip, L.ring.tip],
    'left-middle': [L.middle.mcp, L.middle.pip, L.middle.dip, L.middle.tip],
    'left-index': [L.index.mcp, L.index.pip, L.index.dip, L.index.tip],
    'left-thumb': [L.thumb.base, L.thumb.mid, L.thumb.tip],
  };

  const rightChains = {
    'right-thumb': [R.thumb.base, R.thumb.mid, R.thumb.tip],
    'right-index': [R.index.mcp, R.index.pip, R.index.dip, R.index.tip],
    'right-middle': [R.middle.mcp, R.middle.pip, R.middle.dip, R.middle.tip],
    'right-ring': [R.ring.mcp, R.ring.pip, R.ring.dip, R.ring.tip],
    'right-pinky': [R.pinky.mcp, R.pinky.pip, R.pinky.dip, R.pinky.tip],
  };

  for (let i = 0; i < position.count; i++) {
    const vx = position.getX(i);
    const vy = position.getY(i);
    const vPos = { x: vx, y: vy };

    const isLeft = vx < 0;
    const prefix = isLeft ? '_L' : '_R';
    const chains = isLeft ? leftChains : rightChains;
    const palmBone = boneWorldPos['palm' + prefix];
    const wristBone = boneWorldPos['wrist' + prefix];

    // Find the single closest finger ray for this vertex
    let bestFinger = null;
    let minFDist = Infinity;
    for (const [fName, chain] of Object.entries(chains)) {
      const d = fingerDist(vPos, chain);
      if (d < minFDist) {
        minFDist = d;
        bestFinger = fName;
      }
    }

    // Candidate bones: strictly ONLY the assigned finger's bones + palm (+ wrist for lower palm)
    const fingerBoneNames = FINGER_BONE_MAP[bestFinger];
    const candidateBones = [];

    // Strictly separate palm/wrist region from finger region to prevent palm stretching
    if (vy < -65) {
      // Vertex is in the palm or wrist body - zero finger movement allowed
      const dPalm = Math.hypot(vx - palmBone.pos.x, vy - palmBone.pos.y);
      const dWrist = Math.hypot(vx - wristBone.pos.x, vy - wristBone.pos.y);
      candidateBones.push({ name: 'palm' + prefix, idx: palmBone.idx, dist: Math.max(dPalm, 2) });
      candidateBones.push({ name: 'wrist' + prefix, idx: wristBone.idx, dist: Math.max(dWrist, 2) });
    } else {
      // Vertex is on the finger or knuckle transition zone
      fingerBoneNames.forEach((bName) => {
        const bInfo = boneWorldPos[bName];
        const d = Math.hypot(vx - bInfo.pos.x, vy - bInfo.pos.y);
        candidateBones.push({ name: bName, idx: bInfo.idx, dist: Math.max(d, 2) });
      });

      // Knuckle transition zone (-65 <= vy <= -45): subtle blend into palm
      if (vy <= -45) {
        const dPalm = Math.hypot(vx - palmBone.pos.x, vy - palmBone.pos.y);
        candidateBones.push({ name: 'palm' + prefix, idx: palmBone.idx, dist: Math.max(dPalm * 1.5, 6) });
      }
    }

    // Sort candidate bones by distance and keep top 4
    candidateBones.sort((a, b) => a.dist - b.dist);
    const top4 = candidateBones.slice(0, 4);
    while (top4.length < 4) top4.push(top4[0]);

    // Compute smooth inverse-distance weights with power 2.5
    const rawWeights = top4.map((c) => 1 / Math.pow(Math.max(c.dist, 3), 2.5));
    const sumW = rawWeights.reduce((acc, w) => acc + w, 0);

    top4.forEach((c, slot) => {
      skinIndices.push(c.idx);
      skinWeights.push(rawWeights[slot] / sumW);
    });
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
}

/**
 * Applies anatomical 3D depth sculpting to mesh vertices based on clinical human hand morphology:
 * - Semi-cylindrical finger cross-sections (volumetric depth along finger rays)
 * - Volumetric knuckle elevations at MCP, PIP, and DIP joints
 * - Distal fingernail plateau with dorsal specularity
 * - Transverse carpal arch on the dorsal palm
 * - Extensor digitorum tendon relief ridges leading down to the wrist
 */
export function sculptAnatomicalHandDepth(geometry) {
  const position = geometry.attributes.position;

  const fingerDefinitions = [
    // Left Hand Fingers
    {
      name: 'left-index',
      chain: [
        { pt: { x: 316, y: 230 }, z: 12.5, r: 13.5 }, // MCP
        { pt: { x: 318, y: 202 }, z: 16.0, r: 12.5 }, // PIP
        { pt: { x: 320, y: 180 }, z: 12.0, r: 10.5 }, // DIP
        { pt: { x: 321, y: 161 }, z: 4.0,  r: 8.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'left-middle',
      chain: [
        { pt: { x: 266, y: 225 }, z: 14.0, r: 14.5 }, // MCP
        { pt: { x: 268, y: 198 }, z: 18.0, r: 13.5 }, // PIP
        { pt: { x: 270, y: 175 }, z: 13.0, r: 11.0 }, // DIP
        { pt: { x: 272, y: 155 }, z: 4.0,  r: 9.0 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'left-ring',
      chain: [
        { pt: { x: 210, y: 222 }, z: 13.0, r: 13.5 }, // MCP
        { pt: { x: 214, y: 195 }, z: 16.5, r: 12.5 }, // PIP
        { pt: { x: 218, y: 175 }, z: 12.0, r: 10.5 }, // DIP
        { pt: { x: 221, y: 157 }, z: 4.0,  r: 8.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'left-pinky',
      chain: [
        { pt: { x: 154, y: 218 }, z: 10.5, r: 11.5 }, // MCP
        { pt: { x: 150, y: 192 }, z: 14.0, r: 10.5 }, // PIP
        { pt: { x: 148, y: 168 }, z: 10.0, r: 9.0 },  // DIP
        { pt: { x: 147, y: 146 }, z: 4.0,  r: 7.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'left-thumb',
      chain: [
        { pt: { x: 330, y: 310 }, z: 8.0,  r: 14.0 }, // Base
        { pt: { x: 355, y: 280 }, z: 12.0, r: 13.0 }, // Mid
        { pt: { x: 380, y: 255 }, z: 6.0,  r: 11.0 }, // Tip
      ],
      nailSegment: 1,
    },

    // Right Hand Fingers
    {
      name: 'right-index',
      chain: [
        { pt: { x: 498, y: 222 }, z: 12.5, r: 13.5 }, // MCP
        { pt: { x: 496, y: 195 }, z: 16.0, r: 12.5 }, // PIP
        { pt: { x: 494, y: 170 }, z: 12.0, r: 10.5 }, // DIP
        { pt: { x: 492, y: 145 }, z: 4.0,  r: 8.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'right-middle',
      chain: [
        { pt: { x: 552, y: 220 }, z: 14.0, r: 14.5 }, // MCP
        { pt: { x: 550, y: 192 }, z: 18.0, r: 13.5 }, // PIP
        { pt: { x: 548, y: 165 }, z: 13.0, r: 11.0 }, // DIP
        { pt: { x: 546, y: 140 }, z: 4.0,  r: 9.0 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'right-ring',
      chain: [
        { pt: { x: 606, y: 222 }, z: 13.0, r: 13.5 }, // MCP
        { pt: { x: 604, y: 194 }, z: 16.5, r: 12.5 }, // PIP
        { pt: { x: 602, y: 168 }, z: 12.0, r: 10.5 }, // DIP
        { pt: { x: 600, y: 142 }, z: 4.0,  r: 8.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'right-pinky',
      chain: [
        { pt: { x: 658, y: 215 }, z: 10.5, r: 11.5 }, // MCP
        { pt: { x: 662, y: 188 }, z: 14.0, r: 10.5 }, // PIP
        { pt: { x: 664, y: 162 }, z: 10.0, r: 9.0 },  // DIP
        { pt: { x: 665, y: 137 }, z: 4.0,  r: 7.5 },  // Tip
      ],
      nailSegment: 2,
    },
    {
      name: 'right-thumb',
      chain: [
        { pt: { x: 490, y: 310 }, z: 8.0,  r: 14.0 }, // Base
        { pt: { x: 475, y: 280 }, z: 12.0, r: 13.0 }, // Mid
        { pt: { x: 460, y: 255 }, z: 6.0,  r: 11.0 }, // Tip
      ],
      nailSegment: 1,
    },
  ];

  const palms = [
    { x: 240, y: 275, rx: 78, ry: 65, zMax: 12.0, wristX: 220, wristY: 360 },
    { x: 570, y: 275, rx: 78, ry: 65, zMax: 12.0, wristX: 590, wristY: 360 },
  ];

  for (let i = 0; i < position.count; i++) {
    const vx = position.getX(i);
    const vy = position.getY(i);
    const svgX = vx + 450;
    const svgY = 175 - vy;

    let maxFingerZ = 0;

    for (let f = 0; f < fingerDefinitions.length; f++) {
      const def = fingerDefinitions[f];
      const chain = def.chain;

      for (let s = 0; s < chain.length - 1; s++) {
        const A = chain[s];
        const B = chain[s + 1];

        const abX = B.pt.x - A.pt.x;
        const abY = B.pt.y - A.pt.y;
        const apX = svgX - A.pt.x;
        const apY = svgY - A.pt.y;
        const lenSq = abX * abX + abY * abY;
        if (lenSq === 0) continue;

        let t = (apX * abX + apY * abY) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = A.pt.x + t * abX;
        const projY = A.pt.y + t * abY;
        const dist = Math.hypot(svgX - projX, svgY - projY);

        const r = A.r + t * (B.r - A.r);
        if (dist < r) {
          const cross = Math.sqrt(Math.max(0, 1 - (dist / r) * (dist / r)));
          const centerZ = A.z + t * (B.z - A.z);
          let localZ = centerZ * cross;

          // Fingernail plateau on distal segment
          if (s === def.nailSegment && t > 0.45 && t < 0.95 && dist < 0.65 * r) {
            const nailT = (t - 0.45) / 0.50;
            const nailArch = Math.sin(nailT * Math.PI);
            localZ += 1.5 * nailArch * (1 - dist / (0.65 * r));
          }

          if (localZ > maxFingerZ) {
            maxFingerZ = localZ;
          }
        }
      }
    }

    // Check dorsal palm arch
    let maxPalmZ = 0;
    for (let p = 0; p < palms.length; p++) {
      const palm = palms[p];
      const dx = (svgX - palm.x) / palm.rx;
      const dy = (svgY - palm.y) / palm.ry;
      const distSq = dx * dx + dy * dy;
      if (distSq < 1.0) {
        let pz = palm.zMax * Math.sqrt(1.0 - distSq);

        // Subtle extensor tendon ridges
        if (svgY < 330 && svgY > 230) {
          const tendonDist = Math.abs(dx * palm.rx) % 22;
          if (tendonDist < 5.0) {
            pz += 1.2 * (1 - tendonDist / 5.0);
          }
        }
        if (pz > maxPalmZ) maxPalmZ = pz;
      }

      // Wrist region
      if (svgY >= 330 && svgY <= 380) {
        const wDistX = Math.abs(svgX - palm.wristX);
        if (wDistX < 45) {
          const wArch = Math.sqrt(Math.max(0, 1 - (wDistX / 45) ** 2));
          const wFade = 1 - (svgY - 330) / 50;
          const wz = 6.0 * wArch * wFade;
          if (wz > maxPalmZ) maxPalmZ = wz;
        }
      }
    }

    const vz = Math.max(maxFingerZ, maxPalmZ, 0);
    position.setZ(i, vz);
  }

  position.needsUpdate = true;
}

/**
 * Creates the complete rigged 3D SkinnedMesh with 32-bone skeletal hierarchy.
 */
export function createHandRigMesh(texture = null) {
  const bones = [];
  const boneMap = {};
  const boneIndexMap = {};

  function addBone(name, pos, parent = null) {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.copy(pos);
    if (parent) {
      parent.add(bone);
    }
    const idx = bones.length;
    bones.push(bone);
    boneMap[name] = bone;
    boneIndexMap[name] = idx;
    return bone;
  }

  // Left Hand Rig (16 bones)
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

  // Right Hand Rig (16 bones)
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

  // Mesh proportions matching 750x364 bounds precisely
  const meshWidth = 750;
  const meshHeight = 364;

  // High-density continuous surface: 80x48 subdivisions for smooth skin curvature and joint deformation
  const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 80, 48);
  geometry.translate(-11, -103, 0);

  // Apply anatomical 3D depth sculpting (volumetric knuckles, curved fingers, fingernails, palm arch)
  sculptAnatomicalHandDepth(geometry);

  // Compute strictly isolated skin weights (no cross-finger deformation)
  computeIsolatedSkinWeights(geometry, bones, HAND_LANDMARKS);

  // Compute realistic 3D vertex normals for PBR skin lighting
  geometry.computeVertexNormals();

  // High-fidelity PBR skin material
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.58,
    metalness: 0.04,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    depthWrite: false,
    alphaTest: 0.01,
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

  function triggerKeystroke(charOrEvent, options = {}) {
    if (!charOrEvent) return;

    const resolved = resolveKeyToFinger(charOrEvent, options);
    if (!resolved) return;

    const { finger, reachX, reachY } = resolved;
    const boneNames = FINGER_BONE_MAP[finger];
    if (!boneNames) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // In Three.js: X is -450..450 (same direction as SVG dx)
    // Three.js Y is -175..175 (opposite direction to SVG dy, because SVG Y increases downwards)
    const reach3D_X = reachX;
    const reach3D_Y = -reachY;

    // Register active animation
    activeAnimations.set(finger, {
      startTime: performance.now(),
      duration: prefersReducedMotion ? 95 : 145, // ~145ms total stroke (crisp downstroke, smooth return)
      motionScale: prefersReducedMotion ? 0.35 : 1.0,
      reachX: reach3D_X,
      reachY: reach3D_Y,
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
      // 0.0 to 0.35: crisp strike & reach (ease-out-quad)
      // 0.35 to 1.0: smooth spring-damped return (cosine curve)
      let strike;
      if (progress < 0.35) {
        const p = progress / 0.35;
        strike = 1 - (1 - p) * (1 - p);
      } else {
        const p = (progress - 0.35) / 0.65;
        strike = Math.cos(p * Math.PI * 0.5);
      }

      const motionScale = anim.motionScale || 1.0;
      strike = strike * motionScale;

      const isThumb = finger.includes('thumb');
      const isHomeKey = Math.hypot(anim.reachX, anim.reachY) < 12;

      anim.bones.forEach((bone, idx) => {
        const rest = restTransforms[bone.name];
        if (!rest) return;

        if (isThumb) {
          // Thumbs (2 bones: proximal, distal)
          // Press downward onto spacebar with visible key strike
          if (idx === 0) {
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.15);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.15 - 3.5);
            bone.position.z = rest.pos.z - strike * 7.5;
            bone.rotation.x = rest.rot.x - strike * 0.16;
          } else {
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.25);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.25 - 2.5);
            bone.position.z = rest.pos.z - strike * 5.0;
            bone.rotation.x = rest.rot.x - strike * 0.12;
          }
        } else if (isHomeKey) {
          // Home row downstroke: authentic physical keycap compression
          // Visible downward motion in Y, joint flexion in rotation.x, depression in Z
          if (idx === 0) {
            // MCP Proximal
            bone.position.y = rest.pos.y - strike * 4.0;
            bone.position.z = rest.pos.z - strike * 8.0;
            bone.rotation.x = rest.rot.x - strike * 0.22;
          } else if (idx === 1) {
            // PIP Intermediate
            bone.position.y = rest.pos.y - strike * 3.0;
            bone.position.z = rest.pos.z - strike * 5.0;
            bone.rotation.x = rest.rot.x - strike * 0.16;
          } else if (idx === 2) {
            // DIP Distal (Fingertip)
            bone.position.y = rest.pos.y - strike * 2.0;
            bone.position.z = rest.pos.z - strike * 3.0;
            bone.rotation.x = rest.rot.x - strike * 0.12;
          }
        } else {
          // Reach key: smooth natural reach toward target keycap + keycap downstroke
          // Controlled reach scaling ensures zero texture stretching while cleanly indicating the target key
          const reachScaleX = 0.40;
          const reachScaleY = 0.42;

          if (idx === 0) {
            // Proximal bone (MCP)
            bone.position.x = rest.pos.x + strike * (anim.reachX * reachScaleX * 0.28);
            bone.position.y = rest.pos.y + strike * (anim.reachY * reachScaleY * 0.28 - 3.0);
            bone.position.z = rest.pos.z - strike * 7.0;
            bone.rotation.x = rest.rot.x - strike * 0.20;
            bone.rotation.z = rest.rot.z - strike * (anim.reachX / 280);
          } else if (idx === 1) {
            // Intermediate bone (PIP)
            bone.position.x = rest.pos.x + strike * (anim.reachX * reachScaleX * 0.44);
            bone.position.y = rest.pos.y + strike * (anim.reachY * reachScaleY * 0.44 - 2.0);
            bone.position.z = rest.pos.z - strike * 4.5;
            bone.rotation.x = rest.rot.x - strike * 0.16;
          } else if (idx === 2) {
            // Distal bone (DIP - fingertip)
            bone.position.x = rest.pos.x + strike * (anim.reachX * reachScaleX * 0.28);
            bone.position.y = rest.pos.y + strike * (anim.reachY * reachScaleY * 0.28 - 1.5);
            bone.position.z = rest.pos.z - strike * 3.0;
            bone.rotation.x = rest.rot.x - strike * 0.12;
          }
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
