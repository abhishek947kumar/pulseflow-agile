import React from 'react';
import { 
  Play, 
  Square, 
  CheckSquare, 
  Clock, 
  Calendar, 
  MessageSquare,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';
import { useTimer } from '../context/TimerContext';
import { formatDuration, formatDateRelative, getDueDateStatus } from '../utils/helpers';

export default function TaskCard({ task, onOpenModal }) {
  const { user, users } = useAuth();
  const { taskViewers } = useBoard();
  const { activeTimer, startTaskTimer, stopTaskTimer } = useTimer();

  const assignee = users.find(u => u.id === task.assigneeId);
  const isTimerRunning = activeTimer && activeTimer.taskId === task.id;

  // Live viewers on this card (collaborative presence)
  const viewers = (taskViewers && taskViewers[task.id]) || [];
  const otherViewers = viewers.filter(v => v.id !== user?.id);

  // Cycle time risk calculation
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.columnId.includes('completed');
  const isEffortOverrun = task.estimatedHours > 0 && ((task.timeSpentSeconds || 0) / 3600) > task.estimatedHours && !task.columnId.includes('completed');

  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const dueDateStatus = getDueDateStatus(task.dueDate);

  // Drag handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleTimerToggle = (e) => {
    e.stopPropagation();
    if (isTimerRunning) {
      stopTaskTimer();
    } else {
      startTaskTimer(task);
    }
  };

  // Border accent color based on priority
  const priorityColor = 
    task.priority === 'urgent' ? 'var(--accent-rose)' :
    task.priority === 'high' ? 'var(--accent-amber)' :
    task.priority === 'medium' ? 'var(--primary)' : 'var(--text-dim)';

  return (
    <div
      className={`task-card ${isTimerRunning ? 'pulse-timer' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onOpenModal(task)}
      style={{
        borderTop: isTimerRunning ? '3px solid var(--accent-cyan)' : `3px solid ${priorityColor}`,
        background: isTimerRunning ? 'var(--accent-cyan-light)' : undefined
      }}
    >
      {/* Top Header: Priority Badge, Presence Viewers, & Quick Timer Play Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className={`badge-priority priority-${task.priority || 'medium'}`}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityColor }} />
            {task.priority || 'medium'}
          </span>

          {/* Risk Badges */}
          {isOverdue && (
            <span
              title="Task is past scheduled due date"
              className="tag-pill"
              style={{
                color: 'var(--accent-rose)',
                borderColor: 'rgba(244,63,94,0.35)',
                background: 'var(--accent-rose-light)',
                padding: '1px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '9.5px'
              }}
            >
              <AlertTriangle size={9} /> Overdue
            </span>
          )}
          {!isOverdue && isEffortOverrun && (
            <span
              title="Tracked effort has exceeded initial estimation"
              className="tag-pill"
              style={{
                color: 'var(--accent-amber)',
                borderColor: 'rgba(245,158,11,0.35)',
                background: 'var(--accent-amber-light)',
                padding: '1px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '9.5px'
              }}
            >
              <Clock size={9} /> Overrun
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Live Collaborator Viewing Pill */}
          {otherViewers.length > 0 && (
            <div
              title={`${otherViewers.map(v => v.name).join(', ')} is currently inspecting this task`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-cyan-light)',
                border: '1px solid var(--accent-cyan)',
                fontSize: '9.5px',
                color: 'var(--accent-cyan)',
                fontWeight: 600
              }}
            >
              <Eye size={9} />
              <span>{otherViewers[0]?.name?.split(' ')[0]}</span>
            </div>
          )}

          {/* Quick Timer Button */}
          <button
            onClick={handleTimerToggle}
            title={isTimerRunning ? 'Timer is currently running! Click to stop' : 'Start tracking time on this task'}
            style={{
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              background: isTimerRunning ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: isTimerRunning ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              color: isTimerRunning ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '10.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer'
            }}
          >
            {isTimerRunning ? (
              <>
                <Square size={9} fill="currentColor" />
                <span className="mono" style={{ fontWeight: 700, fontSize: '10px' }}>Stop</span>
              </>
            ) : (
              <>
                <Play size={9} fill="currentColor" />
                <span style={{ fontSize: '10px' }}>Timer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Task Title */}
      <div className="task-card-title">
        {task.title}
      </div>

      {/* Bottom Metadata Bar: Tags, Subtask checklist pill, Time, Due Date & Assignee Avatar */}
      <div className="task-meta-bar">
        <div className="task-meta-left">
          {/* Tags (up to 2) */}
          {task.tags && task.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="tag-pill"
              style={{
                color: tag.color || 'var(--primary)',
                borderColor: `${tag.color || '#6366f1'}33`,
                background: `${tag.color || '#6366f1'}15`,
                fontSize: '9.5px',
                padding: '1px 5px'
              }}
            >
              {tag.name}
            </span>
          ))}

          {/* Checklist subtask counter pill */}
          {totalSubtasks > 0 && (
            <span
              title={`Subtasks: ${completedSubtasks} of ${totalSubtasks} completed`}
              className="tag-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: completedSubtasks === totalSubtasks ? 'var(--accent-emerald)' : 'var(--text-muted)',
                borderColor: completedSubtasks === totalSubtasks ? 'rgba(16, 185, 129, 0.3)' : undefined,
                background: completedSubtasks === totalSubtasks ? 'var(--accent-emerald-light)' : undefined,
                fontSize: '9.5px',
                padding: '1px 5px'
              }}
            >
              <CheckSquare size={10} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          )}

          {/* Time spent */}
          {(task.timeSpentSeconds > 0 || isTimerRunning) && (
            <span
              title={`Tracked: ${formatDuration(task.timeSpentSeconds)}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: isTimerRunning ? 'var(--accent-cyan)' : 'var(--text-dim)',
                fontSize: '10px'
              }}
            >
              <Clock size={10} />
              <span className="mono">{formatDuration(task.timeSpentSeconds)}</span>
            </span>
          )}

          {/* Due date if set */}
          {task.dueDate && (
            <span
              title={`Due Date: ${task.dueDate}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                color: dueDateStatus === 'overdue' ? 'var(--accent-rose)' : (dueDateStatus === 'due-soon' ? 'var(--accent-amber)' : 'var(--text-dim)'),
                fontSize: '10px',
                fontWeight: dueDateStatus !== 'normal' ? 600 : 400
              }}
            >
              <Calendar size={10} />
              <span>{formatDateRelative(task.dueDate)}</span>
            </span>
          )}

          {/* Comments count */}
          {task.comments && task.comments.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)', fontSize: '10px' }}>
              <MessageSquare size={10} />
              <span>{task.comments.length}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div>
          {assignee ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              title={`Assigned to ${assignee.name} (${assignee.role})`}
              className="avatar"
              style={{ width: '22px', height: '22px' }}
            />
          ) : (
            <div
              className="avatar-initials"
              style={{ width: '22px', height: '22px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)', fontSize: '10px' }}
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
