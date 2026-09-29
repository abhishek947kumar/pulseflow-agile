import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import TaskCard from './TaskCard';
import { useBoard } from '../context/BoardContext';

export default function KanbanColumn({ column, tasks, onOpenModal }) {
  const { moveTask, createTask } = useBoard();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only remove class if we are actually leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, column.id, tasks.length);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await createTask({
      columnId: column.id,
      title: quickTitle.trim(),
      priority: 'medium'
    });

    setQuickTitle('');
    setShowQuickAdd(false);
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title-wrap">
          <div
            className="column-accent-bar"
            style={{ backgroundColor: column.colorAccent || '#6366f1' }}
          />
          <h3 className="column-title">{column.title}</h3>
          <span className="column-count-badge">{tasks.length}</span>
        </div>

        <button
          onClick={() => setShowQuickAdd(true)}
          className="btn-icon"
          style={{ width: '28px', height: '28px' }}
          title={`Add task to ${column.title}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards Scrollable Area */}
      <div className="column-cards-container">
        {/* Inline Quick Add Input */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickAddSubmit}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <input
              type="text"
              placeholder="What needs to be done?"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              autoFocus
              style={{ width: '100%', marginBottom: '8px', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  setQuickTitle('');
                }}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Add Card
              </button>
            </div>
          </form>
        )}

        {/* Task Cards */}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onOpenModal={onOpenModal}
          />
        ))}

        {tasks.length === 0 && !showQuickAdd && (
          <div
            style={{
              padding: '30px 10px',
              textAlign: 'center',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-dim)',
              fontSize: '12px'
            }}
          >
            Drop tasks here or click + to add
          </div>
        )}
      </div>
    </div>
  );
}
