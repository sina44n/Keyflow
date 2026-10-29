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

    // Add finger bones
    fingerBoneNames.forEach((bName) => {
      const bInfo = boneWorldPos[bName];
      const d = Math.hypot(vx - bInfo.pos.x, vy - bInfo.pos.y);
      candidateBones.push({ name: bName, idx: bInfo.idx, dist: d });
    });

    // Add palm bone
    const dPalm = Math.hypot(vx - palmBone.pos.x, vy - palmBone.pos.y);
    candidateBones.push({ name: 'palm' + prefix, idx: palmBone.idx, dist: dPalm });

    // Add wrist bone if in lower hand region or fewer than 4 bones
    if (candidateBones.length < 4 || vy < -60) {
      const dWrist = Math.hypot(vx - wristBone.pos.x, vy - wristBone.pos.y);
      candidateBones.push({ name: 'wrist' + prefix, idx: wristBone.idx, dist: dWrist });
    }

    // Sort candidate bones by distance and keep top 4
    candidateBones.sort((a, b) => a.dist - b.dist);
    const top4 = candidateBones.slice(0, 4);
    while (top4.length < 4) top4.push(top4[0]);

    // Compute smooth inverse-distance weights with power 2.5
    const rawWeights = top4.map((c) => 1 / Math.pow(Math.max(c.dist, 4), 2.5));
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
 * Generates genuine 3D volumetric dual-hand geometry:
 * - Rounded 3D elliptical-cylinder finger shafts with dorsal, lateral, and ventral pulp
 * - Anatomical knuckle mounds and joint flexion creases at MCP, PIP, and DIP
 * - Distinct dorsal fingernail plates with realistic cuticle contour and nail bed shading
 * - Transverse carpal arch on the dorsal palm with extensor digitorum tendon ridges
 * - Rounded thenar and hypothenar eminences with wrist taper
 * - Strictly isolated vertex skin weights (100% bone isolation per finger, zero cross-finger drag)
 */
