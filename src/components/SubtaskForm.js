import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTask } from '../context/TaskContext';

const SubtaskForm = ({ taskId, onSuccess, onCancel }) => {
  const { createSubtask } = useTask();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const result = await createSubtask(taskId, {
      title: title.trim(),
      notes: notes.trim()
    });

    if (result.success) {
      setTitle('');
      setNotes('');
      onSuccess?.();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subtask title"
        className="input-field text-sm"
        maxLength={150}
        required
        autoFocus
      />
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="input-field text-sm resize-none"
        rows="2"
        maxLength={500}
      />
      
      <div className="flex items-center space-x-2">
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          <span>{isSubmitting ? 'Adding...' : 'Add Subtask'}</span>
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
        >
          <X size={14} />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
};

export default SubtaskForm;