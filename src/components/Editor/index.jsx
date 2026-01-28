import React, { useState } from 'react';
import { useEmailData } from '../../hooks/useEmailData';
import { useEmailEditor } from '../../hooks/useEmailEditor';
import EditorToolbar from './EditorToolbar';
import EditorTabs from './EditorTabs';
import ImportHtmlModal from './modals/ImportHtmlModal';
import ClearEditorModal from './modals/ClearEditorModal';
import { parseHtmlToUnlayer } from '../../utils/htmlToUnlayer';

const EmailEditorWithTabs = ({ onHtmlExport }) => {
  const [activeTab, setActiveTab] = useState('Design');
  const { emailData, setEmailData, copyStatus, handleCopy } = useEmailData(onHtmlExport);
  const {
    editorRef,
    savingStatus,
    canUndo,
    canRedo,
    currentDevice,
    onEditorLoad,
    saveDesign,
    loadDesignFromStorage,
    handleDeviceSwitch,
    handleUndo,
    handleRedo,
    handleClearEditor,
  } = useEmailEditor(emailData, setEmailData, onHtmlExport, activeTab);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importHtml, setImportHtml] = useState('');
  const [importStep, setImportStep] = useState('input');
  const [parsedDesign, setParsedDesign] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handlePreviewImport = () => {
    if (!importHtml.trim()) return;
    try {
      const design = parseHtmlToUnlayer(importHtml);
      setParsedDesign(design);
      setImportStep('preview');
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to parse HTML. Please check the format.');
    }
  };

  const handleFinalImport = () => {
    if (!parsedDesign) return;
    editorRef.current.editor.loadDesign(parsedDesign);
    saveDesign();
    setIsImportModalOpen(false);
    setImportHtml('');
    setParsedDesign(null);
    setImportStep('input');
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportHtml('');
    setParsedDesign(null);
    setImportStep('input');
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <EditorToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentDevice={currentDevice}
        handleDeviceSwitch={handleDeviceSwitch}
        handleUndo={handleUndo}
        canUndo={canUndo}
        handleRedo={handleRedo}
        canRedo={canRedo}
        loadDesignFromStorage={loadDesignFromStorage}
        setIsImportModalOpen={setIsImportModalOpen}
        confirmClearEditor={() => setIsClearModalOpen(true)}
        saveDesign={saveDesign}
        savingStatus={savingStatus}
      />
      <EditorTabs
        activeTab={activeTab}
        editorRef={editorRef}
        onEditorLoad={onEditorLoad}
        emailData={emailData}
        copyStatus={copyStatus}
        handleCopy={handleCopy}
      />
      <ImportHtmlModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        importHtml={importHtml}
        setImportHtml={setImportHtml}
        handlePreviewImport={handlePreviewImport}
        importStep={importStep}
        setImportStep={setImportStep}
        parsedDesign={parsedDesign}
        handleFinalImport={handleFinalImport}
      />
      <ClearEditorModal
        isOpen={isClearModalOpen}
        onConfirm={() => {
          handleClearEditor();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};

export default EmailEditorWithTabs;
