import React from 'react';
import { Trash2 } from 'lucide-react';

const ClearEditorModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Trash2 className="mr-2 h-6 w-6 text-red-500" />
          Clear Editor?
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to clear the editor? This will remove all
          content and cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearEditorModal;
