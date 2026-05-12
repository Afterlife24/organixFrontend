import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, Target, CheckCircle, XCircle } from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';

const TaskInstanceCardReadOnly = ({ taskInstance, showDateRange = true, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const task = taskInstance.taskId;

  if (!task) return null;
  const completedSubtasks = taskInstance.subtaskInstances?.filter(si => si.completed).length || 0;
  const totalSubtasks = taskInstance.subtaskInstances?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className={`floating-card transition-all duration-200 ${
      compact ? 'p-3 md:p-4 task-card-compact' : 'p-4 md:p-6'
    } ${
      taskInstance.completed ? 'bg-green-50 border-green-200' : ''
    }`}>
      {/* Task Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            {/* Task Completion Status (Read-only) */}
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                taskInstance.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 bg-gray-50'
              }`}
              title={taskInstance.completed ? "Completed" : "Incomplete"}
            >
              {taskInstance.completed && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>

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
      </div>

      {/* Subtasks - only show if expanded and there are subtasks */}
      {isExpanded && taskInstance.subtaskInstances && taskInstance.subtaskInstances.length > 0 && (
        <div className={`${compact ? 'ml-7 space-y-2' : 'ml-9 space-y-3'}`}>
          {taskInstance.subtaskInstances.map((subtaskInstance, index) => (
            <div key={subtaskInstance.subtaskId._id} style={{ animationDelay: `${index * 0.1}s` }} className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50">
              {/* Subtask Completion Status (Read-only) */}
              <div
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  subtaskInstance.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {subtaskInstance.completed ? (
                  <CheckCircle size={12} className="text-white" />
                ) : (
                  <XCircle size={12} className="text-gray-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${
                  subtaskInstance.completed 
                    ? 'text-gray-500 line-through' 
                    : 'text-gray-700'
                }`}>
                  {subtaskInstance.subtaskId.title}
                </p>
                {subtaskInstance.subtaskId.notes && (
                  <p className="text-xs text-gray-500 mt-1">
                    {subtaskInstance.subtaskId.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskInstanceCardReadOnly;
