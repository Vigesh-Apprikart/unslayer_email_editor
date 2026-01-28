import React from 'react';
import UnlayerEditor from './UnlayerEditor';

const EditorTabs = ({
  activeTab,
  editorRef,
  onEditorLoad,
  emailData,
  copyStatus,
  handleCopy,
}) => {
  return (
    <div className="flex-grow mt-4 overflow-hidden relative">
      <div style={{ display: activeTab === 'Design' ? 'block' : 'none', height: '100%' }}>
        <UnlayerEditor editorRef={editorRef} onEditorLoad={onEditorLoad} />
      </div>

      <div
        style={{
          display: activeTab === 'JSON' ? 'block' : 'none',
          height: '100%',
        }}
        className="relative"
      >
        <button
          onClick={() => handleCopy(emailData.json, 'json')}
          className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
        >
          {copyStatus === 'json' ? 'Copied!' : 'Copy'}
        </button>
        <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
          {emailData.json || 'No JSON data available'}
        </pre>
      </div>

      <div
        style={{
          display: activeTab === 'HTML' ? 'block' : 'none',
          height: '100%',
        }}
        className="relative"
      >
        <button
          onClick={() => handleCopy(emailData.html, 'html')}
          className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
        >
          {copyStatus === 'html' ? 'Copied!' : 'Copy'}
        </button>
        <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
          {emailData.html || 'No HTML content available'}
        </pre>
      </div>

      <div
        style={{
          display: activeTab === 'Plain Text' ? 'block' : 'none',
          height: '100%',
        }}
        className="relative"
      >
        <button
          onClick={() => handleCopy(emailData.plainText, 'plainText')}
          className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
        >
          {copyStatus === 'plainText' ? 'Copied!' : 'Copy'}
        </button>
        <pre className="bg-gray-800 text-white p-4 overflow-auto h-full">
          {emailData.plainText || 'No plain text content available'}
        </pre>
      </div>
    </div>
  );
};

export default EditorTabs;
