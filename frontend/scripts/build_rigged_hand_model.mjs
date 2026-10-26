import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { computeIsolatedSkinWeights } from '../src/utils/hand3dRig.js';

// Polyfill FileReader for Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Procedural Anatomical 3D Skinned Hand Rig Generator for KEYFLOW.
 * 
 * Generates a valid, production-grade binary glTF (.glb) containing:
 * - Proper skeletal hierarchy for Left and Right hands (32 bones)
 * - Named finger joints (proximal, intermediate, distal)
 * - Linear blend skinning weights (skinIndices, skinWeights)
 * - Calibrated resting pose aligned with KEYFLOW ANSI 60% Virtual Keyboard
 */
async function buildRiggedHandModel() {
  console.log('Building KEYFLOW Rigged 3D Hand Model...');

  // Target directory
  const modelsDir = path.resolve(__dirname, '../public/models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  // Joint Landmark Calibration (in 900x350 keyboard coordinates)
  // X: 0 to 900, Y: 0 to 350 (Y inverted in 3D: Y_3d = 350 - Y_svg)
  const to3D = (x, y, z = 0) => new THREE.Vector3(x - 450, 175 - y, z);

  const landmarks = {
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

  // Build Skeletal Bone Hierarchy for Left & Right Hand
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

  // Left Hand Bones
  const wrist_L = addBone('wrist_L', landmarks.left.wrist);
  const palm_L = addBone('palm_L', landmarks.left.palm.clone().sub(landmarks.left.wrist), wrist_L);

  // Left Thumb
  const thumb_prox_L = addBone('thumb_proximal_L', landmarks.left.thumb.base.clone().sub(landmarks.left.palm), palm_L);
  addBone('thumb_distal_L', landmarks.left.thumb.tip.clone().sub(landmarks.left.thumb.base), thumb_prox_L);

  // Left Index
  const idx_prox_L = addBone('index_proximal_L', landmarks.left.index.mcp.clone().sub(landmarks.left.palm), palm_L);
  const idx_int_L = addBone('index_intermediate_L', landmarks.left.index.pip.clone().sub(landmarks.left.index.mcp), idx_prox_L);
  addBone('index_distal_L', landmarks.left.index.dip.clone().sub(landmarks.left.index.pip), idx_int_L);

  // Left Middle
  const mid_prox_L = addBone('middle_proximal_L', landmarks.left.middle.mcp.clone().sub(landmarks.left.palm), palm_L);
  const mid_int_L = addBone('middle_intermediate_L', landmarks.left.middle.pip.clone().sub(landmarks.left.middle.mcp), mid_prox_L);
  addBone('middle_distal_L', landmarks.left.middle.dip.clone().sub(landmarks.left.middle.pip), mid_int_L);

  // Left Ring
  const ring_prox_L = addBone('ring_proximal_L', landmarks.left.ring.mcp.clone().sub(landmarks.left.palm), palm_L);
  const ring_int_L = addBone('ring_intermediate_L', landmarks.left.ring.pip.clone().sub(landmarks.left.ring.mcp), ring_prox_L);
  addBone('ring_distal_L', landmarks.left.ring.dip.clone().sub(landmarks.left.ring.pip), ring_int_L);

  // Left Pinky
  const pinky_prox_L = addBone('pinky_proximal_L', landmarks.left.pinky.mcp.clone().sub(landmarks.left.palm), palm_L);
  const pinky_int_L = addBone('pinky_intermediate_L', landmarks.left.pinky.pip.clone().sub(landmarks.left.pinky.mcp), pinky_prox_L);
  addBone('pinky_distal_L', landmarks.left.pinky.dip.clone().sub(landmarks.left.pinky.pip), pinky_int_L);

  // Right Hand Bones
  const wrist_R = addBone('wrist_R', landmarks.right.wrist);
  const palm_R = addBone('palm_R', landmarks.right.palm.clone().sub(landmarks.right.wrist), wrist_R);

  // Right Thumb
  const thumb_prox_R = addBone('thumb_proximal_R', landmarks.right.thumb.base.clone().sub(landmarks.right.palm), palm_R);
  addBone('thumb_distal_R', landmarks.right.thumb.tip.clone().sub(landmarks.right.thumb.base), thumb_prox_R);

  // Right Index
  const idx_prox_R = addBone('index_proximal_R', landmarks.right.index.mcp.clone().sub(landmarks.right.palm), palm_R);
  const idx_int_R = addBone('index_intermediate_R', landmarks.right.index.pip.clone().sub(landmarks.right.index.mcp), idx_prox_R);
  addBone('index_distal_R', landmarks.right.index.dip.clone().sub(landmarks.right.index.pip), idx_int_R);

  // Right Middle
  const mid_prox_R = addBone('middle_proximal_R', landmarks.right.middle.mcp.clone().sub(landmarks.right.palm), palm_R);
  const mid_int_R = addBone('middle_intermediate_R', landmarks.right.middle.pip.clone().sub(landmarks.right.middle.mcp), mid_prox_R);
  addBone('middle_distal_R', landmarks.right.middle.dip.clone().sub(landmarks.right.middle.pip), mid_int_R);

  // Right Ring
  const ring_prox_R = addBone('ring_proximal_R', landmarks.right.ring.mcp.clone().sub(landmarks.right.palm), palm_R);
  const ring_int_R = addBone('ring_intermediate_R', landmarks.right.ring.pip.clone().sub(landmarks.right.ring.mcp), ring_prox_R);
  addBone('ring_distal_R', landmarks.right.ring.dip.clone().sub(landmarks.right.ring.pip), ring_int_R);

  // Right Pinky
  const pinky_prox_R = addBone('pinky_proximal_R', landmarks.right.pinky.mcp.clone().sub(landmarks.right.palm), palm_R);
  const pinky_int_R = addBone('pinky_intermediate_R', landmarks.right.pinky.pip.clone().sub(landmarks.right.pinky.mcp), pinky_prox_R);
  addBone('pinky_distal_R', landmarks.right.pinky.dip.clone().sub(landmarks.right.pinky.pip), pinky_int_R);

  console.log(`Created skeletal rig with ${bones.length} bones.`);

  // Create Skinned Plane / Relief Mesh (80 x 48 segments for smooth deformation)
  const meshWidth = 750;
  const meshHeight = 364;
  const segmentsX = 80;
  const segmentsY = 48;
  const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, segmentsX, segmentsY);

  // Offset geometry to match SVG placement: x = 64..814 (center = 439 -> -11 in 3D), y = 96..460 (center = 278 -> -103 in 3D)
  geometry.translate(-11, -103, 0);

  // Compute strictly isolated skin weights (no cross-finger deformation)
  computeIsolatedSkinWeights(geometry, bones, landmarks);

  // Material setup
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.65,
    metalness: 0.05,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
  });

  const skeleton = new THREE.Skeleton(bones);
  const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
  skinnedMesh.name = 'KeyflowHandsSkinnedMesh';
  skinnedMesh.add(wrist_L);
  skinnedMesh.add(wrist_R);
  skinnedMesh.bind(skeleton);

  // Group for scene export
  const rootScene = new THREE.Scene();
  rootScene.name = 'KeyflowHandsRiggedScene';
  rootScene.add(skinnedMesh);

  // Export to GLB
  const exporter = new GLTFExporter();
  const glbPath = path.join(modelsDir, 'keyflow_hands_rigged.glb');

  return new Promise((resolve, reject) => {
    exporter.parse(
      rootScene,
      (gltf) => {
        fs.writeFileSync(glbPath, Buffer.from(gltf));
        const stats = fs.statSync(glbPath);
        console.log(`Successfully generated and exported GLB to: ${glbPath} (${stats.size} bytes)`);
        resolve(glbPath);
      },
      (error) => {
        console.error('Error exporting GLB:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}

buildRiggedHandModel().catch(console.error);
