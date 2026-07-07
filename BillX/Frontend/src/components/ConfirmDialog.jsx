import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm = () => {},
  onCancel = () => {},
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDestructive ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <button 
            onClick={onCancel} 
            type="button"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mt-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-colors focus:outline-none ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500' 
                : 'bg-brand-green hover:bg-brand-green-700 focus:ring-2 focus:ring-brand-green-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmDialog;
