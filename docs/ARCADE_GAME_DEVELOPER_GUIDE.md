# KEYFLOW Arcade — Global Game Performance & Developer Guide

Welcome to the **KEYFLOW Global Game Performance Architecture**. This system ensures that all arcade typing games deliver silky-smooth, responsive, accessible, and battery-conscious experiences across high-end gaming rigs, laptops, integrated GPUs, tablets, and mobile devices—**without ever compromising the core KEYFLOW typing-learning platform**.

---

## 1. Core Architecture Principles

1. **Website & Route Isolation (Non-Negotiable):**
   Arcade games and their rendering engines must **NEVER** be loaded during normal website navigation. Visiting the homepage, Academy, Workstation, or Telemetry must load 0KB of game engine code.
2. **Lazy Loading:**
   Every game component in `ArcadeHub.jsx` is code-split with `React.lazy()` and wrapped in `<Suspense fallback={<ArcadeGameLoadingScreen />}>`.
3. **Single Active Session:**
   `GameLifecycleManager` enforces that only **one** game runs at any time. When a new game launches or the user exits, previous loops, timers, audio contexts, and GPU resources are terminated.
4. **Gameplay Fairness Protection (Non-Negotiable):**
   Graphics degradation or preset changes must **NEVER** alter typing accuracy, WPM calculations, collision detection, AI progression, or competitive race results. Simulation delta-time is clamped (`Math.min(dt, 0.05)`) to eliminate lag tunneling.
5. **Technology-Agnostic Adapters:**
   Games are free to use Three.js / WebGL, Canvas 2D, SVG, or React DOM. The manager supplies tailored configurations to each technology without forcing a single engine.

---

## 2. Registering a New Game

To register a game, import `registerGame` from `src/utils/performance/GlobalGameManager.js` and declare its metadata:

```javascript
import { registerGame, RENDERING_TECH } from '@/utils/performance/GlobalGameManager';

registerGame({
  id: 'space-drifter',
  title: 'Space Drifter Typing',
  renderingTech: RENDERING_TECH.THREEJS_WEBGL, // or CANVAS_2D, SVG_DOM, REACT_DOM
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: true,
  hasFallback: true,
  fallbackTech: RENDERING_TECH.CANVAS_2D,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['thruster', 'laser', 'sfx'],
  maxParticles: { ultra: 60, high: 40, medium: 20, performance: 6 },
});
```

---

## 3. Practical Implementation Examples

### Example A: Three.js / WebGL Game Implementation

```javascript
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  GlobalGameManager,
  RENDERING_TECH,
  GameLifecycleManager,
  WebGLFallbackManager,
} from '@/utils/performance/GlobalGameManager';

export const My3DGame = ({ onExit, soundEnabled = true }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. Fetch technology-tailored graphics configuration
    const graphicsConfig = GlobalGameManager.getGraphicsConfig(RENDERING_TECH.THREEJS_WEBGL);
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = 400;

    // 2. Graceful WebGLRenderer creation with fallback handling
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: graphicsConfig.antiAliasing,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(graphicsConfig.pixelRatio);
      renderer.shadowMap.enabled = graphicsConfig.shadows !== 'disabled';
    } catch (err) {
      console.warn('WebGL init failed. Activating 2D canvas fallback...');
      return start2DFallback(container, width, height);
    }

    container.appendChild(renderer.domElement);

    // 3. Register context loss & background tab listeners
    const cleanupContext = WebGLFallbackManager.attachContextLossHandlers(
      renderer.domElement,
      () => start2DFallback(container, width, height)
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, graphicsConfig.drawDistance);

    // 4. Register with Lifecycle Manager
    GameLifecycleManager.trackRenderer(renderer);

    let animId;
    let lastTime = performance.now();

    const loop = (timestamp) => {
      // Guarantee fair simulation delta
      const monitor = GlobalGameManager.getActiveMonitor();
      const rawDt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const dt = monitor ? monitor.getFairSimulationDelta(rawDt) : Math.min(rawDt, 0.05);

      // Simulation update (typing, movement, AI)...
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    GameLifecycleManager.trackRaf(animId);

    // 5. Deep resource teardown
    return () => {
      cancelAnimationFrame(animId);
      cleanupContext();
      GameLifecycleManager.disposeThreeScene(scene, renderer);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-[400px]" />;
};
```

---

### Example B: Canvas 2D Game Implementation

```javascript
import React, { useEffect, useRef } from 'react';
import {
  GlobalGameManager,
  RENDERING_TECH,
  GameLifecycleManager,
} from '@/utils/performance/GlobalGameManager';

export const MyCanvasGame = ({ onExit }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const config = GlobalGameManager.getGraphicsConfig(RENDERING_TECH.CANVAS_2D);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Particle density scaled according to preset: config.maxParticles
      // Screen shake gated by: config.enableScreenShake
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    GameLifecycleManager.trackRaf(animId);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={450} />;
};
```

---

### Example C: React DOM / SVG Game Implementation

```javascript
import React, { useState, useEffect } from 'react';
import { GlobalGameManager, RENDERING_TECH } from '@/utils/performance/GlobalGameManager';

export const MyDomGame = () => {
  const [config, setConfig] = useState(() =>
    GlobalGameManager.getGraphicsConfig(RENDERING_TECH.REACT_DOM)
  );

  useEffect(() => {
    const handleProfileChange = () => {
      setConfig(GlobalGameManager.getGraphicsConfig(RENDERING_TECH.REACT_DOM));
    };
    window.addEventListener('keyflow-graphics-profile-changed', handleProfileChange);
    return () => window.removeEventListener('keyflow-graphics-profile-changed', handleProfileChange);
  }, []);

  // Use config.maxParticles and config.enableScreenShake to scale UI effects
  return (
    <div className="relative">
      {/* DOM game elements */}
    </div>
  );
};
```

---

## 4. Graphics Presets Specification

| Setting | Ultra | High | Medium | Performance |
|:---|:---:|:---:|:---:|:---:|
| **Pixel Ratio** | Min(DPR, 2.0) | Min(DPR, 1.5) | 1.0 | 0.85 |
| **Shadows (WebGL)** | High (PCSS 2048) | Medium (PCF 1024) | Basic (512) | Disabled |
| **Particle Density** | 100% (50 particles) | 75% (35 particles) | 40% (20 particles) | 15% (8 particles) |
| **Lighting** | Full (Specular + Glow) | Standard | Simple Directional | Minimal Ambient |
| **Draw Distance** | 320 units | 240 units | 170 units | 110 units |
| **Anti-Aliasing** | Enabled | Enabled | Disabled | Disabled |
| **Screen Shake** | Enabled | Enabled | Subtle | Disabled |

---

## 5. Audio Management Guidelines

- Always access the Web Audio API context through `GlobalAudioLifecycleManager.getAudioContext()`.
- Multiply local oscillator gains by `GlobalAudioLifecycleManager.getEffectiveVolume('sfx')` or `'music'`.
- All audio is automatically suspended when a tab is hidden or a game exits.
