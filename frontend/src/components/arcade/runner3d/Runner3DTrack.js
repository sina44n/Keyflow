import * as THREE from 'three';

/**
 * Runner3DTrack — Procedural Endless Cyber Highway
 * ================================================
 * Endless recycling 3-lane track sections with glowing neon lines,
 * safety barriers, overhead cyber gates, and distant metropolis towers.
 */
export class Runner3DTrack {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.chunkLength = 40;
    this.chunkCount = 7; // Covers 280 meters of continuous track
    this.chunks = [];

    this.buildMaterials();
    this.initChunks();
  }

  buildMaterials() {
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.6,
      metalness: 0.4,
    });

    this.neonCyanMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
    });

    this.neonPurpleMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
    });

    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.8,
      metalness: 0.2,
    });
  }

  initChunks() {
    for (let i = 0; i < this.chunkCount; i++) {
      const chunkZ = i * this.chunkLength;
      const chunk = this.createTrackChunk(chunkZ);
      this.chunks.push(chunk);
      this.group.add(chunk.group);
    }
  }

  createTrackChunk(zPos) {
    const group = new THREE.Group();
    group.position.z = zPos;

    // 1. Road Surface (3 Lanes: width 11m, length 40m)
    const roadGeo = new THREE.PlaneGeometry(11, this.chunkLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Glowing Lane Dividers (Lane 1/2 and Lane 2/3)
    const dividerGeo = new THREE.PlaneGeometry(0.12, this.chunkLength);
    const dividerL = new THREE.Mesh(dividerGeo, this.neonCyanMat);
    dividerL.rotation.x = -Math.PI / 2;
    dividerL.position.set(-1.5, 0.01, 0);
    group.add(dividerL);

    const dividerR = new THREE.Mesh(dividerGeo, this.neonCyanMat);
    dividerR.rotation.x = -Math.PI / 2;
    dividerR.position.set(1.5, 0.01, 0);
    group.add(dividerR);

    // Outer Track Border Glow Lines
    const borderL = new THREE.Mesh(dividerGeo, this.neonPurpleMat);
    borderL.rotation.x = -Math.PI / 2;
    borderL.position.set(-5.4, 0.01, 0);
    group.add(borderL);

    const borderR = new THREE.Mesh(dividerGeo, this.neonPurpleMat);
    borderR.rotation.x = -Math.PI / 2;
    borderR.position.set(5.4, 0.01, 0);
    group.add(borderR);

    // 3. Side Guard Rails
    const railGeo = new THREE.BoxGeometry(0.3, 0.8, this.chunkLength);
    const railL = new THREE.Mesh(railGeo, this.barrierMat);
    railL.position.set(-5.6, 0.4, 0);
    group.add(railL);

    const railR = new THREE.Mesh(railGeo, this.barrierMat);
    railR.position.set(5.6, 0.4, 0);
    group.add(railR);

    // 4. Overhead Cyber Gate Arches (One per chunk)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 0);

    const pillarGeo = new THREE.BoxGeometry(0.4, 5.0, 0.4);
    const pillarL = new THREE.Mesh(pillarGeo, this.barrierMat);
    pillarL.position.set(-5.6, 2.5, 0);
    archGroup.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, this.barrierMat);
    pillarR.position.set(5.6, 2.5, 0);
    archGroup.add(pillarR);

    const beamGeo = new THREE.BoxGeometry(11.6, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeo, this.neonCyanMat);
    beam.position.set(0, 5.0, 0);
    archGroup.add(beam);

    group.add(archGroup);

    // 5. Parallax Background City Buildings on Sides
    for (let b = 0; b < 4; b++) {
      const bHeight = 15 + Math.random() * 25;
      const bWidth = 8 + Math.random() * 6;
      const bDepth = 8 + Math.random() * 6;
      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, this.buildingMat);

      const side = b % 2 === 0 ? -1 : 1;
      const bX = side * (12 + Math.random() * 8);
      const bZ = (Math.random() - 0.5) * this.chunkLength;
      bMesh.position.set(bX, bHeight / 2, bZ);
      group.add(bMesh);

      // Neon roof outline / beacon
      const beaconGeo = new THREE.BoxGeometry(bWidth, 0.3, bDepth);
      const beacon = new THREE.Mesh(beaconGeo, Math.random() > 0.5 ? this.neonCyanMat : this.neonPurpleMat);
      beacon.position.set(bX, bHeight, bZ);
      group.add(beacon);
    }

    return { group, z: zPos };
  }

  update(playerZ) {
    // When a chunk is more than 50 meters behind the player, recycle it to the front
    let maxZ = -Infinity;
    for (const c of this.chunks) {
      if (c.z > maxZ) maxZ = c.z;
    }

    for (const c of this.chunks) {
      if (c.z < playerZ - this.chunkLength * 1.5) {
        c.z = maxZ + this.chunkLength;
        c.group.position.z = c.z;
        maxZ = c.z;
      }
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.scene.remove(this.group);
  }
}
