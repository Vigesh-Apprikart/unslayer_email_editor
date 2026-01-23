import React, { useRef } from 'react';
import EmailEditor from 'react-email-editor';

const MyEmailEditor = () => {
  const editorRef = useRef(null);

  const saveDesign = () => {
    editorRef.current.editor.saveDesign((data) => {
      console.log('Saved email design:', data);
      // You can send this data to your backend to save it or process it.
    });
  };

  const loadDesign = () => {
    // You can load a saved design (pass your design data here)
    const design = {};  // Replace with your saved design object
    editorRef.current.editor.loadDesign(design);
  };

  return (
    <div className="p-6">
      {/* Tabs for Design, JSON, HTML, Plain Text */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <button className="text-blue-500 font-semibold">Design</button>
        <button className="text-gray-500">JSON</button>
        <button className="text-gray-500">HTML</button>
        <button className="text-gray-500">Plain Text</button>
      </div>

      {/* Email Editor Component */}
      <EmailEditor ref={editorRef} className="mt-6" />

      <div className="mt-4">
        <button
          onClick={saveDesign}
          className="p-2 bg-blue-500 text-white rounded mr-2"
        >
          Save Design
        </button>
        <button
          onClick={loadDesign}
          className="p-2 bg-gray-500 text-white rounded"
        >
          Load Design
        </button>
      </div>
    </div>
  );
};

export default MyEmailEditor;
