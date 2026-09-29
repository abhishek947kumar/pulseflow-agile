import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BoardProvider, useBoard } from './context/BoardContext';
import { TimerProvider } from './context/TimerContext';
import Navbar from './components/Navbar';
import ActiveTimerBar from './components/ActiveTimerBar';
import FilterBar from './components/FilterBar';
import BoardView from './components/BoardView';
import AnalyticsView from './components/AnalyticsView';
import ListView from './components/ListView';
import TimelineView from './components/TimelineView';
import TaskModal from './components/TaskModal';
import NewTaskModal from './components/NewTaskModal';
import StandupModal from './components/StandupModal';
import NotificationToast from './components/NotificationToast';

function AppContent() {
  const [activeView, setActiveView] = useState('board'); // 'board' | 'timeline' | 'analytics' | 'list'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const { loading, currentBoard } = useBoard();

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
        onOpenStandupModal={() => setIsStandupModalOpen(true)}
      />

      {/* Active Stopwatch Banner (appears when timer is running) */}
      <ActiveTimerBar onOpenTask={(task) => setSelectedTask(task)} />

      {/* Main Container */}
      <main className="app-main">
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="brand-logo-icon" style={{ margin: '0 auto 16px auto', animation: 'spin 2s linear infinite' }}>
              ✦
            </div>
            Loading PulseFlow Board Workspace...
          </div>
        ) : (
          <>
            {/* Filter Bar (Only on Board, Timeline, and List views) */}
            {activeView !== 'analytics' && (
              <FilterBar />
            )}

            {/* Dynamic Views */}
            {activeView === 'board' && (
              <BoardView onOpenModal={(task) => setSelectedTask(task)} />
            )}

            {activeView === 'timeline' && (
              <TimelineView onOpenModal={(task) => setSelectedTask(task)} />
            )}

            {activeView === 'analytics' && (
              <AnalyticsView />
            )}

            {activeView === 'list' && (
              <ListView onOpenModal={(task) => setSelectedTask(task)} />
            )}
          </>
        )}
      </main>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* New Task Creation Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />

      {/* AI Daily Standup Generator Modal */}
      <StandupModal
        isOpen={isStandupModalOpen}
        onClose={() => setIsStandupModalOpen(false)}
      />

      {/* Real-time Collaborative Toast Alerts */}
      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BoardProvider>
          <TimerProvider>
            <AppContent />
          </TimerProvider>
        </BoardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
