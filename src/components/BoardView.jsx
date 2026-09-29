import React, { useState } from 'react';
import { Plus, User, AlertCircle, Layers } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';

export default function BoardView({ onOpenModal }) {
  const { currentBoard, columns, tasks, groupBy } = useBoard();
  const { users } = useAuth();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6366F1');

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !currentBoard) return;

    try {
      await fetch(`/api/boards/${currentBoard.id}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newColumnTitle.trim(),
          colorAccent: newColumnColor
        })
      });
      setNewColumnTitle('');
      setShowAddColumn(false);
      window.location.reload();
    } catch (err) {
      console.error('Error adding column:', err);
    }
  };

  // If standard columns view without swimlanes
  if (groupBy === 'none') {
    return (
      <div className="kanban-board-container">
        {columns.map(col => {
          const columnTasks = tasks
            .filter(t => t.columnId === col.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

          return (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={columnTasks}
              onOpenModal={onOpenModal}
            />
          );
        })}

        {/* Add New Column Card */}
        <div style={{ minWidth: '280px', width: '280px' }}>
          {showAddColumn ? (
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                border: '1px solid var(--border-accent)',
                background: 'var(--bg-secondary)'
              }}
            >
              <h4 style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text-main)' }}>Add Workflow Stage</h4>
              <form onSubmit={handleAddColumn}>
                <input
                  type="text"
                  placeholder="Column title (e.g. Blocked, QA)"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  autoFocus
                  style={{ width: '100%', marginBottom: '10px', fontSize: '12.5px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Accent:</span>
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'].map(color => (
                    <div
                      key={color}
                      onClick={() => setNewColumnColor(color)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: newColumnColor === color ? '2px solid #ffffff' : 'none',
                        transform: newColumnColor === color ? 'scale(1.2)' : 'none'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddColumn(false)}
                    className="btn-ghost"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}
            >
              <Plus size={16} />
              <span>Add Stage Column</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Swimlane View: Groups tasks horizontally by Assignee or Priority
  let swimlaneGroups = [];
  if (groupBy === 'assignee') {
    swimlaneGroups = users.map(u => ({
      id: u.id,
      title: u.name,
      subtitle: u.role,
      avatar: u.avatar,
      filter: (t) => t.assigneeId === u.id
    }));
    swimlaneGroups.push({
      id: 'unassigned',
      title: 'Unassigned Tasks',
      subtitle: 'Open for team pickup',
      avatar: null,
      filter: (t) => !t.assigneeId
    });
  } else if (groupBy === 'priority') {
    const priorities = [
      { id: 'urgent', title: 'Urgent Priority', color: 'var(--accent-rose)' },
      { id: 'high', title: 'High Priority', color: 'var(--accent-amber)' },
      { id: 'medium', title: 'Medium Priority', color: 'var(--primary)' },
      { id: 'low', title: 'Low Priority', color: 'var(--text-dim)' }
    ];
    swimlaneGroups = priorities.map(p => ({
      id: p.id,
      title: p.title,
      color: p.color,
      filter: (t) => (t.priority || 'medium') === p.id
    }));
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {swimlaneGroups.map(lane => {
        const laneTasks = tasks.filter(lane.filter);
        if (laneTasks.length === 0) return null; // hide empty swimlanes for compactness

        return (
          <div key={lane.id} className="glass-panel" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
            {/* Swimlane Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {lane.avatar && (
                  <img src={lane.avatar} alt={lane.title} className="avatar" style={{ width: '28px', height: '28px' }} />
                )}
                {lane.color && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: lane.color }} />
                )}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{lane.title}</h4>
                  {lane.subtitle && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lane.subtitle}</span>
                  )}
                </div>
              </div>

              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {laneTasks.length} {laneTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Horizontal Column Track within this Swimlane */}
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
              {columns.map(col => {
                const colTasks = laneTasks
                  .filter(t => t.columnId === col.id)
                  .sort((a, b) => (a.position || 0) - (b.position || 0));

                return (
                  <div key={col.id} style={{ minWidth: '260px', maxWidth: '280px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', borderLeft: `3px solid ${col.colorAccent || '#6366f1'}`, paddingLeft: '8px' }}>
                      <span>{col.title}</span>
                      <span className="mono" style={{ fontSize: '11px' }}>{colTasks.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px' }}>
                      {colTasks.map(task => (
                        <div key={task.id}>
                          <KanbanColumn
                            column={col}
                            tasks={[task]}
                            onOpenModal={onOpenModal}
                          />
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div style={{ height: '40px', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
