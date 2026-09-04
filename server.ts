import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskAssignee {
  id: string;
  name: string;
  avatarColor: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'gentle' | 'blossom' | 'canopy' | 'urgent';
  category: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: TaskAssignee;
  subtasks: Subtask[];
  tags: string[];
  order: number;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  lastActive: number;
  currentAction?: string;
  activeTaskId?: string;
}

interface ClientSocket extends WebSocket {
  isAlive?: boolean;
  roomId?: string;
  user?: Collaborator;
}

const PORT = 3000;
const app = express();
app.use(express.json());

// In-memory room storage
const rooms: Map<string, {
  tasks: Task[];
  collaborators: Map<string, Collaborator>;
  petalsShedCount: number;
}> = new Map();

function getInitialTasks(): Task[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: 'task-1',
      title: 'Cultivate daily morning focus & intention',
      description: 'Spend 10 minutes breathing gently under the lilac canopy and prioritizing key intentions.',
      status: 'completed',
      priority: 'gentle',
      category: 'Sanctuary',
      dueDate: todayStr,
      completedAt: new Date(now.getTime() - 3600000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      assignee: { id: 'usr-1', name: 'Wisteria Gardener', avatarColor: '#9b5de5' },
      subtasks: [
        { id: 'sub-1', title: 'Deep diaphragmatic breathing', completed: true },
        { id: 'sub-2', title: 'Note 3 priorities for today', completed: true }
      ],
      tags: ['Mindfulness', 'Routine'],
      order: 1,
    },
    {
      id: 'task-2',
      title: 'Review team project milestone & deliverables',
      description: 'Coordinate with design and engineering peers on the seasonal product rollout.',
      status: 'in-progress',
      priority: 'canopy',
      category: 'Work',
      dueDate: todayStr,
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
      updatedAt: new Date(now.getTime() - 1800000).toISOString(),
      assignee: { id: 'usr-2', name: 'Elena Vance', avatarColor: '#7c3aed' },
      subtasks: [
        { id: 'sub-3', title: 'Audit cross-platform responsiveness', completed: true },
        { id: 'sub-4', title: 'Finalize real-time synchronization specs', completed: false },
        { id: 'sub-5', title: 'Verify offline fallback indicators', completed: false }
      ],
      tags: ['Roadmap', 'Sprint'],
      order: 2,
    },
    {
      id: 'task-3',
      title: 'Draft creative floral aesthetic guidelines',
      description: 'Document the soft lilac, violet, and deep bark gradient pairing rules for interface elements.',
      status: 'todo',
      priority: 'blossom',
      category: 'Creative',
      dueDate: tomorrowStr,
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      assignee: { id: 'usr-1', name: 'Wisteria Gardener', avatarColor: '#9b5de5' },
      subtasks: [
        { id: 'sub-6', title: 'Select harmonious violet tokens', completed: false },
        { id: 'sub-7', title: 'Calibrate canvas wind petal physics', completed: false }
      ],
      tags: ['Design', 'Aesthetics'],
      order: 3,
    },
    {
      id: 'task-4',
      title: 'Tend to the perennial root garden',
      description: 'Refactor database query indexes and ensure resilient offline persistence caches.',
      status: 'todo',
      priority: 'gentle',
      category: 'Focus',
      dueDate: tomorrowStr,
      createdAt: new Date(now.getTime() - 1800000).toISOString(),
      updatedAt: new Date(now.getTime() - 1800000).toISOString(),
      assignee: { id: 'usr-3', name: 'Kai Sterling', avatarColor: '#a78bfa' },
      subtasks: [],
      tags: ['Infrastructure'],
      order: 4,
    }
  ];
}

function getRoom(roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      tasks: getInitialTasks(),
      collaborators: new Map(),
      petalsShedCount: 24
    });
  }
  return rooms.get(roomId)!;
}

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/rooms/:roomId/tasks', (req, res) => {
  const { roomId } = req.params;
  const room = getRoom(roomId);
  res.json({
    tasks: room.tasks,
    petalsShedCount: room.petalsShedCount,
    collaboratorCount: room.collaborators.size,
  });
});

