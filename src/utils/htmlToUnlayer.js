/**
 * Advanced Utility to parse HTML email templates into native Unlayer design JSON.
 * High-fidelity preservation of hierarchy, typography, and styling for absolute 1:1 matching.
 * Handles deep nesting and prevents stacking of horizontal layouts.
 */

export const parseHtmlToUnlayer = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const body = doc.body;

    const cssRules = parseInternalStyles(doc);

    const design = {
        body: {
            rows: [],
            values: {
                backgroundColor: extractBodyBackgroundColor(body) || '#ffffff',
                contentWidth: '600px',
                fontFamily: {
                    label: 'Arial',
                    value: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
                },
                textColor: '#000000',
            }
        },
        schemaVersion: 1
    };

    applyStylesToElements(body, cssRules);
    design.body.rows = processElements(Array.from(body.childNodes));
    return design;
};

const parseInternalStyles = (doc) => {
    const rules = [];
    const styleTags = Array.from(doc.querySelectorAll('style'));
    styleTags.forEach(tag => {
        const css = tag.textContent;
        // Improved regex to handle media queries by skipping them or parsing them carefully
        // For now, we focus on desktop view, so we skip @media
        const cleanCss = css.replace(/@media[^{]+\{([\s\S]+?\}\s*)\}/g, '');

        const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
        let match;
        while ((match = ruleRegex.exec(cleanCss)) !== null) {
            const selector = match[1].trim();
            const declaration = match[2].trim();

            const styles = {};
            declaration.split(';').forEach(pair => {
                const colonIdx = pair.indexOf(':');
                if (colonIdx === -1) return;
                const prop = pair.substring(0, colonIdx).trim();
                const val = pair.substring(colonIdx + 1).trim();
                if (prop && val) {
                    const camelKey = prop.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
                    styles[camelKey] = val.replace('!important', '').trim();
                }
            });
            rules.push({ selector, styles });
        }
    });
    return rules;
};

const applyStylesToElements = (body, rules) => {
    rules.forEach(rule => {
        try {
            const selectors = rule.selector.split(',').map(s => s.trim());
            selectors.forEach(selector => {
                const elements = body.querySelectorAll(selector);
                elements.forEach(el => {
                    const currentStyle = el.getAttribute('style') || '';
                    const ruleStyleEntries = Object.entries(rule.styles).filter(([k]) => {
                        // Don't let internal styles override explicit inline styles
                        const kebab = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                        return !currentStyle.includes(`${kebab}:`);
                    });

                    if (ruleStyleEntries.length > 0) {
                        const ruleStyleString = ruleStyleEntries.map(([k, v]) => {
                            const kebab = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                            return `${kebab}:${v}`;
                        }).join(';');
                        el.setAttribute('style', `${ruleStyleString};${currentStyle}`);
                    }
                });
            });
        } catch { /* ignore invalid selectors */ }
    });
};

const extractBodyBackgroundColor = (body) => {
    const bodyStyle = extractStyles(body);
    if (bodyStyle.backgroundColor && bodyStyle.backgroundColor !== 'transparent') return bodyStyle.backgroundColor;
    const outerTable = body.querySelector('table');
    if (outerTable) {
        const styles = extractStyles(outerTable);
        if (styles.backgroundColor && styles.backgroundColor !== 'transparent') return styles.backgroundColor;
    }
    return null;
};

const processElements = (nodes) => {
    const flattenedNodes = groupInlineNodes(nodes);
    const results = [];
    let currentInRow = [];

    const flush = () => {
        if (currentInRow.length > 0) {
            results.push(createSimpleRow(currentInRow));
            currentInRow = [];
        }
    };

    flattenedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const tagName = el.tagName.toUpperCase();
            if (['STYLE', 'SCRIPT', 'META', 'TITLE', 'HEAD'].includes(tagName)) return;

            if (tagName === 'TABLE') {
                flush();
                results.push(...processTable(el));
            } else if (isBlockElement(el)) {
                flush();
                const innerTable = findLayoutTable(el);
                if (innerTable) {
                    results.push(...processTable(innerTable));
                } else {
                    results.push(createSimpleRow([processComponent(el)]));
                }
            } else if (tagName !== 'BR') {
                currentInRow.push(processComponent(el));
            }
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            currentInRow.push(processComponent(node));
        } else if (node.__isGroup) {
            currentInRow.push(node.component);
        }
    });

    flush();
    return results;
};

