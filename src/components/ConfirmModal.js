import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Trash2, CheckCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  isLoading = false 
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'from-red-500 to-pink-500',
          confirmBtn: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'from-orange-500 to-yellow-500',
          confirmBtn: 'from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
          iconColor: 'text-orange-500'
        };
      default:
        return {
          icon: CheckCircle,
          iconBg: 'from-blue-500 to-indigo-500',
          confirmBtn: 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
          iconColor: 'text-blue-500'
        };
    }
  };

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-sm w-full mx-4 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
        >
          <X size={20} />
        </button>
        
        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 bg-gradient-to-r ${typeStyles.iconBg} rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow`}>
              <Icon className="text-white" size={28} />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {message}
          </p>
          
          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${typeStyles.confirmBtn} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;