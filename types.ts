export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export type TaskPriority = 'gentle' | 'blossom' | 'canopy' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAssignee {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
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

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  lastActive: number;
  currentAction?: string;
  activeTaskId?: string;
}

export interface GardenTreeStats {
  completedCount: number;
  totalCount: number;
  growthLevel: number;
  growthProgress: number; // 0 to 100
  petalsShedCount: number;
  streakDays: number;
}

export interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'toggle' | 'delete' | 'reorder';
  payload: any;
  timestamp: number;
}

export interface WisteriaPetal {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  swayFreq: number;
  swayPhase: number;
  clusterType: 'petal' | 'raceme-drop' | 'floret';
}

export interface FairyDustParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  pulseSpeed: number;
  pulsePhase: number;
  sparkleType: 'four-star' | 'cross' | 'diamond' | 'orb';
  colorType: 'violet' | 'lilac' | 'gold' | 'cyan' | 'starlight';
  life: number;
  maxLife: number;
  maxAlpha: number;
  wanderAngle: number;
  wanderSpeed: number;
}
