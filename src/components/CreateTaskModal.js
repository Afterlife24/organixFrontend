import React, { useState } from 'react';
import { X, Calendar, Plus, AlertCircle } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { formatDate } from '../utils/dateUtils';
import LoadingSpinner from './LoadingSpinner';

const CreateTaskModal = ({ isOpen, onClose, selectedDate }) => {
  const { createTask } = useTask();
  const [formData, setFormData] = useState({
    title: '',
    isDateBased: true // Default to date-based since we're creating for a specific date
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Task title cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    const taskData = {
      title: formData.title.trim()
    };

    // Add dates if it's a date-based task
    if (formData.isDateBased && selectedDate) {
      taskData.startDate = selectedDate.toISOString();
      taskData.endDate = selectedDate.toISOString();
    }

    const result = await createTask(taskData);
    
    if (result.success) {
      // Reset form
      setFormData({
        title: '',
        isDateBased: true
      });
      setErrors({});
      onClose();
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      isDateBased: true
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Plus className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
              <p className="text-sm text-gray-500">
                {selectedDate ? formatDate(selectedDate, { month: 'short', day: 'numeric' }) : 'New task'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Selected Date Info */}
            {selectedDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="text-blue-600" size={16} />
                  <span className="text-sm text-blue-800 font-medium">
                    Task will be created for {formatDate(selectedDate)}
                  </span>
                </div>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="e.g., Morning workout, Team meeting"
                maxLength={200}
                autoFocus
              />
              {errors.title && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle size={14} />
                  <p className="text-sm">{errors.title}</p>
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Task Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="taskType"
                    checked={formData.isDateBased}
                    onChange={() => setFormData({ ...formData, isDateBased: true })}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Date-specific task</span>
                    <p className="text-xs text-gray-500">Task for the selected date only</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="taskType"
                    checked={!formData.isDateBased}
                    onChange={() => setFormData({ ...formData, isDateBased: false })}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Static task</span>
                    <p className="text-xs text-gray-500">Task without specific date</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="small" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus size={16} />
                  <span>Create Task</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;