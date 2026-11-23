/**
 * KEYFLOW — Interactive 3D Yeti Mascot
 * ====================================
 * High-fidelity, real-time 3D creature matching the reference video:
 * - Chubby, fluffy white fur body with soft lighting and rim lights
 * - Distinctive smooth icy-blue face mask (#7ec8e3) with rounded ears
 * - Glossy expressive black eyes with bright white catchlights
 * - Cute small blue nose and gentle friendly smile
 * - Swept-back crest of fluffy white hair tufts on top of head
 * - Articulated mouse tracking: smooth head yaw/pitch/roll & eye parallax
 * - Organic idle breathing, subtle body sway, and autonomous blinking
 * - Natural curved grassy hill positioned strictly beneath feet
 * - Beautiful camera framing with full crest and body in view
 * - Fallback poster support if WebGL is disabled or during initial load
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import yetiPoster from '../../assets/yeti-reference-poster.png';

export const YetiCharacter3D = ({ className = '', isFocusedOnInput = false }) => {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Normalized mouse target coordinates (-1 to 1)
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  // Input focus target (when user focuses email/password, look slightly right towards form)
  useEffect(() => {
    if (isFocusedOnInput) {
      mouseTargetRef.current = { x: 0.42, y: -0.08 };
    }
  }, [isFocusedOnInput]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isFocusedOnInput) return; // Keep gaze on form while typing
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseTargetRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      if (!isFocusedOnInput) {
        mouseTargetRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFocusedOnInput]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, animationFrameId;
    let isDisposed = false;

    try {
      // 1. Scene setup
      scene = new THREE.Scene();

      const width = container.clientWidth || 400;
      const height = container.clientHeight || 500;

      // Camera configured with optimal FOV and pull-back distance so full hair crest
      // and body are completely visible with ample sky headroom (no head cut off)
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.55, 4.45);
      camera.lookAt(0, 0.55, 0);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      container.appendChild(renderer.domElement);

      // 2. Lighting System (Warm sun + Sky bounce + Silky rim light)
      const sunLight = new THREE.DirectionalLight(0xfffaed, 2.1);
      sunLight.position.set(3.2, 4.2, 3.0);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.001;
      scene.add(sunLight);

      const hemiLight = new THREE.HemisphereLight(0xcde8ff, 0x5a7d36, 1.15);
      scene.add(hemiLight);

      // Fluffy rim light from back-left to highlight fur silhouette
      const rimLight = new THREE.DirectionalLight(0xd6eaff, 1.7);
      rimLight.position.set(-3.2, 2.8, -2.4);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0xe8f4ff, 0.75);
      fillLight.position.set(-1.8, 0.6, 2.2);
      scene.add(fillLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambientLight);

      // 3. Materials
      // White Fluffy Fur Material (velvety soft matte appearance, never plastic)
      const furMaterial = new THREE.MeshStandardMaterial({
        color: 0xfafcff,
        roughness: 0.92,
        metalness: 0.02,
      });

      // Fluffy secondary fur (slight warm ivory tint for belly depth)
      const furHighlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0.01,
      });

      // Smooth Icy-Blue Face & Ears Material (#7ec8e3 / #82cbf2)
      const icyBlueMaterial = new THREE.MeshStandardMaterial({
        color: 0x7ec8e3,
        roughness: 0.42,
        metalness: 0.03,
      });

      // Slightly darker blue for nose & smile accent (#52a7cd)
      const blueAccentMaterial = new THREE.MeshStandardMaterial({
        color: 0x52a7cd,
        roughness: 0.48,
        metalness: 0.04,
      });

      // Glossy Black Eye Material with shiny specular reflection
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x080c14,
        roughness: 0.06,
        metalness: 0.28,
      });

      // White eye catchlight glint
      const glintMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });

      // Grassy Ground Material (#5c8b2c)
      const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x5c8b2c,
        roughness: 0.92,
        metalness: 0.02,
      });

      // 4. Character Hierarchy Construction
      const characterRoot = new THREE.Group();
      characterRoot.position.set(0, -0.6, 0);
      scene.add(characterRoot);

      // A. Torso & Belly (Chubby, pear-shaped)
      const torsoGroup = new THREE.Group();
      characterRoot.add(torsoGroup);

      const bodyGeo = new THREE.SphereGeometry(0.86, 36, 36);
      bodyGeo.scale(1.04, 1.14, 0.94);
      const bodyMesh = new THREE.Mesh(bodyGeo, furMaterial);
      bodyMesh.position.set(0, 0.68, 0);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      torsoGroup.add(bodyMesh);

      // Belly soft volume layer
      const bellyGeo = new THREE.SphereGeometry(0.70, 32, 32);
      bellyGeo.scale(0.96, 0.98, 0.86);
      const bellyMesh = new THREE.Mesh(bellyGeo, furHighlightMaterial);
      bellyMesh.position.set(0, 0.64, 0.22);
      torsoGroup.add(bellyMesh);

      // B. Head & Neck Group (Pivot at base of head for yaw/pitch)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.42, 0.04);
      torsoGroup.add(headGroup);

      // Head Base (Chubby rounded white fur)
      const headGeo = new THREE.SphereGeometry(0.66, 36, 36);
      headGeo.scale(1.08, 1.02, 0.98);
      const headMesh = new THREE.Mesh(headGeo, furMaterial);
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // C. Swept-back Fluffy Hair Crest (4 distinct stylish swept tufts)
      const hairCrestGroup = new THREE.Group();
      hairCrestGroup.position.set(0, 0.56, 0.04);
      headGroup.add(hairCrestGroup);

      const createHairTuft = (scaleX, scaleY, scaleZ, posX, posY, posZ, rotX, rotZ) => {
        const tuftGeo = new THREE.ConeGeometry(0.22, 0.68, 24);
        tuftGeo.scale(scaleX, scaleY, scaleZ);
        const tuftMesh = new THREE.Mesh(tuftGeo, furHighlightMaterial);
        tuftMesh.position.set(posX, posY, posZ);
        tuftMesh.rotation.set(rotX, 0, rotZ);
        tuftMesh.castShadow = true;
        return tuftMesh;
      };

      // Main central tall tuft (flowing backwards)
      hairCrestGroup.add(createHairTuft(1.0, 1.1, 0.9, 0, 0.22, -0.12, -0.55, 0));
      // Left swept tuft
      hairCrestGroup.add(createHairTuft(0.85, 0.95, 0.8, -0.22, 0.15, -0.08, -0.45, 0.28));
      // Right swept tuft
      hairCrestGroup.add(createHairTuft(0.85, 0.95, 0.8, 0.22, 0.15, -0.08, -0.45, -0.28));
      // Rear volume tuft
      hairCrestGroup.add(createHairTuft(1.1, 0.8, 1.0, 0, 0.05, -0.28, -0.75, 0));

      // D. Smooth Icy-Blue Face Mask (#7ec8e3)
      const faceGroup = new THREE.Group();
      faceGroup.position.set(0, 0.02, 0.44);
      headGroup.add(faceGroup);

      const faceGeo = new THREE.SphereGeometry(0.42, 32, 32);
      faceGeo.scale(1.02, 1.05, 0.48);
      const faceMesh = new THREE.Mesh(faceGeo, icyBlueMaterial);
      faceMesh.castShadow = true;
      faceGroup.add(faceMesh);

      // E. Icy-Blue Rounded Ears (Left and Right)
      const createEar = (isLeft) => {
        const earGroup = new THREE.Group();
        const earGeo = new THREE.TorusGeometry(0.12, 0.045, 16, 24, Math.PI * 1.3);
        const earMesh = new THREE.Mesh(earGeo, icyBlueMaterial);
        earMesh.rotation.z = isLeft ? Math.PI * 0.35 : -Math.PI * 0.35;
        earGroup.add(earMesh);

        const earBackGeo = new THREE.SphereGeometry(0.1, 16, 16);
        earBackGeo.scale(0.8, 1.2, 0.4);
        const earBackMesh = new THREE.Mesh(earBackGeo, icyBlueMaterial);
        earGroup.add(earBackMesh);

        earGroup.position.set(isLeft ? -0.56 : 0.56, 0.12, 0.08);
        earGroup.rotation.y = isLeft ? -0.4 : 0.4;
        return earGroup;
      };
      headGroup.add(createEar(true));
      headGroup.add(createEar(false));

      // F. Expressive Black Glossy Eyes with Catchlight Glints
      const eyesGroup = new THREE.Group();
      eyesGroup.position.set(0, 0.08, 0.60);
      headGroup.add(eyesGroup);

      const leftEyePivot = new THREE.Group();
      leftEyePivot.position.set(-0.165, 0, 0);
      eyesGroup.add(leftEyePivot);

      const rightEyePivot = new THREE.Group();
      rightEyePivot.position.set(0.165, 0, 0);
      eyesGroup.add(rightEyePivot);

      const eyeGeo = new THREE.SphereGeometry(0.092, 24, 24);
      eyeGeo.scale(0.85, 1.2, 0.65); // Oval vertical pupil

      const createEye = () => {
        const eyeNode = new THREE.Group();
        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeNode.add(eyeMesh);

        // Circular crisp white specular glint at top-left
        const glintGeo = new THREE.CircleGeometry(0.026, 16);
        const glintMesh = new THREE.Mesh(glintGeo, glintMaterial);
        glintMesh.position.set(-0.028, 0.038, 0.072);
        eyeNode.add(glintMesh);

        // Secondary subtle soft reflection glint at bottom-right
        const glint2Geo = new THREE.CircleGeometry(0.012, 16);
        const glint2Mesh = new THREE.Mesh(glint2Geo, glintMaterial);
        glint2Mesh.position.set(0.024, -0.034, 0.072);
        eyeNode.add(glint2Mesh);

        return eyeNode;
      };

      const leftEye = createEye();
      leftEyePivot.add(leftEye);

      const rightEye = createEye();
      rightEyePivot.add(rightEye);

      // G. Eyelids for natural blinking
      const lidGeo = new THREE.SphereGeometry(0.102, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      lidGeo.scale(0.88, 1.22, 0.7);

      const leftUpperLid = new THREE.Mesh(lidGeo, icyBlueMaterial);
      leftUpperLid.position.set(-0.165, 0.04, 0.01);
      leftUpperLid.scale.set(1, 0, 1);
      eyesGroup.add(leftUpperLid);

      const rightUpperLid = new THREE.Mesh(lidGeo, icyBlueMaterial);
      rightUpperLid.position.set(0.165, 0.04, 0.01);
      rightUpperLid.scale.set(1, 0, 1);
      eyesGroup.add(rightUpperLid);

      // H. Cute Blue Nose & Smile Line
      const noseGeo = new THREE.SphereGeometry(0.040, 16, 16);
      noseGeo.scale(1.1, 0.85, 0.9);
      const noseMesh = new THREE.Mesh(noseGeo, blueAccentMaterial);
      noseMesh.position.set(0, -0.04, 0.63);
      headGroup.add(noseMesh);

      // Smile mouth curve (sweet friendly upturned line)
      const mouthCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.08, -0.12, 0.61),
        new THREE.Vector3(-0.03, -0.16, 0.63),
        new THREE.Vector3(0.03, -0.16, 0.63),
        new THREE.Vector3(0.08, -0.11, 0.61)
      );
      const mouthGeo = new THREE.TubeGeometry(mouthCurve, 16, 0.009, 8, false);
      const mouthMesh = new THREE.Mesh(mouthGeo, blueAccentMaterial);
      headGroup.add(mouthMesh);

      // I. Arms & Paws resting naturally on hips/belly
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.82, 0.92, 0.05);
      torsoGroup.add(leftArmGroup);

      const armGeo = new THREE.CylinderGeometry(0.17, 0.21, 0.62, 20);
      const leftArmMesh = new THREE.Mesh(armGeo, furMaterial);
      leftArmMesh.position.set(-0.07, -0.26, 0);
      leftArmMesh.rotation.z = 0.32;
      leftArmGroup.add(leftArmMesh);

      // Left Icy-Blue Hand/Paw
      const pawGeo = new THREE.SphereGeometry(0.15, 20, 20);
      pawGeo.scale(0.9, 0.9, 0.8);
      const leftPaw = new THREE.Mesh(pawGeo, icyBlueMaterial);
      leftPaw.position.set(-0.18, -0.54, 0.08);
      leftArmGroup.add(leftPaw);

      // Right Arm (resting forward on belly)
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.82, 0.92, 0.05);
      torsoGroup.add(rightArmGroup);

      const rightArmMesh = new THREE.Mesh(armGeo, furMaterial);
      rightArmMesh.position.set(0.07, -0.26, 0);
      rightArmMesh.rotation.z = -0.32;
      rightArmGroup.add(rightArmMesh);

      // Right Icy-Blue Hand with cute rounded digits resting on belly
      const rightPawGroup = new THREE.Group();
      rightPawGroup.position.set(0.16, -0.52, 0.15);
      rightArmGroup.add(rightPawGroup);

      const rightPawBase = new THREE.Mesh(pawGeo, icyBlueMaterial);
      rightPawGroup.add(rightPawBase);

      for (let i = 0; i < 4; i++) {
        const fingerGeo = new THREE.CapsuleGeometry(0.038, 0.075, 8, 8);
        const finger = new THREE.Mesh(fingerGeo, icyBlueMaterial);
        finger.position.set(-0.075 + i * 0.052, -0.09, 0.06);
        finger.rotation.x = 0.42;
        rightPawGroup.add(finger);
      }

      // J. Short Chubby Legs & Feet
      const legGeo = new THREE.CylinderGeometry(0.23, 0.27, 0.42, 20);
      const leftLegMesh = new THREE.Mesh(legGeo, furMaterial);
      leftLegMesh.position.set(-0.33, 0.14, 0);
      characterRoot.add(leftLegMesh);

      const rightLegMesh = new THREE.Mesh(legGeo, furMaterial);
      rightLegMesh.position.set(0.33, 0.14, 0);
      characterRoot.add(rightLegMesh);

      // Icy-blue feet resting on grass
      const footGeo = new THREE.SphereGeometry(0.17, 16, 16);
      footGeo.scale(1.1, 0.58, 1.35);
      const leftFoot = new THREE.Mesh(footGeo, icyBlueMaterial);
      leftFoot.position.set(-0.33, -0.02, 0.11);
      characterRoot.add(leftFoot);

      const rightFoot = new THREE.Mesh(footGeo, icyBlueMaterial);
      rightFoot.position.set(0.33, -0.02, 0.11);
      characterRoot.add(rightFoot);

      // K. Grassy Hill Mound Base (#5c8b2c)
      // Positioned strictly beneath the character's feet to form a gentle curved lawn
      // occupying only the lower ~15% of the frame (never a giant wall blocking the torso)
      const hillGeo = new THREE.SphereGeometry(3.8, 48, 36);
      hillGeo.scale(1.25, 0.28, 1.0);
      const hillMesh = new THREE.Mesh(hillGeo, grassMaterial);
      hillMesh.position.set(0, -1.68, -0.1);
      hillMesh.receiveShadow = true;
      scene.add(hillMesh);

      // 5. Animation & Physics Variables
      const clock = new THREE.Clock();
      let blinkTime = 0;
      let nextBlinkInterval = 3.2;
      let isBlinking = false;

      // Render loop with smooth damped lerping
      const animate = () => {
        if (isDisposed) return;
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Smooth mouse target lerping
        const lerpFactor = 0.08;
        mouseCurrentRef.current.x = THREE.MathUtils.lerp(
          mouseCurrentRef.current.x,
          mouseTargetRef.current.x,
          lerpFactor
        );
        mouseCurrentRef.current.y = THREE.MathUtils.lerp(
          mouseCurrentRef.current.y,
          mouseTargetRef.current.y,
          lerpFactor
        );

        const curX = mouseCurrentRef.current.x;
        const curY = mouseCurrentRef.current.y;

        // Head tracking (yaw, pitch, roll)
        const targetHeadYaw = curX * 0.42;
        const targetHeadPitch = -curY * 0.28;
        const targetHeadRoll = -curX * 0.07;

        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadYaw, 0.1);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetHeadPitch, 0.1);
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, targetHeadRoll, 0.1);

        // Eye gaze parallax tracking
        const eyeTargetYaw = curX * 0.028;
        const eyeTargetPitch = curY * 0.022;

        leftEyePivot.position.x = -0.165 + eyeTargetYaw;
        leftEyePivot.position.y = eyeTargetPitch;
        rightEyePivot.position.x = 0.165 + eyeTargetYaw;
        rightEyePivot.position.y = eyeTargetPitch;

        // Organic idle breathing (chest/belly gentle cycle)
        const breath = Math.sin(elapsed * 2.2) * 0.016;
        torsoGroup.scale.set(1.0 + breath * 0.6, 1.0 + breath, 1.0 + breath * 0.8);
        torsoGroup.position.y = breath * 0.4;

        // Autonomous Blinking Cycle
        blinkTime += delta;
        if (!isBlinking && blinkTime > nextBlinkInterval) {
          isBlinking = true;
          blinkTime = 0;
          nextBlinkInterval = 2.4 + Math.random() * 3.2;
        }

        if (isBlinking) {
          // Quick close and reopen (total 160ms)
          const blinkProgress = blinkTime / 0.16;
          if (blinkProgress < 0.5) {
            const scaleY = blinkProgress * 2;
            leftUpperLid.scale.y = scaleY;
            rightUpperLid.scale.y = scaleY;
          } else if (blinkProgress < 1.0) {
            const scaleY = (1.0 - blinkProgress) * 2;
            leftUpperLid.scale.y = scaleY;
            rightUpperLid.scale.y = scaleY;
          } else {
            leftUpperLid.scale.y = 0;
            rightUpperLid.scale.y = 0;
            isBlinking = false;
            blinkTime = 0;
          }
        }

        renderer.render(scene, camera);
      };

      animate();

      // Handle Resize
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 400;
        const h = container.clientHeight || 500;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        isDisposed = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (renderer?.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer?.dispose();
      };
    } catch (err) {
      console.warn('[KEYFLOW] WebGL initialization fallback:', err);
      setHasWebGL(false);
    }
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[380px] md:min-h-[520px] select-none ${className}`}>
      {/* 3D Canvas Mount */}
      {hasWebGL ? (
        <div ref={mountRef} className="w-full h-full absolute inset-0 z-10" />
      ) : (
        /* WebGL Graceful Fallback to Poster with Parallax */
        <div
          className="w-full h-full absolute inset-0 z-10 bg-cover bg-center transition-transform duration-300 ease-out"
          style={{
            backgroundImage: `url(${yetiPoster})`,
            transform: `translate(${mouseCurrentRef.current.x * 6}px, ${-mouseCurrentRef.current.y * 6}px)`,
          }}
          aria-label="3D Yeti Mascot"
        />
      )}

      {/* Atmospheric Cloud & Sunny Backdrop */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 75% 30%, #e0f2fe 0%, #bae6fd 45%, #7dd3fc 100%)',
        }}
      >
        {/* Soft Cumulus Clouds overlay */}
        <div className="absolute top-6 left-4 w-36 h-20 bg-white/70 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-12 right-6 w-48 h-28 bg-white/80 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-16 left-10 w-64 h-32 bg-white/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Reference Typography Overlay at Bottom-Left: EXPLORE. LEARN. GROW. */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none select-none">
        <h2
          className="text-white font-black tracking-[-0.02em] leading-[1.08] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] text-2xl sm:text-3xl font-sans uppercase [text-shadow:_0_1px_2px_rgba(0,0,0,0.45)]"
          style={{ WebkitTextStroke: '0.4px rgba(255, 255, 255, 0.95)', paintOrder: 'stroke fill' }}
        >
          <div>EXPLORE.</div>
          <div>LEARN. GROW.</div>
        </h2>
      </div>
    </div>
  );
};