const groupInlineNodes = (nodes) => {
    const results = [];
    let i = 0;
    while (i < nodes.length) {
        const current = nodes[i];
        if (isPotentialInlineGroupMember(current)) {
            let group = [current];
            let nextIdx = i + 1;
            while (nextIdx < nodes.length && (isPotentialInlineGroupMember(nodes[nextIdx]) || (nodes[nextIdx].nodeType === Node.TEXT_NODE && !nodes[nextIdx].textContent.trim()))) {
                if (isPotentialInlineGroupMember(nodes[nextIdx])) {
                    group.push(nodes[nextIdx]);
                }
                nextIdx++;
            }
            if (group.length > 1) {
                const combinedHtml = group.map(n => n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML).join('');
                results.push({
                    nodeType: 'CUSTOM',
                    __isGroup: true,
                    component: {
                        type: 'text',
                        values: {
                            text: `<div style="text-align: inherit;">${combinedHtml}</div>`,
                            padding: '10px'
                        }
                    }
                });
                i = nextIdx;
                continue;
            }
        }
        results.push(current);
        i++;
    }
    return results;
};

const isPotentialInlineGroupMember = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = node.tagName.toUpperCase();
    if (tag === 'A' && node.querySelector('img')) return true;
    if (tag === 'IMG' && isSocialIcon(node)) return true;
    return false;
};

const processTable = (table) => {
    const unlayerRows = [];
    const tableRows = Array.from(table.rows);
    const tableStyles = extractStyles(table);

    tableRows.forEach(tr => {
        const trCells = Array.from(tr.cells);
        if (trCells.length === 0) return;

        if (trCells.length === 1) {
            const td = trCells[0];
            const children = Array.from(td.childNodes).filter(n => {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    const tag = n.tagName.toUpperCase();
                    return !['STYLE', 'SCRIPT'].includes(tag);
                }
                return n.nodeType === Node.TEXT_NODE && n.textContent.trim();
            });

            if (children.some(c => c.nodeType === Node.ELEMENT_NODE && c.tagName.toUpperCase() === 'TABLE')) {
                const tdStyles = extractStyles(td);
                const trStyles = extractStyles(tr);
                const wrapperBg = trStyles.backgroundColor || tdStyles.backgroundColor || tr.getAttribute('bgcolor') || td.getAttribute('bgcolor') || tableStyles.backgroundColor;

                const innerResults = processElements(children);
                innerResults.forEach(res => {
                    if (isUnlayerRow(res)) {
                        if (wrapperBg && wrapperBg !== 'transparent' && (!res.values.backgroundColor || res.values.backgroundColor === 'transparent')) {
                            res.values.backgroundColor = wrapperBg;
                        }
                        unlayerRows.push(res);
                    } else {
                        const row = createSimpleRow([res]);
                        if (wrapperBg && wrapperBg !== 'transparent') row.values.backgroundColor = wrapperBg;
                        unlayerRows.push(row);
                    }
                });
                return;
            }
        }

        const columns = [];
        const gridCells = [];
        const totalColSpan = trCells.reduce((sum, cell) => sum + (cell.colSpan || 1), 0);

        trCells.forEach(td => {
            const colSpan = td.colSpan || 1;
            const widthPct = (colSpan / totalColSpan) * 100;
            const gridWidth = Math.round((colSpan / totalColSpan) * 12);
            gridCells.push(gridWidth > 0 ? gridWidth : 1);

            const cellStyles = extractStyles(td);
            const column = {
                contents: [],
                values: {
                    _width: `${widthPct.toFixed(2)}%`,
                    padding: cellStyles.padding || '10px',
                    backgroundColor: cellStyles.backgroundColor || td.getAttribute('bgcolor') || 'transparent',
                    verticalAlign: cellStyles.verticalAlign || td.getAttribute('valign') || 'top',
                    borderTop: cellStyles.borderTop,
                    borderBottom: cellStyles.borderBottom,
                    borderLeft: cellStyles.borderLeft,
                    borderRight: cellStyles.borderRight,
                    borderRadius: cellStyles.borderRadius
                }
            };

            const items = processCellContent(Array.from(td.childNodes));
            items.forEach(item => {
                if (isUnlayerRow(item)) {
                    item.columns.forEach(col => column.contents.push(...col.contents));
                } else {
                    column.contents.push(item);
                }
            });

            if (column.contents.length === 0) column.contents.push(createPlaceholder());
            columns.push(column);
        });

        const currentSum = gridCells.reduce((a, b) => a + b, 0);
        if (currentSum !== 12 && columns.length > 0) {
            gridCells[gridCells.length - 1] += (12 - currentSum);
        }

        const trStyles = extractStyles(tr);
        unlayerRows.push({
            cells: gridCells,
            columns: columns,
            values: {
                backgroundColor: trStyles.backgroundColor || tr.getAttribute('bgcolor') || 'transparent',
                verticalAlign: trStyles.verticalAlign || tr.getAttribute('valign') || 'top', // Apply row vertical alignment
                paddingTop: trStyles.paddingTop || (trStyles.padding ? trStyles.padding.split(' ')[0] : '0px'),
                paddingRight: trStyles.paddingRight || (trStyles.padding ? trStyles.padding.split(' ')[1] : '0px'),
                paddingBottom: trStyles.paddingBottom || (trStyles.padding ? trStyles.padding.split(' ')[2] : '0px'),
                paddingLeft: trStyles.paddingLeft || (trStyles.padding ? trStyles.padding.split(' ')[3] : '0px'),
                borderTop: trStyles.borderTop,
                borderBottom: trStyles.borderBottom,
                borderLeft: trStyles.borderLeft,
                borderRight: trStyles.borderRight
            }
        });
    });

    return unlayerRows;
};

