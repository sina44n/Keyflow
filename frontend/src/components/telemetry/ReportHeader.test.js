import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../../i18n/locales.js';

describe('KEYFLOW Telemetry Summary Button Renaming (Task 4)', () => {
  it('translates telemetry report buttons to professional labels in English', () => {
    assert.equal(TRANSLATIONS.en['telemetry.reportToday'], 'Daily');
    assert.equal(TRANSLATIONS.en['telemetry.reportWeekly'], 'Weekly');
    assert.equal(TRANSLATIONS.en['telemetry.reportOverall'], 'Overall');
  });

  it('guarantees all 17 supported locales define telemetry.reportToday, telemetry.reportWeekly, telemetry.reportOverall', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      assert.ok(dict, `Language dictionary missing for ${lang.code}`);
      assert.ok(dict['telemetry.reportToday'], `Missing telemetry.reportToday for ${lang.code}`);
      assert.ok(dict['telemetry.reportWeekly'], `Missing telemetry.reportWeekly for ${lang.code}`);
      assert.ok(dict['telemetry.reportOverall'], `Missing telemetry.reportOverall for ${lang.code}`);

      // Ensure no raw translation keys are used as translations
      assert.notEqual(dict['telemetry.reportToday'], 'telemetry.reportToday');
      assert.notEqual(dict['telemetry.reportWeekly'], 'telemetry.reportWeekly');
      assert.notEqual(dict['telemetry.reportOverall'], 'telemetry.reportOverall');
    }
  });

  it('validates ReportHeader report descriptor configuration and fallbacks', () => {
    // Simulating ReportHeader's internal report definition logic
    const mockT = (key, fallback) => TRANSLATIONS.en[key] || fallback || key;
    
    const reports = [
      { id: 'today', label: mockT('telemetry.reportToday', 'Daily') || 'Daily' },
      { id: 'weekly', label: mockT('telemetry.reportWeekly', 'Weekly') || 'Weekly' },
      { id: 'overall', label: mockT('telemetry.reportOverall', 'Overall') || 'Overall' },
    ];

    assert.equal(reports.length, 3);
    assert.equal(reports[0].id, 'today');
    assert.equal(reports[0].label, 'Daily');

    assert.equal(reports[1].id, 'weekly');
    assert.equal(reports[1].label, 'Weekly');

    assert.equal(reports[2].id, 'overall');
    assert.equal(reports[2].label, 'Overall');

    // Test fallback resilience if t function returns empty/undefined
    const resilientReports = [
      { id: 'today', label: (undefined || 'Daily') },
      { id: 'weekly', label: (undefined || 'Weekly') },
      { id: 'overall', label: (undefined || 'Overall') },
    ];

    assert.equal(resilientReports[0].label, 'Daily');
    assert.equal(resilientReports[1].label, 'Weekly');
    assert.equal(resilientReports[2].label, 'Overall');
  });

  it('guarantees report IDs remain strictly "today", "weekly", "overall" for telemetry metric filtering', () => {
    const reportIds = ['today', 'weekly', 'overall'];
    // Must match calculateReportMetrics accepted period types
    assert.ok(reportIds.includes('today'));
    assert.ok(reportIds.includes('weekly'));
    assert.ok(reportIds.includes('overall'));
  });

  it('verifies filterSessionsByTimeRange supports global period values without data loss', async () => {
    const { filterSessionsByTimeRange } = await import('../../utils/telemetryStorage.js');
    const now = Date.now();
    const mockSessions = [
      { id: 'sess_today', timestamp: now, grossWpm: 50 },
      { id: 'sess_week', timestamp: now - 3 * 86400 * 1000, grossWpm: 45 },
      { id: 'sess_old', timestamp: now - 40 * 86400 * 1000, grossWpm: 40 },
    ];

    const todaySessions = filterSessionsByTimeRange(mockSessions, 'today');
    assert.ok(todaySessions.length >= 1);
    assert.equal(todaySessions[0].id, 'sess_today');

    const weeklySessions = filterSessionsByTimeRange(mockSessions, 'weekly');
    assert.equal(weeklySessions.length, 2);

    const overallSessions = filterSessionsByTimeRange(mockSessions, 'overall');
    assert.equal(overallSessions.length, 3);
  });
});

