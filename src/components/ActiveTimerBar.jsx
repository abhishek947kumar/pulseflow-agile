import React, { useState } from 'react';
import { Square, Clock, Target, CheckCircle2 } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { formatStopwatch } from '../utils/helpers';

export default function ActiveTimerBar({ onOpenTask }) {
  const { 
    activeTimer, 
    elapsedSeconds, 
    isPomodoro, 
    pomodoroSecondsLeft, 
    stopTaskTimer, 
    togglePomodoroMode 
  } = useTimer();

  const [stopping, setStopping] = useState(false);
  const [workNote, setWorkNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!activeTimer) return null;

  const handleStop = async () => {
    setStopping(true);
    await stopTaskTimer(workNote);
    setStopping(false);
    setShowNoteInput(false);
    setWorkNote('');
  };

  const displayTime = isPomodoro 
    ? formatStopwatch(pomodoroSecondsLeft) 
    : formatStopwatch(elapsedSeconds);

  return (
    <div className="active-timer-banner">
      {/* Left: Active Task Name, Visualizer Soundwaves & Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="timer-soundwave">
            <div className="timer-wave-bar" />
            <div className="timer-wave-bar" />
            <div className="timer-wave-bar" />
            <div className="timer-wave-bar" />
          </div>
          <span className="pulse-timer" style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
            <Clock size={18} />
          </span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {isPomodoro ? 'Pomodoro Focus Sprint' : 'Active Stopwatch'}
          </span>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        <button
          onClick={() => onOpenTask(activeTimer.task || { id: activeTimer.taskId })}
          style={{
            background: 'transparent',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '13.5px',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            padding: 0
          }}
        >
          {activeTimer.task?.title || 'Active Task'}
        </button>
      </div>

      {/* Center: Stopwatch Readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          className="mono"
          style={{
            fontSize: '19px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: isPomodoro ? 'var(--accent-amber)' : 'var(--accent-cyan)',
            textShadow: isPomodoro ? '0 0 12px var(--accent-amber-light)' : '0 0 12px var(--accent-cyan-light)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {displayTime}
        </div>

        {/* Pomodoro Mode Switcher */}
        <button
          onClick={togglePomodoroMode}
          className="btn-secondary"
          style={{
            padding: '4px 12px',
            height: '32px',
            fontSize: '11.5px',
            borderColor: isPomodoro ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
            background: isPomodoro ? 'var(--accent-amber-light)' : 'rgba(255,255,255,0.05)',
            color: isPomodoro ? 'var(--accent-amber)' : 'var(--text-muted)'
          }}
        >
          <Target size={13} />
          {isPomodoro ? '25m Focus Active' : 'Switch to Pomodoro'}
        </button>
      </div>

      {/* Right: Stop & Log controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showNoteInput ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              placeholder="What did you achieve in this session?"
              value={workNote}
              onChange={(e) => setWorkNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStop()}
              autoFocus
              style={{
                height: '32px',
                padding: '4px 12px',
                fontSize: '12px',
                width: '260px'
              }}
            />
            <button
              onClick={handleStop}
              className="btn-primary"
              disabled={stopping}
              style={{ height: '32px', padding: '0 12px', fontSize: '12px', background: 'var(--accent-emerald)' }}
            >
              <CheckCircle2 size={13} />
              Confirm Log
            </button>
            <button
              onClick={() => setShowNoteInput(false)}
              className="btn-ghost"
              style={{ height: '32px', padding: '0 8px', fontSize: '11px' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNoteInput(true)}
            className="btn-danger"
            style={{ height: '32px', padding: '0 14px', fontSize: '12px' }}
          >
            <Square size={13} fill="currentColor" />
            Stop & Log Time
          </button>
        )}
      </div>
    </div>
  );
}
