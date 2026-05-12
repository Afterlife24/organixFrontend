import React, { useState } from 'react';
import { Trash2, Edit3, Save, X, MessageSquare } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import ConfirmModal from './ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

const SubtaskItem = ({ subtask }) => {
  const { updateSubtask, deleteSubtask } = useTask();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editNotes, setEditNotes] = useState(subtask.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm();

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    const wasCompleted = subtask.completed;
    const result = await updateSubtask(subtask._id, { completed: !subtask.completed });
    
    // Show feedback for auto-completion (we'll need to check the parent task status)
    if (result.success && !wasCompleted) {
      // Check if this was the last subtask to complete
      // Note: The backend handles the auto-completion, but we don't get the parent task back
      // We could add a toast here if needed, but it might be too noisy
    }
    
    setIsUpdating(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    setIsUpdating(true);
    const result = await updateSubtask(subtask._id, {
      title: editTitle.trim(),
      notes: editNotes.trim()
    });
    
    if (result.success) {
      setIsEditing(false);
    }
    setIsUpdating(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(subtask.title);
    setEditNotes(subtask.notes || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await showConfirm({
      title: "Delete Subtask",
      message: `Are you sure you want to delete "${subtask.title}"? This action cannot be undone.`,
      confirmText: "Delete Subtask",
      cancelText: "Keep Subtask",
      type: "danger",
      onConfirm: async () => {
        await deleteSubtask(subtask._id);
      }
    });
  };

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="input-field text-sm"
          placeholder="Subtask title"
          autoFocus
        />
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="input-field text-sm resize-none"
          rows="2"
          placeholder="Notes (optional)"
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveEdit}
            disabled={!editTitle.trim() || isUpdating}
            className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
        subtask.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
      }`}>
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isUpdating}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            subtask.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary-500'
          } disabled:opacity-50`}
        >
          {subtask.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${
            subtask.completed ? 'text-green-700 line-through' : 'text-gray-900'
          }`}>
            {subtask.title}
          </div>
          
          {subtask.notes && (
            <div className="mt-1">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <MessageSquare size={12} />
                <span>{showNotes ? 'Hide notes' : 'Show notes'}</span>
              </button>
              {showNotes && (
                <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                  {subtask.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
            title="Edit subtask"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="Delete subtask"
          >
            <Trash2 size={14} />
          </button>
        </div>
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

export default SubtaskItem;