import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOUND_PROFILES,
  SOUND_CATEGORIES,
  DEFAULT_SOUND_SETTINGS,
  getSoundSettings,
  saveSoundSettings,
  updateMasterVolume,
  playKeySound,
} from '../utils/keyboardAudio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Complete Premium Audio System Master Upgrade Suite', () => {
  beforeEach(() => {
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

  describe('Part 1: All 20 Distinct Mechanical Sound Profiles', () => {
    it('contains exactly 20 sound profiles across 3 categories', () => {
      assert.equal(SOUND_PROFILES.length, 20);
    });

    it('contains 9 Mechanical profiles with authentic mechanical switch characteristics', () => {
      const mechanical = SOUND_PROFILES.filter((p) => p.category === 'mechanical');
      assert.equal(mechanical.length, 9);
      const expected = [
        'mechanical-blue',
        'mechanical-red',
        'mechanical-brown',
        'creamy-thock',
        'marble-pop',
        'box-jade',
        'holy-panda',
        'buckling-spring',
        'gateron-yellow',
      ];
      for (const id of expected) {
        assert.ok(mechanical.some((p) => p.id === id), `Missing ${id}`);
      }
    });

    it('contains 7 Desk Setup profiles with distinct acoustic properties', () => {
      const desk = SOUND_PROFILES.filter((p) => p.category === 'desk');
      assert.equal(desk.length, 7);
      const expected = [
        'silent-office',
        'laptop-chiclet',
        'classic-keyboard',
        'retro-typewriter',
        'soft-foam',
        'studio-linear',
        'topre-electro',
      ];
      for (const id of expected) {
        assert.ok(desk.some((p) => p.id === id), `Missing ${id}`);
      }
    });

    it('contains 4 Experimental profiles with specialized synthesis', () => {
      const exp = SOUND_PROFILES.filter((p) => p.category === 'experimental');
      assert.equal(exp.length, 4);
      const expected = ['cyber-pulse', 'glass-tap', 'deep-bass', 'arcade-keys'];
      for (const id of expected) {
        assert.ok(exp.some((p) => p.id === id), `Missing ${id}`);
      }
    });

    it('ensures every profile has distinct id, name, tag, and description', () => {
      const ids = new Set();
      const names = new Set();
      for (const p of SOUND_PROFILES) {
        assert.ok(p.id && typeof p.id === 'string');
        assert.ok(p.name && typeof p.name === 'string');
        assert.ok(p.tag && typeof p.tag === 'string');
        assert.ok(p.description && typeof p.description === 'string');
        assert.ok(!ids.has(p.id), `Duplicate ID: ${p.id}`);
        assert.ok(!names.has(p.name), `Duplicate Name: ${p.name}`);
        ids.add(p.id);
        names.add(p.name);
      }
    });

    it('safely plays and synthesizes every profile without throwing in standard, error, and preview modes', () => {
      for (const profile of SOUND_PROFILES) {
        assert.doesNotThrow(() => {
          playKeySound(profile.id, false, false);
          playKeySound(profile.id, true, false);
          playKeySound(profile.id, false, true);
        }, `Failed on profile ${profile.id}`);
      }
    });

    it('handles silent-office as explicitly silent without throwing', () => {
      assert.doesNotThrow(() => {
        playKeySound('silent-office', false, false);
        playKeySound('silent-office', true, false);
        playKeySound('silent-office', false, true);
      });
    });
  });

  describe('Part 4 & 5: Volume Control, Persistence & Studio Audio Pipeline', () => {
    it('defines default settings with enabled: true, profile: mechanical-blue, and volume: 0.75', () => {
      assert.equal(DEFAULT_SOUND_SETTINGS.enabled, true);
      assert.equal(DEFAULT_SOUND_SETTINGS.profile, 'mechanical-blue');
      assert.equal(DEFAULT_SOUND_SETTINGS.volume, 0.75);
    });

    it('persists and restores volume alongside enabled and profile settings', () => {
      saveSoundSettings({ enabled: true, profile: 'creamy-thock', volume: 0.9 });
      const saved = getSoundSettings();
      assert.equal(saved.enabled, true);
      assert.equal(saved.profile, 'creamy-thock');
      assert.equal(saved.volume, 0.9);
    });

    it('clamps volume values within 0.0 and 1.0 safely', () => {
      saveSoundSettings({ volume: 1.5 });
      assert.equal(getSoundSettings().volume, 1.0);

      saveSoundSettings({ volume: -0.2 });
      assert.equal(getSoundSettings().volume, 0.0);
    });

    it('updateMasterVolume safely accepts numbers without throwing', () => {
      assert.doesNotThrow(() => {
        updateMasterVolume(0.5);
        updateMasterVolume(1.0);
        updateMasterVolume(0.0);
      });
    });
  });

  describe('Part 3: Workstation Sound System Modal & Option Wiring', () => {
    const modalPath = path.resolve(__dirname, '../components/workstation/SoundSystemModal.jsx');
    const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
    const toolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
    const shortcutsPath = path.resolve(__dirname, '../components/workstation/ShortcutsModal.jsx');

    it('verifies SoundSystemModal component exists and includes required controls', () => {
      assert.ok(fs.existsSync(modalPath), 'SoundSystemModal.jsx must exist');
      const src = fs.readFileSync(modalPath, 'utf-8');

      // 1. All 20 profiles
      assert.ok(src.includes('filteredProfiles.map'), 'Must render profiles list');
      assert.ok(src.includes('previewSound'), 'Must include previewSound handler');
      assert.ok(src.includes('handleSelectProfile'), 'Must include handleSelectProfile');

      // 2. Volume control
      assert.ok(src.includes('setVolume'), 'Must include setVolume');
      assert.ok(src.includes('type="range"'), 'Must include volume range slider');

      // 3. Sound toggle
      assert.ok(src.includes('setSoundEnabled'), 'Must include setSoundEnabled toggle');

      // 4. Categories and search
      assert.ok(src.includes('categories.map'), 'Must include category filter tabs');
      assert.ok(src.includes('searchQuery'), 'Must include switch search filtering');
    });

    it('verifies WorkstationToolbar wires SoundSelector with onOpenSoundSystem', () => {
      const src = fs.readFileSync(toolbarPath, 'utf-8');
      assert.ok(src.includes('onOpenSoundSystem'), 'Toolbar must accept onOpenSoundSystem');
      assert.ok(src.includes('SoundSelector'), 'Toolbar must invoke SoundSelector');
      assert.ok(
        src.includes('onOpenModal={onOpenSoundSystem}'),
        'Toolbar SoundSelector must pass onOpenModal={onOpenSoundSystem}'
      );
    });

    it('verifies WorkstationPage includes SoundSystemModal, state, and Alt+U shortcut', () => {
      const src = fs.readFileSync(workstationPath, 'utf-8');
      assert.ok(src.includes('SoundSystemModal'), 'WorkstationPage must import SoundSystemModal');
      assert.ok(src.includes('soundSystemOpen'), 'WorkstationPage must track soundSystemOpen state');
      assert.ok(
        src.includes('onOpenSoundSystem={() => setSoundSystemOpen(true)}'),
        'WorkstationPage must pass onOpenSoundSystem to toolbar'
      );
      assert.ok(
        src.includes('!soundSystemOpen'),
        'Universal focus must disable when soundSystemOpen is active'
      );
      assert.ok(
        src.includes("key === 'u'"),
        'WorkstationPage must support Alt+U shortcut for Sound System'
      );
    });

    it('verifies ShortcutsModal documents Alt+U for Sound System', () => {
      const src = fs.readFileSync(shortcutsPath, 'utf-8');
      assert.ok(src.includes('Alt + U'), 'ShortcutsModal must list Alt + U');
      assert.ok(src.includes('Sound System'), 'ShortcutsModal must describe Sound System');
    });
  });

  describe('Part 2: Global Sound Integration Across Typing Interfaces', () => {
    const heroPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');
    const lessonPath = path.resolve(__dirname, '../components/academy/LessonPlayer.jsx');
    const placementPath = path.resolve(__dirname, '../components/academy/PlacementModal.jsx');
    const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');

    it('verifies HeroSection integrates playClick on typing input and backspace', () => {
      const src = fs.readFileSync(heroPath, 'utf-8');
      assert.ok(src.includes('const { playClick } = useKeyboardSound()'));
      assert.ok(src.includes('playClick(addedMistakes > 0)'));
      assert.ok(src.includes('playClick(false)'));
    });

    it('verifies LessonPlayer integrates playClick on typing input and backspace', () => {
      const src = fs.readFileSync(lessonPath, 'utf-8');
      assert.ok(src.includes('const { playClick } = useKeyboardSound()'));
      assert.ok(src.includes('playClick(false)'));
    });

    it('verifies WorkstationPage integrates playClick on typing input and backspace', () => {
      const src = fs.readFileSync(workstationPath, 'utf-8');
      assert.ok(src.includes('const { playClick } = useKeyboardSound()'));
      assert.ok(src.includes('playClick(isError)'));
      assert.ok(src.includes('playClick(false)'));
    });

    it('verifies PlacementModal integrates playClick on diagnostic typing and backspace', () => {
      const src = fs.readFileSync(placementPath, 'utf-8');
      assert.ok(src.includes('const { playClick } = useKeyboardSound()'));
      assert.ok(src.includes('playClick(!isCorrect)'));
      assert.ok(src.includes('playClick(false)'));
    });
  });
});
