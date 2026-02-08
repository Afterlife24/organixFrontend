import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import { Plus, Calendar, ArrowLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateTask = () => {
  const { createTask } = useTask();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    startDate: null,
    endDate: null,
    isDateBased: false // New field to toggle date-based vs static task
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

  const handleDateChange = (date, field) => {
    setFormData({
      ...formData,
      [field]: date
    });
    // Clear error when user changes date
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
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

    // Only validate dates if it's a date-based task
    if (formData.isDateBased) {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required for date-based tasks';
      }

      if (!formData.endDate) {
        newErrors.endDate = 'End date is required for date-based tasks';
      } else if (formData.startDate && formData.endDate) {
        // Normalize dates to start of day for proper comparison
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate < startDate) {
          newErrors.endDate = 'End date must be after or equal to start date';
        }
      }
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

    // Only add dates if it's a date-based task
    if (formData.isDateBased && formData.startDate && formData.endDate) {
      taskData.startDate = formData.startDate.toISOString();
      taskData.endDate = formData.endDate.toISOString();
    }

    const result = await createTask(taskData);
    
    if (result.success) {
      navigate(formData.isDateBased ? '/calendar' : '/tasks');
    }
    
    setIsSubmitting(false);
  };

  const formatDateRange = () => {
    if (!formData.startDate || !formData.endDate) return '';
    
    const start = formData.startDate.toLocaleDateString();
    const end = formData.endDate.toLocaleDateString();
    
    if (start === end) {
      return `Task will appear on: ${start}`;
    }
    
    const daysDiff = Math.ceil((formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24)) + 1;
    return `Task will appear for ${daysDiff} day${daysDiff !== 1 ? 's' : ''}: ${start} - ${end}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        <div className="flex items-center space-x-3 mb-2">
          <Plus className="text-primary-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        </div>
        <p className="text-gray-600">
          Create a static task or a date-based task that appears within a specific date range
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`input-field ${errors.title ? 'border-red-300' : ''}`}
              placeholder="e.g., Gym, Skin Care, Read Book"
              maxLength={200}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Task Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Task Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="taskType"
                  checked={!formData.isDateBased}
                  onChange={() => setFormData({ ...formData, isDateBased: false, startDate: null, endDate: null })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Static Task (no dates)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="taskType"
                  checked={formData.isDateBased}
                  onChange={() => setFormData({ ...formData, isDateBased: true, startDate: new Date(), endDate: new Date() })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Date-based Task</span>
              </label>
            </div>
          </div>

          {/* Date Range - only show if date-based */}
          {formData.isDateBased && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  className={`input-field ${errors.startDate ? 'border-red-300' : ''}`}
                  dateFormat="MMM dd, yyyy"
                  minDate={new Date()}
                  placeholderText="Select start date"
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => handleDateChange(date, 'endDate')}
                  className={`input-field ${errors.endDate ? 'border-red-300' : ''}`}
                  dateFormat="MMM dd, yyyy"
                  minDate={formData.startDate || new Date()}
                  placeholderText="Select end date"
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* Date Range Preview - only show if date-based */}
          {formData.isDateBased && formData.startDate && formData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="text-blue-600" size={16} />
                <span className="text-sm text-blue-800 font-medium">
                  {formatDateRange()}
                </span>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Task Types:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Static Tasks:</strong> Can be completed anytime, no date restrictions</li>
              <li>• <strong>Date-based Tasks:</strong> Appear daily within your specified date range</li>
              <li>• You can add subtasks to any task type</li>
              <li>• Perfect for habits, routines, or one-time tasks</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;