app.post('/api/rooms/:roomId/sync', (req, res) => {
  const { roomId } = req.params;
  const { actions } = req.body as { actions?: any[] };
  const room = getRoom(roomId);

  if (Array.isArray(actions)) {
    for (const action of actions) {
      if (action.type === 'add') {
        const existing = room.tasks.find(t => t.id === action.payload.id);
        if (!existing) {
          room.tasks.push(action.payload);
        }
      } else if (action.type === 'update') {
        const idx = room.tasks.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) {
          room.tasks[idx] = { ...room.tasks[idx], ...action.payload };
        }
      } else if (action.type === 'toggle') {
        const idx = room.tasks.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) {
          const wasCompleted = room.tasks[idx].status === 'completed';
          const nowCompleted = action.payload.status === 'completed';
          room.tasks[idx].status = action.payload.status;
          room.tasks[idx].completedAt = nowCompleted ? new Date().toISOString() : undefined;
          if (!wasCompleted && nowCompleted) {
            room.petalsShedCount += 18;
          }
        }
      } else if (action.type === 'delete') {
        room.tasks = room.tasks.filter(t => t.id !== action.payload.id);
      }
    }
  }

  res.json({
    success: true,
    tasks: room.tasks,
    petalsShedCount: room.petalsShedCount
  });
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const payload = JSON.stringify(message);
    wss.clients.forEach((client) => {
      const clientSock = client as ClientSocket;
      if (
        clientSock.readyState === WebSocket.OPEN &&
        clientSock.roomId === roomId &&
        clientSock !== excludeWs
      ) {
        clientSock.send(payload);
      }
    });
  }

  function getActiveCollaborators(roomId: string): Collaborator[] {
    const room = getRoom(roomId);
    return Array.from(room.collaborators.values());
  }

  wss.on('connection', (ws: ClientSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());
        const roomId = msg.roomId || ws.roomId || 'garden-main';

        switch (msg.type) {
          case 'join': {
            ws.roomId = roomId;
            const room = getRoom(roomId);
            const user: Collaborator = {
              id: msg.user?.id || `user-${Math.random().toString(36).substring(2, 8)}`,
              name: msg.user?.name || 'Garden Visitor',
              color: msg.user?.color || '#9b5de5',
              joinedAt: Date.now(),
              lastActive: Date.now(),
              currentAction: 'Strolling in the wisteria bower'
            };
            ws.user = user;
            room.collaborators.set(user.id, user);

            // Send initial state to joining user
            ws.send(JSON.stringify({
              type: 'sync:init',
              tasks: room.tasks,
              petalsShedCount: room.petalsShedCount,
              collaborators: getActiveCollaborators(roomId),
              self: user,
            }));

            // Broadcast to peers that user joined
            broadcastToRoom(roomId, {
              type: 'presence:update',
              collaborators: getActiveCollaborators(roomId),
              event: 'user_joined',
              user,
            }, ws);
            break;
          }

          case 'task:add': {
            const room = getRoom(roomId);
            const task: Task = msg.task;
            const exists = room.tasks.some(t => t.id === task.id);
            if (!exists) {
              room.tasks.push(task);
              broadcastToRoom(roomId, {
                type: 'task:added',
                task,
                user: ws.user,
              });
            }
            break;
          }

          case 'task:update': {
            const room = getRoom(roomId);
            const updatedTask: Task = msg.task;
            const idx = room.tasks.findIndex(t => t.id === updatedTask.id);
            if (idx !== -1) {
              room.tasks[idx] = updatedTask;
              broadcastToRoom(roomId, {
                type: 'task:updated',
                task: updatedTask,
                user: ws.user,
              });
            }
            break;
          }

          case 'task:toggle': {
            const room = getRoom(roomId);
            const { taskId, status } = msg;
            const idx = room.tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
              const prev = room.tasks[idx];
              const nowCompleted = status === 'completed';
              prev.status = status;
              prev.completedAt = nowCompleted ? new Date().toISOString() : undefined;
              prev.updatedAt = new Date().toISOString();

              if (nowCompleted) {
                room.petalsShedCount += 18;
              }

              // Broadcast task update
              broadcastToRoom(roomId, {
                type: 'task:updated',
                task: prev,
                user: ws.user,
              });

              // If completed, trigger celebrate event across all clients
              if (nowCompleted) {
                broadcastToRoom(roomId, {
                  type: 'tree:celebrate',
                  taskId,
                  taskTitle: prev.title,
                  user: ws.user,
                  petalCount: 28,
                  totalPetals: room.petalsShedCount
                });
              }
            }
            break;
          }

          case 'task:delete': {
            const room = getRoom(roomId);
            const { taskId } = msg;
            room.tasks = room.tasks.filter(t => t.id !== taskId);
            broadcastToRoom(roomId, {
              type: 'task:deleted',
              taskId,
              user: ws.user,
            });
            break;
          }

          case 'task:reorder': {
            const room = getRoom(roomId);
            const { tasks } = msg as { tasks: Task[] };
            if (Array.isArray(tasks)) {
              room.tasks = tasks;
              broadcastToRoom(roomId, {
                type: 'tasks:reordered',
                tasks: room.tasks,
                user: ws.user,
              }, ws);
            }
            break;
          }

          case 'presence:update': {
            if (ws.user && ws.roomId) {
              const room = getRoom(ws.roomId);
              ws.user.lastActive = Date.now();
              if (msg.action) ws.user.currentAction = msg.action;
              if (msg.activeTaskId !== undefined) ws.user.activeTaskId = msg.activeTaskId;
              room.collaborators.set(ws.user.id, ws.user);

              broadcastToRoom(ws.roomId, {
                type: 'presence:update',
                collaborators: getActiveCollaborators(ws.roomId),
                user: ws.user,
              }, ws);
            }
            break;
          }

          case 'tree:rustle': {
            if (ws.roomId) {
              broadcastToRoom(ws.roomId, {
                type: 'tree:rustle',
                user: ws.user,
                intensity: msg.intensity || 1.0,
              });
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.user && ws.roomId) {
        const room = getRoom(ws.roomId);
        room.collaborators.delete(ws.user.id);
        broadcastToRoom(ws.roomId, {
          type: 'presence:update',
          collaborators: getActiveCollaborators(ws.roomId),
          event: 'user_left',
          user: ws.user,
        });
      }
    });
  });

  // Heartbeat ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as ClientSocket;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Wisteria Task Garden server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
