import { useState, useEffect } from 'react';
import { generateHtmlFromDesign, extractPlainText } from '../utils/emailUtils';

const getInitialState = () => {
  const savedDesign = localStorage.getItem('emailDesign');
  if (savedDesign) {
    try {
      const design = JSON.parse(savedDesign);
      if (design.body && design.body.values) {
        const bodyBackgroundColor = design.body.values.backgroundColor;
        const bodyTextColor = design.body.values.textColor;

        if (
          bodyBackgroundColor === '#ff0000' ||
          bodyBackgroundColor === 'red' ||
          bodyTextColor === '#ff0000'
        ) {
          console.warn('Detected old red color in saved design. Clearing localStorage.');
          localStorage.removeItem('emailDesign');
          return {
            design: null,
            json: '',
            html: '',
            plainText: '',
          };
        }
      }

      const htmlContent = generateHtmlFromDesign(design);
      const plainTextContent = extractPlainText(htmlContent);
      return {
        design,
        json: JSON.stringify(design, null, 2),
        html: htmlContent,
        plainText: plainTextContent,
      };
    } catch (error) {
      console.error('Error parsing saved design:', error);
      localStorage.removeItem('emailDesign');
    }
  }
  return {
    design: null,
    json: '',
    html: '',
    plainText: '',
  };
};

export const useEmailData = (onHtmlExport) => {
  const [emailData, setEmailData] = useState(getInitialState);
  const [copyStatus, setCopyStatus] = useState('idle');

  useEffect(() => {
    if (onHtmlExport && emailData.html) {
      onHtmlExport(emailData.html);
    }
  }, [emailData.html, onHtmlExport]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(type);
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  return { emailData, setEmailData, copyStatus, handleCopy };
};
