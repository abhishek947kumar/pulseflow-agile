import { WebSocketServer, WebSocket } from 'ws';

class SocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    // taskId -> Map(socket -> user)
    this.taskViewers = new Map();
  }

  init(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      console.log(`[WS] Client connected. Total active clients: ${this.clients.size}`);

      // Broadcast active user count
      this.broadcast({
        type: 'SYSTEM_STATUS',
        payload: {
          onlineClients: this.clients.size,
          timestamp: new Date().toISOString()
        }
      });

      // Send initial viewers state
      const currentViewers = this.getAllViewers();
      ws.send(JSON.stringify({
        type: 'INITIAL_VIEWERS',
        payload: { viewers: currentViewers }
      }));

      // Handle ping/pong heartbeat
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message);
          this.handleClientMessage(ws, parsed);
        } catch (err) {
          console.error('[WS] Error parsing incoming message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.removeClientFromAllTasks(ws);
        console.log(`[WS] Client disconnected. Total active clients: ${this.clients.size}`);
        this.broadcast({
          type: 'SYSTEM_STATUS',
          payload: { onlineClients: this.clients.size, timestamp: new Date().toISOString() }
        });
      });

      ws.on('error', (err) => {
        console.error('[WS] Client socket error:', err.message);
      });
    });

    // Heartbeat interval to prune stale connections
    const interval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  handleClientMessage(senderWs, message) {
    const { type, payload } = message;

    if (type === 'PING') {
      senderWs.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
    } else if (type === 'ENTER_TASK') {
      const { taskId, user } = payload;
      if (!this.taskViewers.has(taskId)) {
        this.taskViewers.set(taskId, new Map());
      }
      this.taskViewers.get(taskId).set(senderWs, user);
      this.broadcastTaskViewers(taskId);
    } else if (type === 'LEAVE_TASK') {
      const { taskId } = payload;
      if (this.taskViewers.has(taskId)) {
        this.taskViewers.get(taskId).delete(senderWs);
        if (this.taskViewers.get(taskId).size === 0) {
          this.taskViewers.delete(taskId);
        }
        this.broadcastTaskViewers(taskId);
      }
    }
  }

  removeClientFromAllTasks(ws) {
    for (const [taskId, viewersMap] of this.taskViewers.entries()) {
      if (viewersMap.has(ws)) {
        viewersMap.delete(ws);
        if (viewersMap.size === 0) {
          this.taskViewers.delete(taskId);
        }
        this.broadcastTaskViewers(taskId);
      }
    }
  }

  broadcastTaskViewers(taskId) {
    const viewersMap = this.taskViewers.get(taskId);
    const viewers = viewersMap ? Array.from(viewersMap.values()) : [];
    this.broadcast({
      type: 'TASK_VIEWERS_UPDATED',
      payload: { taskId, viewers }
    });
  }

  getAllViewers() {
    const result = {};
    for (const [taskId, viewersMap] of this.taskViewers.entries()) {
      result[taskId] = Array.from(viewersMap.values());
    }
    return result;
  }

  broadcast(message, senderWs = null) {
    if (!this.wss) return;
    const data = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          console.error('[WS] Broadcast send error:', err);
        }
      }
    });
  }
}

export const socketManager = new SocketManager();
