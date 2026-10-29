/**
 * KEYFLOW Typing Competition System
 * ==================================
 * Real database-backed competition lobby with code-based joining,
 * shared passage text, and genuine leaderboard ranking.
 * Never fabricates participants, live bots, or fake scores.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Trophy,
  Plus,
  Play,
  Copy,
  Check,
  RefreshCw,
  Award,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react';
import { Button } from '../common/Button';
import { competitionAPI } from '../../utils/api.js';

export const CompetitionModal = ({
  isOpen,
  onClose,
  onStartCompetitionTest,
  user = null,
  activeCompetition = null,
}) => {
  const [activeTab, setActiveTab] = useState('lobbies'); // 'lobbies' | 'create' | 'join' | 'active'

  // Lobbies & state
  const [competitions, setCompetitions] = useState([]);
  const [currentComp, setCurrentComp] = useState(activeCompetition);
  const [myParticipantId, setMyParticipantId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    challenge_type: 'words',
    target_limit: 25,
    difficulty: 'medium',
    max_participants: 10,
    is_public: true,
    display_name: user?.profile?.display_name || user?.username || 'Host',
    challenge_text: '',
  });

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState(
    user?.profile?.display_name || user?.username || ''
  );

  // Sync activeCompetition from props if passed
  useEffect(() => {
    if (activeCompetition) {
      setCurrentComp(activeCompetition);
      setActiveTab('active');
    }
  }, [activeCompetition]);

  // Load public competitions
  const loadCompetitions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await competitionAPI.list();
      setCompetitions(res.data || []);
    } catch {
      // offline / api error fallback
      setCompetitions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'lobbies') {
      loadCompetitions();
    }
  }, [isOpen, activeTab, loadCompetitions]);

  // Periodic polling for active competition leaderboard
  useEffect(() => {
    if (!isOpen || activeTab !== 'active' || !currentComp?.code) return;

    const interval = setInterval(async () => {
      try {
        const res = await competitionAPI.get(currentComp.code);
        if (res.data) {
          setCurrentComp(res.data);
        }
      } catch {
        // ignore polling network noise
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, currentComp?.code]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy lobby code helper
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Create Competition
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a competition name.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await competitionAPI.create({
        ...createForm,
        display_name: createForm.display_name.trim() || 'Host',
      });
      const created = res.data;
      setCurrentComp(created);
      setMyParticipantId(created.participant_id);
      setActiveTab('active');
      setStatusMessage({ type: 'success', text: `Created lobby ${created.code}! Share code with rivals.` });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to create competition.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Join Competition
  const handleJoin = async (codeToJoin, explicitName = null) => {
    const code = (codeToJoin || joinCode).trim().toUpperCase();
    if (!code) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid competition code.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const name = explicitName || joinDisplayName.trim() || user?.username || 'Typist';
      const res = await competitionAPI.join(code, { display_name: name });
      const comp = res.data;
      setCurrentComp(comp);
      setMyParticipantId(comp.participant_id);
      setActiveTab('active');
      setStatusMessage({ type: 'success', text: `Joined ${comp.name}!` });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Could not join competition.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Start Competition typing test in Workstation
  const handleStartTyping = () => {
    if (!currentComp) return;
    onStartCompetitionTest({
      competition: currentComp,
      participantId: myParticipantId,
      challengeText: currentComp.challenge_text,
      challengeType: currentComp.challenge_type,
      targetLimit: currentComp.target_limit,
    });
    onClose();
  };

  // Export Results as CSV
  const handleDownloadCSV = () => {
    if (!currentComp) return;
    const participants = currentComp.participants || [];
    const escapeCSV = (val) => '"' + String(val ?? '').replace(/"/g, '""') + '"';

    let csv = `KEYFLOW COMPETITION RESULTS REPORT\r\n`;
    csv += `Competition Name,${escapeCSV(currentComp.name)}\r\n`;
    csv += `Room Code,${escapeCSV(currentComp.code)}\r\n`;
    csv += `Status,${escapeCSV(currentComp.status.toUpperCase())}\r\n`;
    csv += `Mode,${escapeCSV(currentComp.challenge_type === 'words' ? `${currentComp.target_limit} words` : `${currentComp.target_limit} seconds`)}\r\n`;
    csv += `Total Participants,${participants.length}\r\n`;
    if (currentComp.summary) {
      csv += `Completed Typists,${currentComp.summary.completed_count}\r\n`;
      csv += `Average WPM,${currentComp.summary.avg_wpm}\r\n`;
      csv += `Average Accuracy,${currentComp.summary.avg_accuracy}%\r\n`;
      csv += `Top WPM,${currentComp.summary.top_wpm}\r\n`;
      csv += `Top Score,${currentComp.summary.top_score}\r\n`;
    }
    csv += `\r\n`;
    csv += `Rank,Display Name,Status,Score,Net WPM,Raw WPM,Accuracy (%),CPM,Correct Chars,Incorrect Chars,Total Chars,Correct Words,Words Completed,Duration (s),Completed At\r\n`;

    participants.forEach((p, idx) => {
      const rank = p.rank || (p.status === 'completed' ? idx + 1 : '—');
      const name = escapeCSV(p.display_name || 'Anonymous');
      const status = p.status;
      const score = p.score || 0;
      const netWpm = p.net_wpm || 0;
      const rawWpm = p.gross_wpm || 0;
      const accuracy = p.accuracy || 0;
      const cpm = p.cpm || Math.round(Number(p.net_wpm || 0) * 5);
      const correctChars = p.correct_chars || 0;
      const incorrectChars = p.incorrect_chars || 0;
      const totalChars = p.total_chars || (correctChars + incorrectChars);
      const correctWords = p.correct_words || Math.round(correctChars / 5);
      const wordsCompleted = p.words_completed || Math.round(totalChars / 5);
      const duration = p.duration_seconds || 0;
      const completedAt = p.completed_at ? escapeCSV(new Date(p.completed_at).toISOString()) : '—';

      csv += `${rank},${name},${status},${score},${netWpm},${rawWpm},${accuracy},${cpm},${correctChars},${incorrectChars},${totalChars},${correctWords},${wordsCompleted},${duration},${completedAt}\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `keyflow-competition-${currentComp.code}-results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Results as JSON
  const handleDownloadJSON = () => {
    if (!currentComp) return;
    const reportData = {
      report: 'KEYFLOW Typing Competition Report',
      exported_at: new Date().toISOString(),
      competition: {
        code: currentComp.code,
        name: currentComp.name,
        status: currentComp.status,
        challenge_type: currentComp.challenge_type,
        target_limit: currentComp.target_limit,
        difficulty: currentComp.difficulty,
        max_participants: currentComp.max_participants,
        challenge_text: currentComp.challenge_text,
        created_at: currentComp.created_at,
        created_by: currentComp.created_by_name,
      },
      summary: currentComp.summary || null,
      ranking_rules: [
        '1. Highest Net WPM',
        '2. Highest Accuracy percentage (tie-breaker)',
        '3. Fastest duration (tie-breaker)',
      ],
      participants: (currentComp.participants || []).map((p, idx) => ({
        rank: p.rank || (p.status === 'completed' ? idx + 1 : null),
        display_name: p.display_name,
        status: p.status,
        score: p.score || 0,
        net_wpm: Number(p.net_wpm || 0),
        gross_wpm: Number(p.gross_wpm || 0),
        accuracy: Number(p.accuracy || 0),
        cpm: p.cpm || Math.round(Number(p.net_wpm || 0) * 5),
        correct_chars: p.correct_chars || 0,
        incorrect_chars: p.incorrect_chars || 0,
        total_chars: p.total_chars || ((p.correct_chars || 0) + (p.incorrect_chars || 0)),
        correct_words: p.correct_words || Math.round((p.correct_chars || 0) / 5),
        words_completed: p.words_completed || Math.round(((p.correct_chars || 0) + (p.incorrect_chars || 0)) / 5),
        duration_seconds: p.duration_seconds || 0,
        completed_at: p.completed_at || null,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `keyflow-competition-${currentComp.code}-results.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-mono"
        role="dialog"
        aria-labelledby="competition-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="competition-modal-title" className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Typing Competition Arena</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent)]">
                  Live Multiplayer
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Genuine synchronized text challenges & verified leaderboards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('lobbies')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'lobbies'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Lobbies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'create'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'join'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Join
              </button>
              {currentComp && (
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'active'
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                      : 'text-[var(--accent)] hover:underline'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>Room</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close competition arena"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button type="button" onClick={() => setStatusMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: LOBBIES */}
          {activeTab === 'lobbies' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Active Public Competitions</span>
                <button
                  type="button"
                  onClick={loadCompetitions}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {competitions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl p-6">
                  <Trophy className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-[var(--text-primary)]">No active lobbies found.</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
                    Be the first to host a competition room and challenge fellow typists!
                  </p>
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setActiveTab('create')}>
                    Create Competition Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {competitions.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {comp.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent)]">
                            {comp.code}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase">
                            • {comp.challenge_type === 'words' ? `${comp.target_limit} words` : `${comp.target_limit}s`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                          <span>Host: {comp.created_by_name}</span>
                          <span>•</span>
                          <span>
                            {comp.participant_count} / {comp.max_participants} players
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{comp.status}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJoin(comp.code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Join</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Competition Room Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Friday Speed Finals, Precision Sprint"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Challenge Type</label>
                  <select
                    value={createForm.challenge_type}
                    onChange={(e) => setCreateForm({ ...createForm, challenge_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="words">Word Sprint</option>
                    <option value="timed">Time Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Target Limit</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={createForm.target_limit}
                    onChange={(e) => setCreateForm({ ...createForm, target_limit: parseInt(e.target.value, 10) || 25 })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Your Display Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.display_name}
                    onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm({ ...createForm, max_participants: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">
                  Custom Challenge Text <span className="text-[10px] text-[var(--text-muted)]">(Optional — leaves random if blank)</span>
                </label>
                <textarea
                  rows={2}
                  value={createForm.challenge_text}
                  onChange={(e) => setCreateForm({ ...createForm, challenge_text: e.target.value })}
                  placeholder="Paste specific challenge passage here or leave blank for curated test passage"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setActiveTab('lobbies')}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-bold shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Competition Room</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: JOIN */}
          {activeTab === 'join' && (
            <div className="max-w-md mx-auto py-6 space-y-4 text-xs">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Join Competition Room</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Enter the unique room code provided by the competition host
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KF-AB12CD"
                    className="w-full text-center tracking-widest uppercase font-mono text-base font-bold px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Your Display Name</label>
                  <input
                    type="text"
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    placeholder="Learner"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleJoin(joinCode)}
                  disabled={isLoading || !joinCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-bold shadow-md transition-all cursor-pointer disabled:opacity-40"
                >
                  Join Lobby
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE ROOM, SUMMARY, PODIUM & FULL LEADERBOARD */}
          {activeTab === 'active' && currentComp && (
            <div className="space-y-4 text-xs">
              {/* Room Header Card */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">{currentComp.name}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        currentComp.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : currentComp.status === 'active'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {currentComp.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                    <span>
                      Mode: {currentComp.challenge_type === 'words' ? `${currentComp.target_limit} words` : `${currentComp.target_limit}s`}
                    </span>
                    <span>•</span>
                    <span>
                      Players: {currentComp.participants?.length || 0} / {currentComp.max_participants}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--accent)]">{currentComp.code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(currentComp.code)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                      title="Copy lobby code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Download Results Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] font-semibold transition-all cursor-pointer text-[11px]"
                      title="Download results as CSV spreadsheet"
                    >
                      <Download className="w-3 h-3 text-[var(--accent)]" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] font-semibold transition-all cursor-pointer text-[11px]"
                      title="Download results as structured JSON"
                    >
                      <FileText className="w-3 h-3 text-[var(--accent)]" />
                      <span>JSON</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartTyping}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test</span>
                  </button>
                </div>
              </div>

              {/* Competition-Wide Summary Cards */}
              {currentComp.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Typists</div>
                    <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                      {currentComp.summary.completed_count}{' '}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        / {currentComp.summary.total_participants} completed
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Lobby Avg Speed</div>
                    <div className="text-base font-bold text-[var(--accent)] font-mono">
                      {currentComp.summary.avg_wpm} <span className="text-[10px]">WPM</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Lobby Avg Accuracy</div>
                    <div className="text-base font-bold text-[var(--ui-success)] font-mono">
                      {currentComp.summary.avg_accuracy}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Best Score</div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {currentComp.summary.top_score}{' '}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        ({currentComp.summary.top_wpm} WPM)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st, 2nd, 3rd Podium */}
              {currentComp.summary?.podium && currentComp.summary.podium.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Podium Winners</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1st Place Gold */}
                    {currentComp.summary.podium[0] && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            🥇 1st Place
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Score {currentComp.summary.podium[0].score || Math.round(currentComp.summary.podium[0].net_wpm * (currentComp.summary.podium[0].accuracy / 100) * 10)}
                          </span>
                        </div>
                        <div className="mt-1 font-bold text-sm text-[var(--text-primary)] truncate">
                          {currentComp.summary.podium[0].display_name}
                        </div>
                        <div className="mt-1 text-xs font-mono text-amber-300 flex items-center gap-2">
                          <span className="font-bold">{currentComp.summary.podium[0].net_wpm} WPM</span>
                          <span>•</span>
                          <span>{currentComp.summary.podium[0].accuracy}% acc</span>
                        </div>
                      </div>
                    )}

                    {/* 2nd Place Silver */}
                    {currentComp.summary.podium[1] && (
                      <div className="p-3 rounded-xl bg-slate-400/10 border border-slate-400/30 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            🥈 2nd Place
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-400/20 text-slate-200">
                            Score {currentComp.summary.podium[1].score || Math.round(currentComp.summary.podium[1].net_wpm * (currentComp.summary.podium[1].accuracy / 100) * 10)}
                          </span>
                        </div>
                        <div className="mt-1 font-bold text-sm text-[var(--text-primary)] truncate">
                          {currentComp.summary.podium[1].display_name}
                        </div>
                        <div className="mt-1 text-xs font-mono text-slate-300 flex items-center gap-2">
                          <span className="font-bold">{currentComp.summary.podium[1].net_wpm} WPM</span>
                          <span>•</span>
                          <span>{currentComp.summary.podium[1].accuracy}% acc</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place Bronze */}
                    {currentComp.summary.podium[2] && (
                      <div className="p-3 rounded-xl bg-amber-700/10 border border-amber-700/30 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            🥉 3rd Place
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-700/20 text-amber-400">
                            Score {currentComp.summary.podium[2].score || Math.round(currentComp.summary.podium[2].net_wpm * (currentComp.summary.podium[2].accuracy / 100) * 10)}
                          </span>
                        </div>
                        <div className="mt-1 font-bold text-sm text-[var(--text-primary)] truncate">
                          {currentComp.summary.podium[2].display_name}
                        </div>
                        <div className="mt-1 text-xs font-mono text-amber-500 flex items-center gap-2">
                          <span className="font-bold">{currentComp.summary.podium[2].net_wpm} WPM</span>
                          <span>•</span>
                          <span>{currentComp.summary.podium[2].accuracy}% acc</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shared Challenge Passage Preview */}
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold">
                  Shared Challenge Text (All participants receive this identical prompt)
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {currentComp.challenge_text}
                </p>
              </div>

              {/* Complete Participant-Level Leaderboard Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Complete Results for Every Participant ({currentComp.participants?.length || 0})</span>
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>Ranked: Net WPM → Acc → Duration</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await competitionAPI.get(currentComp.code);
                          if (res.data) setCurrentComp(res.data);
                        } catch {}
                      }}
                      className="hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                      title="Refresh results"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] overflow-x-auto bg-[var(--bg-elevated)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        <th className="py-2 px-2.5 text-center w-8">#</th>
                        <th className="py-2 px-3">Participant</th>
                        <th className="py-2 px-2 text-right">Score</th>
                        <th className="py-2 px-2 text-right">Net WPM</th>
                        <th className="py-2 px-2 text-right">Raw WPM</th>
                        <th className="py-2 px-2 text-right">Accuracy</th>
                        <th className="py-2 px-2 text-right">CPM</th>
                        <th className="py-2 px-2 text-right">Chars (OK/Err)</th>
                        <th className="py-2 px-2 text-right">Words</th>
                        <th className="py-2 px-2 text-right">Duration</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {currentComp.participants && currentComp.participants.length > 0 ? (
                        currentComp.participants.map((p, idx) => {
                          const isRank1 = p.rank === 1 || (idx === 0 && p.status === 'completed');
                          return (
                            <tr
                              key={p.id || idx}
                              className={`transition-colors ${
                                isRank1 ? 'bg-[var(--accent)]/5 font-semibold' : 'hover:bg-[var(--bg-surface)]/50'
                              }`}
                            >
                              <td className="py-2 px-2.5 text-center font-bold text-[var(--accent)]">
                                {p.rank || (p.status === 'completed' ? idx + 1 : '—')}
                              </td>
                              <td className="py-2 px-3 font-medium text-[var(--text-primary)] truncate max-w-[130px]">
                                {p.display_name}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-amber-400">
                                {p.status === 'completed' ? (p.score ?? Math.round(Number(p.net_wpm || 0) * (Number(p.accuracy || 0) / 100) * 10)) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-[var(--text-primary)]">
                                {p.status === 'completed' ? `${p.net_wpm}` : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--text-secondary)]">
                                {p.status === 'completed' ? `${p.gross_wpm || p.net_wpm}` : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--ui-success)] font-bold">
                                {p.status === 'completed' ? `${p.accuracy}%` : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-sky-400">
                                {p.status === 'completed' ? (p.cpm ?? Math.round(Number(p.net_wpm || 0) * 5)) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--text-muted)] text-[11px]">
                                {p.status === 'completed' ? (
                                  <span>
                                    <span className="text-[var(--ui-success)]">{p.correct_chars ?? 0}</span> /{' '}
                                    <span className="text-[var(--ui-error)]">{p.incorrect_chars ?? 0}</span>
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--text-muted)] text-[11px]">
                                {p.status === 'completed' ? (p.correct_words ?? Math.round((p.correct_chars || 0) / 5)) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-[var(--text-muted)]">
                                {p.status === 'completed' ? `${p.duration_seconds || 0}s` : '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : p.status === 'typing'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={11} className="text-center py-6 text-xs text-[var(--text-muted)]">
                            No participants joined yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
