/**
 * KEYFLOW Leaderboard Authentic Profile Avatars Unit Tests
 * =======================================================
 * Forensic verification for Phase 7.8:
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
import { isAuthenticAvatarUrl, getInitials } from '../utils/avatarUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Leaderboard Authentic Avatars Contract', () => {
  it('isAuthenticAvatarUrl accepts authentic Google and external avatar URLs', () => {
    // Direct Google photo URL
    assert.strictEqual(
      isAuthenticAvatarUrl('https://lh3.googleusercontent.com/a/ACg8ocIKasDvJq31cLOP2Q4FM_pEyCZnqsOx5oL8eWa_UIz6GfMs6w=s96-c'),
      true,
      'Direct Google avatar URL must be recognized as authentic'
    );

    // Clerk proxy wrapping Google avatar (type: "proxy")
    const googleProxyToken = Buffer.from(JSON.stringify({
      type: 'proxy',
      src: 'https://lh3.googleusercontent.com/a/ACg8oc_sample=s1000-c',
      s: 'sig123',
    })).toString('base64');
    assert.strictEqual(
      isAuthenticAvatarUrl(`https://img.clerk.com/${googleProxyToken}`),
      true,
      'Clerk proxy URL wrapping a Google avatar must be recognized as authentic'
    );

    // Standard HTTPS external photo
    assert.strictEqual(
      isAuthenticAvatarUrl('https://avatars.githubusercontent.com/u/12345'),
      true,
      'Standard HTTPS image URL must be recognized as authentic'
    );
  });

  it('isAuthenticAvatarUrl rejects Clerk generic purple placeholder avatars and invalid inputs', () => {
    // Clerk default placeholder token (type: "default")
    const clerkDefaultToken = Buffer.from(JSON.stringify({
      type: 'default',
      iid: 'ins_3LMocvBYysmHWl91ylt2KoLWpy8',
      rid: 'user_3LN6vKBLr0Tsw9tJPLJe6v5VTwn',
      initials: 'SK',
    })).toString('base64');
    assert.strictEqual(
      isAuthenticAvatarUrl(`https://img.clerk.com/${clerkDefaultToken}`),
      false,
      'Clerk default generated avatar must be rejected to prevent displaying generic purple placeholder'
    );

    // Empty and null inputs
    assert.strictEqual(isAuthenticAvatarUrl(''), false, 'Empty string must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('   '), false, 'Whitespace must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl(null), false, 'Null must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl(undefined), false, 'Undefined must be rejected');

    // Non-http schemes
    assert.strictEqual(isAuthenticAvatarUrl('javascript:alert(1)'), false, 'javascript: scheme must be rejected');
    assert.strictEqual(isAuthenticAvatarUrl('blob:http://localhost/123'), false, 'blob: scheme must be rejected');
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
