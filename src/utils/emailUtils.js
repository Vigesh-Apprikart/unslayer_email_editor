// Function to generate email-safe, "bulletproof" HTML from Unlayer's design JSON
const generateHtmlFromDesign = (design) => {
    if (!design || !design.body) {
        return '';
    }

    const { body } = design;
    const { rows, values: bodyValues } = body;
    const bodyStyle = `word-spacing:normal;background-color:${bodyValues.backgroundColor || '#FFFFFF'};`;
    const containerWidth = bodyValues.contentWidth || '600px';

    const renderContent = (content) => {
        switch (content.type) {
            case 'text': {
                // Unlayer's text content is already HTML, so we just return it.
                // A more robust solution would parse this and clean it further.
                return content.values.text;
            }
            case 'image': {
                const { values } = content;
                const url = values.src.url ? values.src.url.replace(/ /g, '%20') : ''; // Ensure URL exists and is encoded
                // Provide robust fallbacks for image width and height to prevent invalid HTML
                const imageWidth = values.image && values.image.width ? values.image.width : 600;
                const imageHeight = values.image && values.image.height ? values.image.height : 'auto';
                const altText = values.altText || 'Image'; // Fallback alt text

                // Gmail requires explicit width/height attributes and display:block
                return `<img alt="${altText}" src="${url}" width="${imageWidth}" style="display: block; height: ${imageHeight}; width: 100%; max-width: ${imageWidth}px;" />`;
            }
            case 'button': {
                const { values: btn } = content;
                const btnStyle = `border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:${btn.buttonColors.backgroundColor};`;
                return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                    <tr>
                        <td align="center" bgcolor="${btn.buttonColors.backgroundColor}" role="presentation" style="${btnStyle}" valign="middle">
                            <a href="${btn.href.url}" target="_blank" style="display:inline-block;background:${btn.buttonColors.backgroundColor};color:${btn.buttonColors.color};font-family:Arial, sans-serif;font-size:13px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;">
                                ${btn.text}
                            </a>
                        </td>
                    </tr>
                </table>`;
            }
            case 'html': {
                // Unlayer's 'html' tool stores the custom HTML in content.values.html
                // or content.values.content depending on configuration.
                // We extract the raw HTML and unwrap it if it's a full document.
                const htmlValue = content.values.html || content.values.content || '';

                // If it's a full document, extract only what's inside the <body> tags.
                // Otherwise, return it as-is.
                if (htmlValue.toLowerCase().includes('<body')) {
                    const bodyMatch = htmlValue.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    return bodyMatch ? bodyMatch[1].trim() : htmlValue;
                }

                // Also remove DOCTYPE, html and head tags if they exist without body
                return htmlValue
                    .replace(/<!DOCTYPE[^>]*>/gi, '')
                    .replace(/<\/?html[^>]*>/gi, '')
                    .replace(/<head[^>]*>([\s\S]*)<\/head>/gi, '')
                    .trim();
            }
            default:
                return '';
        }
    };

    const renderColumn = (column) => {
        return column.contents.map(renderContent).join('');
    };

    const renderRow = (row) => {
        const columnsHtml = row.columns.map((column) => {
            const columnWidth = (100 / row.columns.length).toFixed(2);
            const columnStyle = `width:${columnWidth}%;vertical-align:top;`;
            return `<td style="${columnStyle}" valign="top">${renderColumn(column)}</td>`;
        }).join('');

        // Each row is its own table for structure
        return `
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                        <tbody>
                            <tr>
                                ${columnsHtml}
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        `;
    };

    const rowsHtml = rows.map(renderRow).join('');

    return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
        <title></title>
        <!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <!--<![endif]-->
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style type="text/css">
            #outlook a { padding: 0; }
            body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            p { display: block; margin: 13px 0; }
        </style>
        <!--[if mso]>
        <noscript>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        </noscript>
        <![endif]-->
        <style type="text/css">
            @media only screen and (max-width:480px) {
                .mj-column-per-100 { width: 100% !important; max-width: 100%; }
                table.mj-full-width-mobile { width: 100% !important; }
                td.mj-full-width-mobile { width: auto !important; }
            }
        </style>
    </head>
    <body style="${bodyStyle}">
        <!-- Outer Wrapper -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bodyValues.backgroundColor || '#FFFFFF'};">
            <tr>
                <td align="center">
                    <!--[if mso | IE]>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:${containerWidth};" width="${parseInt(containerWidth, 10)}">
                        <tr>
                            <td>
                    <![endif]-->
                    <!-- Inner Container -->
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:${containerWidth};">
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <!--[if mso | IE]>
                            </td>
                        </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

// Function to extract plain text from HTML
const extractPlainText = (html) => {
    if (!html) {
        return '';
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    let plainText = '';

    // Create a TreeWalker to efficiently traverse all text nodes in the document body
    const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT, // Only show text nodes
        null, // No filter function needed
        false // deprecated, must be false
    );

    let node;
    // Iterate through all text nodes
    while ((node = walker.nextNode())) {
        let text = node.nodeValue.trim();
        if (text.length > 0) {
            // Append text and add a newline for separation
            plainText += text + '\n';
        }
    }

    // Clean up multiple newlines (e.g., from consecutive block elements) and trim overall whitespace
    plainText = plainText.replace(/(\n\s*){2,}/g, '\n\n').trim();

    return plainText;
};


export { generateHtmlFromDesign, extractPlainText };

