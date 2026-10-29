import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Masterpiece Workstation Upgrade — Architecture & Component Contract', () => {
  it('WorkstationPage integrates WorkstationToolbar, CustomTypingStudio, CompetitionModal, SavedTextsModal, and Focus Mode', () => {
    const pagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(content.includes('WorkstationToolbar'), 'WorkstationToolbar must be imported and rendered');
    assert.ok(content.includes('CustomTypingStudio'), 'CustomTypingStudio must be imported and rendered');
    assert.ok(content.includes('SavedTextsModal'), 'SavedTextsModal must be imported and rendered');
    assert.ok(content.includes('PracticeHistoryModal'), 'PracticeHistoryModal must be imported and rendered');
    assert.ok(content.includes('ShortcutsModal'), 'ShortcutsModal must be imported and rendered');
    assert.ok(content.includes('CompetitionModal'), 'CompetitionModal must be imported and rendered');
    assert.ok(content.includes('focusMode'), 'Focus mode state must be implemented');
  });

  it('Preserves exact core typing box styling and feedback mechanism when panels are closed', () => {
    const pagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Verify key classes of the non-negotiable typing space
    assert.ok(content.includes('min-h-[160px]'), 'Preserves min-h-[160px]');
    assert.ok(content.includes('whitespace-pre-wrap break-words'), 'Preserves text wrapping and whitespace rules');
    assert.ok(content.includes('getCharacterFeedback'), 'Preserves character feedback styling engine');
    assert.ok(content.includes('inputRef'), 'Preserves hidden input focus mechanics');
  });

  it('CustomTypingStudio provides all required settings groups (mode, delimiter, limit, utilities)', () => {
    const studioPath = path.resolve(__dirname, '../components/workstation/CustomTypingStudio.jsx');
    const content = fs.readFileSync(studioPath, 'utf-8');

    assert.ok(content.includes('generationMode'), 'Must support generationMode');
    assert.ok(content.includes('delimiter'), 'Must support delimiter');
    assert.ok(content.includes('limitType'), 'Must support limitType');
    assert.ok(content.includes('removeZeroWidth'), 'Must support zero-width removal');
    assert.ok(content.includes('normalizeSmartQuotes'), 'Must support smart quotes normalization');
    assert.ok(content.includes('normalizeWhitespace'), 'Must support whitespace collapse');
    assert.ok(content.includes('undoHistory'), 'Must support reversible undo for utilities');
  });

  it('CompetitionModal supports lobbies, creation, code join, and real-time leaderboard ranking', () => {
    const compPath = path.resolve(__dirname, '../components/workstation/CompetitionModal.jsx');
    const content = fs.readFileSync(compPath, 'utf-8');

    assert.ok(content.includes('competitionAPI'), 'Must connect to competition API');
    assert.ok(content.includes('handleCreate'), 'Must support creating competition');
    assert.ok(content.includes('handleJoin'), 'Must support joining by code');
    assert.ok(content.includes('leaderboard'), 'Must display verified leaderboard');
  });
});