const findLayoutTable = (node) => {
    const children = Array.from(node.childNodes).filter(n => {
        if (n.nodeType === Node.ELEMENT_NODE) {
            const tag = n.tagName.toUpperCase();
            return !['STYLE', 'SCRIPT'].includes(tag);
        }
        return n.nodeType === Node.TEXT_NODE && n.textContent.trim();
    });

    if (children.length === 1) {
        const child = children[0];
        if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = child.tagName.toUpperCase();
            if (tag === 'TABLE') {
                if (child.rows.length === 1 && child.rows[0].cells.length === 1) {
                    return findLayoutTable(child.rows[0].cells[0]);
                }
                return child;
            }
            if (['DIV', 'CENTER', 'SECTION', 'MAIN', 'TD', 'FIGURE'].includes(tag)) {
                return findLayoutTable(child);
            }
        }
    }
    return null;
};

const processCellContent = (nodes) => {
    const flattenedNodes = groupInlineNodes(nodes);
    const results = [];
    flattenedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            const tag = el.tagName.toUpperCase();
            if (tag === 'TABLE') {
                results.push(...processTable(el));
            } else if (['DIV', 'SECTION', 'CENTER', 'HEADER', 'FOOTER'].includes(tag)) {
                if (el.querySelector('table')) {
                    results.push(...processCellContent(Array.from(el.childNodes)));
                } else {
                    results.push(processComponent(el));
                }
            } else {
                results.push(processComponent(el));
            }
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            results.push(processComponent(node));
        } else if (node.__isGroup) {
            results.push(node.component);
        }
    });
    return results;
};

/**
 * Enhanced Component Processor with Surgical Style Fidelity
 */
