import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { create3DVehicle } from './Racing3DVehicle';

/**
 * Interactive 3D Garage Turntable Preview
 * Renders the customized supercar on an illuminated rotating turntable stage.
 * Features mouse/touch drag-to-rotate, spotlight reflections, metallic highlights,
 * and live 3D billboard driver badge updates.
 */
export const Racing3DGarageTurntable = ({
  vehicleId = 'apex-gt',
  primaryColor = '#EF4444',
  secondaryColor = '#1F2937',
  wheelFinish = 'chrome',
  glowColor = '#EF4444',
  nitroStyle = 'fire',
  driverName = 'YOU',
}) => {
  const containerRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    vehicleController: null,
    turntableGroup: null,
    isDragging: false,
    prevMouseX: 0,
    rotationY: 0.6,
    autoRotate: true,
    animId: null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 340;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 2.8, 9.5);
    camera.lookAt(0, 0.9, 0);

    // 2. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL unavailable for Garage Turntable', e);
      return;
    }

    // 3. Turntable Stage Group
    const turntableGroup = new THREE.Group();
    scene.add(turntableGroup);

    // Circular Turntable Base Platform
    const stageGeo = new THREE.CylinderGeometry(4.0, 4.3, 0.28, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.7,
      roughness: 0.25,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.14;
    stage.receiveShadow = true;
    turntableGroup.add(stage);

    // Neon Accent Ring around Turntable
    const ringGeo = new THREE.RingGeometry(3.85, 3.98, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(glowColor),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.01;
    turntableGroup.add(ringMesh);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 2.2, 30, Math.PI / 4, 0.3, 1);
    mainSpot.position.set(4, 8, 6);
    scene.add(mainSpot);

    const fillSpot = new THREE.SpotLight(0x38bdf8, 1.2, 25, Math.PI / 4, 0.5, 1);
    fillSpot.position.set(-6, 6, -4);
    scene.add(fillSpot);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // Underglow spotlight on stage
    const underSpot = new THREE.PointLight(new THREE.Color(glowColor), 2.5, 6, 2);
    underSpot.position.set(0, 0.3, 0);
    turntableGroup.add(underSpot);

    // 5. Mount Vehicle
    const vehicleController = create3DVehicle({
      vehicleConfig: {
        id: vehicleId,
        color: primaryColor,
        secondaryColor,
        glowColor,
        wheelFinish,
        nitroStyle,
      },
      isPlayer: true,
      driverName: driverName || 'YOU',
      lane: 1.5, // Center
      initialX: 0,
    });
    turntableGroup.add(vehicleController.group);

    stateRef.current = {
      scene,
      camera,
      renderer,
      vehicleController,
      turntableGroup,
      isDragging: false,
      prevMouseX: 0,
      rotationY: 0.6,
      autoRotate: true,
      animId: null,
    };

    // 6. Interaction Handlers
    const onMouseDown = (e) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.autoRotate = false;
    };

    const onMouseMove = (e) => {
      if (!stateRef.current.isDragging) return;
      const deltaX = e.clientX - stateRef.current.prevMouseX;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.rotationY += deltaX * 0.008;
    };

    const onMouseUp = () => {
      stateRef.current.isDragging = false;
      // Resume auto-rotation after a 2-second pause
      setTimeout(() => {
        if (!stateRef.current.isDragging) {
          stateRef.current.autoRotate = true;
        }
      }, 2000);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.prevMouseX = e.touches[0].clientX;
        stateRef.current.autoRotate = false;
      }
    };

    const onTouchMove = (e) => {
      if (!stateRef.current.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - stateRef.current.prevMouseX;
      stateRef.current.prevMouseX = e.touches[0].clientX;
      stateRef.current.rotationY += deltaX * 0.01;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // 7. Animation Loop
    let lastTime = performance.now();
    const animate = (time) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (stateRef.current.autoRotate) {
        stateRef.current.rotationY += dt * 0.45;
      }

      if (turntableGroup) {
        turntableGroup.rotation.y = stateRef.current.rotationY;
      }

      renderer.render(scene, camera);
      stateRef.current.animId = requestAnimationFrame(animate);
    };
    stateRef.current.animId = requestAnimationFrame(animate);

    // Resize Handler
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
      if (vehicleController) {
        vehicleController.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [vehicleId, primaryColor, secondaryColor, wheelFinish, glowColor, nitroStyle, driverName]);

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[#07090e] shadow-2xl group select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-3 left-3.5 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-black/70 text-red-400 border border-red-500/30 backdrop-blur-xs">
          3D SHOWROOM TURNTABLE
        </span>
        <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
          Drag to inspect • 360° View
        </span>
      </div>
      <div className="absolute bottom-3 right-3 pointer-events-none text-right">
        <span className="text-[11px] font-mono text-white/80 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
          {driverName ? driverName.toUpperCase() : 'YOU'} • READY
        </span>
      </div>
    </div>
  );
};
