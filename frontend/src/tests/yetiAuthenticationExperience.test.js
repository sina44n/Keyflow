import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Phase 7.56: Exact Reference-Video Login Experience & 3D Yeti Mascot', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const yetiComponentPath = path.resolve(__dirname, '../components/auth/YetiCharacter3D.jsx');
  assert.ok(fs.existsSync(yetiComponentPath), 'YetiCharacter3D.jsx must exist');
  const yetiContent = fs.readFileSync(yetiComponentPath, 'utf-8');

  it('1. Verifies 3D Yeti Mascot uses Three.js with articulated anatomy and lighting', () => {
    assert.ok(yetiContent.includes("import * as THREE from 'three'"), 'Must import Three.js');
    assert.ok(yetiContent.includes('THREE.WebGLRenderer'), 'Must initialize WebGLRenderer');
    assert.ok(yetiContent.includes('THREE.PerspectiveCamera'), 'Must use PerspectiveCamera');
    assert.ok(yetiContent.includes('0x7ec8e3'), 'Must use reference icy-blue material color for face & ears');
    assert.ok(yetiContent.includes('createHairTuft'), 'Must generate swept-back fluffy hair crest');
    assert.ok(yetiContent.includes('leftEyePivot'), 'Must mount articulated left eye');
    assert.ok(yetiContent.includes('rightEyePivot'), 'Must mount articulated right eye');
    assert.ok(yetiContent.includes('sunLight'), 'Must configure directional sunlight');
    assert.ok(yetiContent.includes('rimLight'), 'Must configure rim lighting for fur silhouette');
  });

  it('2. Verifies mouse-responsive tracking, blinking, and organic breathing', () => {
    assert.ok(yetiContent.includes('mouseTargetRef'), 'Must maintain normalized mouse tracking target');
    assert.ok(yetiContent.includes('THREE.MathUtils.lerp'), 'Must smoothly interpolate motion with damped lerp');
    assert.ok(yetiContent.includes('targetHeadYaw'), 'Must articulate head yaw tracking');
    assert.ok(yetiContent.includes('eyeTargetYaw'), 'Must articulate eye gaze tracking');
    assert.ok(yetiContent.includes('nextBlinkInterval'), 'Must schedule natural autonomous blinking intervals');
    assert.ok(yetiContent.includes('isBlinking'), 'Must manage eyelid animation during blink cycles');
    assert.ok(yetiContent.includes('breath'), 'Must calculate organic idle breathing expansion');
  });

  it('3. Verifies WebGL fallback poster is provided', () => {
    assert.ok(yetiContent.includes('hasWebGL'), 'Must guard WebGL availability');
    assert.ok(yetiContent.includes('yetiPoster'), 'Must import fallback reference poster');
  });

  it('4. Verifies reference typography "EXPLORE. LEARN. GROW." in left panel', () => {
    assert.ok(yetiContent.includes('EXPLORE.'), 'Must contain EXPLORE.');
    assert.ok(yetiContent.includes('LEARN. GROW.'), 'Must contain LEARN. GROW.');
  });

  it('5. Verifies small KEYFLOW brand label replaces YETI AI above heading without mascot icon', () => {
    assert.ok(authPageContent.includes('KEYFLOW'), 'Must display KEYFLOW branding');
    assert.ok(!authPageContent.includes('<YetiMascotIcon'), 'Must strictly omit mascot icon above brand label');
    assert.ok(authPageContent.includes('text-[10px] font-bold tracking-'), 'Must keep brand label small and subtle');
    assert.ok(!authPageContent.includes('YETTI.AI'), 'Must not display original YETTI.AI text');
  });

  it('6. Verifies exact reference headings: "Welcome Back" and "Welcome to KEYFLOW"', () => {
    assert.ok(authPageContent.includes("isLogin && 'Welcome Back'"), 'Login must display Welcome Back');
    assert.ok(authPageContent.includes("isRegister && 'Welcome to KEYFLOW'"), 'Registration must display Welcome to KEYFLOW');
  });

  it('7. Verifies reference supporting text', () => {
    assert.ok(
      authPageContent.includes("Enter your email and password to access your account"),
      'Must display reference supporting copy for login'
    );
  });

  it('8. Verifies solid black primary button and white Google OAuth button', () => {
    assert.ok(
      authPageContent.includes('bg-black hover:bg-neutral-800 text-white font-bold'),
      'Primary button must be solid black'
    );
    assert.ok(
      authPageContent.includes('Sign in with Google'),
      'Must provide Sign in with Google button'
    );
    assert.ok(
      authPageContent.includes('border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-800'),
      'Google button must have reference white styling with subtle border'
    );
  });

  it('9. Verifies complete removal of old anime illustration and black void backdrop', () => {
    assert.ok(!authPageContent.includes('auth-illustration.jpg'), 'Must completely remove old anime illustration');
    assert.ok(
      authPageContent.includes('from-[#96cdf2] via-[#bde1f8] to-[#edf7fd]'),
      'Must use soft sky-blue atmospheric background'
    );
  });

  it('10. Verifies real authentication wiring and Clerk integration are preserved', () => {
    assert.ok(authPageContent.includes('handleGoogleSignIn'), 'Must preserve Google OAuth handler');
    assert.ok(authPageContent.includes('loginWithGoogle({ destination })'), 'Must initiate real Google OAuth');
    assert.ok(authPageContent.includes('ClerkPasswordReset'), 'Must preserve ClerkPasswordReset for recovery');
    assert.ok(authPageContent.includes('SignIn'), 'Must mount Clerk SignIn');
    assert.ok(authPageContent.includes('SignUp'), 'Must mount Clerk SignUp');
  });
});
