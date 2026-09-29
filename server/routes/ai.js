import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Smart AI Task Decomposer
// Decomposes any technical or business task into concrete engineering checklist subtasks,
// acceptance criteria, estimated hours, and tags
router.post('/decompose', authenticate, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required for decomposition' });

  const text = `${title} ${description || ''}`.toLowerCase();

  let subtasks = [];
  let suggestedTags = [];
  let estimatedHours = 6;
  let priority = 'medium';

  // Domain-specific heuristic pattern matching
  if (text.includes('auth') || text.includes('jwt') || text.includes('security') || text.includes('login')) {
    subtasks = [
      { title: 'Define JWT claims & payload signature validation', completed: false },
      { title: 'Implement refresh token rotation & secure cookie storage', completed: false },
      { title: 'Add RBAC middleware to protect sensitive API endpoints', completed: false },
      { title: 'Write unit tests for invalid token & expiry edge cases', completed: false }
    ];
    suggestedTags = [{ name: 'Security', color: '#EF4444' }, { name: 'Auth', color: '#6366F1' }];
    estimatedHours = 8;
    priority = 'high';
  } else if (text.includes('socket') || text.includes('realtime') || text.includes('real-time') || text.includes('chat') || text.includes('event')) {
    subtasks = [
      { title: 'Set up bi-directional event dispatcher & message schemas', completed: false },
      { title: 'Add heartbeat ping/pong keepalive & reconnection jitter', completed: false },
      { title: 'Implement multi-client room broadcast filtering', completed: false },
      { title: 'Simulate high-concurrency client connection load', completed: false }
    ];
    suggestedTags = [{ name: 'WebSocket', color: '#06B6D4' }, { name: 'Real-time', color: '#F43F5E' }];
    estimatedHours = 10;
    priority = 'urgent';
  } else if (text.includes('chart') || text.includes('analytics') || text.includes('d3') || text.includes('metric') || text.includes('report')) {
    subtasks = [
      { title: 'Aggregate time-series query data for burndown coordinates', completed: false },
      { title: 'Render responsive SVG line/area curve with curveMonotoneX', completed: false },
      { title: 'Add interactive hover crosshair & inspection tooltips', completed: false },
      { title: 'Verify contrast and readability across dark and light themes', completed: false }
    ];
    suggestedTags = [{ name: 'Data Viz', color: '#F59E0B' }, { name: 'D3.js', color: '#EC4899' }];
    estimatedHours = 12;
    priority = 'high';
  } else if (text.includes('docker') || text.includes('deploy') || text.includes('ci/cd') || text.includes('pipeline') || text.includes('devops')) {
    subtasks = [
      { title: 'Write optimized multi-stage Dockerfile with non-root user', completed: false },
      { title: 'Configure docker-compose with persistent volume mounts', completed: false },
      { title: 'Set up automated GitHub Actions workflow for lint & build', completed: false },
      { title: 'Add healthcheck probe endpoint with memory stats', completed: false }
    ];
    suggestedTags = [{ name: 'DevOps', color: '#10B981' }, { name: 'Docker', color: '#06B6D4' }];
    estimatedHours = 8;
    priority = 'medium';
  } else if (text.includes('ui') || text.includes('design') || text.includes('theme') || text.includes('css') || text.includes('card')) {
    subtasks = [
      { title: 'Define design tokens and CSS variables for theme palette', completed: false },
      { title: 'Build responsive components with glassmorphism & hover lifts', completed: false },
      { title: 'Add subtle micro-animations and accessibility focus rings', completed: false },
      { title: 'Audit mobile viewport layout and touch targets', completed: false }
    ];
    suggestedTags = [{ name: 'UI/UX', color: '#8B5CF6' }, { name: 'Design System', color: '#EC4899' }];
    estimatedHours = 6;
    priority = 'medium';
  } else {
    // General Agile task breakdown
    subtasks = [
      { title: `Architect technical specification & requirements for ${title}`, completed: false },
      { title: 'Implement core functionality and validation logic', completed: false },
      { title: 'Integrate UI feedback states (loading, success, error toasts)', completed: false },
      { title: 'Write peer-review tests and verify cross-browser behavior', completed: false }
    ];
    suggestedTags = [{ name: 'Feature', color: '#6366F1' }, { name: 'Full-Stack', color: '#06B6D4' }];
    estimatedHours = 6;
    priority = 'medium';
  }

  res.json({
    subtasks,
    suggestedTags,
    estimatedHours,
    priority,
    rationale: `AI Copilot decomposed "${title}" into ${subtasks.length} actionable engineering deliverables based on agile domain standards.`
  });
});

// Automated Daily Standup Summary Generator
router.post('/standup', authenticate, (req, res) => {
  const { boardId } = req.body;
  const user = req.user;
  const tasks = db.getTasks(boardId);
  const timeLogs = db.getTimeLogs();

  const userTasks = tasks.filter(t => t.assigneeId === user.id);
  const completedTasks = userTasks.filter(t => t.columnId === 'col-completed');
  const inProgressTasks = userTasks.filter(t => t.columnId === 'col-progress');
  const todoTasks = userTasks.filter(t => t.columnId === 'col-todo');

  const userLogs = timeLogs.filter(l => l.userId === user.id);
  const totalLoggedHours = +(userLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1);

  // Standup output
  const yesterdayItems = completedTasks.length > 0 
    ? completedTasks.map(t => `Completed "${t.title}" (${(t.timeSpentSeconds / 3600).toFixed(1)}h logged)`)
    : [userLogs[0]?.note ? `Logged time on: ${userLogs[0].note}` : 'Reviewed incoming PRs and architectural specifications'];

  const todayItems = inProgressTasks.length > 0
    ? inProgressTasks.map(t => `Focusing on "${t.title}" (${t.subtasks?.filter(s => s.completed).length || 0}/${t.subtasks?.length || 0} subtasks done)`)
    : (todoTasks.length > 0 ? [`Starting "${todoTasks[0].title}"`] : ['Triaging backlog tickets and pair programming']);

  // Check for blockers / bottlenecks
  const blockers = [];
  const atRisk = inProgressTasks.find(t => t.priority === 'urgent' || (t.dueDate && new Date(t.dueDate) < new Date()));
  if (atRisk) {
    blockers.push(`"${atRisk.title}" has impending deadline or high complexity.`);
  }

  const standup = {
    userName: user.name,
    userRole: user.role,
    avatar: user.avatar,
    generatedAt: new Date().toISOString(),
    totalLoggedHours,
    activeTasksCount: inProgressTasks.length,
    sections: {
      yesterday: yesterdayItems,
      today: todayItems,
      blockers: blockers.length > 0 ? blockers : ['No blocking issues currently. On track for sprint delivery.']
    },
    formattedMarkdown: `### 🚀 Daily Agile Standup: ${user.name} (${user.role})
*Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}*

**1. What did I complete yesterday?**
${yesterdayItems.map(i => `- ${i}`).join('\n')}

**2. What am I working on today?**
${todayItems.map(i => `- ${i}`).join('\n')}

**3. Any blockers or dependencies?**
${blockers.length > 0 ? blockers.map(b => `- ⚠️ ${b}`).join('\n') : '- None! Velocity on track.'}

*(Total hours tracked across sprint: ${totalLoggedHours}h)*`
  };

  res.json({ standup });
});

export default router;
