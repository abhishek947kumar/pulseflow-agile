import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { socketManager } from '../websocket.js';

const router = express.Router();

// List boards
router.get('/', authenticate, (req, res) => {
  const boards = db.getBoards();
  res.json({ boards });
});

// Get specific board with its columns and tasks
router.get('/:id', authenticate, (req, res) => {
  const board = db.getBoardById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  res.json({ board });
});

// Add column to board
router.post('/:id/columns', authenticate, (req, res) => {
  const { title, colorAccent } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Column title is required' });
  }

  const column = db.addColumn({
    boardId: req.params.id,
    title,
    colorAccent
  });

  db.addActivity({
    boardId: req.params.id,
    userId: req.user.id,
    userName: req.user.name,
    action: 'created_column',
    details: `created column "${title}"`
  });

  socketManager.broadcast({
    type: 'COLUMN_CREATED',
    payload: { column, boardId: req.params.id, user: req.user }
  });

  res.status(201).json({ column });
});

// Update column
router.put('/:id/columns/:columnId', authenticate, (req, res) => {
  const column = db.updateColumn(req.params.columnId, req.body);
  if (!column) return res.status(404).json({ error: 'Column not found' });

  socketManager.broadcast({
    type: 'COLUMN_UPDATED',
    payload: { column, boardId: req.params.id }
  });

  res.json({ column });
});

// Delete column
router.delete('/:id/columns/:columnId', authenticate, (req, res) => {
  const success = db.deleteColumn(req.params.columnId);
  if (!success) return res.status(404).json({ error: 'Column not found' });

  socketManager.broadcast({
    type: 'COLUMN_DELETED',
    payload: { columnId: req.params.columnId, boardId: req.params.id }
  });

  res.json({ success: true });
});

// Reset board to initial showcase sample data
router.post('/:id/reset', authenticate, (req, res) => {
  db.reset();
  const board = db.getBoardById(req.params.id);

  socketManager.broadcast({
    type: 'BOARD_RESET',
    payload: { board }
  });

  res.json({ board, message: 'Board reset to high-fidelity demo dataset' });
});

// Board activity log
router.get('/:id/activities', authenticate, (req, res) => {
  const activities = db.getActivities(req.params.id);
  res.json({ activities });
});

// Export board data
router.get('/:id/export', authenticate, (req, res) => {
  const board = db.getBoardById(req.params.id);
  const tasks = db.getTasks(req.params.id);
  const logs = db.getTimeLogs();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    board,
    tasks,
    timeLogs: logs.filter(l => tasks.some(t => t.id === l.taskId))
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${board.key || 'board'}-export.json"`);
  res.json(exportPayload);
});

export default router;