export function createVolumetricDualHandGeometry(landmarks, boneIndexMap) {
  function buildDigit(chain, radiiLat, radiiDv, boneNames) {
    const positions = [];
    const uvs = [];
    const colors = [];
    const skinIndices = [];
    const skinWeights = [];
    const indices = [];

    const bIndices = boneNames.map((n) => boneIndexMap[n]);
    const rings = [];

    for (let s = 0; s < chain.length - 1; s++) {
      const pA = chain[s];
      const pB = chain[s + 1];
      const bA = bIndices[s];
      const bB = bIndices[Math.min(s + 1, bIndices.length - 1)];

      const numSlices = s === chain.length - 2 ? 6 : 5;
      for (let st = 0; st < numSlices; st++) {
        const t = st / numSlices;
        const cx = pA.x + t * (pB.x - pA.x);
        const cy = pA.y + t * (pB.y - pA.y);
        const cz = pA.z + t * (pB.z - pA.z);
        const rLat = radiiLat[s] + t * (radiiLat[s + 1] - radiiLat[s]);
        const rDv = radiiDv[s] + t * (radiiDv[s + 1] - radiiDv[s]);

        let wA = 1.0;
        let wB = 0.0;
        if (t > 0.6) {
          const blend = (t - 0.6) / 0.4;
          wA = 1.0 - 0.5 * blend;
          wB = 0.5 * blend;
        }

        rings.push({ cx, cy, cz, rLat, rDv, bA, bB, wA, wB, s, t });
      }
    }

    // Tip ring
    const tip = chain[chain.length - 1];
    const lastBone = bIndices[bIndices.length - 1];
    rings.push({
      cx: tip.x,
      cy: tip.y,
      cz: tip.z,
      rLat: 4.5,
      rDv: 3.5,
      bA: lastBone,
      bB: lastBone,
      wA: 1.0,
      wB: 0.0,
      s: chain.length - 2,
      t: 1.0,
    });

    const radialSegments = 12;
    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      for (let c = 0; c <= radialSegments; c++) {
        const theta = (c / radialSegments) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        let vx = ring.cx + ring.rLat * cos;
        let vy = ring.cy;
        let vz = ring.cz + ring.rDv * sin;

        // Base human skin color (#D89E82 warm tone)
        let cr = 0.847, cg = 0.620, cb = 0.510;

        // Knuckle elevations and skin folds on dorsal side (sin > 0)
        if (sin > 0) {
          if (ring.s === 0 && ring.t < 0.25) {
            vz += 2.0 * sin; // MCP
            cr = 0.81; cg = 0.54; cb = 0.46;
          }
          if (ring.s === 0 && ring.t > 0.75) {
            vz += 2.5 * sin; // PIP
            cr = 0.80; cg = 0.53; cb = 0.45;
          }
          if (ring.s === 1 && ring.t > 0.75) {
            vz += 1.8 * sin; // DIP
            cr = 0.81; cg = 0.55; cb = 0.47;
          }

          // Distinct fingernail plate on dorsal distal phalanx
          if (ring.s === chain.length - 2 && ring.t > 0.45 && ring.t < 0.95 && sin > 0.5) {
            const nailT = (ring.t - 0.45) / 0.50;
            vz += 1.6 * Math.sin(nailT * Math.PI) * sin;
            cr = 0.918; cg = 0.765; cb = 0.722; // #EAC3B8 nail bed
            if (ring.t > 0.88) {
              cr = 0.96; cg = 0.92; cb = 0.90; // lunula / free margin
            }
          }
        }

        positions.push(vx, vy, vz);
        uvs.push(c / radialSegments, r / (rings.length - 1));
        colors.push(cr, cg, cb);
        skinIndices.push(ring.bA, ring.bB, 0, 0);
        skinWeights.push(ring.wA, ring.wB, 0, 0);
      }
    }

    const vPerRing = radialSegments + 1;
    for (let r = 0; r < rings.length - 1; r++) {
      for (let c = 0; c < radialSegments; c++) {
        const i0 = r * vPerRing + c;
        const i1 = (r + 1) * vPerRing + c;
        const i2 = (r + 1) * vPerRing + (c + 1);
        const i3 = r * vPerRing + (c + 1);
        indices.push(i0, i1, i2);
        indices.push(i0, i2, i3);
      }
    }

    // Fingertip cap apex (matching landmark tip exactly)
    const capIdx = positions.length / 3;
    positions.push(tip.x, tip.y, tip.z);
    uvs.push(0.5, 1.0);
    colors.push(0.85, 0.62, 0.52);
    skinIndices.push(lastBone, lastBone, 0, 0);
    skinWeights.push(1.0, 0.0, 0.0, 0.0);

    const lastRingStart = (rings.length - 1) * vPerRing;
    for (let c = 0; c < radialSegments; c++) {
      indices.push(lastRingStart + c, capIdx, lastRingStart + c + 1);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    geom.setIndex(indices);
    return geom;
  }

  function buildPalm(wristPt, palmPt, knucklePts, wristBoneName, palmBoneName) {
    const positions = [];
    const uvs = [];
    const colors = [];
    const skinIndices = [];
    const skinWeights = [];
    const indices = [];

    const wristBoneIdx = boneIndexMap[wristBoneName];
    const palmBoneIdx = boneIndexMap[palmBoneName];

    let kx = 0, ky = 0, kz = 0;
    knucklePts.forEach((p) => { kx += p.x; ky += p.y; kz += p.z; });
    kx /= knucklePts.length; ky /= knucklePts.length; kz /= knucklePts.length;

    const numRings = 7;
    const radialSegments = 16;

    for (let r = 0; r < numRings; r++) {
      const t = r / (numRings - 1);
      let cx, cy, cz;
      if (t < 0.5) {
        const u = t / 0.5;
        cx = wristPt.x + u * (palmPt.x - wristPt.x);
        cy = wristPt.y + u * (palmPt.y - wristPt.y);
        cz = wristPt.z + u * (palmPt.z - wristPt.z);
      } else {
        const u = (t - 0.5) / 0.5;
        cx = palmPt.x + u * (kx - palmPt.x);
        cy = palmPt.y + u * (ky - palmPt.y);
        cz = palmPt.z + u * (kz - palmPt.z);
      }

      const halfWidth = 38 + t * 45;
      const dorsalHeight = 6.0 + (1 - Math.abs(t - 0.6) * 1.5) * 8.0;
      const palmarDepth = 4.0 + (1 - Math.abs(t - 0.6) * 1.5) * 3.0;

      const wWrist = Math.max(0, 1 - t * 1.8);
      const wPalm = 1 - wWrist;

      for (let c = 0; c <= radialSegments; c++) {
        const theta = (c / radialSegments) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        let vx = cx + halfWidth * cos;
        let vy = cy;
        let vz = cz;
        let cr = 0.847, cg = 0.620, cb = 0.510;

        if (sin >= 0) {
          vz += dorsalHeight * sin;
          if (t > 0.3 && t < 0.95 && Math.abs(cos) < 0.8) {
            vz += 1.2 * Math.cos(cos * 8);
          }
        } else {
          vz += palmarDepth * sin;
        }

        positions.push(vx, vy, vz);
        uvs.push(c / radialSegments, t);
        colors.push(cr, cg, cb);
        skinIndices.push(wristBoneIdx, palmBoneIdx, 0, 0);
        skinWeights.push(wWrist, wPalm, 0, 0);
      }
    }

    const vPerRing = radialSegments + 1;
    for (let r = 0; r < numRings - 1; r++) {
      for (let c = 0; c < radialSegments; c++) {
        const i0 = r * vPerRing + c;
        const i1 = (r + 1) * vPerRing + c;
        const i2 = (r + 1) * vPerRing + (c + 1);
        const i3 = r * vPerRing + (c + 1);
        indices.push(i0, i1, i2);
        indices.push(i0, i2, i3);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    geom.setIndex(indices);
    return geom;
  }

  const L = landmarks.left;
  const R = landmarks.right;

  const parts = [
    buildPalm(L.wrist, L.palm, [L.pinky.mcp, L.ring.mcp, L.middle.mcp, L.index.mcp, L.thumb.base], 'wrist_L', 'palm_L'),
    buildDigit([L.pinky.mcp, L.pinky.pip, L.pinky.dip, L.pinky.tip], [10.5, 9.5, 8.5, 6.5], [9.0, 8.0, 7.0, 5.5], ['pinky_proximal_L', 'pinky_intermediate_L', 'pinky_distal_L']),
    buildDigit([L.ring.mcp, L.ring.pip, L.ring.dip, L.ring.tip], [12.5, 11.5, 10.0, 8.0], [10.5, 9.8, 8.5, 6.5], ['ring_proximal_L', 'ring_intermediate_L', 'ring_distal_L']),
    buildDigit([L.middle.mcp, L.middle.pip, L.middle.dip, L.middle.tip], [13.5, 12.5, 10.8, 8.5], [11.5, 10.8, 9.0, 7.0], ['middle_proximal_L', 'middle_intermediate_L', 'middle_distal_L']),
    buildDigit([L.index.mcp, L.index.pip, L.index.dip, L.index.tip], [12.5, 11.5, 10.0, 8.0], [10.5, 9.8, 8.5, 6.5], ['index_proximal_L', 'index_intermediate_L', 'index_distal_L']),
    buildDigit([L.thumb.base, L.thumb.mid, L.thumb.tip], [14.0, 13.0, 10.5], [12.0, 11.0, 8.5], ['thumb_proximal_L', 'thumb_distal_L']),

    buildPalm(R.wrist, R.palm, [R.pinky.mcp, R.ring.mcp, R.middle.mcp, R.index.mcp, R.thumb.base], 'wrist_R', 'palm_R'),
    buildDigit([R.thumb.base, R.thumb.mid, R.thumb.tip], [14.0, 13.0, 10.5], [12.0, 11.0, 8.5], ['thumb_proximal_R', 'thumb_distal_R']),
    buildDigit([R.index.mcp, R.index.pip, R.index.dip, R.index.tip], [12.5, 11.5, 10.0, 8.0], [10.5, 9.8, 8.5, 6.5], ['index_proximal_R', 'index_intermediate_R', 'index_distal_R']),
    buildDigit([R.middle.mcp, R.middle.pip, R.middle.dip, R.middle.tip], [13.5, 12.5, 10.8, 8.5], [11.5, 10.8, 9.0, 7.0], ['middle_proximal_R', 'middle_intermediate_R', 'middle_distal_R']),
    buildDigit([R.ring.mcp, R.ring.pip, R.ring.dip, R.ring.tip], [12.5, 11.5, 10.0, 8.0], [10.5, 9.8, 8.5, 6.5], ['ring_proximal_R', 'ring_intermediate_R', 'ring_distal_R']),
    buildDigit([R.pinky.mcp, R.pinky.pip, R.pinky.dip, R.pinky.tip], [10.5, 9.5, 8.5, 6.5], [9.0, 8.0, 7.0, 5.5], ['pinky_proximal_R', 'pinky_intermediate_R', 'pinky_distal_R']),
  ];

  const posArr = [], normArr = [], uvArr = [], colArr = [], sIdxArr = [], sWArr = [], indArr = [];
  let vOffset = 0;
  for (const part of parts) {
    part.computeVertexNormals();
    const p = part.attributes.position;
    const n = part.attributes.normal;
    const u = part.attributes.uv;
    const c = part.attributes.color;
    const s = part.attributes.skinIndex;
    const w = part.attributes.skinWeight;
    const idx = part.index;

    for (let i = 0; i < p.count; i++) {
      posArr.push(p.getX(i), p.getY(i), p.getZ(i));
      normArr.push(n.getX(i), n.getY(i), n.getZ(i));
      uvArr.push(u.getX(i), u.getY(i));
      colArr.push(c.getX(i), c.getY(i), c.getZ(i));
      sIdxArr.push(s.getX(i), s.getY(i), s.getZ(i), s.getW(i));
      sWArr.push(w.getX(i), w.getY(i), w.getZ(i), w.getW(i));
    }
    for (let i = 0; i < idx.count; i++) {
      indArr.push(idx.getX(i) + vOffset);
    }
    vOffset += p.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));
  merged.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sIdxArr, 4));
  merged.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sWArr, 4));
  merged.setIndex(indArr);
  merged.computeVertexNormals();
  return merged;
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

  // Generate genuine volumetric 3D dual-hand geometry
  const geometry = createVolumetricDualHandGeometry(HAND_LANDMARKS, boneIndexMap);

  // High-fidelity PBR skin material with natural Caucasian warm tone, micro-roughness and dielectric specularity
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    vertexColors: true,
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

      anim.bones.forEach((bone, idx) => {
        const rest = restTransforms[bone.name];
        if (!rest) return;

        if (isThumb) {
          // Thumbs (2 bones: proximal, distal)
          if (idx === 0) {
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.40);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.40);
            bone.position.z = rest.pos.z - strike * 8.0;
            bone.rotation.x = rest.rot.x - strike * 0.14;
          } else {
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.60);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.60);
            bone.position.z = rest.pos.z - strike * 6.0;
            bone.rotation.x = rest.rot.x - strike * 0.10;
          }
        } else {
          // Fingers (3 bones: proximal MCP, intermediate PIP, distal DIP)
          if (idx === 0) {
            // Proximal bone (MCP)
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.28);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.28);
            bone.position.z = rest.pos.z - strike * 8.0; // Keycap depression depth
            bone.rotation.x = rest.rot.x - strike * 0.20;
            // Subtle lateral reach tilt
            bone.rotation.z = rest.rot.z - strike * (anim.reachX / 280);
          } else if (idx === 1) {
            // Intermediate bone (PIP)
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.44);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.44);
            bone.position.z = rest.pos.z - strike * 4.0;
            bone.rotation.x = rest.rot.x - strike * 0.16;
          } else if (idx === 2) {
            // Distal bone (DIP - fingertip)
            bone.position.x = rest.pos.x + strike * (anim.reachX * 0.28);
            bone.position.y = rest.pos.y + strike * (anim.reachY * 0.28);
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
