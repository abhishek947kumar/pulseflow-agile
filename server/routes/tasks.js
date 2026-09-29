import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { socketManager } from '../websocket.js';

const router = express.Router();

// List tasks
router.get('/', authenticate, (req, res) => {
  const { boardId } = req.query;
  const tasks = db.getTasks(boardId);
  res.json({ tasks });
});

// Single task with logs
router.get('/:id', authenticate, (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const timeLogs = db.getTimeLogs(task.id);
  res.json({ task: { ...task, timeLogs } });
});

// Create task
router.post('/', authenticate, (req, res) => {
  const { boardId, columnId, title, description, priority, assigneeId, estimatedHours, dueDate, tags } = req.body;
  if (!title || !boardId || !columnId) {
    return res.status(400).json({ error: 'title, boardId, and columnId are required' });
  }

  const task = db.createTask({
    boardId,
    columnId,
    title,
    description,
    priority: priority || 'medium',
    assigneeId: assigneeId || req.user.id,
    reporterId: req.user.id,
    estimatedHours: estimatedHours || 0,
    dueDate,
    tags: tags || []
  });

  db.addActivity({
    boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'created_task',
    details: `created task "${task.title}"`,
    taskId: task.id
  });

  socketManager.broadcast({
    type: 'TASK_CREATED',
    payload: { task, user: req.user }
  });

  res.status(201).json({ task });
});

// Update task
router.put('/:id', authenticate, (req, res) => {
  const task = db.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.addActivity({
    boardId: task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'updated_task',
    details: `updated details for "${task.title}"`,
    taskId: task.id
  });

  socketManager.broadcast({
    type: 'TASK_UPDATED',
    payload: { task, user: req.user }
  });

  res.json({ task });
});

// Move task (Drag and Drop)
router.post('/:id/move', authenticate, (req, res) => {
  const { targetColumnId, newPosition } = req.body;
  if (!targetColumnId) {
    return res.status(400).json({ error: 'targetColumnId is required' });
  }

  const result = db.moveTask({
    taskId: req.params.id,
    targetColumnId,
    newPosition: newPosition !== undefined ? Number(newPosition) : 0
  });

  if (!result) return res.status(404).json({ error: 'Task not found' });

  const { task, previousColumnId } = result;

  // Log activity if moved across columns
  if (previousColumnId !== targetColumnId) {
    const board = db.getBoardById(task.boardId);
    const targetCol = board.columns.find(c => c.id === targetColumnId);
    const colName = targetCol ? targetCol.title : targetColumnId;

    db.addActivity({
      boardId: task.boardId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'moved_task',
      details: `moved "${task.title}" to ${colName}`,
      taskId: task.id
    });
  }

  socketManager.broadcast({
    type: 'TASK_MOVED',
    payload: {
      taskId: task.id,
      task,
      previousColumnId,
      targetColumnId,
      newPosition,
      user: req.user
    }
  });

  res.json({ task, success: true });
});

// Delete task
router.delete('/:id', authenticate, (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.deleteTask(req.params.id);

  db.addActivity({
    boardId: task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'deleted_task',
    details: `deleted task "${task.title}"`
  });

  socketManager.broadcast({
    type: 'TASK_DELETED',
    payload: { taskId: req.params.id, boardId: task.boardId, user: req.user }
  });

  res.json({ success: true });
});

// Add subtask / checklist item
router.post('/:id/subtasks', authenticate, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Subtask title is required' });

  const result = db.addSubtask(req.params.id, title);
  if (!result) return res.status(404).json({ error: 'Task not found' });

  socketManager.broadcast({
    type: 'SUBTASK_ADDED',
    payload: { taskId: req.params.id, task: result.task, subtask: result.subtask }
  });

  res.status(201).json(result);
});

// Toggle subtask completion
router.patch('/:id/subtasks/:subtaskId', authenticate, (req, res) => {
  const result = db.toggleSubtask(req.params.id, req.params.subtaskId);
  if (!result) return res.status(404).json({ error: 'Task or subtask not found' });

  socketManager.broadcast({
    type: 'SUBTASK_TOGGLED',
    payload: { taskId: req.params.id, task: result.task, subtask: result.subtask }
  });

  res.json(result);
});

// Delete subtask
router.delete('/:id/subtasks/:subtaskId', authenticate, (req, res) => {
  const task = db.deleteSubtask(req.params.id, req.params.subtaskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  socketManager.broadcast({
    type: 'SUBTASK_DELETED',
    payload: { taskId: req.params.id, task, subtaskId: req.params.subtaskId }
  });

  res.json({ task, success: true });
});

// Add comment
router.post('/:id/comments', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const result = db.addComment(req.params.id, {
    userId: req.user.id,
    content
  });

  if (!result) return res.status(404).json({ error: 'Task not found' });

  db.addActivity({
    boardId: result.task.boardId,
    userId: req.user.id,
    userName: req.user.name,
    action: 'commented',
    details: `commented on "${result.task.title}"`,
    taskId: result.task.id
  });

  socketManager.broadcast({
    type: 'COMMENT_ADDED',
    payload: { taskId: req.params.id, comment: result.comment, user: req.user }
  });

  res.status(201).json(result);
});

export default router;