const processComponent = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
        return {
            type: 'text',
            values: {
                text: `<p style="margin: 0; line-height: 140%; font-family: inherit;">${node.textContent.trim()}</p>`,
                padding: '10px'
            }
        };
    }

    const el = node;
    const tagName = el.tagName.toUpperCase();
    const styles = extractStyles(el);
    const textAlign = el.getAttribute('align') || styles.textAlign || 'inherit';

    const baseComponentValues = {
        padding: styles.padding || '10px',
        textAlign: textAlign !== 'inherit' ? textAlign : undefined,
        backgroundColor: styles.backgroundColor !== 'transparent' ? styles.backgroundColor : undefined,
        borderTop: styles.borderTop,
        borderBottom: styles.borderBottom,
        borderLeft: styles.borderLeft,
        borderRight: styles.borderRight,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
    };

    // Handle Image component
    if (tagName === 'IMG' || tagName === 'FIGURE' || (tagName === 'A' && el.querySelector('img'))) {
        let actualImg = el;
        let linkHref = null;

        if (tagName === 'A') {
            actualImg = el.querySelector('img');
            linkHref = el.href;
        } else if (tagName === 'FIGURE') {
            actualImg = el.querySelector('img') || el;
        }

        if (actualImg && actualImg.tagName === 'IMG') {
            const imgStyles = extractStyles(actualImg);
            const parentStyles = extractStyles(el);
            const platform = detectSocialPlatform(actualImg.src, actualImg.alt);

            return {
                type: 'image',
                values: {
                    ...baseComponentValues,
                    src: { url: actualImg.src },
                    altText: actualImg.alt || platform || 'Image',
                    width: actualImg.getAttribute('width') ? actualImg.getAttribute('width') + 'px' : (imgStyles.width || styles.width || '100%'),
                    autoWidth: !actualImg.getAttribute('width') && !imgStyles.width && !styles.width,
                    padding: styles.padding || imgStyles.padding || parentStyles.padding || '10px',
                    borderRadius: imgStyles.borderRadius || styles.borderRadius,
                    boxShadow: styles.boxShadow || imgStyles.boxShadow,
                    href: linkHref ? { url: linkHref, target: '_blank' } : undefined
                }
            };
        }
    }

    // Handle Button
    if (tagName === 'A' && isButtonLike(el)) {
        return {
            type: 'button',
            values: {
                ...baseComponentValues,
                text: el.innerText || 'Button',
                href: { url: el.href, target: '_blank' },
                buttonColors: {
                    color: styles.color || '#ffffff',
                    backgroundColor: styles.backgroundColor || '#3AAEE0'
                },
                fontSize: styles.fontSize,
                fontWeight: normalizeFontWeight(styles.fontWeight),
                lineHeight: styles.lineHeight,
                letterSpacing: styles.letterSpacing,
                fontFamily: styles.fontFamily ? { label: styles.fontFamily, value: styles.fontFamily } : undefined,
                borderRadius: styles.borderRadius // Explicitly add border-radius for buttons
            }
        };
    }

    // Handle Typography (Strict Precision Mapping)
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'SPAN', 'STRONG', 'B', 'FONT', 'UL', 'LI'].includes(tagName)) {
        return {
            type: 'text',
            values: {
                ...baseComponentValues,
                text: el.outerHTML,
                color: styles.color,
                fontSize: styles.fontSize,
                fontWeight: normalizeFontWeight(styles.fontWeight),
                lineHeight: styles.lineHeight,
                letterSpacing: styles.letterSpacing,
                fontFamily: styles.fontFamily ? { label: styles.fontFamily, value: styles.fontFamily } : undefined,
                paddingTop: styles.paddingTop,
                paddingRight: styles.paddingRight,
                paddingBottom: styles.paddingBottom,
                paddingLeft: styles.paddingLeft,
                marginTop: styles.marginTop,
                marginRight: styles.marginRight,
                marginBottom: styles.marginBottom,
                marginLeft: styles.marginLeft
            }
        };
    }

    return {
        type: 'text',
        values: {
            ...baseComponentValues,
            text: el.outerHTML
        }
    };
};

const isSocialIcon = (img) => {
    const src = img.src.toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'twitter', 'x.com', 'tiktok', 'social'];
    return platforms.some(p => src.includes(p) || alt.includes(p));
};

const detectSocialPlatform = (src, alt) => {
    const text = (src + ' ' + (alt || '')).toLowerCase();
    if (text.includes('facebook')) return 'Facebook';
    if (text.includes('instagram')) return 'Instagram';
    if (text.includes('linkedin')) return 'LinkedIn';
    if (text.includes('youtube')) return 'YouTube';
    if (text.includes('twitter') || text.includes('x.com')) return 'Twitter';
    return null;
};

const isBlockElement = (el) => {
    return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'CENTER', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'BLOCKQUOTE', 'FIGURE'].includes(el.tagName.toUpperCase());
};

const isButtonLike = (el) => {
    const s = extractStyles(el);
    return (s.backgroundColor && s.backgroundColor !== 'transparent') || el.getAttribute('bgcolor') || el.classList.contains('button') || (el.innerText && el.innerText.length < 30 && s.display === 'inline-block');
};

const isUnlayerRow = (item) => item && item.columns && item.cells;

/**
 * Surgical Precision Style Extraction
 * Normalizes multi-side properties (padding, margin, border) into canonical Unlayer formats.
 */
