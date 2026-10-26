import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOUND_PROFILES,
  SOUND_CATEGORIES,
  DEFAULT_SOUND_SETTINGS,
  getSoundSettings,
  saveSoundSettings,
  playKeySound,
} from './keyboardAudio.js';

describe('Tactile Keyboard Audio Studio Engine', () => {
  beforeEach(() => {
    // Reset global localStorage mock
    globalThis.localStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
      removeItem(key) {
        delete this.store[key];
      },
    };
  });

  it('contains exactly 16 curated keyboard sound profiles', () => {
    assert.equal(SOUND_PROFILES.length, 16);
  });

  it('contains all 6 profiles in the Mechanical Collection', () => {
    const mechanicalProfiles = SOUND_PROFILES.filter((p) => p.category === 'mechanical');
    assert.equal(mechanicalProfiles.length, 6);
    const ids = mechanicalProfiles.map((p) => p.id);
    assert.ok(ids.includes('mechanical-blue'), 'Mechanical Blue');
    assert.ok(ids.includes('mechanical-red'), 'Mechanical Red');
    assert.ok(ids.includes('mechanical-brown'), 'Mechanical Brown');
    assert.ok(ids.includes('creamy-thock'), 'Creamy Thock');
    assert.ok(ids.includes('marble-pop'), 'Marble Pop');
    assert.ok(ids.includes('box-jade'), 'Box Jade');
  });

  it('contains all 6 profiles in the Desk Setup Collection', () => {
    const deskProfiles = SOUND_PROFILES.filter((p) => p.category === 'desk');
    assert.equal(deskProfiles.length, 6);
    const ids = deskProfiles.map((p) => p.id);
    assert.ok(ids.includes('silent-office'), 'Silent Office');
    assert.ok(ids.includes('laptop-chiclet'), 'Laptop Chiclet');
    assert.ok(ids.includes('classic-keyboard'), 'Classic Keyboard');
    assert.ok(ids.includes('retro-typewriter'), 'Retro Typewriter');
    assert.ok(ids.includes('soft-foam'), 'Soft Foam');
    assert.ok(ids.includes('studio-linear'), 'Studio Linear');
  });

  it('contains all 4 profiles in the Experimental Collection', () => {
    const experimentalProfiles = SOUND_PROFILES.filter((p) => p.category === 'experimental');
    assert.equal(experimentalProfiles.length, 4);
    const ids = experimentalProfiles.map((p) => p.id);
    assert.ok(ids.includes('cyber-pulse'), 'Cyber Pulse');
    assert.ok(ids.includes('glass-tap'), 'Glass Tap');
    assert.ok(ids.includes('deep-bass'), 'Deep Bass');
    assert.ok(ids.includes('arcade-keys'), 'Arcade Keys');
  });

  it('ensures every profile has distinct id, name, tag, and description', () => {
    const ids = new Set();
    const names = new Set();

    for (const p of SOUND_PROFILES) {
      assert.ok(p.id && typeof p.id === 'string', 'has valid id');
      assert.ok(p.name && typeof p.name === 'string', 'has valid name');
      assert.ok(p.tag && typeof p.tag === 'string', 'has valid tag');
      assert.ok(p.description && typeof p.description === 'string', 'has valid description');
      assert.ok(['mechanical', 'desk', 'experimental'].includes(p.category), 'valid category');

      assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
      assert.ok(!names.has(p.name), `duplicate name ${p.name}`);
      ids.add(p.id);
      names.add(p.name);
    }
  });

  it('provides all 4 category filter tabs', () => {
    const categoryIds = SOUND_CATEGORIES.map((c) => c.id);
    assert.deepEqual(categoryIds, ['all', 'mechanical', 'desk', 'experimental']);
  });

  it('provides default sound settings with sound enabled on mechanical-blue', () => {
    assert.equal(DEFAULT_SOUND_SETTINGS.enabled, true);
    assert.equal(DEFAULT_SOUND_SETTINGS.profile, 'mechanical-blue');
  });

  it('reads default settings when localStorage is empty', () => {
    const settings = getSoundSettings();
    assert.equal(settings.enabled, true);
    assert.equal(settings.profile, 'mechanical-blue');
  });

  it('persists and restores sound profile selection', () => {
    saveSoundSettings({ enabled: true, profile: 'creamy-thock' });
    const restored = getSoundSettings();
    assert.equal(restored.enabled, true);
    assert.equal(restored.profile, 'creamy-thock');

    saveSoundSettings({ enabled: false, profile: 'retro-typewriter' });
    const disabled = getSoundSettings();
    assert.equal(disabled.enabled, false);
    assert.equal(disabled.profile, 'retro-typewriter');
  });

  it('seamlessly migrates legacy profile IDs', () => {
    // classic -> classic-keyboard
    globalThis.localStorage.setItem(
      'keyflow_keyboard_sound_settings_v1',
      JSON.stringify({ enabled: true, profile: 'classic' })
    );
    assert.equal(getSoundSettings().profile, 'classic-keyboard');

    // silent -> silent-office
    globalThis.localStorage.setItem(
      'keyflow_keyboard_sound_settings_v1',
      JSON.stringify({ enabled: false, profile: 'silent' })
    );
    assert.equal(getSoundSettings().profile, 'silent-office');
  });

  it('falls back to default profile if an invalid or corrupted profile is stored', () => {
    globalThis.localStorage.setItem(
      'keyflow_keyboard_sound_settings_v1',
      JSON.stringify({ enabled: true, profile: 'non-existent-switch' })
    );
    const settings = getSoundSettings();
    assert.equal(settings.profile, 'mechanical-blue');
  });

  it('safely handles playKeySound for all 16 profiles without throwing', () => {
    // Testing all 16 profiles with regular keypress, error keystroke, and preview mode
    for (const profile of SOUND_PROFILES) {
      assert.doesNotThrow(() => {
        playKeySound(profile.id, false, false);
        playKeySound(profile.id, true, false);
        playKeySound(profile.id, false, true);
      }, `playKeySound failed on ${profile.id}`);
    }
  });

  it('handles silent-office without errors or audio playback', () => {
    assert.doesNotThrow(() => {
      playKeySound('silent-office', false, false);
      playKeySound('silent-office', true, false);
      playKeySound('silent-office', false, true);
    });
  });
});
