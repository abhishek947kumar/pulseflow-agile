import React, { useState } from 'react';
import { 
  Kanban, 
  BarChart3, 
  ListTodo, 
  CalendarRange,
  Bot,
  Plus, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';
import { useTheme } from '../context/ThemeContext';
import { toggleSound, isSoundEnabled } from '../utils/audio';

export default function Navbar({ activeView, setActiveView, onOpenNewTaskModal, onOpenStandupModal }) {
  const { user, users, switchPersona } = useAuth();
  const { boards, currentBoard, loadBoardDetails, onlineClients, resetBoard } = useBoard();
  const { theme, changeTheme, themes } = useTheme();

  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundActive(newState);
  };

  const activeThemeObj = themes.find(t => t.id === theme) || themes[0];

  return (
    <header className="navbar">
      {/* Brand & Board Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div className="nav-brand" onClick={() => setActiveView('board')}>
          <div className="brand-logo-icon">
            <Kanban size={18} />
          </div>
          <div className="brand-title">
            PulseFlow
            <span className="brand-badge">Agile</span>
          </div>
        </div>

        {/* Board Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '4px 10px', height: '32px', borderRadius: 'var(--radius-sm)' }}
            onClick={() => {
              setShowBoardMenu(!showBoardMenu);
              setShowPersonaMenu(false);
              setShowThemeMenu(false);
            }}
          >
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentBoard?.title || 'Active Project'}
            </span>
            <ChevronDown size={12} style={{ opacity: 0.7 }} />
          </button>

          {showBoardMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '40px',
                left: 0,
                width: '280px',
                padding: '6px',
                zIndex: 60,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase' }}>
                Select Active Board
              </div>
              {boards.map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    loadBoardDetails(b.id);
                    setShowBoardMenu(false);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: currentBoard?.id === b.id ? 'var(--primary-light)' : 'transparent',
                    color: currentBoard?.id === b.id ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{b.title}</span>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>{b.key}</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {b.description ? b.description.slice(0, 40) + '...' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Navigation Tabs (Concise, Clean) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button
          onClick={() => setActiveView('board')}
          style={{
            padding: '5px 11px',
            borderRadius: 'var(--radius-sm)',
            background: activeView === 'board' ? 'var(--primary)' : 'transparent',
            color: activeView === 'board' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '12px'
          }}
        >
          <Kanban size={13} />
          <span>Board</span>
        </button>

        <button
          onClick={() => setActiveView('timeline')}
          style={{
            padding: '5px 11px',
            borderRadius: 'var(--radius-sm)',
            background: activeView === 'timeline' ? 'var(--primary)' : 'transparent',
            color: activeView === 'timeline' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '12px'
          }}
        >
          <CalendarRange size={13} />
          <span>Roadmap</span>
        </button>

        <button
          onClick={() => setActiveView('analytics')}
          style={{
            padding: '5px 11px',
            borderRadius: 'var(--radius-sm)',
            background: activeView === 'analytics' ? 'var(--primary)' : 'transparent',
            color: activeView === 'analytics' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '12px'
          }}
        >
          <BarChart3 size={13} />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveView('list')}
          style={{
            padding: '5px 11px',
            borderRadius: 'var(--radius-sm)',
            background: activeView === 'list' ? 'var(--primary)' : 'transparent',
            color: activeView === 'list' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '12px'
          }}
        >
          <ListTodo size={13} />
          <span>List</span>
        </button>
      </nav>

      {/* Right Controls: New Task, AI Standup, Theme, Reset, Presence, Persona */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Primary New Task Button */}
        <button
          className="btn-primary"
          onClick={onOpenNewTaskModal}
          style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>

        {/* AI Standup Generator Button */}
        <button
          onClick={onOpenStandupModal}
          className="btn-secondary"
          title="AI Sprint Standup Generator"
          style={{
            height: '32px',
            padding: '0 10px',
            fontSize: '11.5px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
            borderColor: 'var(--border-accent)'
          }}
        >
          <Bot size={13} color="var(--accent-cyan)" />
          <span>Standup</span>
        </button>

        {/* Compact Theme Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            title={`Theme: ${activeThemeObj.name}`}
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowPersonaMenu(false);
              setShowBoardMenu(false);
            }}
            style={{
              padding: '4px 8px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: activeThemeObj.previewColor,
                boxShadow: `0 0 6px ${activeThemeObj.previewColor}`
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{activeThemeObj.name.split(' ')[0]}</span>
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {showThemeMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '230px',
                padding: '6px',
                zIndex: 60,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase' }}>
                Design Theme Palette
              </div>
              {themes.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    changeTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: theme === t.id ? 'var(--primary-light)' : 'transparent',
                    color: theme === t.id ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: t.previewColor,
                      boxShadow: `0 0 6px ${t.previewColor}`
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{t.name}</span>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 400 }}>{t.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time WebSocket Live Status Pill */}
        <div
          title={`${onlineClients} user(s) live on WebSocket`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--accent-emerald-light)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            color: 'var(--accent-emerald)',
            fontWeight: 600
          }}
        >
          <span className="pulse-dot online" style={{ width: '6px', height: '6px' }} />
          <span>{onlineClients}</span>
        </div>

        {/* Audio Toggle */}
        <button
          className="btn-icon"
          style={{ width: '28px', height: '28px' }}
          title={soundActive ? 'Sound: Enabled' : 'Sound: Muted'}
          onClick={handleSoundToggle}
        >
          {soundActive ? <Volume2 size={13} color="var(--primary)" /> : <VolumeX size={13} />}
        </button>

        {/* Reset Showcase Data */}
        <button
          className="btn-icon"
          style={{ width: '28px', height: '28px' }}
          title="Reset board to clean showcase demo dataset"
          onClick={() => {
            if (window.confirm('Reset board to clean recruiter showcase dataset?')) {
              resetBoard();
            }
          }}
        >
          <RotateCcw size={13} />
        </button>

        {/* Persona Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            title="Switch User Persona"
            onClick={() => {
              setShowPersonaMenu(!showPersonaMenu);
              setShowBoardMenu(false);
              setShowThemeMenu(false);
            }}
            style={{
              padding: '2px 6px 2px 3px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="avatar" style={{ width: '24px', height: '24px' }} />
            ) : (
              <div className="avatar-initials" style={{ width: '24px', height: '24px', fontSize: '11px' }}>
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <span style={{ fontSize: '11.5px', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {showPersonaMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '240px',
                padding: '6px',
                zIndex: 60,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase' }}>
                Switch Teammate Persona
              </div>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    switchPersona(u.id);
                    setShowPersonaMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: user?.id === u.id ? 'var(--primary-light)' : 'transparent',
                    color: user?.id === u.id ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <img src={u.avatar} alt={u.name} className="avatar" style={{ width: '22px', height: '22px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{u.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
