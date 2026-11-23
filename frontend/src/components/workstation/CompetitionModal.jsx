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
  Trash2,
  AlertTriangle,
  Users,
  Pencil,
  Clock,
  ExternalLink,
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
  const [myParticipantToken, setMyParticipantToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Edit room modal state
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    challenge_type: 'words',
    target_limit: 25,
    max_participants: 10,
    challenge_text: '',
    enable_time_limit: false,
    time_limit_seconds: 60,
  });

  // Check if current user is authorized to manage a specific competition room
  const canManageRoom = useCallback(
    (comp) => {
      if (!comp) return false;
      const isNamedHost = Boolean(
        user &&
          comp.created_by_name &&
          (user.username === comp.created_by_name ||
            user.profile?.display_name === comp.created_by_name ||
            user.id === comp.created_by_id)
      );
      if (isNamedHost) return true;

      if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem(`kf_comp_host_${comp.code}`) === 'true') {
          return true;
        }
      }

      if (comp.participants && myParticipantId && comp.participants[0]?.id === myParticipantId) {
        return true;
      }
      return false;
    },
    [user, myParticipantId]
  );

  const isHost = Boolean(currentComp && canManageRoom(currentComp));

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
    enable_time_limit: false,
    time_limit_seconds: 60,
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
      const payload = {
        name: createForm.name.trim(),
        challenge_type: createForm.challenge_type,
        target_limit: Number(createForm.target_limit) || 25,
        difficulty: createForm.difficulty,
        max_participants: Number(createForm.max_participants) || 10,
        is_public: createForm.is_public,
        display_name: createForm.display_name.trim() || 'Host',
        challenge_text: createForm.challenge_text,
        time_limit_seconds: createForm.enable_time_limit ? Number(createForm.time_limit_seconds) || 60 : null,
      };
      const res = await competitionAPI.create(payload);
      const created = res.data;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`kf_comp_host_${created.code}`, 'true');
        if (created.participant_token) {
          localStorage.setItem(`kf_comp_token_${created.code}`, created.participant_token);
        }
        if (created.participant_id) {
          localStorage.setItem(`kf_comp_part_id_${created.code}`, created.participant_id);
        }
      }
      setCurrentComp(created);
      setMyParticipantId(created.participant_id);
      setMyParticipantToken(created.participant_token || null);
      setActiveTab('active');
      setStatusMessage({ type: 'success', text: `Created lobby ${created.code}! Share code with rivals.` });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to create competition.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Room Modal
  const handleOpenEdit = (comp) => {
    if (!comp) return;
    if (comp.status !== 'waiting') {
      setStatusMessage({
        type: 'error',
        text: `Cannot edit "${comp.name}" because it is already ${comp.status}. Only rooms in waiting status can be edited.`,
      });
      return;
    }
    setEditForm({
      code: comp.code,
      name: comp.name || '',
      challenge_type: comp.challenge_type || 'words',
      target_limit: comp.target_limit || 25,
      max_participants: comp.max_participants || 10,
      challenge_text: comp.challenge_text || '',
      enable_time_limit: Boolean(comp.time_limit_seconds),
      time_limit_seconds: comp.time_limit_seconds || 60,
    });
    setEditingRoom(comp);
  };

  // Save Edits to Room
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRoom || !editForm.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid competition name.' });
      return;
    }
    setIsLoading(true);
    try {
      const token =
        (typeof localStorage !== 'undefined' && localStorage.getItem(`kf_comp_token_${editingRoom.code}`)) ||
        myParticipantToken ||
        null;
      const partId =
        (typeof localStorage !== 'undefined' && localStorage.getItem(`kf_comp_part_id_${editingRoom.code}`)) ||
        myParticipantId ||
        null;

      const payload = {
        name: editForm.name.trim(),
        challenge_type: editForm.challenge_type,
        target_limit: Number(editForm.target_limit) || 25,
        max_participants: Number(editForm.max_participants) || 10,
        challenge_text: editForm.challenge_text,
        time_limit_seconds: editForm.enable_time_limit ? Number(editForm.time_limit_seconds) || 60 : null,
        participant_token: token,
        participant_id: partId,
      };

      const res = await competitionAPI.update(editingRoom.code, payload);
      const updated = res.data;
      setStatusMessage({ type: 'success', text: `Room ${updated.code} updated successfully!` });
      if (currentComp?.code === updated.code) {
        setCurrentComp(updated);
      }
      setEditingRoom(null);
      loadCompetitions();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to update competition room.';
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
      setMyParticipantToken(comp.participant_token || null);
      if (typeof localStorage !== 'undefined') {
        if (comp.participant_token) {
          localStorage.setItem(`kf_comp_token_${comp.code}`, comp.participant_token);
        }
        if (comp.participant_id) {
          localStorage.setItem(`kf_comp_part_id_${comp.code}`, comp.participant_id);
        }
      }
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
  const handleStartTyping = async () => {
    if (!currentComp) return;
    try {
      if (currentComp.status === 'waiting') {
        await competitionAPI.start(currentComp.code).catch(() => {});
      }
    } catch {}
    onStartCompetitionTest({
      competition: currentComp,
      participantId: myParticipantId,
      participantToken: myParticipantToken,
      challengeText: currentComp.challenge_text,
      challengeType: currentComp.challenge_type,
      targetLimit: currentComp.target_limit,
    });
    onClose();
  };

  // Delete / Cancel Competition Room (Host Only)
  const handleConfirmDelete = async () => {
    const comp = roomToDelete || currentComp;
    if (!comp) return;
    setIsLoading(true);
    try {
      const token =
        (typeof localStorage !== 'undefined' && localStorage.getItem(`kf_comp_token_${comp.code}`)) ||
        myParticipantToken ||
        null;
      const partId =
        (typeof localStorage !== 'undefined' && localStorage.getItem(`kf_comp_part_id_${comp.code}`)) ||
        myParticipantId ||
        null;

      await competitionAPI.delete(comp.code, {
        participant_id: partId,
        participant_token: token,
      });

      setStatusMessage({ type: 'success', text: `Room ${comp.code} deleted successfully.` });
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`kf_comp_host_${comp.code}`);
        localStorage.removeItem(`kf_comp_token_${comp.code}`);
        localStorage.removeItem(`kf_comp_part_id_${comp.code}`);
      }
      if (currentComp?.code === comp.code) {
        setCurrentComp(null);
        setActiveTab('lobbies');
      }
      setRoomToDelete(null);
      setShowDeleteConfirm(false);
      loadCompetitions();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to delete room.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
      setRoomToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteRoom = () => {
    setRoomToDelete(currentComp);
    setShowDeleteConfirm(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] font-mono"
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
                  {competitions.map((comp) => {
                    const canManage = canManageRoom(comp);
                    const isTimed = Boolean(comp.time_limit_seconds || comp.competition_mode === 'timed');
                    return (
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
                              • {isTimed ? `${comp.time_limit_seconds || comp.target_limit}s timer` : (comp.challenge_type === 'words' ? `${comp.target_limit} words` : `${comp.target_limit}s`)}
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

                        {/* Room Actions: Room Info | Edit | Delete | Join */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Edit action */}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(comp)}
                              disabled={comp.status !== 'waiting'}
                              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                              title={
                                comp.status === 'waiting'
                                  ? 'Edit competition room'
                                  : `Cannot edit room in ${comp.status} status`
                              }
                              aria-label={`Edit ${comp.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 rounded-lg border border-[var(--border)]/40 bg-[var(--bg-surface)]/40 text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                              title="Only the room host can edit this room"
                              aria-label="Edit restricted to room host"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete action */}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRoomToDelete(comp);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                              title="Delete competition room"
                              aria-label={`Delete ${comp.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 rounded-lg border border-[var(--border)]/40 bg-[var(--bg-surface)]/40 text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                              title="Only the room host can delete this room"
                              aria-label="Delete restricted to room host"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Join button */}
                          <button
                            type="button"
                            onClick={() => handleJoin(comp.code)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Join</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  <select
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm({ ...createForm, max_participants: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="5">5 Typists</option>
                    <option value="10">10 Typists (Standard)</option>
                    <option value="25">25 Typists</option>
                    <option value="50">50 Typists</option>
                    <option value="0">Unlimited Typists (Scalable)</option>
                  </select>
                </div>
              </div>

              {/* Competition Time Limit (Advanced Mode Selection) */}
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="font-bold text-xs text-[var(--text-primary)]">Competition Time Limit</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createForm.enable_time_limit}
                      onChange={(e) => setCreateForm({ ...createForm, enable_time_limit: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-0 cursor-pointer accent-[var(--accent)]"
                    />
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {createForm.enable_time_limit ? 'Countdown Timer Enabled' : 'Enable Time Limit'}
                    </span>
                  </label>
                </div>

                {createForm.enable_time_limit ? (
                  <div className="space-y-2 pt-1 border-t border-[var(--border)]/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Select Duration</span>
                      <span className="font-mono font-bold text-[var(--accent)]">
                        {createForm.time_limit_seconds} seconds
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[15, 30, 60, 120, 300].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, time_limit_seconds: dur })}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            createForm.time_limit_seconds === dur
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                              : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                      ⏱ Timed Race: Typists race against the countdown clock. Input stops synchronously on expiration.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    🏁 Text-Completion Mode: No countdown timer. Competition completes when the challenge passage is finished.
                  </p>
                )}
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

          {/* TAB 4: ROOM MANAGEMENT (CLEAN & COMPACT) */}
          {activeTab === 'active' && currentComp && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm space-y-4">
                {/* Room Info Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-base text-[var(--text-primary)]">{currentComp.name}</span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
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
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                      <span>
                        Mode: {currentComp.time_limit_seconds ? `${currentComp.time_limit_seconds}s Timer` : (currentComp.challenge_type === 'words' ? `${currentComp.target_limit} words` : `${currentComp.target_limit}s`)}
                      </span>
                      <span>•</span>
                      <span>
                        Players: {currentComp.participants?.length || 0} / {currentComp.max_participants}
                      </span>
                    </div>
                  </div>

                  {/* Room Code with Copy Button */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Room Code:</span>
                    <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">{currentComp.code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(currentComp.code)}
                      className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Copy lobby code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Room Actions Row */}
                <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Results Page link */}
                    <a
                      href={`/competitions/${currentComp.code}/results`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold text-xs transition-all cursor-pointer"
                      title="Open dedicated Champions Leaderboard"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Results Page</span>
                      <ExternalLink className="w-3 h-3 text-amber-400/80" />
                    </a>

                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(currentComp)}
                        disabled={currentComp.status !== 'waiting'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={currentComp.status === 'waiting' ? "Edit this competition room" : "Only rooms in waiting status can be edited"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Room</span>
                      </button>
                    )}

                    {isHost && (
                      <button
                        type="button"
                        onClick={handleDeleteRoom}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-all cursor-pointer"
                        title="Delete this competition room"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete Room</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartTyping}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Edit Room Modal Overlay */}
        {editingRoom && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
            <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Edit Competition Room</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Room {editingRoom.code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Competition Room Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-muted)] mb-1">Challenge Type</label>
                    <select
                      value={editForm.challenge_type}
                      onChange={(e) => setEditForm({ ...editForm, challenge_type: e.target.value })}
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
                      value={editForm.target_limit}
                      onChange={(e) => setEditForm({ ...editForm, target_limit: parseInt(e.target.value, 10) || 25 })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Max Participants</label>
                  <select
                    value={editForm.max_participants}
                    onChange={(e) => setEditForm({ ...editForm, max_participants: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="5">5 Typists</option>
                    <option value="10">10 Typists (Standard)</option>
                    <option value="25">25 Typists</option>
                    <option value="50">50 Typists</option>
                    <option value="0">Unlimited Typists (Scalable)</option>
                  </select>
                </div>

                {/* Competition Time Limit (Advanced Mode Selection) */}
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">Competition Time Limit</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.enable_time_limit}
                        onChange={(e) => setEditForm({ ...editForm, enable_time_limit: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-0 cursor-pointer accent-[var(--accent)]"
                      />
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        {editForm.enable_time_limit ? 'Countdown Timer Enabled' : 'Enable Time Limit'}
                      </span>
                    </label>
                  </div>

                  {editForm.enable_time_limit ? (
                    <div className="space-y-2 pt-1 border-t border-[var(--border)]/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-muted)]">Select Duration</span>
                        <span className="font-mono font-bold text-[var(--accent)]">
                          {editForm.time_limit_seconds} seconds
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[15, 30, 60, 120, 300].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, time_limit_seconds: dur })}
                            className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              editForm.time_limit_seconds === dur
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                                : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 text-[var(--text-secondary)] border border-[var(--border)]'
                            }`}
                          >
                            {dur}s
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      🏁 Text-Completion Mode: Competition finishes when the challenge passage is completed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">
                    Custom Challenge Text <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.challenge_text}
                    onChange={(e) => setEditForm({ ...editForm, challenge_text: e.target.value })}
                    placeholder="Custom challenge prompt"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Delete Competition Room</h4>
                  <p className="text-xs text-[var(--text-muted)]">Room {roomToDelete?.code || currentComp?.code}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to delete this competition room? All participants will be removed and leaderboard results will be permanently erased.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToDelete(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
