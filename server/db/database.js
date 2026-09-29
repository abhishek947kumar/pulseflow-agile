import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Initial seed data generator
function getInitialSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('demo123', salt);

  const users = [
    {
      id: 'usr-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@pulseflow.io',
      role: 'Staff Product Manager',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      colorAccent: '#6366F1',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@pulseflow.io',
      role: 'Lead Full-Stack Architect',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      colorAccent: '#06B6D4',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-3',
      name: 'Marcus Vance',
      email: 'marcus.vance@pulseflow.io',
      role: 'Principal UI/UX Designer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      colorAccent: '#F59E0B',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-4',
      name: 'Elena Rostova',
      email: 'elena.rostova@pulseflow.io',
      role: 'DevOps & Reliability Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      colorAccent: '#10B981',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr-5',
      name: 'David Kim',
      email: 'david.kim@pulseflow.io',
      role: 'Senior Frontend Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      colorAccent: '#EC4899',
      passwordHash: defaultPasswordHash
    }
  ];

  const boardId = 'board-pulseflow-2026';

  const columns = [
    { id: 'col-backlog', boardId, title: 'Backlog', position: 0, colorAccent: '#64748B' },
    { id: 'col-todo', boardId, title: 'To Do (Pending)', position: 1, colorAccent: '#3B82F6' },
    { id: 'col-progress', boardId, title: 'In Progress (Ongoing)', position: 2, colorAccent: '#F59E0B' },
    { id: 'col-review', boardId, title: 'In Review & QA', position: 3, colorAccent: '#8B5CF6' },
    { id: 'col-completed', boardId, title: 'Completed (Done)', position: 4, colorAccent: '#10B981' }
  ];

  const now = new Date();
  const daysOffset = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const tasks = [
    {
      id: 'tsk-101',
      boardId,
      columnId: 'col-progress',
      title: 'Real-time WebSocket event bus & reconnection jitter',
      description: 'Implement bi-directional event dispatching with exponential backoff and message acknowledgement for collaborative state updates.',
      priority: 'urgent',
      assigneeId: 'usr-2',
      reporterId: 'usr-1',
      estimatedHours: 12,
      timeSpentSeconds: 19800, // 5.5 hours
      dueDate: daysOffset(1),
      position: 0,
      tags: [
        { name: 'Backend', color: '#6366F1' },
        { name: 'WebSocket', color: '#06B6D4' },
        { name: 'Real-time', color: '#F43F5E' }
      ],
      subtasks: [
        { id: 'sub-1', title: 'Setup WS heartbeat ping/pong', completed: true },
        { id: 'sub-2', title: 'Implement room broadcast filtering', completed: true },
        { id: 'sub-3', title: 'Handle client reconnect buffer flush', completed: false },
        { id: 'sub-4', title: 'Write load testing benchmark', completed: false }
      ],
      comments: [
        {
          id: 'cmt-1',
          userId: 'usr-1',
          content: 'Sarah, make sure we have fallbacks in case proxy closes idle sockets after 60s.',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'cmt-2',
          userId: 'usr-2',
          content: 'Added 25s ping heartbeats, testing smooth failover now!',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ]
    },
    {
      id: 'tsk-102',
      boardId,
      columnId: 'col-progress',
      title: 'Executive Analytics & D3.js Sprint Burndown Visualization',
      description: 'Design and render interactive burndown curves, team velocity metrics, and cycle-time distribution with smooth hover tooltips.',
      priority: 'high',
      assigneeId: 'usr-5',
      reporterId: 'usr-1',
      estimatedHours: 16,
      timeSpentSeconds: 28800, // 8.0 hours
      dueDate: daysOffset(2),
      position: 1,
      tags: [
        { name: 'Frontend', color: '#EC4899' },
        { name: 'D3.js', color: '#F59E0B' },
        { name: 'Analytics', color: '#10B981' }
      ],
      subtasks: [
        { id: 'sub-5', title: 'Compute ideal vs actual trajectory coordinates', completed: true },
        { id: 'sub-6', title: 'Add animated SVG path drawing', completed: true },
        { id: 'sub-7', title: 'Crosshair inspection tooltip with date/points', completed: true },
        { id: 'sub-8', title: 'Export report to CSV/PNG', completed: false }
      ],
      comments: [
        {
          id: 'cmt-3',
          userId: 'usr-3',
          content: 'The gradient fill under the burndown line looks slick! Check contrast in light mode too.',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ]
    },
    {
      id: 'tsk-103',
      boardId,
      columnId: 'col-todo',
      title: 'JWT Authentication & Role-Based Access Control (RBAC)',
      description: 'Implement secure Bearer token authentication, refresh token rotation, password hashing with bcrypt, and session validation.',
      priority: 'high',
      assigneeId: 'usr-2',
      reporterId: 'usr-4',
      estimatedHours: 8,
      timeSpentSeconds: 7200, // 2.0 hours
      dueDate: daysOffset(3),
      position: 0,
      tags: [
        { name: 'Security', color: '#EF4444' },
        { name: 'Auth', color: '#6366F1' }
      ],
      subtasks: [
        { id: 'sub-9', title: 'Generate signed JWT with user claims', completed: true },
        { id: 'sub-10', title: 'Protected API route middleware verification', completed: true },
        { id: 'sub-11', title: 'Implement quick persona switcher for recruiters', completed: false }
      ],
      comments: []
    },
    {
      id: 'tsk-104',
      boardId,
      columnId: 'col-todo',
      title: 'Active Task Stopwatch & Pomodoro Floating Ticker',
      description: 'Build persistent global timer widget with play/pause, duration auto-accumulation, session notes, and audio chime when Pomodoro ends.',
      priority: 'medium',
      assigneeId: 'usr-3',
      reporterId: 'usr-1',
      estimatedHours: 6,
      timeSpentSeconds: 3600,
      dueDate: daysOffset(4),
      position: 1,
      tags: [
        { name: 'UX/UI', color: '#F59E0B' },
        { name: 'Timer', color: '#06B6D4' }
      ],
      subtasks: [
        { id: 'sub-12', title: 'Synchronize running timer in localStorage', completed: true },
        { id: 'sub-13', title: 'Create Web Audio synthesizer for chime', completed: false },
        { id: 'sub-14', title: 'Log time slice to task history upon stop', completed: false }
      ],
      comments: []
    },
    {
      id: 'tsk-105',
      boardId,
      columnId: 'col-todo',
      title: 'Interactive Drag-and-Drop Kanban Columns with Micro-animations',
      description: 'Refined dragging feel with glassmorphic ghost card, drop target highlights, auto-scroll on column edges, and keyboard accessible reorder.',
      priority: 'urgent',
      assigneeId: 'usr-5',
      reporterId: 'usr-3',
      estimatedHours: 10,
      timeSpentSeconds: 0,
      dueDate: daysOffset(1),
      position: 2,
      tags: [
        { name: 'Frontend', color: '#EC4899' },
        { name: 'Animation', color: '#8B5CF6' }
      ],
      subtasks: [
        { id: 'sub-15', title: 'HTML5 Drag & Drop handlers with smooth transition', completed: false },
        { id: 'sub-16', title: 'Sound feedback on drop', completed: false },
        { id: 'sub-17', title: 'Confetti explosion upon dropping into Completed', completed: false }
      ],
      comments: []
    },
    {
      id: 'tsk-106',
      boardId,
      columnId: 'col-review',
      title: 'Automated CI/CD Pipeline & Zero-Downtime Deployment',
      description: 'Configure GitHub Actions workflow for linting, testing, Docker container builds, and deployment verification.',
      priority: 'medium',
      assigneeId: 'usr-4',
      reporterId: 'usr-2',
      estimatedHours: 8,
      timeSpentSeconds: 27000, // 7.5 hours
      dueDate: daysOffset(0), // today
      position: 0,
      tags: [
        { name: 'DevOps', color: '#10B981' },
        { name: 'Docker', color: '#06B6D4' }
      ],
      subtasks: [
        { id: 'sub-18', title: 'Write multi-stage Dockerfile', completed: true },
        { id: 'sub-19', title: 'Setup healthcheck endpoint /api/health', completed: true },
        { id: 'sub-20', title: 'Verify staging rollout', completed: true }
      ],
      comments: [
        {
          id: 'cmt-4',
          userId: 'usr-4',
          content: 'Pipeline green across all checks. Ready for final peer sign-off.',
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
        }
      ]
    },
    {
      id: 'tsk-107',
      boardId,
      columnId: 'col-review',
      title: 'Design System Typography & Glassmorphism Theme Tokens',
      description: 'Curate dark luxury obsidian theme with vibrant status colors, custom scrollbars, and modern typography using Plus Jakarta Sans.',
      priority: 'low',
      assigneeId: 'usr-3',
      reporterId: 'usr-1',
      estimatedHours: 6,
      timeSpentSeconds: 21600, // 6.0 hours
      dueDate: daysOffset(-1),
      position: 1,
      tags: [
        { name: 'Design System', color: '#8B5CF6' },
        { name: 'CSS', color: '#06B6D4' }
      ],
      subtasks: [
        { id: 'sub-21', title: 'Define HSL color palette and dark mode variables', completed: true },
        { id: 'sub-22', title: 'Create badge and pill component tokens', completed: true },
        { id: 'sub-23', title: 'Test across mobile and 4K displays', completed: true }
      ],
      comments: []
    },
    {
      id: 'tsk-108',
      boardId,
      columnId: 'col-completed',
      title: 'Initial Database Modeling (PostgreSQL & MongoDB Schemas)',
      description: 'Architect normalized relational tables for PostgreSQL and document schema design for MongoDB collections.',
      priority: 'high',
      assigneeId: 'usr-2',
      reporterId: 'usr-1',
      estimatedHours: 8,
      timeSpentSeconds: 28800, // 8 hours
      dueDate: daysOffset(-3),
      position: 0,
      tags: [
        { name: 'Database', color: '#F59E0B' },
        { name: 'PostgreSQL', color: '#3B82F6' },
        { name: 'Architecture', color: '#10B981' }
      ],
      subtasks: [
        { id: 'sub-24', title: 'Draft schema.sql with indexes and foreign keys', completed: true },
        { id: 'sub-25', title: 'Draft mongo-models.js for Mongoose', completed: true },
        { id: 'sub-26', title: 'Build fast zero-dependency local persistent store', completed: true }
      ],
      comments: [
        {
          id: 'cmt-5',
          userId: 'usr-1',
          content: 'Clean architecture! Recruiters can review both PostgreSQL and Mongo implementations directly in the repository.',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ]
    },
    {
      id: 'tsk-109',
      boardId,
      columnId: 'col-completed',
      title: 'Project Kickoff & Technical Requirements Specification',
      description: 'Establish sprint velocity targets, stakeholder milestones, and architecture design documents.',
      priority: 'medium',
      assigneeId: 'usr-1',
      reporterId: 'usr-1',
      estimatedHours: 5,
      timeSpentSeconds: 18000, // 5 hours
      dueDate: daysOffset(-5),
      position: 1,
      tags: [
        { name: 'Planning', color: '#64748B' },
        { name: 'Agile', color: '#6366F1' }
      ],
      subtasks: [
        { id: 'sub-27', title: 'Define user personas (PM, Dev, Designer, QA)', completed: true },
        { id: 'sub-28', title: 'Set sprint velocity goals (40 points)', completed: true }
      ],
      comments: []
    },
    {
      id: 'tsk-110',
      boardId,
      columnId: 'col-backlog',
      title: 'Slack & Webhook Notification Integration',
      description: 'Allow teams to trigger outbound webhooks when tasks transition across columns or timers exceed estimated hours.',
      priority: 'low',
      assigneeId: 'usr-4',
      reporterId: 'usr-1',
      estimatedHours: 10,
      timeSpentSeconds: 0,
      dueDate: daysOffset(10),
      position: 0,
      tags: [
        { name: 'Integrations', color: '#8B5CF6' },
        { name: 'Webhooks', color: '#F59E0B' }
      ],
      subtasks: [
        { id: 'sub-29', title: 'Define webhook payload spec', completed: false },
        { id: 'sub-30', title: 'Add retry queue for transient HTTP 5xx', completed: false }
      ],
      comments: []
    },
    {
      id: 'tsk-111',
      boardId,
      columnId: 'col-backlog',
      title: 'AI Sprint Copilot: Task Breakdown & Estimation Suggester',
      description: 'Integrate LLM assistant to auto-suggest checklist subtasks and story points based on task title and description.',
      priority: 'medium',
      assigneeId: 'usr-2',
      reporterId: 'usr-3',
      estimatedHours: 14,
      timeSpentSeconds: 0,
      dueDate: daysOffset(14),
      position: 1,
      tags: [
        { name: 'AI / Copilot', color: '#EC4899' },
        { name: 'Innovation', color: '#06B6D4' }
      ],
      subtasks: [
        { id: 'sub-31', title: 'Design prompt templates for task decomposition', completed: false },
        { id: 'sub-32', title: 'Add 1-click apply checklist items UI', completed: false }
      ],
      comments: []
    }
  ];

  const timeLogs = [
    {
      id: 'log-1',
      taskId: 'tsk-101',
      userId: 'usr-2',
      durationSeconds: 10800, // 3h
      startedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 17).toISOString(),
      note: 'Built WebSocket server wrapper and heartbeat ping/pong mechanism'
    },
    {
      id: 'log-2',
      taskId: 'tsk-101',
      userId: 'usr-2',
      durationSeconds: 9000, // 2.5h
      startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      note: 'Broadcast channels and reconnect buffer tests'
    },
    {
      id: 'log-3',
      taskId: 'tsk-102',
      userId: 'usr-5',
      durationSeconds: 14400, // 4h
      startedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 11).toISOString(),
      note: 'Integrated D3 coordinates for Burndown line charts'
    },
    {
      id: 'log-4',
      taskId: 'tsk-102',
      userId: 'usr-5',
      durationSeconds: 14400, // 4h
      startedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      note: 'Added interactive hover tooltips and velocity calculations'
    },
    {
      id: 'log-5',
      taskId: 'tsk-106',
      userId: 'usr-4',
      durationSeconds: 27000,
      startedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      endedAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
      note: 'Docker multi-stage build configuration and CI pipeline'
    }
  ];

  const activities = [
    {
      id: 'act-1',
      boardId,
      userId: 'usr-2',
      userName: 'Sarah Chen',
      action: 'moved_task',
      details: 'moved "Real-time WebSocket event bus" to In Progress (Ongoing)',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'act-2',
      boardId,
      userId: 'usr-5',
      userName: 'David Kim',
      action: 'completed_subtask',
      details: 'checked off "Crosshair inspection tooltip" on Analytics visualization',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'act-3',
      boardId,
      userId: 'usr-4',
      userName: 'Elena Rostova',
      action: 'logged_time',
      details: 'logged 7.5 hours on Automated CI/CD Pipeline',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'act-4',
      boardId,
      userId: 'usr-1',
      userName: 'Alex Rivera',
      action: 'created_task',
      details: 'created task "AI Sprint Copilot: Task Breakdown"',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  const boards = [
    {
      id: boardId,
      title: 'PulseFlow 2026 Core Platform & Cloud Migration',
      description: 'Sprint 24: Real-time collaborative kanban, task time-tracking, and executive workflow metrics.',
      key: 'PF-26',
      ownerId: 'usr-1',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
    },
    {
      id: 'board-mobile-v3',
      title: 'Mobile App v3.0 Native Experience',
      description: 'React Native & Offline sync architecture for iOS and Android releases.',
      key: 'MOB',
      ownerId: 'usr-3',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ];

  return {
    users,
    boards,
    columns,
    tasks,
    timeLogs,
    activities,
    activeTimers: {} // userId -> { taskId, startedAt, durationSeconds }
  };
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.reset();
      }
    } catch (err) {
      console.error('Error loading database, initializing fresh seed data:', err);
      this.reset();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  reset() {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // --- Users ---
  getUsers() {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  getUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser({ name, email, password, role = 'Member', avatar = null }) {
    const existing = this.getUserByEmail(email);
    if (existing) throw new Error('User already exists with this email');

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      name,
      email,
      role,
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      colorAccent: '#6366F1',
      passwordHash
    };

    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  // --- Boards & Columns ---
  getBoards() {
    return this.data.boards;
  }

  getBoardById(id) {
    const board = this.data.boards.find(b => b.id === id) || this.data.boards[0];
    const columns = this.data.columns
      .filter(c => c.boardId === board.id)
      .sort((a, b) => a.position - b.position);
    const tasks = this.data.tasks.filter(t => t.boardId === board.id);
    return { ...board, columns, tasks };
  }

  addColumn({ boardId, title, colorAccent = '#6366F1' }) {
    const existing = this.data.columns.filter(c => c.boardId === boardId);
    const newCol = {
      id: `col-${uuidv4().slice(0, 8)}`,
      boardId,
      title,
      position: existing.length,
      colorAccent
    };
    this.data.columns.push(newCol);
    this.save();
    return newCol;
  }

  updateColumn(id, updates) {
    const col = this.data.columns.find(c => c.id === id);
    if (!col) return null;
    Object.assign(col, updates);
    this.save();
    return col;
  }

  deleteColumn(id) {
    const colIndex = this.data.columns.findIndex(c => c.id === id);
    if (colIndex === -1) return false;
    this.data.columns.splice(colIndex, 1);
    // Delete or reassign tasks in this column
    this.data.tasks = this.data.tasks.filter(t => t.columnId !== id);
    this.save();
    return true;
  }

  // --- Tasks ---
  getTasks(boardId) {
    return this.data.tasks.filter(t => !boardId || t.boardId === boardId);
  }

  getTaskById(id) {
    return this.data.tasks.find(t => t.id === id);
  }

  createTask(taskData) {
    const id = `tsk-${uuidv4().slice(0, 8)}`;
    const task = {
      id,
      boardId: taskData.boardId,
      columnId: taskData.columnId,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      assigneeId: taskData.assigneeId || null,
      reporterId: taskData.reporterId || null,
      estimatedHours: Number(taskData.estimatedHours || 0),
      timeSpentSeconds: Number(taskData.timeSpentSeconds || 0),
      dueDate: taskData.dueDate || null,
      position: taskData.position ?? 999,
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      comments: taskData.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.tasks.push(task);
    this.save();
    return task;
  }

  updateTask(id, updates) {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return task;
  }

  moveTask({ taskId, targetColumnId, newPosition }) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const previousColumnId = task.columnId;
    task.columnId = targetColumnId;
    task.position = newPosition !== undefined ? newPosition : 0;
    task.updatedAt = new Date().toISOString();

    // Adjust positions for tasks in the destination column
    const columnTasks = this.data.tasks
      .filter(t => t.boardId === task.boardId && t.columnId === targetColumnId && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    columnTasks.splice(task.position, 0, task);
    columnTasks.forEach((t, idx) => {
      t.position = idx;
    });

    this.save();
    return { task, previousColumnId, targetColumnId };
  }

  deleteTask(id) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.tasks.splice(idx, 1);
    // Remove associated time logs
    this.data.timeLogs = this.data.timeLogs.filter(l => l.taskId !== id);
    this.save();
    return true;
  }

  // --- Subtasks ---
  toggleSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return null;
    subtask.completed = !subtask.completed;
    task.updatedAt = new Date().toISOString();
    this.save();
    return { task, subtask };
  }

  addSubtask(taskId, title) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    const newSubtask = {
      id: `sub-${uuidv4().slice(0, 8)}`,
      title,
      completed: false
    };
    task.subtasks.push(newSubtask);
    task.updatedAt = new Date().toISOString();
    this.save();
    return { task, subtask: newSubtask };
  }

  deleteSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    task.updatedAt = new Date().toISOString();
    this.save();
    return task;
  }

  // --- Comments ---
  addComment(taskId, { userId, content }) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    const comment = {
      id: `cmt-${uuidv4().slice(0, 8)}`,
      userId,
      content,
      createdAt: new Date().toISOString()
    };
    task.comments.push(comment);
    this.save();
    return { task, comment };
  }

  // --- Time Logs & Active Timer ---
  getActiveTimer(userId) {
    return this.data.activeTimers[userId] || null;
  }

  startTimer({ userId, taskId }) {
    const active = {
      taskId,
      startedAt: new Date().toISOString(),
      accumulatedSeconds: 0
    };
    this.data.activeTimers[userId] = active;
    this.save();
    return active;
  }

  stopTimer({ userId, note = '' }) {
    const active = this.data.activeTimers[userId];
    if (!active) return null;

    const endedAt = new Date();
    const duration = Math.round((endedAt.getTime() - new Date(active.startedAt).getTime()) / 1000);
    const totalDuration = Math.max(1, duration + (active.accumulatedSeconds || 0));

    // Log the time
    const log = {
      id: `log-${uuidv4().slice(0, 8)}`,
      taskId: active.taskId,
      userId,
      durationSeconds: totalDuration,
      startedAt: active.startedAt,
      endedAt: endedAt.toISOString(),
      note: note || 'Active tracked focus session'
    };
    this.data.timeLogs.push(log);

    // Update task time spent
    const task = this.getTaskById(active.taskId);
    if (task) {
      task.timeSpentSeconds = (task.timeSpentSeconds || 0) + totalDuration;
      task.updatedAt = new Date().toISOString();
    }

    delete this.data.activeTimers[userId];
    this.save();
    return { log, task };
  }

  addManualTimeLog({ taskId, userId, durationSeconds, note }) {
    const log = {
      id: `log-${uuidv4().slice(0, 8)}`,
      taskId,
      userId,
      durationSeconds: Number(durationSeconds),
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      note: note || 'Manual time entry'
    };
    this.data.timeLogs.push(log);

    const task = this.getTaskById(taskId);
    if (task) {
      task.timeSpentSeconds = (task.timeSpentSeconds || 0) + Number(durationSeconds);
      task.updatedAt = new Date().toISOString();
    }
    this.save();
    return { log, task };
  }

  getTimeLogs(taskId) {
    if (taskId) {
      return this.data.timeLogs.filter(l => l.taskId === taskId);
    }
    return this.data.timeLogs;
  }

  // --- Activities ---
  addActivity({ boardId, userId, userName, action, details, taskId = null }) {
    const act = {
      id: `act-${uuidv4().slice(0, 8)}`,
      boardId,
      userId,
      userName,
      action,
      details,
      taskId,
      createdAt: new Date().toISOString()
    };
    this.data.activities.unshift(act);
    // keep up to 100 entries
    if (this.data.activities.length > 100) {
      this.data.activities.pop();
    }
    this.save();
    return act;
  }

  getActivities(boardId) {
    return this.data.activities.filter(a => !boardId || a.boardId === boardId);
  }
}

export const db = new Database();
