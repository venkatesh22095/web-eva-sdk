import { textPlugin } from "./text-plugin";

import {EditorView, basicSetup} from "codemirror"
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { EditorState } from '@codemirror/state';
import { bracketMatching } from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { createThumbsUpFilled, copyCodeIcon, tickMarkIcon } from "../../../templateRenderer/icons-library";

const CODE_REGEX = /```(?!chart\b)(\w*)\s*([\s\S]*?)\s*```/g;

const getLanguageExtension = (language) => {
    const lang = language.toLowerCase();
    switch (lang) {
        case 'javascript':
        case 'js':
        case 'jsx':
            return javascript({ jsx: true });
        case 'typescript':
        case 'ts':
        case 'tsx':
            return javascript({ jsx: true, typescript: true });
        case 'json':
            return json();
        case 'html':
        case 'htm':
            return html();
        case 'css':
        case 'scss':
        case 'sass':
            return css();
        case 'python':
        case 'py':
            return python();
        case 'java':
            return java();
        case 'cpp':
        case 'c++':
        case 'c':
            return cpp();
        case 'xml':
            return xml();
        case 'sql':
            return sql();
        default:
            return [];
    }
};

function extractCodeParts(content) {
    const matches = content.match(CODE_REGEX);
    if (!matches) return [{language: '', code: '', text: content}];

    const parts = [];
    let lastIndex = 0;

    matches.forEach(match => {
        const index = content.indexOf(match, lastIndex);
        if (index > lastIndex) {
            parts.push({
                language: '',
                code: '',
                text: content.slice(lastIndex, index),
            });
        }

        const [_, lang, code] =
            match.match(/```(?!chart\b)(?!chart\b)(\w*)\s*([\s\S]*?)\s*```/) || [];
        parts.push({language: lang || 'plaintext', code, text: ''});

        lastIndex = index + match.length;
    });

    if (lastIndex < content.length) {
        parts.push({language: '', code: '', text: content.slice(lastIndex)});
    }

    return parts;
}

// Custom setup matching React app configuration
const customBasicSetup = [
    bracketMatching(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle),
];

// Vanilla JS Copy Button
const createCopyButton = (code, buttonId) => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.setAttribute('data-copy-id', buttonId);
    button.setAttribute('data-code', code);
    
    const updateButtonContent = (copied = false) => {
        button.innerHTML = '';
        
        const copyBtn = document.createElement('div');
        copyBtn.className = copied ? 'copy-btn copied-btn' : 'copy-btn';
        
        const copyIcon = document.createElement('div');
        copyIcon.className = 'copy-icon';
        
        const copyText = document.createElement('div');
        copyText.className = 'copy-text';
        
        if (copied) {
            // You can replace this with your actual TickMark icon
            copyIcon.innerHTML = tickMarkIcon({ size: 14, color: "#79716B" }); // or use your TickMark component
            copyText.textContent = 'Copied';
        } else {
            // You can replace this with your actual MessageCopy icon  
            copyIcon.innerHTML = copyCodeIcon({ size: 14, color: "#79716B" }); // or use your MessageCopy component
            copyText.textContent = 'Copy';
        }
        
        copyBtn.appendChild(copyIcon);
        copyBtn.appendChild(copyText);
        button.appendChild(copyBtn);
    };
    
    updateButtonContent();
    return button;
};

// Function to attach event listeners after DOM rendering
const attachCopyButtonEvents = (container) => {
    const copyButtons = container.querySelectorAll('.copy-button[data-copy-id]');
    
    copyButtons.forEach(button => {
        const code = button.getAttribute('data-code');
        let copied = false;
        
        const updateButtonContent = (isCopied = false) => {
            const copyBtn = button.querySelector('.copy-btn');
            const copyIcon = button.querySelector('.copy-icon');
            const copyText = button.querySelector('.copy-text');
            
            if (isCopied) {
                copyBtn.className = 'copy-btn copied-btn';
                copyIcon.innerHTML = tickMarkIcon({ size: 14, color: "#79716B" });
                copyText.textContent = 'Copied';
            } else {
                copyBtn.className = 'copy-btn';
                copyIcon.innerHTML = copyCodeIcon({ size: 14, color: "#79716B" });
                copyText.textContent = 'Copy';
            }
        };
        
        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(code);
                copied = true;
                updateButtonContent(true);
                setTimeout(() => {
                    copied = false;
                    updateButtonContent(false);
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        };
        
        button.addEventListener('click', handleCopy);
    });
};

export const codePlugin = {
    name: 'code',
    priority: 3,
    canHandle: content => CODE_REGEX.test(content),
    render: (content) => {

        const parts = extractCodeParts(content);

        const pContainer = document.createElement('div');
        pContainer.className = 'p-code-renderer';

        const container = document.createElement('div');
        container.className = 'code-renderer';
        let buttonCounter = 0;

        for (const part of parts) {
            if (part.code) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-parent';
                
                // Add copy button at the top with unique ID
                const copyButton = createCopyButton(part.code, `copy-btn-${buttonCounter++}`);
                wrapper.appendChild(copyButton);
        
                const codeDiv = document.createElement('div');
                codeDiv.className = 'code-block-content';
        
                const editorDiv = document.createElement('div');
                codeDiv.appendChild(editorDiv);

                try {
                    const state = EditorState.create({
                        doc: part.code,
                        extensions: [
                            customBasicSetup,
                            getLanguageExtension(part.language),
                            EditorView.lineWrapping,
                            EditorState.readOnly.of(true),
                            EditorView.editable.of(false),
                        ].filter(Boolean)
                    });

                    new EditorView({
                        state,
                        parent: editorDiv,
                    })
                    
                    wrapper.appendChild(codeDiv);
                    container.appendChild(wrapper);
                } catch (error) {
                    console.error('Error rendering code block:', error);
                    codeDiv.innerHTML = `<pre>${part.code}</pre>`;
                }
                
            } else if (part.text) {
                const textDiv = document.createElement('div');
                textDiv.className = 'code-block-renderer';
                const inner = document.createElement('div');
                inner.innerHTML = textPlugin.render(part.text); // assuming render returns DOM or HTML
                textDiv.appendChild(inner);
                container.appendChild(textDiv);
            }
        }

        pContainer.appendChild(container);
        
        // Attach event listeners after DOM is ready
        setTimeout(() => {
            const renderedContainer = document.querySelector('.code-renderer');
            if (renderedContainer) {
                attachCopyButtonEvents(renderedContainer);
            }
        }, 1000);
        
        return pContainer.innerHTML;
    },
};
