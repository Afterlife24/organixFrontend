import React, { useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, CheckCircle, Target, TrendingUp, Plus } from 'lucide-react';

const Today = () => {
  const { todayTasks, isLoading, fetchTodayTasks } = useTask();

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const safeTodayTasks = todayTasks || [];
  const completedTasks = safeTodayTasks.filter(task => task.completed);
  const incompleteTasks = safeTodayTasks.filter(task => !task.completed);

  const totalSubtasks = safeTodayTasks.reduce((acc, task) => acc + (task.subtasks?.length || 0), 0);
  const completedSubtasks = safeTodayTasks.reduce((acc, task) => 
    acc + (task.subtasks?.filter(subtask => subtask.completed).length || 0), 0
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">Today</h1>
                <p className="text-gray-600 text-sm md:text-base">{formatDate(new Date())}</p>
              </div>
            </div>
          </div>
          
          {/* Quick Add Button - Mobile */}
          <div className="md:hidden mb-6">
            <a
              href="/create-task"
              className="inline-flex items-center space-x-2 premium-button text-sm"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </a>
          </div>
        </div>
        
        {/* Stats Cards */}
        {safeTodayTasks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="text-white" size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{todayTasks.length}</div>
              <div className="text-xs text-gray-500 font-medium">Total Tasks</div>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="text-white" size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{incompleteTasks.length}</div>
              <div className="text-xs text-gray-500 font-medium">Active</div>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="text-white" size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completedTasks.length}</div>
              <div className="text-xs text-gray-500 font-medium">Completed</div>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="text-white" size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500 font-medium">Progress</div>
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-8">
        {/* Active Tasks */}
        {incompleteTasks.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={16} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Active Tasks</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
            </div>
            <div className="space-y-4 md:space-y-6">
              {incompleteTasks.map((task, index) => (
                <div key={task._id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskCard task={task} showDateRange={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={16} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Completed Tasks</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
            </div>
            <div className="space-y-4 md:space-y-6 opacity-75">
              {completedTasks.map((task, index) => (
                <div key={task._id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskCard task={task} showDateRange={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {safeTodayTasks.length === 0 && (
          <div className="text-center py-16 md:py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
              <Calendar className="text-gray-400" size={40} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">No tasks for today</h3>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              You don't have any tasks scheduled for today. Create a new task to get started!
            </p>
            <a
              href="/create-task"
              className="premium-button inline-flex items-center space-x-3"
            >
              <Plus size={20} />
              <span>Create Your First Task</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Today;