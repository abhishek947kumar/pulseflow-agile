import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { playDropSound, playSuccessSound } from '../utils/audio';

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const { user, token } = useAuth();
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [onlineClients, setOnlineClients] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Search, Filter & Swimlane State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'assignee' | 'priority'
  const [taskViewers, setTaskViewers] = useState({}); // taskId -> Array of users

  // WebSocket reference
  const wsRef = useRef(null);

  // Helper to add toast
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Fetch initial boards
  const loadBoards = async () => {
    try {
      const res = await fetch('/api/boards', {
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.boards) {
        setBoards(data.boards);
        if (data.boards.length > 0 && !currentBoard) {
          await loadBoardDetails(data.boards[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    }
  };

  // Load specific board data
  const loadBoardDetails = async (boardId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/boards/${boardId}`, {
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.board) {
        setCurrentBoard(data.board);
        setColumns(data.board.columns || []);
        setTasks(data.board.tasks || []);
      }

      // Load activities
      const actRes = await fetch(`/api/boards/${boardId}/activities`, {
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const actData = await actRes.json();
      if (actData.activities) {
        setActivities(actData.activities);
      }
    } catch (err) {
      console.error('Failed to load board details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [user]);

  // WebSocket connection & live sync
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws = null;
    let reconnectTimeout = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WS] Connected to live board synchronization bus');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWsMessage(data);
          } catch (e) {
            console.error('[WS] Error processing message:', e);
          }
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected. Reconnecting in 3s...');
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WS] Socket warning:', err.message || err);
          ws.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [currentBoard?.id]);

  const handleWsMessage = ({ type, payload }) => {
    switch (type) {
      case 'SYSTEM_STATUS':
        if (payload.onlineClients !== undefined) {
          setOnlineClients(payload.onlineClients);
        }
        break;

      case 'TASK_MOVED':
        setTasks(prev => {
          const filtered = prev.filter(t => t.id !== payload.taskId);
          return [...filtered, payload.task].sort((a, b) => (a.position || 0) - (b.position || 0));
        });
        if (payload.user?.id !== user?.id) {
          addToast(`${payload.user?.name || 'Teammate'} moved "${payload.task.title}"`, 'info');
        }
        break;

      case 'TASK_CREATED':
        setTasks(prev => [...prev, payload.task]);
        if (payload.user?.id !== user?.id) {
          addToast(`${payload.user?.name || 'Teammate'} created task "${payload.task.title}"`, 'success');
        }
        break;

      case 'TASK_UPDATED':
        setTasks(prev => prev.map(t => (t.id === payload.task.id ? payload.task : t)));
        break;

      case 'TASK_DELETED':
        setTasks(prev => prev.filter(t => t.id !== payload.taskId));
        if (payload.user?.id !== user?.id) {
          addToast(`Task deleted by ${payload.user?.name || 'Teammate'}`, 'info');
        }
        break;

      case 'SUBTASK_TOGGLED':
      case 'SUBTASK_ADDED':
      case 'SUBTASK_DELETED':
        setTasks(prev => prev.map(t => (t.id === payload.taskId ? payload.task : t)));
        break;

      case 'COMMENT_ADDED':
        setTasks(prev =>
          prev.map(t => {
            if (t.id === payload.taskId) {
              return { ...t, comments: [...(t.comments || []), payload.comment] };
            }
            return t;
          })
        );
        break;

      case 'INITIAL_VIEWERS':
        if (payload.viewers) {
          setTaskViewers(payload.viewers);
        }
        break;

      case 'TASK_VIEWERS_UPDATED':
        setTaskViewers(prev => ({
          ...prev,
          [payload.taskId]: payload.viewers || []
        }));
        break;

      case 'COLUMN_CREATED':
        setColumns(prev => [...prev, payload.column]);
        break;

      case 'BOARD_RESET':
        if (payload.board) {
          setCurrentBoard(payload.board);
          setColumns(payload.board.columns || []);
          setTasks(payload.board.tasks || []);
          addToast('Board re-synchronized to sample dataset', 'success');
        }
        break;

      default:
        break;
    }
  };

  // Optimistic Move Task Handler with sound & celebration
  const moveTask = async (taskId, targetColumnId, newPosition = 0) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // Check if moving to completed
    const isMovingToCompleted = targetColumnId.includes('completed') || targetColumnId.includes('done');
    if (isMovingToCompleted && targetTask.columnId !== targetColumnId) {
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#06B6D4', '#F59E0B']
      });
    } else {
      playDropSound();
    }

    // Optimistically update local state
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, columnId: targetColumnId, position: newPosition };
        }
        return t;
      })
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ targetColumnId, newPosition })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Move failed on server:', data.error);
        loadBoardDetails(currentBoard.id);
      }
    } catch (err) {
      console.error('Network error during move:', err);
      loadBoardDetails(currentBoard.id);
    }
  };

  const createTask = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...taskData,
          boardId: currentBoard.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => [...prev, data.task]);
        addToast(`Created task "${data.task.title}"`, 'success');
        return data.task;
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const updateTask = async (taskId, updates) => {
    // Optimistic update
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
        return data.task;
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      addToast(`Deleted task "${taskToDelete?.title || ''}"`, 'info');
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const addSubtask = async (taskId, title) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  const addComment = async (taskId, content) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const resetBoard = async () => {
    if (!currentBoard) return;
    try {
      const res = await fetch(`/api/boards/${currentBoard.id}/reset`, {
        method: 'POST',
        headers: {
          'x-demo-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentBoard(data.board);
        setColumns(data.board.columns || []);
        setTasks(data.board.tasks || []);
        addToast('Restored showcase sample data', 'success');
      }
    } catch (err) {
      console.error('Error resetting board:', err);
    }
  };

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesTag = (task.tags || []).some(t => t.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Assignee filter
      if (filterAssignee !== 'all') {
        if (task.assigneeId !== filterAssignee) return false;
      }

      // Priority filter
      if (filterPriority !== 'all') {
        if (task.priority !== filterPriority) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterAssignee, filterPriority]);

  const enterTask = (taskId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: 'ENTER_TASK',
        payload: { taskId, user: { id: user.id, name: user.name, avatar: user.avatar } }
      }));
    }
  };

  const leaveTask = (taskId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'LEAVE_TASK',
        payload: { taskId }
      }));
    }
  };

  return (
    <BoardContext.Provider
      value={{
        boards,
        currentBoard,
        columns,
        tasks: filteredTasks,
        allTasks: tasks,
        activities,
        onlineClients,
        loading,
        toasts,
        searchQuery,
        setSearchQuery,
        filterAssignee,
        setFilterAssignee,
        filterPriority,
        setFilterPriority,
        groupBy,
        setGroupBy,
        taskViewers,
        enterTask,
        leaveTask,
        loadBoardDetails,
        moveTask,
        createTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        addSubtask,
        addComment,
        resetBoard,
        addToast
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within a BoardProvider');
  return context;
}

