import React, { useState } from 'react';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';

export default function NewTaskModal({ isOpen, onClose, defaultColumnId }) {
  const { columns, createTask } = useBoard();
  const { users, user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || (columns[1]?.id || columns[0]?.id));
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState(user?.id || '');
  const [estimatedHours, setEstimatedHours] = useState('4');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(name => ({ name, color: '#6366F1' }));

    await createTask({
      title: title.trim(),
      description: description.trim(),
      columnId,
      priority,
      assigneeId: assigneeId || null,
      estimatedHours: parseFloat(estimatedHours) || 0,
      dueDate: dueDate || null,
      tags
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Create New Task</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Implement WebSocket reconnection retry"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief details or acceptance criteria..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Stage / Column
              </label>
              <select value={columnId} onChange={e => setColumnId(e.target.value)} style={{ width: '100%' }}>
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Priority
              </label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%' }}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Assignee
              </label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ width: '100%' }}>
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Estimated Effort (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Backend, API, Security"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} /> Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
