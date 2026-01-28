import React from 'react';
import { FileUp } from 'lucide-react';
import PreviewPanel from './PreviewPanel';

const ImportHtmlModal = ({
  isOpen,
  onClose,
  importHtml,
  setImportHtml,
  handlePreviewImport,
  importStep,
  setImportStep,
  parsedDesign,
  handleFinalImport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold flex items-center">
            <FileUp className="mr-2 h-5 w-5 text-purple-600" />
            {importStep === 'input' ? 'Import External HTML' : 'Review Parsed Structure'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-4 flex-grow overflow-auto">
          {importStep === 'input' ? (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Paste your table-based HTML code below. Our aggressive parser will preserve horizontal layouts and surgical styling.
              </p>
              <textarea
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="<table ...> ... </table>"
              />
            </>
          ) : (
            <PreviewPanel design={parsedDesign} />
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div>
            {importStep === 'preview' && (
              <button
                onClick={() => setImportStep('input')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded text-sm font-semibold transition-colors"
              >
                ← Back to Edit
              </button>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm transition-colors"
            >
              Cancel
            </button>
            {importStep === 'input' ? (
              <button
                onClick={handlePreviewImport}
                disabled={!importHtml.trim()}
                className="px-6 py-2 text-white bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 rounded text-sm font-bold shadow-sm transition-transform active:scale-95"
              >
                Preview Structure
              </button>
            ) : (
              <button
                onClick={handleFinalImport}
                className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded text-sm font-bold shadow-md transition-transform active:scale-95"
              >
                Done - Add to Editor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportHtmlModal;
