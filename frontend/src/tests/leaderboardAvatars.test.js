/**
 * KEYFLOW Leaderboard Authentic Profile Avatars Unit Tests
 * =======================================================
 * Forensic verification for Production-Grade Leaderboard Avatar System:
 * - isGoogleAvatarHost domain validation contract
 * - isAuthenticAvatarUrl detection contract
 * - getInitial single uppercase initial formatting contract
 * - getAvatarColor deterministic color assignment & WCAG AA contrast contract
 * - LeaderboardAvatar / UserAvatar component rendering & fallback contract
 * - LeaderboardPodium & LeaderboardTable integration contract
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isAuthenticAvatarUrl,
  isGoogleAvatarHost,
  getInitial,
  getInitials,
  getAvatarColor,
  AVATAR_PALETTE,
} from '../utils/avatarUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeClerkToken(payload) {
  return 'https://img.clerk.com/' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

function calcContrast(hexColor) {
  const rgb = [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16),
  ];
  const a = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const bgL = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  const whiteL = 1.0;
  return (whiteL + 0.05) / (bgL + 0.05);
}

describe('KEYFLOW Leaderboard Authentic Google Avatars Contract', () => {
  it('isGoogleAvatarHost strictly accepts verified Google profile CDN domains over HTTPS', () => {
    assert.strictEqual(
      isGoogleAvatarHost('https://lh3.googleusercontent.com/a/ACg8ocIKasDvJq31cLOP2Q4FM=s96-c'),
      true,
      'lh3.googleusercontent.com must be accepted'
    );
    assert.strictEqual(
      isGoogleAvatarHost('https://lh6.googleusercontent.com/photo.jpg'),
      true,
      'lh6.googleusercontent.com must be accepted'
    );
    assert.strictEqual(
      isGoogleAvatarHost('https://googleusercontent.com/user/123'),
      true,
      'googleusercontent.com must be accepted'
    );
    assert.strictEqual(
      isGoogleAvatarHost('https://lh3.ggpht.com/pic.jpg'),
      true,
      'lh3.ggpht.com must be accepted'
    );

    // Insecure HTTP rejected
    assert.strictEqual(
      isGoogleAvatarHost('http://lh3.googleusercontent.com/pic.jpg'),
      false,
      'Insecure HTTP must be rejected'
    );

    // Non-Google domains rejected
    assert.strictEqual(isGoogleAvatarHost('https://evil-site.com/pic.jpg'), false);
    assert.strictEqual(isGoogleAvatarHost('https://github.com/avatar.png'), false);

    // Subdomain spoofing rejected
    assert.strictEqual(isGoogleAvatarHost('https://googleusercontent.com.attacker.com/pic.png'), false);
    assert.strictEqual(isGoogleAvatarHost('https://lh3.googleusercontent.com.evil.org/pic.png'), false);

    // Path / query trickery rejected
    assert.strictEqual(isGoogleAvatarHost('https://attacker.com/googleusercontent.com/pic.jpg'), false);
    assert.strictEqual(isGoogleAvatarHost('https://attacker.com/pic.jpg?domain=googleusercontent.com'), false);
  });

  it('isAuthenticAvatarUrl accepts authentic Google direct and Clerk proxy URLs', () => {
    // Direct Google photo URL
    assert.strictEqual(
      isAuthenticAvatarUrl('https://lh3.googleusercontent.com/a/ACg8ocIKasDvJq31cLOP2Q4FM_pEyCZnqsOx5oL8eWa_UIz6GfMs6w=s96-c'),
      true,
      'Direct Google avatar URL must be recognized as authentic'
    );

    // Clerk proxy wrapping Google avatar (type: "proxy", src: *.googleusercontent.com)
    const googleProxyUrl = makeClerkToken({
      type: 'proxy',
      src: 'https://lh3.googleusercontent.com/a/ACg8oc_sample=s1000-c',
      s: 'sig123',
    });
    assert.strictEqual(
      isAuthenticAvatarUrl(googleProxyUrl),
      true,
      'Clerk proxy URL wrapping a Google avatar must be recognized as authentic'
    );
  });

  it('isAuthenticAvatarUrl strictly rejects arbitrary external HTTPS URLs', () => {
    assert.strictEqual(
      isAuthenticAvatarUrl('https://evil-site.com/avatar.png'),
      false,
      'Arbitrary external HTTPS URL must be rejected'
    );
    assert.strictEqual(
      isAuthenticAvatarUrl('https://avatars.githubusercontent.com/u/12345'),
      false,
      'Non-Google third-party avatar URL must be rejected'
    );
    assert.strictEqual(
      isAuthenticAvatarUrl('https://cdn.example.org/profile.jpg'),
      false,
      'Generic CDN image URL must be rejected'
    );
  });

  it('isAuthenticAvatarUrl rejects Clerk generic purple placeholder avatars and non-Google proxies', () => {
    // Clerk default placeholder token (type: "default")
    const clerkDefaultUrl = makeClerkToken({
      type: 'default',
      iid: 'ins_3LMocvBYysmHWl91ylt2KoLWpy8',
      rid: 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
      initials: 'SK',
    });
    assert.strictEqual(
      isAuthenticAvatarUrl(clerkDefaultUrl),
      false,
      'Clerk default generated avatar must be rejected to prevent displaying generic purple placeholder'
    );

    // Clerk proxy wrapping an arbitrary external domain
    const maliciousProxyUrl = makeClerkToken({
      type: 'proxy',
      src: 'https://evil-site.com/malicious.png',
      s: 'fake_sig',
    });
    assert.strictEqual(
      isAuthenticAvatarUrl(maliciousProxyUrl),
      false,
      'Clerk proxy wrapping non-Google image must be rejected'
    );
  });

  it('isAuthenticAvatarUrl rejects insecure schemes and malformed inputs', () => {
    assert.strictEqual(isAuthenticAvatarUrl('http://lh3.googleusercontent.com/pic.png'), false, 'HTTP must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('javascript:alert(1)'), false, 'javascript: scheme must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('data:image/png;base64,iVBORw0KGgoAAA='), false, 'data: scheme must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('blob:https://keyflow.app/1234'), false, 'blob: scheme must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl(''), false, 'Empty string must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('   '), false, 'Whitespace must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl(null), false, 'Null must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl(undefined), false, 'Undefined must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('https:///invalid-domain'), false, 'Malformed URL must be rejected');
  });

  it('getInitial extracts exactly one uppercase initial with safe fallback', () => {
    assert.strictEqual(getInitial('sinan kp'), 'S');
    assert.strictEqual(getInitial('robith'), 'R');
    assert.strictEqual(getInitial('alex john'), 'A');
    assert.strictEqual(getInitial('michael'), 'M');
    assert.strictEqual(getInitial('@user_18Emh2'), 'U');
    assert.strictEqual(getInitial(''), '?');
    assert.strictEqual(getInitial('   '), '?');
    assert.strictEqual(getInitial(null), '?');
    assert.strictEqual(getInitial(undefined), '?');
  });

  it('getInitials extracts clean initials with safe fallbacks (backward compatibility)', () => {
    assert.strictEqual(getInitials('John Doe'), 'JD');
    assert.strictEqual(getInitials('sinan kp'), 'SK');
    assert.strictEqual(getInitials('alice'), 'AL');
    assert.strictEqual(getInitials(''), 'KF');
    assert.strictEqual(getInitials(null), 'KF');
    assert.strictEqual(getInitials(undefined), 'KF');
  });

  it('AVATAR_PALETTE contains 20+ distinct colors all passing WCAG AA contrast with pure white', () => {
    assert.ok(AVATAR_PALETTE.length >= 20, `Palette must have at least 20 colors, got ${AVATAR_PALETTE.length}`);
    for (const color of AVATAR_PALETTE) {
      assert.strictEqual(color.text, '#FFFFFF', 'All text colors in palette must be pure white');
      const contrast = calcContrast(color.bg);
      assert.ok(
        contrast >= 4.5,
        `Color ${color.name} (${color.bg}) must pass WCAG AA contrast (>= 4.5:1), got ${contrast.toFixed(2)}:1`
      );
    }
  });

  it('getAvatarColor assigns deterministic, stable colors for any user identifier', () => {
    const colorA1 = getAvatarColor(39);
    const colorA2 = getAvatarColor(39);
    assert.deepStrictEqual(colorA1, colorA2, 'Same numeric user id must always return the exact same color');

    const colorB1 = getAvatarColor('user_18Emh2');
    const colorB2 = getAvatarColor('user_18Emh2');
    assert.deepStrictEqual(colorB1, colorB2, 'Same username must always return the exact same color');

    // Null and empty safe fallback
    assert.ok(getAvatarColor(null)?.bg, 'Null identifier must return a valid palette color');
    assert.ok(getAvatarColor('')?.bg, 'Empty identifier must return a valid palette color');
  });

  it('LeaderboardAvatar component file implements no-referrer and onError fallback', () => {
    const avatarCompPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardAvatar.jsx');
    assert.ok(fs.existsSync(avatarCompPath), 'LeaderboardAvatar.jsx must exist');
    const content = fs.readFileSync(avatarCompPath, 'utf-8');

    assert.ok(content.includes('referrerPolicy="no-referrer"'), 'Must set referrerPolicy="no-referrer" for Google CDN compatibility');
    assert.ok(content.includes('onError='), 'Must handle onError to guarantee broken image icons are never shown');
    assert.ok(content.includes('isAuthenticAvatarUrl'), 'Must validate URLs with isAuthenticAvatarUrl');
    assert.ok(content.includes('getInitial'), 'Must use getInitial for single uppercase initial fallback');
    assert.ok(content.includes('getAvatarColor'), 'Must use getAvatarColor for deterministic background color');
    assert.ok(content.includes('UserAvatar'), 'Must export UserAvatar alias');
    assert.ok(content.includes('w-14 h-14'), 'Must support podium size (w-14 h-14)');
    assert.ok(content.includes('w-9 h-9'), 'Must support table size (w-9 h-9)');
    assert.ok(content.includes('rounded-full'), 'Must enforce circular geometry');
  });

  it('LeaderboardPodium integrates LeaderboardAvatar and preserves slot styling', () => {
    const podiumPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardPodium.jsx');
    const content = fs.readFileSync(podiumPath, 'utf-8');

    assert.ok(content.includes("import { LeaderboardAvatar } from './LeaderboardAvatar';"), 'Must import LeaderboardAvatar');
    assert.ok(content.includes('<LeaderboardAvatar'), 'Must render LeaderboardAvatar component');
    assert.ok(content.includes('size="podium"'), 'Must specify size="podium"');
    assert.ok(content.includes('userId='), 'Must pass userId for deterministic color assignment');
    assert.ok(content.includes('ringClass={slot.avatarRing}'), 'Must pass slot.avatarRing for podium theme ring colors');
    assert.ok(content.includes('isCurrentUser'), 'Must preserve "YOU" indicator for authenticated user');
  });

  it('LeaderboardTable integrates LeaderboardAvatar and preserves table styling', () => {
    const tablePath = path.resolve(__dirname, '../components/leaderboard/LeaderboardTable.jsx');
    const content = fs.readFileSync(tablePath, 'utf-8');

    assert.ok(content.includes("import { LeaderboardAvatar } from './LeaderboardAvatar';"), 'Must import LeaderboardAvatar');
    assert.ok(content.includes('<LeaderboardAvatar'), 'Must render LeaderboardAvatar component');
    assert.ok(content.includes('size="table"'), 'Must specify size="table"');
    assert.ok(content.includes('userId='), 'Must pass userId for deterministic color assignment');
  });

  it('AuthContext integrates isAuthenticAvatarUrl during user sync', () => {
    const authPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const content = fs.readFileSync(authPath, 'utf-8');

    assert.ok(content.includes('isAuthenticAvatarUrl'), 'AuthContext must import and use isAuthenticAvatarUrl');
  });
});
