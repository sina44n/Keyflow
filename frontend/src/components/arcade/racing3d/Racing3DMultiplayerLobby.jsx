import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Car,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Shield,
  Flame,
} from 'lucide-react';
import { Button } from '../../common/Button';

export const Racing3DMultiplayerLobby = ({
  user,
  customVehicle,
  driverName,
  onStartMultiplayerRace,
  onBackToGarage,
}) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'create' | 'in_room'
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createForm, setCreateForm] = useState({
    roomName: `${driverName || 'Racer'}'s Championship`,
    track: 'speedway',
    tier: 1,
    targetDistance: 1200,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const pollIntervalRef = useRef(null);

  // Guest ID for guest identity
  const guestId = useRef(
    localStorage.getItem('keyflow_guest_id') ||
      (() => {
        const id = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('keyflow_guest_id', id);
        return id;
      })()
  ).current;

  // 1. Fetch active rooms
  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/games/racing/rooms/');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchRooms();
      const interval = setInterval(fetchRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchRooms]);

  // 2. Create room
  const handleCreateRoom = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    try {
      const payload = {
        displayName: driverName || 'Driver',
        roomName: createForm.roomName,
        track: createForm.track,
        tier: createForm.tier,
        targetDistance: createForm.targetDistance,
        vehicleId: customVehicle?.selectedVehicleId || 'apex-gt',
        color: customVehicle?.primaryColor || '#EF4444',
        nitroStyle: customVehicle?.nitroStyle || 'fire',
        wheelFinish: customVehicle?.wheelFinish || 'chrome',
        guestId,
      };

      const res = await fetch('/api/games/racing/rooms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create room');
      }

      const data = await res.json();
      setCurrentRoom(data.room);
      setCurrentParticipant(data.participant);
      setActiveTab('in_room');
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // 3. Join room by code
  const handleJoinRoom = async (codeToJoin) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) return;
    setErrorMessage('');
    try {
      const payload = {
        displayName: driverName || 'Driver',
        vehicleId: customVehicle?.selectedVehicleId || 'apex-gt',
        color: customVehicle?.primaryColor || '#EF4444',
        nitroStyle: customVehicle?.nitroStyle || 'fire',
        wheelFinish: customVehicle?.wheelFinish || 'chrome',
        guestId,
      };

      const res = await fetch(`/api/games/racing/rooms/${code}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join room');
      }

      const data = await res.json();
      setCurrentRoom(data.room);
      setCurrentParticipant(data.participant);
      setActiveTab('in_room');
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // 4. Toggle ready status
  const handleToggleReady = async () => {
    if (!currentRoom || !currentParticipant) return;
    try {
      const res = await fetch(`/api/games/racing/rooms/${currentRoom.code}/ready/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: currentParticipant.id,
          ready: !currentParticipant.is_ready,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRoom(data.room);
        const updatedSelf = data.room.participants.find((p) => p.id === currentParticipant.id);
        if (updatedSelf) setCurrentParticipant(updatedSelf);
      }
    } catch (err) {
      console.warn('Failed to toggle ready', err);
    }
  };

  // 5. Host force start
  const handleHostStart = async () => {
    if (!currentRoom || !currentParticipant) return;
    try {
      const res = await fetch(`/api/games/racing/rooms/${currentRoom.code}/ready/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forceStart: true,
          participantId: currentParticipant.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRoom(data.room);
      }
    } catch (err) {
      console.warn('Failed to force start', err);
    }
  };

  // 6. Leave room
  const handleLeaveRoom = async () => {
    if (currentRoom && currentParticipant) {
      try {
        await fetch(`/api/games/racing/rooms/${currentRoom.code}/leave/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId: currentParticipant.id }),
        });
      } catch (e) {
        // ignore
      }
    }
    setCurrentRoom(null);
    setCurrentParticipant(null);
    setActiveTab('browse');
    fetchRooms();
  };

  // 7. Polling room state while in room
  useEffect(() => {
    if (activeTab !== 'in_room' || !currentRoom) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/games/racing/rooms/${currentRoom.code}/`);
        if (res.ok) {
          const roomData = await res.json();
          setCurrentRoom(roomData);

          // Check if game has started countdown or racing
          if (roomData.status === 'countdown' || roomData.status === 'racing') {
            clearInterval(pollIntervalRef.current);
            onStartMultiplayerRace({
              room: roomData,
              participant: currentParticipant,
              participants: roomData.participants,
            });
          }
        }
      } catch (err) {
        console.warn('Lobby poll error', err);
      }
    };

    pollIntervalRef.current = setInterval(poll, 1200);
    return () => clearInterval(pollIntervalRef.current);
  }, [activeTab, currentRoom, currentParticipant, onStartMultiplayerRace]);

  const copyRoomCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // ==========================================
  // IN-ROOM WAITING LOBBY VIEW
  // ==========================================
  if (activeTab === 'in_room' && currentRoom) {
    const isHost = currentParticipant?.lane === 0;
    const participants = currentRoom.participants || [];

    return (
      <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-6 animate-in fade-in">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                MULTIPLAYER GRID
              </span>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                {currentRoom.name}
              </h2>
            </div>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
              Track: <strong className="text-[var(--text-primary)] capitalize">{currentRoom.track}</strong> • Distance: <strong className="text-[var(--text-primary)]">{currentRoom.target_distance}m</strong> • Tier {currentRoom.tier}
            </p>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-red-500/40 shadow-inner">
              <span className="text-xs font-mono text-zinc-400">ROOM:</span>
              <span className="text-base font-mono font-black text-red-400 tracking-wider">
                {currentRoom.code}
              </span>
              <button
                type="button"
                onClick={copyRoomCode}
                className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>

        {/* 4-Lane Grid Display */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
            <span>Starting Grid ({participants.length}/4 Racers)</span>
            <span className="text-emerald-400">
              {participants.filter((p) => p.is_ready).length}/{participants.length} Ready
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[0, 1, 2, 3].map((laneIdx) => {
              const p = participants.find((r) => r.lane === laneIdx);
              const isSelf = p && p.id === currentParticipant?.id;

              if (p) {
                return (
                  <div
                    key={laneIdx}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelf
                        ? 'border-red-500 bg-red-500/10 shadow-lg ring-1 ring-red-500/40'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-zinc-300 border border-white/10">
                        LANE {laneIdx + 1}
                      </span>
                      {p.lane === 0 && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          HOST
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: p.primary_color }}
                      />
                      <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {p.display_name} {isSelf && '(YOU)'}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span>Car</span>
                        <span className="text-[var(--text-primary)] uppercase">{p.vehicle_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nitro</span>
                        <span className="text-cyan-400 capitalize">{p.nitro_style}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">Status</span>
                      <span
                        className={`text-xs font-mono font-bold flex items-center gap-1 ${
                          p.is_ready ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {p.is_ready ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> READY
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> TUNING
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              }

              // Empty Grid Slot
              return (
                <div
                  key={laneIdx}
                  className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)]/30 flex flex-col items-center justify-center text-center text-zinc-500 min-h-[140px]"
                >
                  <span className="text-[10px] font-mono mb-2">LANE {laneIdx + 1}</span>
                  <Car className="w-6 h-6 mb-2 opacity-40" />
                  <span className="text-xs font-mono">Waiting for Racer...</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
          <div className="text-xs font-mono text-[var(--text-secondary)]">
            Invite rivals by sharing room code <strong className="text-red-400 font-bold">{currentRoom.code}</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant={currentParticipant?.is_ready ? 'outline' : 'primary'}
              size="md"
              onClick={handleToggleReady}
              className={`w-full sm:w-auto font-bold ${
                currentParticipant?.is_ready ? 'border-emerald-500 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {currentParticipant?.is_ready ? 'Cancel Ready' : 'Ready Up!'}
            </Button>

            {isHost && (
              <Button
                variant="primary"
                size="md"
                icon={Play}
                onClick={handleHostStart}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Launch Grid Race
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // BROWSE ROOMS / CREATE ROOM VIEW
  // ==========================================
  return (
    <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>REAL-TIME MULTIPLAYER RACING</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">
            Competitive 4-Car Drag Strip
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Race live human opponents with genuine progressive acceleration and real-time telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBackToGarage}>
            Back to Garage
          </Button>
          <Button
            variant={activeTab === 'create' ? 'outline' : 'primary'}
            size="sm"
            icon={activeTab === 'create' ? Users : Plus}
            onClick={() => setActiveTab(activeTab === 'create' ? 'browse' : 'create')}
          >
            {activeTab === 'create' ? 'Browse Rooms' : 'Create Room'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* CREATE ROOM FORM */}
      {activeTab === 'create' ? (
        <form onSubmit={handleCreateRoom} className="space-y-4 max-w-lg mx-auto py-2">
          <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">
            Create Custom Racing Room
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--text-muted)]">Room Name</label>
            <input
              type="text"
              value={createForm.roomName}
              onChange={(e) => setCreateForm({ ...createForm, roomName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--text-muted)]">Track Circuit</label>
              <select
                value={createForm.track}
                onChange={(e) => setCreateForm({ ...createForm, track: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              >
                <option value="speedway">Speedway Arena</option>
                <option value="sunset">Sunset Boulevard</option>
                <option value="neon-city">Neon Metropolis</option>
                <option value="alpine">Alpine Pass</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--text-muted)]">Track Distance</label>
              <select
                value={createForm.targetDistance}
                onChange={(e) => setCreateForm({ ...createForm, targetDistance: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              >
                <option value={800}>800m (Sprint)</option>
                <option value={1200}>1,200m (Standard)</option>
                <option value={1800}>1,800m (Endurance)</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Open Room & Take Pole Position (Lane 1)
            </Button>
          </div>
        </form>
      ) : (
        /* BROWSE & JOIN ROOMS */
        <div className="space-y-6">
          {/* Join by Code Search Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Enter 6-char Room Code (e.g. ROOM-XXXX)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500 uppercase"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => handleJoinRoom()}
              disabled={!joinCodeInput.trim()}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Join Room
            </Button>
          </div>

          {/* Active Public Rooms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Public Rooms ({rooms.length})
              </h3>
              <button
                type="button"
                onClick={fetchRooms}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center text-zinc-500 font-mono text-xs space-y-2">
                <Car className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p>No open rooms active right now.</p>
                <p className="text-zinc-400">Create a room above to challenge other racers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl bg-[var(--bg-elevated)]/80 border border-[var(--border)] hover:border-red-500/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-red-400 font-bold border border-red-500/20">
                          {room.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {room.participant_count || room.participants?.length || 1}/4 Racers
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {room.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                        Host: {room.host_name} • {room.track} ({room.target_distance}m)
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinRoom(room.code)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      Join Grid ({room.participant_count || room.participants?.length || 1}/4)
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
