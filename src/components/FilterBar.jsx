import React from 'react';
import { 
  Search, 
  User, 
  X, 
  Layers, 
  Download, 
  Printer,
  SlidersHorizontal
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { exportBoardToCSV, generatePrintableReport } from '../utils/export';

export default function FilterBar() {
  const {
    tasks,
    allTasks,
    columns,
    searchQuery,
    setSearchQuery,
    filterAssignee,
    setFilterAssignee,
    filterPriority,
    setFilterPriority,
    groupBy,
    setGroupBy,
    currentBoard
  } = useBoard();

  const { users } = useAuth();

  const priorities = [
    { id: 'all', label: 'All Priorities' },
    { id: 'urgent', label: '🔴 Urgent' },
    { id: 'high', label: '🟠 High' },
    { id: 'medium', label: '🟣 Medium' },
    { id: 'low', label: '⚪ Low' }
  ];

  const hasActiveFilters = searchQuery !== '' || filterAssignee !== 'all' || filterPriority !== 'all' || groupBy !== 'none';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAssignee('all');
    setFilterPriority('all');
    setGroupBy('none');
  };

  const handleExportCSV = () => {
    exportBoardToCSV({
      board: currentBoard,
      tasks: allTasks,
      columns,
      users
    });
  };

  const handlePrint = () => {
    generatePrintableReport({
      board: currentBoard,
      tasks: allTasks,
      columns,
      users
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '10px',
        margin: '0 0 10px 0',
        padding: '6px 12px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}
    >
      {/* Left: Compact Search & Dropdown Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Compact Search */}
        <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            placeholder="Search tasks, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '30px',
              paddingRight: searchQuery ? '26px' : '10px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-dim)',
                padding: '2px'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Priority Dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              height: '32px',
              padding: '2px 8px',
              fontSize: '11.5px',
              borderRadius: 'var(--radius-sm)',
              background: filterPriority !== 'all' ? 'var(--primary-light)' : undefined,
              borderColor: filterPriority !== 'all' ? 'var(--border-accent)' : undefined,
              color: filterPriority !== 'all' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: filterPriority !== 'all' ? 600 : 400
            }}
          >
            {priorities.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            style={{
              height: '32px',
              padding: '2px 8px',
              fontSize: '11.5px',
              borderRadius: 'var(--radius-sm)',
              background: filterAssignee !== 'all' ? 'var(--primary-light)' : undefined,
              borderColor: filterAssignee !== 'all' ? 'var(--border-accent)' : undefined,
              color: filterAssignee !== 'all' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: filterAssignee !== 'all' ? 600 : 400
            }}
          >
            <option value="all">All Assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode (Columns vs Swimlanes) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              height: '32px',
              padding: '2px 8px',
              fontSize: '11.5px',
              borderRadius: 'var(--radius-sm)',
              background: groupBy !== 'none' ? 'var(--primary-light)' : undefined,
              borderColor: groupBy !== 'none' ? 'var(--border-accent)' : undefined
            }}
          >
            <option value="none">Standard Columns</option>
            <option value="assignee">Swimlanes: Assignee</option>
            <option value="priority">Swimlanes: Priority</option>
          </select>
        </div>

        {/* Reset Filter Button if any filter active */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost"
            style={{ fontSize: '11px', color: 'var(--accent-rose)', height: '32px', padding: '2px 8px' }}
            title="Clear all active filters"
          >
            <X size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Right: Export actions & Task Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="btn-secondary"
          title="Download board tasks as CSV spreadsheet"
          style={{ height: '30px', padding: '2px 8px', fontSize: '11.5px' }}
        >
          <Download size={12} />
          <span>CSV</span>
        </button>

        {/* Print Summary */}
        <button
          onClick={handlePrint}
          className="btn-secondary"
          title="Open printable executive milestone report"
          style={{ height: '30px', padding: '2px 8px', fontSize: '11.5px' }}
        >
          <Printer size={12} />
        </button>

        {/* Task Counter */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            borderLeft: '1px solid var(--border-subtle)',
            paddingLeft: '8px',
            marginLeft: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          {hasActiveFilters ? (
            <span><strong style={{ color: 'var(--text-main)' }}>{tasks.length}</strong>/{allTasks.length} tasks</span>
          ) : (
            <span><strong style={{ color: 'var(--text-main)' }}>{allTasks.length}</strong> tasks</span>
          )}
        </div>
      </div>
    </div>
  );
}
