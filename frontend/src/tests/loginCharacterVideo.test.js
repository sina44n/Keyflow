import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Login Page Seamless Greeting → Continuous Idle Video Integration', () => {
  const publicMediaDir = path.resolve(__dirname, '../../public/media');
  const greetingPath = path.join(publicMediaDir, 'greeting.mp4');
  const idlePath = path.join(publicMediaDir, 'idle.mp4');

  const componentPath = path.resolve(__dirname, '../components/auth/LoginCharacterVideo.jsx');
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');

  it('1. Verifies both Greeting and Idle video files exist in public/media with valid size', () => {
    assert.ok(fs.existsSync(greetingPath), 'greeting.mp4 must exist in public/media');
    assert.ok(fs.existsSync(idlePath), 'idle.mp4 must exist in public/media');

    const gSize = fs.statSync(greetingPath).size;
    const iSize = fs.statSync(idlePath).size;

    assert.ok(gSize > 1_000_000, `greeting.mp4 must be valid video (got ${gSize} bytes)`);
    assert.ok(iSize > 3_000_000, `idle.mp4 must be valid video (got ${iSize} bytes)`);
  });

  it('2. Verifies LoginCharacterVideo component exists and implements session persistence', () => {
    assert.ok(fs.existsSync(componentPath), 'LoginCharacterVideo.jsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes("export const LoginCharacterVideo"), 'Must export LoginCharacterVideo');
    assert.ok(content.includes('sessionStorage.getItem'), 'Must read sessionStorage for one-time greeting');
    assert.ok(content.includes('sessionStorage.setItem'), 'Must write sessionStorage to record completed greeting');
    assert.ok(content.includes('kf_login_character_greeting_played'), 'Must use dedicated session storage key');
  });

  it('3. Verifies smooth crossfade duration and pre-end transition triggering', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes('CROSSFADE_DURATION_MS = 800'), 'Must use 800ms crossfade duration');
    assert.ok(content.includes('GREETING_TRANSITION_LEAD_TIME'), 'Must define transition lead time before greeting ends');
    assert.ok(content.includes('executeTransition'), 'Must implement transition execution');
  });

  it('4. Verifies video attributes: muted, playsInline, autoPlay, preload, loop for idle', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes('playsInline'), 'Must include playsInline for mobile compatibility');
    assert.ok(content.includes('muted'), 'Must include muted for reliable cross-browser autoplay');
    assert.ok(content.includes('preload="auto"'), 'Must preload idle video while greeting plays');
    assert.ok(content.includes('loop'), 'Idle video must loop continuously');
  });

  it('5. Verifies transition listeners and error fallbacks', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes('onTimeUpdate={handleGreetingTimeUpdate}'), 'Must bind onTimeUpdate');
    assert.ok(content.includes('onEnded={handleGreetingEnded}'), 'Must bind onEnded safety net');
    assert.ok(content.includes('handleFirstInteraction'), 'Must include autoplay interaction fallback');
  });

  it('6. Verifies AuthPage integrates LoginCharacterVideo into the left panel', () => {
    assert.ok(fs.existsSync(authPagePath), 'AuthPage.jsx must exist');
    const authContent = fs.readFileSync(authPagePath, 'utf-8');

    assert.ok(
      authContent.includes("import { LoginCharacterVideo } from '../components/auth/LoginCharacterVideo'"),
      'AuthPage must import LoginCharacterVideo'
    );
    assert.ok(
      authContent.includes('<LoginCharacterVideo />'),
      'AuthPage must mount LoginCharacterVideo in the left panel'
    );
  });

  it('7. Verifies left panel dimensions and responsive styling are preserved', () => {
    const authContent = fs.readFileSync(authPagePath, 'utf-8');

    assert.ok(
      authContent.includes('w-full md:w-[48%] min-h-[380px] md:min-h-[520px] rounded-[22px] sm:rounded-[24px]'),
      'Must preserve exact left panel responsive dimensions and rounded corners'
    );
  });

  it('8. Verifies all right-panel authentication forms and Clerk OAuth remain preserved', () => {
    const authContent = fs.readFileSync(authPagePath, 'utf-8');

    assert.ok(authContent.includes('handleGoogleSignIn'), 'Must preserve Google OAuth handler');
    assert.ok(authContent.includes('loginWithGoogle'), 'Must preserve loginWithGoogle');
    assert.ok(authContent.includes('SignIn'), 'Must preserve Clerk SignIn component');
    assert.ok(authContent.includes('SignUp'), 'Must preserve Clerk SignUp component');
    assert.ok(authContent.includes('ClerkPasswordReset'), 'Must preserve password reset');
    assert.ok(authContent.includes('KEYFLOW'), 'Must preserve KEYFLOW branding');
  });

  it('9. Verifies complete removal of video controls, download, fullscreen, and PiP', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(content.includes('controls={false}'), 'Must explicitly disable controls');
    assert.ok(content.includes('controlsList="nodownload nofullscreen noremoteplayback"'), 'Must restrict controlsList');
    assert.ok(content.includes('disablePictureInPicture'), 'Must disable picture in picture');
    assert.ok(content.includes('disableRemotePlayback'), 'Must disable remote playback');
    assert.ok(content.includes('pointer-events-none'), 'Must disable pointer events on video elements');
    assert.ok(content.includes('onContextMenu='), 'Must block context menu on video');
    assert.ok(cssContent.includes('video::-webkit-media-controls'), 'Must hide webkit media controls in CSS');
  });

  it('10. Verifies Plus Jakarta Sans typography is configured site-wide', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(indexContent.includes('Plus+Jakarta+Sans'), 'index.html must load Plus Jakarta Sans from Google Fonts');
    assert.ok(cssContent.includes("'Plus Jakarta Sans'"), 'index.css must configure Plus Jakarta Sans as primary font');
    assert.ok(cssContent.includes('--font-sans:'), 'index.css must set --font-sans in @theme');
  });

  it('11. Verifies EXPLORE. LEARN. GROW. typography has prominent, bold font weight and styling', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('EXPLORE.'), 'Must contain EXPLORE.');
    assert.ok(content.includes('LEARN. GROW.'), 'Must contain LEARN. GROW.');
    assert.ok(content.includes('font-black'), 'Must use font-black (900 weight) for bold prominence');
    assert.ok(content.includes('WebkitTextStroke'), 'Must include WebkitTextStroke for optical weight enhancement');
  });
});
