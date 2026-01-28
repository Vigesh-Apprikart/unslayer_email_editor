import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Monitor,
  Smartphone,
  FileUp,
  Trash2,
} from 'lucide-react';

const EditorToolbar = ({
  activeTab,
  setActiveTab,
  currentDevice,
  handleDeviceSwitch,
  handleUndo,
  canUndo,
  handleRedo,
  canRedo,
  loadDesignFromStorage,
  setIsImportModalOpen,
  confirmClearEditor,
  saveDesign,
  savingStatus,
}) => {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setActiveTab('Design')}
          className={`${activeTab === 'Design' ? 'text-blue-500' : 'text-gray-500'} font-semibold`}
        >
          Design
        </button>
        <button
          onClick={() => setActiveTab('JSON')}
          className={`${activeTab === 'JSON' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          JSON
        </button>
        <button
          onClick={() => setActiveTab('HTML')}
          className={`${activeTab === 'HTML' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          HTML
        </button>
        <button
          onClick={() => setActiveTab('Plain Text')}
          className={`${activeTab === 'Plain Text' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          Plain Text
        </button>
      </div>

      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md">
        <button
          onClick={() => handleDeviceSwitch('desktop')}
          className={`p-1.5 rounded ${currentDevice === 'desktop' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Desktop"
          disabled={activeTab !== 'Design'}
        >
          <Monitor className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleDeviceSwitch('mobile')}
          className={`p-1.5 rounded ${currentDevice === 'mobile' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}
          title="Mobile"
          disabled={activeTab !== 'Design'}
        >
          <Smartphone className="h-5 w-5" />
        </button>
      </div>

      <div className="space-x-2 flex items-center">
        <button
          onClick={handleUndo}
          disabled={!canUndo || activeTab !== 'Design'}
          className="p-2 w-10 h-10 text-white rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center"
          title="Undo"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo || activeTab !== 'Design'}
          className="p-2 w-10 h-10 text-white rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center"
          title="Redo"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={loadDesignFromStorage}
          disabled={activeTab !== 'Design'}
          className="p-2 w-32 text-white rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center text-sm"
        >
          Load Design
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          disabled={activeTab !== 'Design'}
          className="p-2 w-32 text-white rounded bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center text-sm"
        >
          <FileUp className="h-4 w-4 mr-1" />
          Import HTML
        </button>
        <button
          onClick={confirmClearEditor}
          disabled={activeTab !== 'Design'}
          className="p-2 w-32 text-white rounded bg-red-500 hover:bg-red-600 disabled:bg-gray-400 flex items-center justify-center text-sm"
          title="Clear Editor"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </button>
        <button
          onClick={saveDesign}
          disabled={savingStatus === 'saving' || activeTab !== 'Design'}
          className="p-2 w-32 text-white rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
        >
          {savingStatus === 'saving' && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {savingStatus === 'idle' && 'Save Design'}
          {savingStatus === 'saving' && 'Saving...'}
          {savingStatus === 'saved' && 'Saved!'}
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
