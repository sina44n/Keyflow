/**
 * KEYFLOW — Login Character Video Player (Seamless Greeting → Idle Loop)
 * ======================================================================
 * - Plays the high-resolution Greeting Video (waving 'Hi') exactly once per browser session.
 * - Seamlessly crossfades (800ms) into the Idle Video as the wave settles.
 * - Continuously loops the Idle Video indefinitely.
 * - Uses sessionStorage to persist playback state across page navigation, re-renders,
 *   and toggling between Sign In and Sign Up.
 * - Zero flickering, zero blank frames, zero layout distortion.
 * - Autoplay safe: muted, playsInline, autoPlay with interaction fallback.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const SESSION_KEY = 'kf_login_character_greeting_played';
const CROSSFADE_DURATION_MS = 800;
const GREETING_TRANSITION_LEAD_TIME = 0.85; // seconds before greeting ends to start crossfade

export const LoginCharacterVideo = ({ className = '' }) => {
  // Check if greeting has already played in this browser session
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isCrossfading, setIsCrossfading] = useState(false);
  const [greetingError, setGreetingError] = useState(false);
  const [idleError, setIdleError] = useState(false);

  const greetingVideoRef = useRef(null);
  const idleVideoRef = useRef(null);
  const transitionStartedRef = useRef(false);
  const crossfadeTimerRef = useRef(null);

  // Mark session storage
  const recordGreetingCompleted = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {}
    setHasPlayedGreeting(true);
  }, []);

  // Execute transition from Greeting to Idle
  const executeTransition = useCallback(() => {
    if (transitionStartedRef.current) return;
    transitionStartedRef.current = true;

    const idleVideo = idleVideoRef.current;
    const greetingVideo = greetingVideoRef.current;

    if (!idleVideo) {
      recordGreetingCompleted();
      return;
    }

    // 1. Prepare and start idle video
    idleVideo.currentTime = 0;
    const playPromise = idleVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[KEYFLOW Video] Autoplay idle prevented:', err);
      });
    }

    // 2. Start crossfade
    setIsCrossfading(true);

    // 3. After crossfade duration, complete transition and pause greeting
    if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
    crossfadeTimerRef.current = setTimeout(() => {
      if (greetingVideo) {
        try {
          greetingVideo.pause();
        } catch {}
      }
      setIsCrossfading(false);
      recordGreetingCompleted();
    }, CROSSFADE_DURATION_MS + 50);
  }, [recordGreetingCompleted]);

  // Initial playback setup
  useEffect(() => {
    const greetingVideo = greetingVideoRef.current;
    const idleVideo = idleVideoRef.current;

    if (hasPlayedGreeting) {
      // Repeat visit: start Idle video directly
      if (idleVideo) {
        idleVideo.currentTime = 0;
        idleVideo.play().catch(() => {});
      }
    } else {
      // First visit: play Greeting video from start, preload Idle
      if (greetingVideo) {
        greetingVideo.currentTime = 0;
        greetingVideo.play().catch((err) => {
          console.warn('[KEYFLOW Video] Autoplay greeting prevented, falling back to idle:', err);
          setGreetingError(true);
          executeTransition();
        });
      }
      if (idleVideo) {
        idleVideo.load();
      }
    }

    // Fallback: If autoplay was blocked, resume on first user interaction anywhere
    const handleFirstInteraction = () => {
      if (hasPlayedGreeting) {
        if (idleVideo && idleVideo.paused) {
          idleVideo.play().catch(() => {});
        }
      } else {
        if (greetingVideo && greetingVideo.paused && !transitionStartedRef.current) {
          greetingVideo.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
    };
  }, [hasPlayedGreeting, executeTransition]);

  // Monitor greeting video playback time to trigger crossfade before video ends
  const handleGreetingTimeUpdate = () => {
    if (hasPlayedGreeting || transitionStartedRef.current) return;
    const g = greetingVideoRef.current;
    if (!g || !g.duration) return;

    const remaining = g.duration - g.currentTime;
    if (remaining <= GREETING_TRANSITION_LEAD_TIME && remaining > 0) {
      executeTransition();
    }
  };

  // Safety net on greeting ended event
  const handleGreetingEnded = () => {
    if (!transitionStartedRef.current) {
      executeTransition();
    }
  };

  // Determine opacities
  // If greeting already played: greeting is 0, idle is 1
  // If first visit & playing greeting: greeting is 1, idle is 0
  // If crossfading: greeting transitions to 0, idle transitions to 1
  const greetingOpacity = hasPlayedGreeting ? 0 : isCrossfading ? 0 : 1;
  const idleOpacity = hasPlayedGreeting ? 1 : isCrossfading ? 1 : 0;
  const greetingPointerEvents = hasPlayedGreeting ? 'none' : 'auto';

  return (
    <div
      className={`relative w-full h-full min-h-[380px] md:min-h-[520px] rounded-[22px] sm:rounded-[24px] overflow-hidden bg-gradient-to-b from-[#bfe4f9] via-[#d3ecfa] to-[#eaf5fc] select-none ${className}`}
      data-testid="login-character-video-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Greeting Video (First-time session playback - 100% Decorative, Zero Controls) */}
      {!hasPlayedGreeting && (
        <video
          ref={greetingVideoRef}
          src="/media/greeting.mp4"
          playsInline
          muted
          autoPlay
          loop={false}
          controls={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          preload="auto"
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleGreetingTimeUpdate}
          onEnded={handleGreetingEnded}
          onError={() => {
            setGreetingError(true);
            executeTransition();
          }}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-800 ease-in-out z-10 pointer-events-none decorative-video"
          style={{
            opacity: greetingOpacity,
            transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
          }}
          data-testid="greeting-video"
          aria-hidden="true"
        />
      )}

      {/* 2. Idle Video (Continuous loop - 100% Decorative, Zero Controls) */}
      <video
        ref={idleVideoRef}
        src="/media/idle.mp4"
        playsInline
        muted
        loop
        autoPlay={hasPlayedGreeting}
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        preload="auto"
        onContextMenu={(e) => e.preventDefault()}
        onError={() => setIdleError(true)}
        className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-800 ease-in-out z-0 pointer-events-none decorative-video"
        style={{
          opacity: idleOpacity,
          transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
        }}
        data-testid="idle-video"
        aria-hidden="true"
      />

      {/* 3. Subtle Vignette to Harmonize Outer Edge in Card */}
      <div
        className="absolute inset-0 pointer-events-none shadow-[inset_0_0_24px_rgba(0,0,0,0.08)] z-20"
        aria-hidden="true"
      />

      {/* 4. Bottom-Left Typography: EXPLORE. LEARN. GROW. matching Reference Image 2 */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none select-none">
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
