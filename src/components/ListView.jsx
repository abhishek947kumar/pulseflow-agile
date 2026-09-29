import React from 'react';
import { 
  Play, 
  Square, 
  Clock, 
  Calendar, 
  ChevronRight, 
  CheckSquare 
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { formatDuration, formatDateRelative, getDueDateStatus } from '../utils/helpers';

export default function ListView({ onOpenModal }) {
  const { tasks, columns } = useBoard();
  const { users } = useAuth();
  const { activeTimer, startTaskTimer, stopTaskTimer } = useTimer();

  const getColumnName = (colId) => {
    const col = columns.find(c => c.id === colId);
    return col ? col.title : colId;
  };

  const getColumnColor = (colId) => {
    const col = columns.find(c => c.id === colId);
    return col ? col.colorAccent : '#6366f1';
  };

  return (
    <div className="view-container glass-panel" style={{ padding: '0' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Task Registry & Timeline</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spreadsheet view of all in-flight and backlog items</p>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          {tasks.length} total tasks
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 18px', width: '90px' }}>Priority</th>
              <th style={{ padding: '12px 18px' }}>Task Title & Tags</th>
              <th style={{ padding: '12px 18px', width: '170px' }}>Stage</th>
              <th style={{ padding: '12px 18px', width: '160px' }}>Assignee</th>
              <th style={{ padding: '12px 18px', width: '130px' }}>Due Date</th>
              <th style={{ padding: '12px 18px', width: '150px' }}>Time Tracked</th>
              <th style={{ padding: '12px 18px', width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const isTimerRunning = activeTimer && activeTimer.taskId === task.id;
              const dueDateStatus = getDueDateStatus(task.dueDate);

              return (
                <tr
                  key={task.id}
                  onClick={() => onOpenModal(task)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    background: isTimerRunning ? 'rgba(6, 182, 212, 0.05)' : 'transparent'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = isTimerRunning ? 'rgba(6, 182, 212, 0.05)' : 'transparent'}
                >
                  {/* Priority */}
                  <td style={{ padding: '12px 18px' }}>
                    <span className={`badge-priority priority-${task.priority || 'medium'}`}>
                      {task.priority || 'medium'}
                    </span>
                  </td>

                  {/* Title & Tags */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {task.title}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="tag-pill"
                            style={{ fontSize: '10px', padding: '1px 6px' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Stage / Column */}
                  <td style={{ padding: '12px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getColumnColor(task.columnId)
                        }}
                      />
                      {getColumnName(task.columnId)}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: '12px 18px' }}>
                    {assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={assignee.avatar} alt={assignee.name} className="avatar" style={{ width: '22px', height: '22px' }} />
                        <span style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>{assignee.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '12px' }}>Unassigned</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td style={{ padding: '12px 18px' }}>
                    {task.dueDate ? (
                      <span
                        style={{
                          fontSize: '12px',
                          color: dueDateStatus === 'overdue' ? '#f43f5e' : (dueDateStatus === 'due-soon' ? '#fbbf24' : 'var(--text-muted)'),
                          fontWeight: dueDateStatus !== 'normal' ? 600 : 400
                        }}
                      >
                        {formatDateRelative(task.dueDate)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  {/* Time Tracked */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ color: isTimerRunning ? '#38bdf8' : 'var(--text-main)', fontWeight: 600 }}>
                        {formatDuration(task.timeSpentSeconds)}
                      </span>
                      {task.estimatedHours > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          / {task.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action / Quick Timer */}
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTimerRunning) stopTaskTimer();
                        else startTaskTimer(task);
                      }}
                      className="btn-icon"
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'inline-flex',
                        background: isTimerRunning ? 'rgba(6, 182, 212, 0.2)' : undefined,
                        borderColor: isTimerRunning ? '#06b6d4' : undefined,
                        color: isTimerRunning ? '#38bdf8' : undefined
                      }}
                      title={isTimerRunning ? 'Stop timer' : 'Start stopwatch'}
                    >
                      {isTimerRunning ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
