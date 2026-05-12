import React, { useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckSquare, Plus } from 'lucide-react';

const Tasks = () => {
  const { staticTasks, isLoading, fetchStaticTasks } = useTask();

  useEffect(() => {
    fetchStaticTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const completedTasks = (staticTasks || []).filter(task => task.completed);
  const incompleteTasks = (staticTasks || []).filter(task => !task.completed);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <CheckSquare className="text-primary-600" size={28} />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tasks</h1>
          </div>
          <a
            href="/create-task"
            className="btn-primary inline-flex items-center space-x-2 text-sm"
          >
            <Plus size={16} />
            <span>New Task</span>
          </a>
        </div>
        <p className="text-gray-600 text-sm">Static tasks that can be completed anytime</p>
        
        {/* Stats */}
        {staticTasks.length > 0 && (
          <div className="mt-3 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              <span className="text-gray-600">
                {incompleteTasks.length} active task{incompleteTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {/* Active Tasks */}
        {incompleteTasks.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Active Tasks</h2>
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <TaskCard key={task._id} task={task} showDateRange={false} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Completed Tasks</span>
            </h2>
            <div className="space-y-3 opacity-75">
              {completedTasks.map((task) => (
                <TaskCard key={task._id} task={task} showDateRange={false} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {staticTasks.length === 0 && (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Create your first static task that you can complete anytime!
            </p>
            <a
              href="/create-task"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Your First Task</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;