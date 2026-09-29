import React from 'react';
import { CalendarRange, Clock, CheckSquare, ChevronRight } from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/helpers';

export default function TimelineView({ onOpenModal }) {
  const { tasks, columns } = useBoard();
  const { users } = useAuth();

  const sprintDays = 14;
  const daysArray = Array.from({ length: sprintDays }, (_, i) => i + 1);

  // Compute simulated start & end column spans for visual Gantt display
  const getGanttSpan = (task, idx) => {
    // Determine span based on task properties
    const isCompleted = task.columnId.includes('completed');
    const isProgress = task.columnId.includes('progress');
    const isReview = task.columnId.includes('review');

    let startDay = 1;
    let durationDays = 4;

    if (isCompleted) {
      startDay = 1;
      durationDays = 5;
    } else if (isProgress) {
      startDay = 4 + (idx % 3);
      durationDays = 6;
    } else if (isReview) {
      startDay = 7;
      durationDays = 3;
    } else {
      startDay = 8 + (idx % 4);
      durationDays = 5;
    }

    startDay = Math.min(startDay, sprintDays - 2);
    const endDay = Math.min(sprintDays, startDay + durationDays);

    return { startDay, endDay, span: endDay - startDay + 1 };
  };

  const getStageColor = (columnId) => {
    const col = columns.find(c => c.id === columnId);
    return col?.colorAccent || '#6366F1';
  };

  return (
    <div className="view-container glass-panel" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarRange size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Sprint Roadmap & Gantt Schedule</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Visual work breakdown and timeline execution across the active 14-day sprint
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-emerald)' }} />
            Completed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-amber)' }} />
            In Progress
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }} />
            To Do
          </span>
        </div>
      </div>

      {/* Gantt Grid Table */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '950px' }}>
          {/* Header Row: Task Column (340px) + 14 Days Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: `340px repeat(${sprintDays}, 1fr)`, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deliverable & Assignee
            </div>
            {daysArray.map(day => (
              <div
                key={day}
                style={{
                  padding: '12px 4px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: day === 9 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  background: day === 9 ? 'var(--accent-cyan-light)' : 'transparent',
                  borderLeft: '1px solid var(--border-subtle)'
                }}
              >
                D{day}
                {day === 9 && <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Today</div>}
              </div>
            ))}
          </div>

          {/* Task Rows */}
          {tasks.map((task, idx) => {
            const assignee = users.find(u => u.id === task.assigneeId);
            const { startDay, span } = getGanttSpan(task, idx);
            const stageColor = getStageColor(task.columnId);
            const totalSub = task.subtasks?.length || 0;
            const completedSub = task.subtasks?.filter(s => s.completed).length || 0;
            const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : (task.columnId.includes('completed') ? 100 : 40);

            return (
              <div
                key={task.id}
                onClick={() => onOpenModal(task)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `340px repeat(${sprintDays}, 1fr)`,
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  alignItems: 'center',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Left Task Label */}
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {assignee ? (
                    <img src={assignee.avatar} alt={assignee.name} className="avatar" style={{ width: '22px', height: '22px' }} />
                  ) : (
                    <div className="avatar-initials" style={{ width: '22px', height: '22px', fontSize: '10px' }}>?</div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {formatDuration(task.timeSpentSeconds)} logged &bull; {task.priority}
                    </div>
                  </div>
                </div>

                {/* 14 Days Gantt Grid Cells with Task Span Bar */}
                <div
                  style={{
                    gridColumn: `2 / span ${sprintDays}`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${sprintDays}, 1fr)`,
                    height: '100%',
                    position: 'relative',
                    alignItems: 'center',
                    padding: '8px 0'
                  }}
                >
                  {/* Grid vertical line guides */}
                  {daysArray.map(day => (
                    <div
                      key={day}
                      style={{
                        height: '100%',
                        borderLeft: '1px solid var(--border-subtle)',
                        background: day === 9 ? 'var(--accent-cyan-light)' : 'transparent'
                      }}
                    />
                  ))}

                  {/* Horizontal Task Span Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${((startDay - 1) / sprintDays) * 100}% + 4px)`,
                      width: `calc(${(span / sprintDays) * 100}% - 8px)`,
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      background: `linear-gradient(90deg, ${stageColor}cc, ${stageColor})`,
                      boxShadow: `0 2px 8px ${stageColor}33`,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {progressPct}% &bull; {task.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
