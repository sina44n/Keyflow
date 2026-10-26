import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BONE_NAMES,
  FINGER_BONE_MAP,
  createHandRigMesh,
  createHandAnimationController,
} from '../../utils/hand3dRig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Interactive 3D Hand Skeletal Rig & Kinematic Animation Engine', () => {
  it('contains exactly 32 anatomical bones with documented standard naming', () => {
    assert.equal(BONE_NAMES.length, 32);

    // Left hand
    assert.ok(BONE_NAMES.includes('wrist_L'));
    assert.ok(BONE_NAMES.includes('palm_L'));
    assert.ok(BONE_NAMES.includes('thumb_proximal_L'));
    assert.ok(BONE_NAMES.includes('thumb_distal_L'));
    assert.ok(BONE_NAMES.includes('index_proximal_L'));
    assert.ok(BONE_NAMES.includes('index_intermediate_L'));
    assert.ok(BONE_NAMES.includes('index_distal_L'));
    assert.ok(BONE_NAMES.includes('middle_proximal_L'));
    assert.ok(BONE_NAMES.includes('middle_intermediate_L'));
    assert.ok(BONE_NAMES.includes('middle_distal_L'));
    assert.ok(BONE_NAMES.includes('ring_proximal_L'));
    assert.ok(BONE_NAMES.includes('ring_intermediate_L'));
    assert.ok(BONE_NAMES.includes('ring_distal_L'));
    assert.ok(BONE_NAMES.includes('pinky_proximal_L'));
    assert.ok(BONE_NAMES.includes('pinky_intermediate_L'));
    assert.ok(BONE_NAMES.includes('pinky_distal_L'));

    // Right hand
    assert.ok(BONE_NAMES.includes('wrist_R'));
    assert.ok(BONE_NAMES.includes('palm_R'));
    assert.ok(BONE_NAMES.includes('thumb_proximal_R'));
    assert.ok(BONE_NAMES.includes('thumb_distal_R'));
    assert.ok(BONE_NAMES.includes('index_proximal_R'));
    assert.ok(BONE_NAMES.includes('index_intermediate_R'));
    assert.ok(BONE_NAMES.includes('index_distal_R'));
    assert.ok(BONE_NAMES.includes('middle_proximal_R'));
    assert.ok(BONE_NAMES.includes('middle_intermediate_R'));
    assert.ok(BONE_NAMES.includes('middle_distal_R'));
    assert.ok(BONE_NAMES.includes('ring_proximal_R'));
    assert.ok(BONE_NAMES.includes('ring_intermediate_R'));
    assert.ok(BONE_NAMES.includes('ring_distal_R'));
    assert.ok(BONE_NAMES.includes('pinky_proximal_R'));
    assert.ok(BONE_NAMES.includes('pinky_intermediate_R'));
    assert.ok(BONE_NAMES.includes('pinky_distal_R'));
  });

  it('maps all touch-typing fingers to anatomical bone chains', () => {
    assert.deepEqual(FINGER_BONE_MAP['left-pinky'], ['pinky_proximal_L', 'pinky_intermediate_L', 'pinky_distal_L']);
    assert.deepEqual(FINGER_BONE_MAP['left-ring'], ['ring_proximal_L', 'ring_intermediate_L', 'ring_distal_L']);
    assert.deepEqual(FINGER_BONE_MAP['left-middle'], ['middle_proximal_L', 'middle_intermediate_L', 'middle_distal_L']);
    assert.deepEqual(FINGER_BONE_MAP['left-index'], ['index_proximal_L', 'index_intermediate_L', 'index_distal_L']);
    assert.deepEqual(FINGER_BONE_MAP['right-index'], ['index_proximal_R', 'index_intermediate_R', 'index_distal_R']);
    assert.deepEqual(FINGER_BONE_MAP['right-middle'], ['middle_proximal_R', 'middle_intermediate_R', 'middle_distal_R']);
    assert.deepEqual(FINGER_BONE_MAP['right-ring'], ['ring_proximal_R', 'ring_intermediate_R', 'ring_distal_R']);
    assert.deepEqual(FINGER_BONE_MAP['right-pinky'], ['pinky_proximal_R', 'pinky_intermediate_R', 'pinky_distal_R']);
  });

  it('generates a 3D SkinnedMesh with 32 bones and valid vertex skin weights', () => {
    const { skinnedMesh, bones, boneMap } = createHandRigMesh();
    assert.ok(skinnedMesh.isSkinnedMesh, 'Is a valid SkinnedMesh');
    assert.equal(bones.length, 32, 'Contains 32 bones');

    const geom = skinnedMesh.geometry;
    const skinWeights = geom.attributes.skinWeight;
    const skinIndices = geom.attributes.skinIndex;

    assert.ok(skinWeights && skinWeights.count > 0, 'Has skin weights');
    assert.ok(skinIndices && skinIndices.count > 0, 'Has skin indices');

    // Verify boneMap contains all bones
    BONE_NAMES.forEach((name) => {
      assert.ok(boneMap[name], `Bone ${name} is in boneMap`);
    });
  });

  it('animates the correct finger on keystroke and smoothly returns to resting pose', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    const pinkyProx = boneMap['pinky_proximal_L'];
    const initialRotX = pinkyProx.rotation.x;

    // Type 'a' (left pinky)
    controller.triggerKeystroke('a');
    assert.equal(controller.getActiveCount(), 1, 'Left pinky animation active');

    // Advance 40ms (downstroke peak)
    controller.update(performance.now() + 40);
    assert.ok(pinkyProx.rotation.x < initialRotX, 'Pinky flexed downward');

    // Advance 150ms (full recovery)
    controller.update(performance.now() + 150);
    assert.equal(controller.getActiveCount(), 0, 'Animation finished');
    assert.equal(pinkyProx.rotation.x, initialRotX, 'Restored to exact resting pose');
  });

  it('resets all bones immediately when resetAll is invoked', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    controller.triggerKeystroke('f'); // left index
    controller.triggerKeystroke('j'); // right index
    assert.equal(controller.getActiveCount(), 2);

    controller.resetAll();
    assert.equal(controller.getActiveCount(), 0, 'All animations cleared');
  });

  it('verifies finger articulation for all 8 fingers across touch-typing home keys', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    // Left hand home keys: A (pinky), S (ring), D (middle), F (index)
    controller.triggerKeystroke('a');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('s');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('d');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('f');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    // Right hand home keys: J (index), K (middle), L (ring), ; (pinky)
    controller.triggerKeystroke('j');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('k');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('l');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke(';');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();
  });

  it('supports configurable spacebar thumb assignments', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    // Default right-thumb
    controller.triggerKeystroke(' ');
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    // Configured left-thumb
    controller.triggerKeystroke(' ', { spaceThumb: 'left-thumb' });
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();
  });

  it('handles uppercase letters, shifted symbols, and punctuation', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    controller.triggerKeystroke('S'); // uppercase S
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('!'); // shifted 1 (pinky)
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('?'); // shifted / (pinky)
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();

    controller.triggerKeystroke('backspace'); // backspace (pinky)
    assert.equal(controller.getActiveCount(), 1);
    controller.resetAll();
  });

  it('supports rapid repeated keystrokes on the same finger without getting stuck', () => {
    const { boneMap } = createHandRigMesh();
    const controller = createHandAnimationController(boneMap);

    const ringProx = boneMap['ring_proximal_L'];
    const initialRot = ringProx.rotation.x;

    // Simulate typing 'sss' rapidly
    controller.triggerKeystroke('s');
    controller.update(performance.now() + 20);
    assert.equal(controller.getActiveCount(), 1);

    controller.triggerKeystroke('s');
    controller.update(performance.now() + 20);
    assert.equal(controller.getActiveCount(), 1);

    controller.triggerKeystroke('s');
    controller.update(performance.now() + 20);
    assert.equal(controller.getActiveCount(), 1);

    // After completion duration, must return cleanly to rest
    controller.update(performance.now() + 200);
    assert.equal(controller.getActiveCount(), 0);
    assert.equal(ringProx.rotation.x, initialRot);
  });

  it('verifies binary GLB model exists on disk and is non-empty', () => {
    const glbPath = path.resolve(__dirname, '../../../../frontend/public/models/keyflow_hands_rigged.glb');
    assert.ok(fs.existsSync(glbPath), 'GLB file exists');
    const stats = fs.statSync(glbPath);
    assert.ok(stats.size > 200000, `GLB file size ${stats.size} is valid`);
  });
});
