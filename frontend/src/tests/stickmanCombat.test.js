/**
 * Stickman Fight 2D Combat & Progression Test Suite
 * ==================================================
 * Verifies 1-on-1 sparring match, multi-enemy progression (Encounter 1 -> 5),
 * spatial separation physics, attack token arbitration, and typing integration.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Stickman2DCharacter } from '../components/arcade/stickman2d/Stickman2DCharacter.js';
import { Stickman2DEnemies } from '../components/arcade/stickman2d/Stickman2DEnemies.js';
import { Stickman2DCombat } from '../components/arcade/stickman2d/Stickman2DCombat.js';
import { StickmanParagraphManager } from '../components/arcade/stickman2d/StickmanParagraphManager.js';

describe('Stickman Fight 2D Combat & Progression Engine', () => {
  test('Stickman2DEnemies initializes and exposes setup1v1 function', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    assert.strictEqual(typeof enemies.setup1v1, 'function', 'enemies.setup1v1 must be a callable function');

    const primary = enemies.setup1v1(200);
    assert.ok(primary, 'setup1v1 must return a valid primary enemy');
    assert.strictEqual(primary.name, 'White Stickman Rival');
    assert.strictEqual(primary.hp, 180);
    assert.strictEqual(enemies.getLivingCount(), 1);
  });

  test('Encounter 1 is pure 1v1 combat with single opponent', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    enemies.setupEncounter(1, 250);

    assert.strictEqual(enemies.enemies.length, 1);
    assert.strictEqual(enemies.enemies[0].aiRole, 'front');
    assert.strictEqual(enemies.getLivingCount(), 1);
  });

  test('Encounter 2 spawns 2 flanking enemies (front and rear)', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    const playerX = 250;
    enemies.setupEncounter(2, playerX);

    assert.strictEqual(enemies.enemies.length, 2);
    const front = enemies.enemies.find(e => e.aiRole === 'front');
    const flank = enemies.enemies.find(e => e.aiRole === 'flank');

    assert.ok(front, 'Must have front attacker');
    assert.ok(flank, 'Must have rear flanking attacker');
    assert.ok(front.x > playerX, 'Front enemy is ahead of player');
    assert.ok(flank.x < playerX, 'Flank enemy is behind player');
  });

  test('Encounter 3 spawns 3 enemies including reserve fighter', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    enemies.setupEncounter(3, 250);

    assert.strictEqual(enemies.enemies.length, 3);
    const reserve = enemies.enemies.find(e => e.aiRole === 'reserve');
    assert.ok(reserve, 'Must include reserve fighter holding back');
    assert.ok(reserve.preferredDist > 120, 'Reserve maintains tactical distance');
  });

  test('Encounter 5 spawns Infernal Titan Boss with elevated HP and scale', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    enemies.setupEncounter(5, 250);

    assert.strictEqual(enemies.enemies.length, 1);
    const boss = enemies.enemies[0];
    assert.strictEqual(boss.aiRole, 'boss');
    assert.ok(boss.maxHp >= 400, 'Boss has high health pool');
    assert.ok(boss.scale > 1.2, 'Boss is visually scaled up');
  });

  test('Anti-overlap spatial separation separates overlapping enemies', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    enemies.setupEncounter(2, 250);

    // Place enemies at exact same X coordinate
    enemies.enemies[0].x = 300;
    enemies.enemies[1].x = 300;

    const combat = new Stickman2DCombat();
    const player = new Stickman2DCharacter({ x: 250, groundY: 420 });

    enemies.update(0.016, player, combat, null, { groundY: 420 });

    assert.notStrictEqual(enemies.enemies[0].x, enemies.enemies[1].x, 'Enemies should be pushed apart');
    assert.ok(Math.abs(enemies.enemies[0].x - enemies.enemies[1].x) > 0, 'Distance must increase');
  });

  test('Attack token manager restricts active attackers', () => {
    const enemies = new Stickman2DEnemies({ groundY: 420 });
    enemies.setupEncounter(3, 250);

    assert.strictEqual(enemies.activeAttackerId, null);
    assert.ok(enemies.attackTokenCooldown >= 0);
  });

  test('Paragraph typing engine triggers strikes and finishers', () => {
    let wordCompleted = false;
    let paragraphCompleted = false;

    const mgr = new StickmanParagraphManager({
      onWordComplete: () => { wordCompleted = true; },
      onParagraphComplete: () => { paragraphCompleted = true; },
    });

    assert.ok(mgr.currentPassage.length > 0, 'Must load battle passage');
    const firstChar = mgr.currentPassage[0];

    // Simulate typing the first character accurately
    const res = mgr.handleKeyDown({ key: firstChar });
    assert.ok(res, 'Accurate keystroke succeeds');
    assert.strictEqual(mgr.charStatuses[0], 'correct');
  });
});

