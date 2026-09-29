import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:boardId', authenticate, (req, res) => {
  const { boardId } = req.params;
  const board = db.getBoardById(boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const tasks = db.getTasks(boardId);
  const users = db.getUsers();
  const timeLogs = db.getTimeLogs();
  const boardTimeLogs = timeLogs.filter(l => tasks.some(t => t.id === l.taskId));

  // 1. Column distribution
  const columnDistribution = board.columns.map(col => {
    const colTasks = tasks.filter(t => t.columnId === col.id);
    const totalHours = colTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    return {
      id: col.id,
      title: col.title,
      color: col.colorAccent,
      count: colTasks.length,
      totalHours
    };
  });

  // 2. Priority distribution
  const priorities = ['urgent', 'high', 'medium', 'low'];
  const priorityDistribution = priorities.map(p => ({
    priority: p,
    count: tasks.filter(t => (t.priority || '').toLowerCase() === p).length
  }));

  // 3. Team Member Workload (Assigned vs Logged hours)
  const memberWorkload = users.map(user => {
    const userTasks = tasks.filter(t => t.assigneeId === user.id);
    const assignedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const userLogs = boardTimeLogs.filter(l => l.userId === user.id);
    const loggedHours = +(userLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1);

    return {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      color: user.colorAccent,
      tasksCount: userTasks.length,
      assignedHours,
      loggedHours
    };
  });

  // 4. Sprint Burndown (14-day sprint data)
  const sprintDays = 14;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedTasks = tasks.filter(t => t.columnId === 'col-completed');
  const completedHours = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const remainingHours = Math.max(0, totalEstimatedHours - completedHours);

  // Generate realistic burndown curve points
  const burndownData = [];
  const idealStep = totalEstimatedHours / (sprintDays - 1);

  // Simulate current day as day 9 of 14
  const currentSprintDay = 9;
  let simulatedActual = totalEstimatedHours;

  for (let day = 1; day <= sprintDays; day++) {
    const ideal = +(Math.max(0, totalEstimatedHours - (day - 1) * idealStep)).toFixed(1);
    let actual = null;

    if (day <= currentSprintDay) {
      if (day === 1) {
        simulatedActual = totalEstimatedHours;
      } else {
        // Daily progression towards current remaining
        const dailyDrop = (totalEstimatedHours - remainingHours) / (currentSprintDay - 1);
        simulatedActual = +(Math.max(remainingHours, simulatedActual - dailyDrop + (Math.sin(day) * 1.5))).toFixed(1);
      }
      actual = simulatedActual;
    }

    burndownData.push({
      day: `Day ${day}`,
      dayNumber: day,
      ideal,
      actual
    });
  }

  // 5. High-level KPIs
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const totalLoggedHours = +(boardTimeLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1);
  const totalChecklistCount = tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0);
  const completedChecklistCount = tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0);

  res.json({
    kpis: {
      totalTasks,
      completedCount,
      completionRate,
      totalEstimatedHours,
      totalLoggedHours,
      activeSprintDay: currentSprintDay,
      totalSprintDays: sprintDays,
      checklistProgress: totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0
    },
    columnDistribution,
    priorityDistribution,
    memberWorkload,
    burndownData
  });
});

export default router;
