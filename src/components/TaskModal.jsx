import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Clock, 
  CheckSquare, 
  Plus, 
  Calendar, 
  Play, 
  Square, 
  MessageSquare, 
  Send, 
  Sparkles,
  Bot,
  AlertTriangle
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { formatDuration, formatDateRelative, getDueDateStatus } from '../utils/helpers';

export default function TaskModal({ task, onClose }) {
  const { columns, updateTask, deleteTask, toggleSubtask, addSubtask, addComment, addToast } = useBoard();
  const { users, user } = useAuth();
  const { activeTimer, startTaskTimer, stopTaskTimer } = useTimer();

  // Form states
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [columnId, setColumnId] = useState(task.columnId);
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours || 0);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  // Subtask input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comment input
  const [newCommentText, setNewCommentText] = useState('');

  // Manual time log input
  const [manualHours, setManualHours] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [timeLogs, setTimeLogs] = useState([]);
  const [showManualTime, setShowManualTime] = useState(false);

  // AI Copilot state
  const [decomposing, setDecomposing] = useState(false);
  const [aiRationale, setAiRationale] = useState('');

  const isTimerRunning = activeTimer && activeTimer.taskId === task.id;

  // Load detailed logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/timer/logs?taskId=${task.id}`);
        const data = await res.json();
        if (data.logs) setTimeLogs(data.logs);
      } catch (e) {
        console.error('Error fetching logs:', e);
      }
    };
    fetchLogs();
  }, [task.id, isTimerRunning]);

  // AI Task Decomposition handler
  const handleAiDecompose = async () => {
    try {
      setDecomposing(true);
      const res = await fetch('/api/ai/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();

      if (data.subtasks && data.subtasks.length > 0) {
        // Add AI subtasks
        for (const sub of data.subtasks) {
          await addSubtask(task.id, sub.title);
        }

        // Apply suggestions if fields were blank
        if (!estimatedHours || estimatedHours === 0) {
          setEstimatedHours(data.estimatedHours);
          updateTask(task.id, { estimatedHours: data.estimatedHours });
        }

        if (data.suggestedTags && (!task.tags || task.tags.length === 0)) {
          updateTask(task.id, { tags: data.suggestedTags });
        }

        setAiRationale(data.rationale);
        addToast(`AI Copilot generated ${data.subtasks.length} technical subtasks!`, 'success');
      }
    } catch (err) {
      console.error('AI decomposition error:', err);
      addToast('Failed to run AI decomposition', 'error');
    } finally {
      setDecomposing(false);
    }
  };

  const handleSaveDetails = async () => {
    await updateTask(task.id, {
      title,
      description,
      columnId,
      priority,
      assigneeId: assigneeId || null,
      estimatedHours: Number(estimatedHours),
      dueDate: dueDate || null
    });
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await addComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleManualTimeSubmit = async (e) => {
    e.preventDefault();
    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours <= 0) return;

    try {
      const seconds = Math.round(hours * 3600);
      const res = await fetch('/api/timer/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user.id
        },
        body: JSON.stringify({
          taskId: task.id,
          durationSeconds: seconds,
          note: manualNote || 'Manual log entry'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTimeLogs(prev => [data.log, ...prev]);
        setManualHours('');
        setManualNote('');
        setShowManualTime(false);
        updateTask(task.id, { timeSpentSeconds: (task.timeSpentSeconds || 0) + seconds });
      }
    } catch (err) {
      console.error('Error logging manual time:', err);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const checklistProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Cycle time risk calculation
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isTimeOverbudget = task.estimatedHours > 0 && ((task.timeSpentSeconds || 0) / 3600) > task.estimatedHours;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge-priority priority-${priority}`}>
              {priority}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Task Inspector
            </span>

            {/* Risk Badges */}
            {isOverdue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f43f5e', background: 'rgba(244,63,94,0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 600 }}>
                <AlertTriangle size={12} /> Schedule Risk: Overdue
              </span>
            )}
            {isTimeOverbudget && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>
                <Clock size={12} /> Effort Exceeded Estimate
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDelete}
              className="btn-danger"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Delete Task"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', padding: '24px' }}>
          {/* Left Column: Title, Description, Checklist, Discussion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveDetails}
                style={{ width: '100%', fontSize: '16px', fontWeight: 700 }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Description & Acceptance Criteria
              </label>
              <textarea
                rows={4}
                value={description}
                placeholder="Add background context, technical specifications, or steps..."
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDetails}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Subtasks / Checklist with AI Copilot Button */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={16} color="var(--primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Subtasks Checklist</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* AI Copilot Button */}
                  <button
                    onClick={handleAiDecompose}
                    disabled={decomposing}
                    className="btn-secondary"
                    style={{
                      padding: '3px 9px',
                      height: '28px',
                      fontSize: '11px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                      borderColor: 'var(--border-accent)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <Sparkles size={12} color="var(--accent-cyan)" />
                    {decomposing ? 'Decomposing...' : 'AI Decompose'}
                  </button>

                  <span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {completedSubtasks}/{totalSubtasks} ({Math.round(checklistProgress)}%)
                  </span>
                </div>
              </div>

              {aiRationale && (
                <div style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', background: 'var(--accent-cyan-light)', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                  🤖 {aiRationale}
                </div>
              )}

              {/* Progress bar */}
              <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', marginBottom: '14px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${checklistProgress}%`,
                    background: checklistProgress === 100 ? 'var(--accent-emerald)' : 'linear-gradient(90deg, var(--primary), var(--accent-cyan))',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Subtask list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {task.subtasks && task.subtasks.map(s => (
                  <div
                    key={s.id}
                    onClick={() => toggleSubtask(task.id, s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: s.completed ? 'var(--accent-emerald-light)' : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      border: s.completed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={s.completed}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        color: s.completed ? 'var(--text-dim)' : 'var(--text-main)',
                        textDecoration: s.completed ? 'line-through' : 'none'
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add a new checklist item..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  style={{ flex: 1, fontSize: '12px', padding: '7px 12px' }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>

            {/* Discussion */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MessageSquare size={16} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Team Discussion</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', maxHeight: '180px', overflowY: 'auto' }}>
                {(!task.comments || task.comments.length === 0) ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  task.comments.map(c => {
                    const author = users.find(u => u.id === c.userId);
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img src={author?.avatar} alt={author?.name} className="avatar" style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{author?.name || 'Teammate'}</span>
                          </div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {c.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Write a comment or mention @teammate..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{ flex: 1, fontSize: '12.5px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 12px' }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Workflow Metadata & Time Tracker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Workflow Column / Stage
              </label>
              <select
                value={columnId}
                onChange={(e) => {
                  setColumnId(e.target.value);
                  updateTask(task.id, { columnId: e.target.value });
                }}
                style={{ width: '100%' }}
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  updateTask(task.id, { assigneeId: e.target.value || null });
                }}
                style={{ width: '100%' }}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    updateTask(task.id, { priority: e.target.value });
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    updateTask(task.id, { dueDate: e.target.value });
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Estimated Effort (Hours)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                onBlur={handleSaveDetails}
                style={{ width: '100%' }}
              />
            </div>

            {/* Time Tracking Section */}
            <div style={{ background: 'var(--accent-cyan-light)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Time Tracking
                </span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatDuration(task.timeSpentSeconds)} logged
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {isTimerRunning ? (
                  <button
                    onClick={() => stopTaskTimer()}
                    className="btn-danger"
                    style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                  >
                    <Square size={14} fill="currentColor" /> Stop Active Timer
                  </button>
                ) : (
                  <button
                    onClick={() => startTaskTimer(task)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '12.5px' }}
                  >
                    <Play size={14} fill="currentColor" /> Start Live Stopwatch
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualTime(!showManualTime)}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  Manual Log
                </button>
              </div>

              {showManualTime && (
                <form onSubmit={handleManualTimeSubmit} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="Hours (e.g. 1.5)"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      style={{ width: '110px', fontSize: '12px' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Work notes"
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      style={{ flex: 1, fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button type="button" onClick={() => setShowManualTime(false)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                      Log Hours
                    </button>
                  </div>
                </form>
              )}

              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Recorded Time Entries ({timeLogs.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {timeLogs.length === 0 ? (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No time entries logged yet.
                    </div>
                  ) : (
                    timeLogs.map(l => {
                      const u = users.find(x => x.id === l.userId);
                      return (
                        <div
                          key={l.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11.5px',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u?.name?.split(' ')[0] || 'Member'}: </span>
                            <span style={{ color: 'var(--text-muted)' }}>{l.note || 'Focus session'}</span>
                          </div>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {formatDuration(l.durationSeconds)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
