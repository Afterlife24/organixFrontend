import React, { useState } from 'react';
import { Calendar, Plus, Trash2, ChevronDown, ChevronRight, Target, ChevronUp } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import SubtaskInstanceItem from './SubtaskInstanceItem';
import SubtaskForm from './SubtaskForm';
import ConfirmModal from './ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { formatDateShort } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const TaskInstanceCard = ({ taskInstance, showDateRange = true, compact = false }) => {
  const { deleteTask, toggleTaskInstanceComplete, updateTaskOrder } = useTask();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm();

  const task = taskInstance.taskId;

  if (!task) return null;

  const handleTaskToggle = async () => {
    setIsUpdating(true);
    const wasCompleted = taskInstance.completed;
    const result = await toggleTaskInstanceComplete(taskInstance._id);
    
    // Show feedback for auto-completion
    if (result.success && !wasCompleted && totalSubtasks > 0) {
      // Task was marked complete, which auto-completed all subtasks
      toast.success(`Task completed! All ${totalSubtasks} subtasks were automatically marked as done.`);
    } else if (result.success && wasCompleted && totalSubtasks > 0) {
      // Task was marked incomplete, which auto-incompleted all subtasks
      toast.success(`Task marked incomplete. All subtasks were automatically unchecked.`);
    }
    
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    await showConfirm({
      title: "Delete Task",
      message: `Are you sure you want to delete "${task.title}" and all its subtasks? This action cannot be undone.`,
      confirmText: "Delete Task",
      cancelText: "Keep Task",
      type: "danger",
      onConfirm: async () => {
        await deleteTask(task._id);
      }
    });
  };

  const handleMoveUp = async () => {
    await updateTaskOrder(task._id, 'up');
  };

  const handleMoveDown = async () => {
    await updateTaskOrder(task._id, 'down');
  };

  const completedSubtasks = taskInstance.subtaskInstances?.filter(si => si.completed).length || 0;
  const totalSubtasks = taskInstance.subtaskInstances?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <>
      <div className={`floating-card transition-all duration-200 ${
        compact ? 'p-3 md:p-4 task-card-compact' : 'p-4 md:p-6'
      } animate-slide-up ${
        taskInstance.completed ? 'bg-green-50 border-green-200' : ''
      }`}>
        {/* Task Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              {/* Task Completion Checkbox */}
              <button
                onClick={handleTaskToggle}
                disabled={isUpdating}
                className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  taskInstance.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                } disabled:opacity-50`}
                title={taskInstance.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {taskInstance.completed && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Expand/Collapse Button (only show if there are subtasks) */}
              {totalSubtasks > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                >
                  {isExpanded ? 
                    <ChevronDown size={18} className="group-hover:scale-110 transition-transform" /> : 
                    <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
                  }
                </button>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className={`${
                  compact ? 'text-sm font-semibold task-title-compact task-title-wrap' : 'text-lg md:text-xl font-bold truncate'
                } transition-all duration-200 ${
                  taskInstance.completed ? 'text-green-700 line-through' : 'text-gray-900'
                }`}>
                  {task.title}
                </h3>
                {showDateRange && task.startDate && task.endDate && (() => {
                  const startDateFormatted = formatDateShort(task.startDate);
                  const endDateFormatted = formatDateShort(task.endDate);
                  
                  // Only show date range if both dates are valid and formatted successfully
                  if (startDateFormatted && endDateFormatted) {
                    return (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar size={14} className="mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {startDateFormatted} - {endDateFormatted}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            
            {/* Progress Section - only show if there are subtasks */}
            {totalSubtasks > 0 && (
              <div className={`${compact ? 'ml-7' : 'ml-9'} space-y-${compact ? '2' : '3'}`}>
                <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex items-center space-x-2">
                    <Target size={compact ? 12 : 14} className="text-blue-500" />
                    <span className="text-gray-600 font-medium">
                      {completedSubtasks} of {totalSubtasks} subtasks completed
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">{Math.round(progressPercentage)}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className={`w-full bg-gray-200 rounded-full ${compact ? 'h-2' : 'h-3'} overflow-hidden`}>
                    <div
                      className={`bg-gradient-to-r from-blue-500 to-indigo-500 ${compact ? 'h-2' : 'h-3'} rounded-full transition-all duration-500 ease-out shadow-sm`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  {progressPercentage === 100 && (
                    <div className={`absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse`}></div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-3">
            {/* Reorder buttons */}
            <div className="flex flex-col space-y-0.5">
              <button
                onClick={handleMoveUp}
                className={`${
                  compact ? 'p-0.5' : 'p-1'
                } text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200 group`}
                title="Move task up"
              >
                <ChevronUp size={compact ? 10 : 12} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleMoveDown}
                className={`${
                  compact ? 'p-0.5' : 'p-1'
                } text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200 group`}
                title="Move task down"
              >
                <ChevronDown size={compact ? 10 : 12} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Other action buttons */}
            <button
              onClick={() => setShowSubtaskForm(!showSubtaskForm)}
              className={`${
                compact ? 'p-1.5' : 'p-2 md:p-3'
              } text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group`}
              title="Add subtask"
            >
              <Plus size={compact ? 14 : 16} className="group-hover:scale-110 transition-transform" />
            </button>
            {/* Only show delete button for admin users */}
            {user?.isAdmin && (
              <button
                onClick={handleDelete}
                className={`${
                  compact ? 'p-1.5' : 'p-2 md:p-3'
                } text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group`}
                title="Delete task"
              >
                <Trash2 size={compact ? 14 : 16} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Subtask Form */}
        {showSubtaskForm && (
          <div className={`${compact ? 'mb-4 ml-7' : 'mb-6 ml-9'} animate-slide-up`}>
            <SubtaskForm
              taskId={task._id}
              onSuccess={() => setShowSubtaskForm(false)}
              onCancel={() => setShowSubtaskForm(false)}
            />
          </div>
        )}

        {/* Subtasks - only show if expanded and there are subtasks */}
        {isExpanded && taskInstance.subtaskInstances && taskInstance.subtaskInstances.length > 0 && (
          <div className={`${compact ? 'ml-7 space-y-2' : 'ml-9 space-y-3'}`}>
            {taskInstance.subtaskInstances.map((subtaskInstance, index) => (
              <div key={subtaskInstance.subtaskId._id} style={{ animationDelay: `${index * 0.1}s` }}>
                <SubtaskInstanceItem 
                  subtaskInstance={subtaskInstance} 
                  taskInstanceId={taskInstance._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        isLoading={confirmState.isLoading}
      />
    </>
  );
};

export default TaskInstanceCard;