const extractStyles = (el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return {};

    const attr = el.getAttribute('style') || '';
    const styles = {};
    attr.split(';').forEach(p => {
        const splitIdx = p.indexOf(':');
        if (splitIdx === -1) return;
        const k = p.substring(0, splitIdx).trim();
        const v = p.substring(splitIdx + 1).trim();
        if (k && v) {
            const camel = k.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
            styles[camel] = v.replace('!important', '').trim();
        }
    });

    // 1. Shorthand expansion for Borders
    if (styles.border) {
        const parts = styles.border.split(' ');
        if (parts.length === 3) {
            const [width, style, color] = parts;
            ['Top', 'Bottom', 'Left', 'Right'].forEach(side => {
                styles[`border${side}Width`] = width;
                styles[`border${side}Style`] = style;
                styles[`border${side}Color`] = color;
            });
        }
    }

    // 2. Individual border side calculation
    ['Top', 'Bottom', 'Left', 'Right'].forEach(side => {
        const sideKey = `border${side}`;
        if (styles[sideKey]) {
            const parts = styles[sideKey].split(' ');
            if (parts.length === 3) {
                styles[`border${side}Width`] = parts[0];
                styles[`border${side}Style`] = parts[1];
                styles[`border${side}Color`] = parts[2];
            }
        }

        const width = styles[`border${side}Width`];
        const style = styles[`border${side}Style`];
        const color = styles[`border${side}Color`];
        if (width || style || color) {
            styles[sideKey] = `${width || '1px'} ${style || 'solid'} ${color || '#000000'}`;
        }
    });

    // 3. Shorthand expansion for Padding and Margin with precision
    ['padding', 'margin'].forEach(prop => {
        if (styles[prop]) {
            const parts = styles[prop].split(/\s+/);
            if (parts.length === 1) {
                styles[`${prop}Top`] = styles[`${prop}Right`] = styles[`${prop}Bottom`] = styles[`${prop}Left`] = parts[0];
            } else if (parts.length === 2) {
                styles[`${prop}Top`] = styles[`${prop}Bottom`] = parts[0];
                styles[`${prop}Right`] = styles[`${prop}Left`] = parts[1];
            } else if (parts.length === 3) {
                styles[`${prop}Top`] = parts[0];
                styles[`${prop}Right`] = styles[`${prop}Left`] = parts[1];
                styles[`${prop}Bottom`] = parts[2];
            } else if (parts.length === 4) {
                styles[`${prop}Top`] = parts[0];
                styles[`${prop}Right`] = parts[1];
                styles[`${prop}Bottom`] = parts[2];
                styles[`${prop}Left`] = parts[3];
            }
        }
    });

    // 4. Attribute Capture & Normalization
    if (el.getAttribute('align')) styles.textAlign = el.getAttribute('align');
    if (el.getAttribute('valign')) styles.verticalAlign = el.getAttribute('valign');
    if (el.getAttribute('bgcolor')) styles.backgroundColor = el.getAttribute('bgcolor');

    // Fix: Normalize vertical-align "center" to "middle" for Unlayer compatibility
    if (styles.verticalAlign === 'center') styles.verticalAlign = 'middle';

    ['width', 'height'].forEach(attrName => {
        const val = el.getAttribute(attrName);
        if (val) {
            styles[attrName] = /^\d+$/.test(val) ? val + 'px' : val;
        }
    });

    // 5. Typography Normalization
    if (styles.lineHeight && styles.lineHeight.endsWith('%')) {
        const pct = parseInt(styles.lineHeight);
        if (!isNaN(pct)) styles.lineHeight = (pct / 100).toFixed(2);
    }

    return styles;
};

const normalizeFontWeight = (val) => {
    if (!val) return undefined;
    if (val === 'bold') return 700;
    if (val === 'normal') return 400;
    const num = parseInt(val);
    return isNaN(num) ? val : num;
};

const createSimpleRow = (components) => ({
    cells: [12],
    columns: [{
        contents: components,
        values: { _width: '100%', padding: '0px' }
    }],
    values: { backgroundColor: 'transparent', padding: '0px' }
});

const createPlaceholder = () => ({
    type: 'text',
    values: { text: '<p>&nbsp;</p>', padding: '10px' }
});
