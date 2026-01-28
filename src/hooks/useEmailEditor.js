import { useState, useCallback, useEffect, useRef } from 'react';
import { generateHtmlFromDesign, extractPlainText } from '../utils/emailUtils';

export const useEmailEditor = (emailData, setEmailData, onHtmlExport, activeTab) => {
  const editorRef = useRef(null);
  const [savingStatus, setSavingStatus] = useState('idle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('desktop');

  const updateUndoRedoState = useCallback(() => {
    if (editorRef.current?.editor) {
      editorRef.current.editor.canUndo((canUndo) => {
        setCanUndo(canUndo);
        editorRef.current.editor.canRedo((canRedo) => {
          setCanRedo(canRedo);
        });
      });
    }
  }, []);

  const saveDesign = useCallback(() => {
    if (!editorRef.current) return;
    setSavingStatus('saving');

    editorRef.current.editor.exportHtml((data) => {
      const { design } = data;

      if (!design || (Object.keys(design).length === 0 && !design.body)) {
        console.warn('Invalid/empty design. Save aborted.');
        setSavingStatus('idle');
        return;
      }

      const jsonData = JSON.stringify(design, null, 2);
      const customHtml = generateHtmlFromDesign(design);
      const plainTextContent = extractPlainText(customHtml);

      setEmailData({
        design,
        json: jsonData,
        html: customHtml,
        plainText: plainTextContent,
      });

      localStorage.setItem('emailDesign', JSON.stringify(design));

      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
      updateUndoRedoState();

      if (onHtmlExport) onHtmlExport(customHtml);
    });
  }, [onHtmlExport, updateUndoRedoState, setEmailData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (savingStatus === 'saving') saveDesign();
    }, 1000);
    return () => clearTimeout(handler);
  }, [savingStatus, saveDesign]);

  const onEditorLoad = () => {
    if (emailData.design) {
      editorRef.current.editor.loadDesign(emailData.design);
    } else {
      editorRef.current.editor.loadDesign(null);
    }

    editorRef.current.editor.addEventListener('design:updated', () => {
      if (activeTab === 'Design') setSavingStatus('saving');
    });

    editorRef.current.editor.addEventListener('history:changed', updateUndoRedoState);
  };

  const loadDesignFromStorage = useCallback(() => {
    if (!editorRef.current) return;

    const savedDesign = localStorage.getItem('emailDesign');
    if (savedDesign) {
      try {
        const design = JSON.parse(savedDesign);
        editorRef.current.editor.loadDesign(design);
        setSavingStatus('saving');
      } catch (error) {
        console.error('Error parsing saved design:', error);
        alert('Could not load design. Clearing corrupted design.');
        localStorage.removeItem('emailDesign');
        editorRef.current.editor.loadDesign(null);
        setSavingStatus('saving');
      }
    } else {
      editorRef.current.editor.loadDesign(null);
      alert('No saved design found. Editor cleared.');
      setSavingStatus('saving');
    }
  }, []);

  const handleDeviceSwitch = (device) => {
    if (device === currentDevice || !editorRef.current?.editor) return;

    editorRef.current.editor.exportHtml((data) => {
      const currentDesign = data.design;
      setCurrentDevice(device);

      const container =
        document.querySelector('[data-unlayer="email-editor"]')?.parentElement ||
        document.querySelector('.email-editor-wrapper') ||
        editorRef.current?.editor?.iframe?.parentElement;

      if (container) {
        container.style.maxWidth = device === 'mobile' ? '400px' : '100%';
        container.style.margin = device === 'mobile' ? '0 auto' : '0';
        container.style.border = device === 'mobile' ? '2px dashed #3b82f6' : 'none';
        container.style.transition = 'max-width 0.4s ease';
        container.style.overflow = 'hidden';
      }

      editorRef.current.editor.loadDesign(currentDesign);
      setTimeout(updateUndoRedoState, 500);
    });
  };

  const handleUndo = () => editorRef.current?.editor?.undo();
  const handleRedo = () => editorRef.current?.editor?.redo();

  const handleClearEditor = () => {
    if (!editorRef.current) return;
    editorRef.current.editor.loadBlank();
    localStorage.removeItem('emailDesign');
    setEmailData({ design: null, json: '', html: '', plainText: '' });
    setSavingStatus('idle');
    updateUndoRedoState();
    alert('Editor cleared successfully.');
  };

  return {
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
  };
};
