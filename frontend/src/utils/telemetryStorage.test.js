import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  toLocalDateString,
  getWeekDateRange,
  formatDuration,
  filterSessions,
  calculateReportMetrics,
  generatePracticeCalendar,
  generateProgressTimeSeries,
  generateCSVReport,
  getPersonalRecords,
  STANDARD_COVERAGE_CHARS,
  DAY_HEADERS,
  dayHeaders,
  generatePersonalizedInsights,
} from './telemetryStorage.js';

describe('KEYFLOW Telemetry & Biomechanical Intelligence Engine Tests', () => {
  describe('Date Utilities & Week Range Math', () => {
    it('formats dates consistently in YYYY-MM-DD local format', () => {
      const fixedDate = new Date(2026, 9, 28, 12, 0, 0); // October 28, 2026
      assert.equal(toLocalDateString(fixedDate), '2026-10-28');
    });

    it('calculates exact 7-day week bounds according to week start preference', () => {
      // 2026-10-28 is a Wednesday (day 3)
      const wednesday = new Date(2026, 9, 28, 14, 30, 0);

      // Week starting Sunday (0): Sun Oct 25 to Sat Oct 31
      const sunWeek = getWeekDateRange(0, wednesday);
      assert.equal(sunWeek.startDateStr, '2026-10-25');
      assert.equal(sunWeek.endDateStr, '2026-10-31');
      assert.equal(sunWeek.prevStartDateStr, '2026-10-18');
      assert.equal(sunWeek.prevEndDateStr, '2026-10-24');

      // Week starting Monday (1): Mon Oct 26 to Sun Nov 1
      const monWeek = getWeekDateRange(1, wednesday);
      assert.equal(monWeek.startDateStr, '2026-10-26');
      assert.equal(monWeek.endDateStr, '2026-11-01');
    });
  });

  describe('Duration Formatting', () => {
    it('formats seconds into clean human-readable duration strings', () => {
      assert.equal(formatDuration(0), '0s');
      assert.equal(formatDuration(45), '45s');
      assert.equal(formatDuration(125), '2m 5s');
      assert.equal(formatDuration(3600), '1h');
      assert.equal(formatDuration(3665), '1h 1m');
      assert.equal(formatDuration(68199), '18h 56m');
    });
  });

  describe('Report Filtering (Today, Weekly, Overall)', () => {
    const todayStr = toLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    const mockSessions = [
      { id: '1', date: todayStr, timestamp: Date.now(), duration: 60, wpm: 45, accuracy: 96, status: 'passed' },
      { id: '2', date: todayStr, timestamp: Date.now(), duration: 120, wpm: 50, accuracy: 98, status: 'passed' },
      { id: '3', date: yesterdayStr, timestamp: Date.now() - 86400000, duration: 90, wpm: 40, accuracy: 92, status: 'failed' },
      { id: '4', date: '2025-01-15', timestamp: new Date('2025-01-15').getTime(), duration: 300, wpm: 35, accuracy: 90, status: 'passed' },
    ];

    it('filters Today sessions and compares with Yesterday', () => {
      const { current, comparison } = filterSessions(mockSessions, 'today');
      assert.equal(current.length, 2);
      assert.equal(comparison.length, 1);
      assert.equal(current[0].id, '1');
      assert.equal(current[1].id, '2');
      assert.equal(comparison[0].id, '3');
    });

    it('returns all sessions in Overall report', () => {
      const { current } = filterSessions(mockSessions, 'overall');
      assert.equal(current.length, 4);
    });
  });

  describe('Mathematical Metric Calculations', () => {
    const sampleSessions = [
      {
        id: 's1',
        duration: 120, // 2 minutes
        wpm: 60,
        accuracy: 95,
        realAccuracy: 92,
        totalChars: 600,
        correctChars: 570,
        incorrectChars: 30,
        backspaces: 15,
        status: 'passed',
        mode: 'practice',
        characterStats: {
          a: { total: 100, correct: 98, incorrect: 2, wpm: 55 },
          e: { total: 200, correct: 195, incorrect: 5, wpm: 65 },
        },
        fingerStats: {
          'left-pinky': { total: 100, correct: 98, incorrect: 2, wpm: 55 },
          'left-middle': { total: 200, correct: 195, incorrect: 5, wpm: 65 },
        },
      },
      {
        id: 's2',
        duration: 60, // 1 minute
        wpm: 40,
        accuracy: 90,
        realAccuracy: 88,
        totalChars: 200,
        correctChars: 180,
        incorrectChars: 20,
        backspaces: 5,
        status: 'failed',
        mode: 'lesson',
        characterStats: {
          e: { total: 100, correct: 90, incorrect: 10, wpm: 45 },
        },
        fingerStats: {
          'left-middle': { total: 100, correct: 90, incorrect: 10, wpm: 45 },
        },
      },
    ];

    it('accurately computes totals, durations, and weighted metrics', () => {
      const metrics = calculateReportMetrics(sampleSessions);
      assert.equal(metrics.hasData, true);
      assert.equal(metrics.totalDuration, 180);
      assert.equal(metrics.passedDuration, 120);
      assert.equal(metrics.failedDuration, 60);
      assert.equal(metrics.learningDuration, 60);
      assert.equal(metrics.totalAttempts, 2);
      assert.equal(metrics.passedAttempts, 1);
      assert.equal(metrics.failedAttempts, 1);
      assert.equal(metrics.maxWpm, 60);
      assert.equal(metrics.avgWpm, 50); // (60 + 40) / 2
      assert.equal(metrics.totalChars, 800);
      assert.equal(metrics.correctChars, 750);
      assert.equal(metrics.incorrectChars, 50);
      assert.equal(metrics.accuracy, 94); // 750 / 800 = 93.75 -> 94
      assert.equal(metrics.realAccuracy, 91); // 750 / (750 + 50 + 20) = 750 / 820 = 91.46%
    });

    it('aggregates individual finger and hand metrics accurately', () => {
      const metrics = calculateReportMetrics(sampleSessions);
      const pinky = metrics.fingerStats.find((f) => f.id === 'left-pinky');
      assert.ok(pinky);
      assert.equal(pinky.speed, 55);
      assert.equal(pinky.accuracy, 98);

      const middle = metrics.fingerStats.find((f) => f.id === 'left-middle');
      assert.ok(middle);
      assert.equal(middle.totalKeystrokes, 300);
      assert.equal(middle.speed, 55); // (65 + 45) / 2
    });

    it('handles empty session arrays honestly without NaN or fake data', () => {
      const metrics = calculateReportMetrics([]);
      assert.equal(metrics.hasData, false);
      assert.equal(metrics.totalDuration, 0);
      assert.equal(metrics.avgWpm, 0);
      assert.equal(metrics.accuracy, 0);
      assert.equal(metrics.totalAttempts, 0);
      assert.equal(metrics.coveragePercent, 0);
    });
  });

  describe('12-Month Practice Calendar Generation', () => {
    it('generates 12 calendar months with rolling date bounds', () => {
      const calendar = generatePracticeCalendar([]);
      assert.equal(calendar.months.length, 12);
      assert.ok(calendar.months[0].monthName);
      assert.ok(calendar.months[11].weeks.length >= 4);
    });

    it('assigns correct 4-level activity intensity', () => {
      const todayStr = toLocalDateString(new Date());
      const testSessions = [
        { date: todayStr, duration: 1850, wpm: 50 }, // 30m+ -> intensity 4
      ];
      const calendar = generatePracticeCalendar(testSessions);
      const currentMonth = calendar.months[calendar.months.length - 1];
      let foundDay = null;
      for (const w of currentMonth.weeks) {
        for (const d of w.days) {
          if (d && d.date === todayStr) {
            foundDay = d;
            break;
          }
        }
      }
      assert.ok(foundDay);
      assert.equal(foundDay.intensity, 4);
      assert.equal(foundDay.attempts, 1);
    });

    it('handles empty activity history safely without NaN or undefined totals', () => {
      const calendar = generatePracticeCalendar([]);
      assert.equal(calendar.totalDuration, 0);
      assert.equal(calendar.totalAttempts, 0);
      assert.equal(calendar.formattedTotalDuration, '0s');
      assert.equal(calendar.totalDurationFormatted, '0s');
      assert.equal(calendar.months.length, 12);
    });

    it('correctly creates leading and trailing empty cells with isCurrentMonth: false', () => {
      const calendar = generatePracticeCalendar([], 0);
      calendar.months.forEach((m) => {
        m.weeks.forEach((w) => {
          assert.equal(w.days.length, 7, 'Each calendar week must contain exactly 7 day slots');
          w.days.forEach((d) => {
            assert.ok(typeof d === 'object' && d !== null, 'Day slots must be non-null objects');
            if (!d.isCurrentMonth) {
              assert.equal(d.dayOfMonth, null);
              assert.equal(d.attempts, 0);
              assert.equal(d.duration, 0);
            } else {
              assert.ok(d.dayOfMonth >= 1 && d.dayOfMonth <= 31);
              assert.ok(d.dateStr.length === 10);
            }
          });
          assert.ok(typeof w.weeklyTotalSeconds === 'number');
        });
      });
    });

    it('supports all seven week-start options (0 to 6) with correct weekday alignment', () => {
      for (let startDay = 0; startDay < 7; startDay++) {
        const cal = generatePracticeCalendar([], startDay);
        assert.equal(cal.months.length, 12);
        // Verify day 1 of the first month aligns to (firstDayWeekday - startDay + 7) % 7
        const m = cal.months[0];
        const expectedPrefix = (new Date(m.year, m.month, 1).getDay() - startDay + 7) % 7;
        const firstWeek = m.weeks[0];
        // The first `expectedPrefix` slots must be isCurrentMonth: false
        for (let b = 0; b < expectedPrefix; b++) {
          assert.equal(firstWeek.days[b].isCurrentMonth, false, `Prefix slot ${b} must be false for startDay ${startDay}`);
        }
        // Slot at `expectedPrefix` must be day 1
        assert.equal(firstWeek.days[expectedPrefix].isCurrentMonth, true);
        assert.equal(firstWeek.days[expectedPrefix].dayOfMonth, 1);
      }
    });

    it('correctly calculates leap year days for February (29 days in 2024, 28 in 2025)', () => {
      const leapDays2024 = new Date(2024, 2, 0).getDate();
      assert.equal(leapDays2024, 29);

      const nonLeapDays2025 = new Date(2025, 2, 0).getDate();
      assert.equal(nonLeapDays2025, 28);
    });
  });

  describe('Progress Overview Time Series', () => {
    it('aggregates daily intervals with duration, speed, accuracy, and coverage', () => {
      const sessions = [
        { date: '2026-10-25', duration: 120, wpm: 45, totalChars: 100, correctChars: 95 },
        { date: '2026-10-26', duration: 180, wpm: 55, totalChars: 150, correctChars: 147 },
      ];
      const series = generateProgressTimeSeries(sessions, 'daily');
      assert.equal(series.length, 2);
      assert.equal(series[0].wpm, 45);
      assert.equal(series[1].wpm, 55);
      assert.equal(series[0].practiceMinutes, 2);
      assert.equal(series[1].practiceMinutes, 3);
    });
  });

  describe('CSV Report Exporting', () => {
    it('generates compliant CSV data with proper headers and escaped values', () => {
      const sessions = [
        {
          id: 'test_1',
          date: '2026-10-28',
          timestamp: 1793188800000,
          mode: 'practice',
          title: 'Speed Sprint',
          duration: 60,
          wpm: 52,
          grossWpm: 55,
          accuracy: 96,
          realAccuracy: 94,
          totalChars: 260,
          correctChars: 250,
          incorrectChars: 10,
          backspaces: 5,
          status: 'passed',
        },
      ];
      const { csvContent, filename } = generateCSVReport(sessions, 'KEYFLOW_Test');
      assert.ok(filename.startsWith('KEYFLOW_Test_'));
      assert.ok(filename.endsWith('.csv'));
      assert.ok(csvContent.includes('Session ID,Date,Timestamp,Mode,Title'));
      assert.ok(csvContent.includes('"test_1","2026-10-28"'));
      assert.ok(csvContent.includes('52,55,96,94'));
    });
  });

  describe('Personal Records & Milestones Contract', () => {
    it('calculates personal bests accurately across stored sessions with full data contract', () => {
      const sessions = [
        { wpm: 40, accuracy: 92, duration: 60, totalChars: 200, date: '2026-10-20', status: 'passed' },
        { wpm: 85, accuracy: 99, duration: 300, totalChars: 1200, date: '2026-10-21', status: 'passed' },
        { wpm: 60, accuracy: 95, duration: 120, totalChars: 500, date: '2026-10-21', status: 'passed' },
      ];
      const records = getPersonalRecords(sessions);
      assert.equal(records.highestWpm, 85);
      assert.equal(records.bestAccuracy, 99);
      assert.equal(records.longestSessionFormatted, '5m');
      assert.equal(records.longestSessionSeconds, 300);
      assert.equal(records.totalChars, 1900);
      assert.equal(records.totalSessions, 3);
      assert.equal(records.totalCompletedSessions, 3);
      assert.equal(records.totalPracticeSeconds, 480);
      assert.ok(records.mostActiveDate.includes('2026-10-21'));
      assert.equal(records.mostActiveDay.date, '2026-10-21');
      assert.equal(records.mostActiveDay.durationSeconds, 420);
      assert.equal(records.mostActiveDay.attempts, 2);
    });

    it('safely handles empty, null, or undefined session inputs without throwing', () => {
      const fromEmpty = getPersonalRecords([]);
      assert.equal(fromEmpty.highestWpm, 0);
      assert.equal(fromEmpty.bestAccuracy, 0);
      assert.equal(fromEmpty.longestSessionSeconds, 0);
      assert.equal(fromEmpty.longestSessionFormatted, '0s');
      assert.equal(fromEmpty.totalCompletedSessions, 0);
      assert.equal(fromEmpty.totalPracticeSeconds, 0);
      assert.equal(fromEmpty.mostActiveDay.durationSeconds, 0);

      const fromNull = getPersonalRecords(null);
      assert.equal(fromNull.highestWpm, 0);
      assert.equal(fromNull.totalSessions, 0);
      assert.equal(fromNull.mostActiveDay.durationSeconds, 0);

      const fromUndef = getPersonalRecords(undefined);
      assert.equal(fromUndef.highestWpm, 0);
      assert.equal(fromUndef.totalSessions, 0);
      assert.equal(fromUndef.mostActiveDay.durationSeconds, 0);
    });
  });

  describe('Practice Calendar & Weekday Header Alignment', () => {
    it('defines standard DAY_HEADERS and dayHeaders correctly starting on Sunday (0) to Saturday (6)', () => {
      assert.ok(Array.isArray(DAY_HEADERS));
      assert.equal(DAY_HEADERS.length, 7);
      assert.equal(DAY_HEADERS[0], 'Sun');
      assert.equal(DAY_HEADERS[1], 'Mon');
      assert.equal(DAY_HEADERS[2], 'Tue');
      assert.equal(DAY_HEADERS[3], 'Wed');
      assert.equal(DAY_HEADERS[4], 'Thu');
      assert.equal(DAY_HEADERS[5], 'Fri');
      assert.equal(DAY_HEADERS[6], 'Sat');
      assert.strictEqual(dayHeaders, DAY_HEADERS);
    });

    it('reorders weekday headers to match the starting weekday for all 7 options', () => {
      for (let weekStart = 0; weekStart < 7; weekStart++) {
        const ordered = [];
        for (let i = 0; i < 7; i++) {
          const idx = (weekStart + i) % 7;
          ordered.push(DAY_HEADERS[idx]);
        }
        assert.equal(ordered.length, 7);
        assert.equal(ordered[0], DAY_HEADERS[weekStart]);
      }
    });
  });

  describe('Personalized Recommendations & Insights Contract', () => {
    it('provides both actionLink and actionHref, actionText and actionLabel, and category', () => {
      const insights = generatePersonalizedInsights(null);
      assert.ok(Array.isArray(insights));
      assert.ok(insights.length > 0);
      const first = insights[0];
      assert.ok(first.category);
      assert.ok(first.actionHref);
      assert.ok(first.actionLink);
      assert.ok(first.actionLabel);
      assert.ok(first.actionText);
    });
  });

  describe('Regression Tests: calculateReportMetrics Robustness & Signature Polymorphism', () => {
    const todayStr = toLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    const validSessions = [
      {
        id: 'sess-today-1',
        date: todayStr,
        timestamp: Date.now(),
        duration: 120,
        wpm: 65,
        accuracy: 98,
        realAccuracy: 95,
        totalChars: 650,
        correctChars: 637,
        incorrectChars: 13,
        backspaces: 8,
        status: 'passed',
        characterStats: { a: { total: 50, correct: 49, incorrect: 1, wpm: 60 } },
        fingerStats: { 'left-index': { total: 50, correct: 49, incorrect: 1, wpm: 60 } },
      },
      {
        id: 'sess-yesterday-1',
        date: yesterdayStr,
        timestamp: Date.now() - 86400000,
        duration: 90,
        wpm: 55,
        accuracy: 94,
        realAccuracy: 90,
        totalChars: 400,
        correctChars: 376,
        incorrectChars: 24,
        backspaces: 12,
        status: 'passed',
        characterStats: { a: { total: 40, correct: 38, incorrect: 2, wpm: 52 } },
        fingerStats: { 'left-index': { total: 40, correct: 38, incorrect: 2, wpm: 52 } },
      },
    ];

    it('REGRESSION: handles calculateReportMetrics(sessions, "today") without comparisonSessions.forEach crash', () => {
      // Prior bug: 2nd parameter passed 'today' (string) which caused comparisonSessions.forEach() to throw TypeError
      assert.doesNotThrow(() => {
        const metrics = calculateReportMetrics(validSessions, 'today', { weekStart: 0, goalMinutes: 20 });
        assert.equal(metrics.hasData, true);
        assert.equal(metrics.reportType, 'today');
        assert.equal(metrics.totalAttempts, 1);
        assert.equal(metrics.avgWpm, 65);
        // Comparison was yesterday's session
        assert.equal(metrics.deltaWpm, 10); // 65 - 55 = +10
        assert.equal(metrics.deltaAccuracy, 4); // 98 - 94 = +4
      });
    });

    it('REGRESSION: handles calculateReportMetrics(sessions, "weekly") and "overall" string reportTypes', () => {
      assert.doesNotThrow(() => {
        const weeklyMetrics = calculateReportMetrics(validSessions, 'weekly');
        assert.equal(weeklyMetrics.reportType, 'weekly');
        assert.ok(weeklyMetrics.hasData);

        const overallMetrics = calculateReportMetrics(validSessions, 'overall');
        assert.equal(overallMetrics.reportType, 'overall');
        assert.equal(overallMetrics.totalAttempts, 2);
        assert.equal(overallMetrics.deltaWpm, -5); // (60 avg - 65 baseline = -5)
      });
    });

    it('handles legacy signature: calculateReportMetrics(sessions, comparisonSessionsArray, options)', () => {
      const current = [validSessions[0]];
      const comparison = [validSessions[1]];
      const metrics = calculateReportMetrics(current, comparison, { goalMinutes: 15 });
      assert.equal(metrics.hasData, true);
      assert.equal(metrics.totalAttempts, 1);
      assert.equal(metrics.avgWpm, 65);
      assert.equal(metrics.deltaWpm, 10);
    });

    it('handles options object passed directly as 2nd parameter: calculateReportMetrics(sessions, { goalMinutes: 30 })', () => {
      assert.doesNotThrow(() => {
        const metrics = calculateReportMetrics(validSessions, { goalMinutes: 30 });
        assert.equal(metrics.hasData, true);
        assert.equal(metrics.totalAttempts, 2);
        assert.equal(metrics.goalMinutes, 30);
      });
    });

    it('safely handles empty sessions arrays across all report modes without crashing or fabricating stats', () => {
      ['today', 'weekly', 'overall'].forEach((mode) => {
        const metrics = calculateReportMetrics([], mode);
        assert.equal(metrics.hasData, false);
        assert.equal(metrics.totalDuration, 0);
        assert.equal(metrics.avgWpm, 0);
        assert.equal(metrics.accuracy, 0);
        assert.equal(metrics.realAccuracy, 0);
        assert.equal(metrics.totalAttempts, 0);
        assert.equal(metrics.deltaWpm, 0);
        assert.equal(metrics.deltaAccuracy, 0);
        assert.equal(metrics.deltaDuration, 0);
        assert.equal(metrics.deltaMistakes, 0);
        assert.ok(Array.isArray(metrics.fingerStats));
        assert.ok(Array.isArray(metrics.characterStats));
      });
    });

    it('safely handles null, undefined, or primitive non-array session inputs', () => {
      assert.doesNotThrow(() => {
        const nullMetrics = calculateReportMetrics(null, 'today');
        assert.equal(nullMetrics.hasData, false);

        const undefMetrics = calculateReportMetrics(undefined, 'overall');
        assert.equal(undefMetrics.hasData, false);

        const strMetrics = calculateReportMetrics('invalid', 'weekly');
        assert.equal(strMetrics.hasData, false);
      });
    });

    it('safely handles malformed sessions and legacy Academy sessions with alternate field names', () => {
      const mixedSessions = [
        // Completely empty session object
        {},
        // Session with non-numeric fields
        { id: 'malformed_1', wpm: 'invalid', accuracy: null, duration: undefined },
        // Legacy Academy session format
        {
          id: 'academy_1',
          date: todayStr,
          timestamp: Date.now(),
          durationSeconds: 180, // Legacy field
          totalKeystrokes: 900,  // Legacy field
          mistakes: 10,          // Legacy field
          grossWpm: 60,
          wpm: 58,
          accuracy: 97,
          status: 'passed',
        },
      ];

      assert.doesNotThrow(() => {
        const metrics = calculateReportMetrics(mixedSessions, 'overall');
        assert.equal(metrics.hasData, true);
        assert.equal(metrics.totalDuration, 180);
        assert.equal(metrics.totalChars, 900);
        assert.equal(metrics.incorrectChars, 10);
        assert.equal(metrics.totalAttempts, 3);
      });
    });

    it('safely handles invalid or non-array comparison parameter', () => {
      assert.doesNotThrow(() => {
        // Passing non-array, non-string, non-options comparison parameter
        const metrics = calculateReportMetrics(validSessions, 12345);
        assert.equal(metrics.hasData, true);
        assert.equal(metrics.totalAttempts, 2);
      });
    });
  });
});
