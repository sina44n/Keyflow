/**
 * KEYFLOW Leaderboard Authentic Profile Avatars Unit Tests
 * =======================================================
 * Forensic verification for Phase 7.8 & 7.9:
 * - isGoogleAvatarHost domain validation contract
 * - isAuthenticAvatarUrl detection contract
 * - getInitials formatting contract
 * - LeaderboardAvatar component rendering & fallback contract
 * - LeaderboardPodium & LeaderboardTable integration contract
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAuthenticAvatarUrl, isGoogleAvatarHost, getInitials } from '../utils/avatarUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeClerkToken(payload) {
  return 'https://img.clerk.com/' + Buffer.from(JSON.stringify(payload)).toString('base64');
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

  it('getInitials extracts clean two-letter initials with safe fallbacks', () => {
    assert.strictEqual(getInitials('John Doe'), 'JD');
    assert.strictEqual(getInitials('sinan kp'), 'SK');
    assert.strictEqual(getInitials('alice'), 'AL');
    assert.strictEqual(getInitials(''), 'KF');
    assert.strictEqual(getInitials(null), 'KF');
    assert.strictEqual(getInitials(undefined), 'KF');
  });

  it('LeaderboardAvatar component file implements no-referrer and onError fallback', () => {
    const avatarCompPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardAvatar.jsx');
    assert.ok(fs.existsSync(avatarCompPath), 'LeaderboardAvatar.jsx must exist');
    const content = fs.readFileSync(avatarCompPath, 'utf-8');

    assert.ok(content.includes('referrerPolicy="no-referrer"'), 'Must set referrerPolicy="no-referrer" for Google CDN compatibility');
    assert.ok(content.includes('onError='), 'Must handle onError to guarantee broken image icons are never shown');
    assert.ok(content.includes('isAuthenticAvatarUrl'), 'Must validate URLs with isAuthenticAvatarUrl');
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
    assert.ok(content.includes('ringClass={slot.avatarRing}'), 'Must pass slot.avatarRing for podium theme ring colors');
    assert.ok(content.includes('isCurrentUser'), 'Must preserve "YOU" indicator for authenticated user');
  });

  it('LeaderboardTable integrates LeaderboardAvatar and preserves table styling', () => {
    const tablePath = path.resolve(__dirname, '../components/leaderboard/LeaderboardTable.jsx');
    const content = fs.readFileSync(tablePath, 'utf-8');

    assert.ok(content.includes("import { LeaderboardAvatar } from './LeaderboardAvatar';"), 'Must import LeaderboardAvatar');
    assert.ok(content.includes('<LeaderboardAvatar'), 'Must render LeaderboardAvatar component');
    assert.ok(content.includes('size="table"'), 'Must specify size="table"');
  });

  it('AuthContext integrates isAuthenticAvatarUrl during user sync', () => {
    const authPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const content = fs.readFileSync(authPath, 'utf-8');

    assert.ok(content.includes('isAuthenticAvatarUrl'), 'AuthContext must import and use isAuthenticAvatarUrl');
  });
});
