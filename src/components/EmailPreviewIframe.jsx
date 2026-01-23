import React, { useRef, useEffect, useState } from 'react';

const EmailPreviewIframe = ({ htmlContent }) => {
    const iframeRef = useRef(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    useEffect(() => {
        if (iframeRef.current && htmlContent) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            doc.open();
            doc.write(htmlContent);
            doc.close();

            const adjustHeight = () => {
                if (iframe.contentWindow && iframe.contentWindow.document.body) {
                    iframe.style.height = (iframe.contentWindow.document.body.scrollHeight + 20) + 'px';
                    setIframeLoaded(true);
                }
            };

            iframe.onload = adjustHeight;
            adjustHeight();
        }
    }, [htmlContent]);

    return (
        <div style={{ width: '100%', border: '1px solid #e0e0e0', marginTop: '20px' }}>
            {!iframeLoaded && <p>Loading email preview...</p>}
            <iframe
                ref={iframeRef}
                title="Email Design Preview"
                sandbox="allow-same-origin"
                width="100%"
                height={iframeLoaded ? undefined : '500px'}
                frameBorder="0"
                style={{ border: 'none', display: iframeLoaded ? 'block' : 'none' }}
            />
        </div>
    );
};

export default EmailPreviewIframe;
