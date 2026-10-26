import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createHandRigMesh,
  createHandAnimationController,
} from '../../utils/hand3dRig.js';

/**
 * Hand3DGuide — Interactive WebGL 3D Articulated Human Hand Guidance for KEYFLOW.
 *
 * Implements real-time 3D skeletal articulation (32 bones) with natural touch-typing
 * downstroke, key reach, and damped harmonic recovery synchronized with user keystrokes.
 *
 * Features:
 * - High-fidelity texture mapping preserving authentic skin pores, fingernails, and red rim lighting
 * - Event-driven: only animates active fingers on typing, zero GPU waste when idling
 * - Damped harmonic spring physics for natural touch-typing kinematics
 * - Graceful fallback to static high-resolution asset if WebGL is unavailable
 * - Full memory cleanup on unmount or toggle off
 */
export function Hand3DGuide({
  targetChar,
  lastKeystroke,
  isVisible = true,
  spaceThumb = 'right-thumb',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  // Controller and scene refs
  const controllerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);
  const isLoopRunningRef = useRef(false);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!isVisible || webGLFailed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;
    } catch {
      setWebGLFailed(true);
      return;
    }

    // Camera matching 900x350 keyboard coordinates
    const camera = new THREE.OrthographicCamera(-450, 450, 175, -175, 0.1, 2000);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Subtle atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xFF1744, 0.85);
    rimLight.position.set(0, 200, 300);
    scene.add(rimLight);

    // Texture loader with cached high-resolution hands asset
    const textureLoader = new THREE.TextureLoader();
    let handMesh = null;
    let skeleton = null;
    let animController = null;

    textureLoader.load(
      '/realistic_hands_both.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        // Create 3D SkinnedMesh with 32 bones
        const rig = createHandRigMesh(texture);
        handMesh = rig.skinnedMesh;
        skeleton = rig.skeleton;
        animController = createHandAnimationController(rig.boneMap);
        controllerRef.current = animController;

        scene.add(handMesh);

        // Initial render
        renderer.render(scene, camera);
      },
      undefined,
      () => {
        // Fallback on texture error
        setWebGLFailed(true);
      }
    );

    // Render loop trigger function
    function startLoopIfNeeded() {
      if (isLoopRunningRef.current) return;
      isLoopRunningRef.current = true;

      function loop() {
        const ctrl = controllerRef.current;
        if (!ctrl || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
          isLoopRunningRef.current = false;
          return;
        }

        const isStillAnimating = ctrl.update(performance.now());
        rendererRef.current.render(sceneRef.current, cameraRef.current);

        if (isStillAnimating) {
          animFrameRef.current = requestAnimationFrame(loop);
        } else {
          isLoopRunningRef.current = false;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    }

    // Expose startLoop to outer scope via ref
    rendererRef.current._startLoop = startLoopIfNeeded;

    // Handle responsive container resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && rendererRef.current) {
          rendererRef.current.setSize(width, height, false);
          if (sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial size setup
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      renderer.setSize(rect.width, rect.height, false);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();

      if (handMesh) {
        scene.remove(handMesh);
        handMesh.geometry.dispose();
        if (handMesh.material.map) handMesh.material.map.dispose();
        handMesh.material.dispose();
      }
      if (skeleton) {
        skeleton.dispose();
      }
      renderer.dispose();
      controllerRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      isLoopRunningRef.current = false;
    };
  }, [isVisible, webGLFailed]);

  // Trigger finger animation on keystroke event
  useEffect(() => {
    if (!isVisible || !lastKeystroke?.key) return;

    const controller = controllerRef.current;
    if (controller) {
      controller.triggerKeystroke(lastKeystroke.key, { spaceThumb });
      if (rendererRef.current?._startLoop) {
        rendererRef.current._startLoop();
      }
    }
  }, [lastKeystroke, isVisible, spaceThumb]);

  // Reset animations if target changes or user restarts
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.resetAll();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [targetChar]);

  if (!isVisible) return null;

  // WebGL Fallback to static SVG image if canvas/WebGL unsupported
  if (webGLFailed) {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <img
          src="/realistic_hands_both.png"
          alt="Hands Guide"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible z-10"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
        style={{
          filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.75))',
          maskImage: 'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.7) 86%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.7) 86%, transparent 100%)',
        }}
      />
    </div>
  );
}

export default Hand3DGuide;
