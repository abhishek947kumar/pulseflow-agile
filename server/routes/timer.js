import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { socketManager } from '../websocket.js';

const router = express.Router();

// Get active running timer for the authenticated user
router.get('/active', authenticate, (req, res) => {
  const active = db.getActiveTimer(req.user.id);
  if (!active) return res.json({ active: null });

  const task = db.getTaskById(active.taskId);
  res.json({ active, task });
});

// Start timer on a task
router.post('/start', authenticate, (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  const task = db.getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const active = db.startTimer({ userId: req.user.id, taskId });

  db.addActivity({
    boardId: task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'started_timer',
    details: `started timer on "${task.title}"`,
    taskId: task.id
  });

  socketManager.broadcast({
    type: 'TIMER_STARTED',
    payload: { userId: req.user.id, taskId, task, startedAt: active.startedAt }
  });

  res.json({ active, task });
});

// Stop active timer & persist time log
router.post('/stop', authenticate, (req, res) => {
  const { note } = req.body;
  const result = db.stopTimer({ userId: req.user.id, note });

  if (!result) {
    return res.status(400).json({ error: 'No active timer found to stop' });
  }

  const { log, task } = result;

  db.addActivity({
    boardId: task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'logged_time',
    details: `logged ${(log.durationSeconds / 3600).toFixed(1)} hrs on "${task.title}"`,
    taskId: task.id
  });

  socketManager.broadcast({
    type: 'TIMER_STOPPED',
    payload: { userId: req.user.id, log, task }
  });

  res.json({ success: true, log, task });
});

// Add manual time log
router.post('/manual', authenticate, (req, res) => {
  const { taskId, durationSeconds, note } = req.body;
  if (!taskId || !durationSeconds) {
    return res.status(400).json({ error: 'taskId and durationSeconds are required' });
  }

  const result = db.addManualTimeLog({
    taskId,
    userId: req.user.id,
    durationSeconds,
    note
  });

  if (!result) return res.status(404).json({ error: 'Task not found' });

  db.addActivity({
    boardId: result.task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'logged_time',
    details: `logged ${(durationSeconds / 3600).toFixed(1)} hrs on "${result.task.title}"`,
    taskId: result.task.id
  });

  socketManager.broadcast({
    type: 'TIME_LOG_ADDED',
    payload: { log: result.log, task: result.task }
  });

  res.json(result);
});

// Get all time logs
router.get('/logs', authenticate, (req, res) => {
  const { taskId } = req.query;
  const logs = db.getTimeLogs(taskId);
  res.json({ logs });
});

export default router;
