import React, { useState } from 'react';
import { useGardenSocket } from './hooks/useGardenSocket';
import { Task, TaskStatus } from './types';
import { WisteriaCanvas } from './components/WisteriaCanvas';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskModal } from './components/TaskModal';
import { CollaboratorsBar } from './components/CollaboratorsBar';
import { GardenStats } from './components/GardenStats';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { 
  ListTodo, 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Plus, 
  Wind,
  Undo2
} from 'lucide-react';

export default function App() {
  const [roomId, setRoomId] = useState<string>('garden-main');
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'sanctuary'>('list');
  const [sanctuaryTab, setSanctuaryTab] = useState<'active' | 'completed'>('active');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState<TaskStatus>('todo');

  const {
    tasks,
    collaborators,
    currentUser,
    isConnected,
    isSyncing,
    pendingOfflineCount,
    gardenStats,
    activities,
    latestCelebration,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    rustleTree,
    flushOfflineQueue
  } = useGardenSocket(roomId);

  const handleOpenNewTaskModal = (defaultStatus: TaskStatus = 'todo') => {
    setTaskToEdit(null);
    setDefaultModalStatus(defaultStatus);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask({
        ...taskData,
        status: defaultModalStatus,
      });
    }
  };

  const handleQuickAdd = (title: string) => {
    addTask({
      title,
      status: 'todo',
      priority: 'blossom',
      category: 'Sanctuary'
    });
  };

  return (
    <div className="min-h-screen bg-[#1a0f1f] text-[#f3e8ff] font-sans flex flex-col selection:bg-[#7c3aed] selection:text-white">
      {/* Clean Minimalism Main Wrapper */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col space-y-8">
        
        {/* Clean Minimalism Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
              Wisteria Tasks
            </h1>
            <p className="text-[#a78bfa] text-xs sm:text-sm tracking-wide mt-1">
              {isConnected ? 'Real-time Collaboration Active' : 'Offline Mode • Local Cache Active'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Switcher Pill */}
            <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveView('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                  activeView === 'list'
                    ? 'bg-white/15 text-white font-medium shadow-sm'
                    : 'text-[#a78bfa] hover:text-white'
                }`}
                title="List View"
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                onClick={() => setActiveView('kanban')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                  activeView === 'kanban'
                    ? 'bg-white/15 text-white font-medium shadow-sm'
                    : 'text-[#a78bfa] hover:text-white'
                }`}
                title="Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>

              <button
                onClick={() => setActiveView('sanctuary')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                  activeView === 'sanctuary'
                    ? 'bg-white/15 text-white font-medium shadow-sm'
                    : 'text-[#a78bfa] hover:text-white'
                }`}
                title="Canopy View"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Canopy</span>
              </button>
            </div>

            {/* PWA Install */}
            <PWAInstallButton />

            {/* New Task Button */}
            <button
              onClick={() => handleOpenNewTaskModal()}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#d8b4fe] text-[#1a0f1f] rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Real-time Room & Collaborators Bar */}
        <CollaboratorsBar
          roomId={roomId}
          onRoomChange={setRoomId}
          collaborators={collaborators}
          currentUser={currentUser}
          isConnected={isConnected}
        />

        {/* View Layouts */}
        {activeView !== 'sanctuary' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Task Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {activeView === 'list' ? (
                <TaskList
                  tasks={tasks}
                  onToggleComplete={toggleTaskCompletion}
                  onEditTask={handleEditTask}
                  onDeleteTask={deleteTask}
                  onQuickAdd={handleQuickAdd}
                  onOpenNewTaskModal={() => handleOpenNewTaskModal()}
                />
              ) : (
                <TaskBoard
                  tasks={tasks}
                  onToggleComplete={toggleTaskCompletion}
                  onUpdateStatus={(taskId, status) => updateTask(taskId, { status })}
                  onEditTask={handleEditTask}
                  onOpenNewTaskModal={(status) => handleOpenNewTaskModal(status)}
                />
              )}
            </div>

            {/* Living Canopy & Garden Stats Column */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#a78bfa] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#a78bfa]" />
                    Living Wisteria Arbor
                  </span>
                  <button
                    onClick={() => setActiveView('sanctuary')}
                    className="flex items-center gap-1 text-[11px] text-[#a78bfa] hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand</span>
                  </button>
                </div>

                <WisteriaCanvas
                  stats={gardenStats}
                  latestCelebration={latestCelebration}
                  onRustle={rustleTree}
                />
              </div>

              {/* Garden Vitality & Daily Insight */}
              <GardenStats
                stats={gardenStats}
                activities={activities}
                onRustleTree={rustleTree}
              />
            </div>
          </div>
        ) : (
          /* Immersive Sanctuary Mode */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
              <div>
                <h2 className="text-lg font-light text-white flex items-center gap-2">
                  <Wind className="w-4 h-4 text-[#a78bfa]" />
                  Wisteria Tree Sanctuary
                </h2>
                <p className="text-xs text-[#a78bfa] mt-1">
                  Completing tasks nurtures this procedural wisteria tree, shedding fragrant blossom petals into the breeze.
                </p>
              </div>
              <button
                onClick={() => setActiveView('list')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Return to Tasks</span>
              </button>
            </div>

            <WisteriaCanvas
              stats={gardenStats}
              latestCelebration={latestCelebration}
              onRustle={rustleTree}
              isExpanded={true}
            />

            {/* Quick Task Checkoff & Undone Grid */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10">
                  <button
                    onClick={() => setSanctuaryTab('active')}
                    className={`px-3.5 py-1 rounded-full text-xs transition-all ${
                      sanctuaryTab === 'active'
                        ? 'bg-[#a78bfa] text-[#1a0f1f] font-semibold'
                        : 'text-[#d8b4fe] opacity-70 hover:opacity-100'
                    }`}
                  >
                    Active Intentions ({tasks.filter(t => t.status !== 'completed').length})
                  </button>
                  <button
                    onClick={() => setSanctuaryTab('completed')}
                    className={`px-3.5 py-1 rounded-full text-xs transition-all ${
                      sanctuaryTab === 'completed'
                        ? 'bg-[#a78bfa] text-[#1a0f1f] font-semibold'
                        : 'text-[#d8b4fe] opacity-70 hover:opacity-100'
                    }`}
                  >
                    Blossomed ({tasks.filter(t => t.status === 'completed').length})
                  </button>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#a78bfa] hidden sm:inline">
                  {sanctuaryTab === 'active' ? 'Click Complete to shed petals' : 'Click Undo to restore task'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sanctuaryTab === 'active' ? (
                  <>
                    {tasks.filter(t => t.status !== 'completed').slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-light text-white truncate">{task.title}</p>
                          <span className="text-[10px] text-[#a78bfa] uppercase tracking-wider">{task.category}</span>
                        </div>
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="px-3 py-1.5 rounded-full bg-[#d8b4fe] text-[#1a0f1f] text-[11px] font-semibold uppercase tracking-wider hover:bg-white transition-all shrink-0 shadow-sm"
                        >
                          Complete
                        </button>
                      </div>
                    ))}
                    {tasks.filter(t => t.status !== 'completed').length === 0 && (
                      <div className="col-span-full text-center py-6 text-xs text-[#a78bfa]">
                        All tasks completed! Take a mindful breath under the wisteria canopy.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {tasks.filter(t => t.status === 'completed').slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/5 transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-light text-white/80 line-through truncate">{task.title}</p>
                          <span className="text-[10px] text-[#a78bfa] uppercase tracking-wider">{task.category}</span>
                        </div>
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#d8b4fe] text-[#d8b4fe] hover:text-[#1a0f1f] text-[11px] font-semibold uppercase tracking-wider transition-all shrink-0 shadow-sm"
                          title="Undo completion and restore task"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      </div>
                    ))}
                    {tasks.filter(t => t.status === 'completed').length === 0 && (
                      <div className="col-span-full text-center py-6 text-xs text-[#a78bfa]">
                        No blossomed tasks yet. Complete a task to see petals shed!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clean Minimalism Footer from Design HTML */}
        <footer className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-white/10 pt-8 gap-4">
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#a78bfa] mb-1 font-medium">Sync Status</p>
              <p className={`text-xs font-mono ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isConnected ? 'Live • Connected' : 'Offline • Cached'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#a78bfa] mb-1 font-medium">Storage</p>
              <p className="text-xs font-mono opacity-80 text-white">Local Cache Enabled</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#a78bfa] mb-1 font-medium">Tree Vitality</p>
            <p className="text-xs opacity-60 text-[#d8b4fe]">{gardenStats.growthProgress}% bloom • {gardenStats.petalsShedCount} petals shed</p>
          </div>
        </footer>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        collaborators={collaborators}
        currentUser={currentUser}
      />

      {/* Offline Status & Reconnection Indicator */}
      <OfflineIndicator
        pendingCount={pendingOfflineCount}
        isSyncing={isSyncing}
        onSync={flushOfflineQueue}
      />
    </div>
  );
}
