
export const applyVariableStyling = (editor) => {
	try {
		
		editor.enable();
		
		const text = editor.getText();		
		const variableRegex = /\$\$([^$]+)\$\$/g;								

		
		const currentSelection = editor.getSelection();
		
		// Find and replace variables (remove $$ and style the word)
		const matches = [];
		let regexMatch;
		
		while ((regexMatch = variableRegex.exec(text)) !== null) {
			matches.push({
				index: regexMatch.index,
				length: regexMatch[0].length,
				fullText: regexMatch[0], // $$word$$
				wordOnly: regexMatch[1]  // word
			});
		}

		
		for (let i = matches.length - 1; i >= 0; i--) {
			const { index, length, wordOnly } = matches[i];										
			
			
			const existingFormat = editor.getFormat(index, wordOnly.length);
			const isAlreadyStyled = existingFormat.background === '#e3f2fd' && 
									existingFormat.color === '#1976d2' && 
									existingFormat.bold === true;
									
			
			if (!isAlreadyStyled) {
				
				editor.deleteText(index, length, 'silent');
				editor.insertText(index, wordOnly + ' ', 'silent');
				
				
				editor.formatText(index, wordOnly.length, {
					'background': '#e3f2fd',
					'color': '#1976d2',
					'bold': true
				}, 'silent');
			}
		}

		
		if (currentSelection) {
			editor.setSelection(currentSelection.index, currentSelection.length, 'silent');
		}
		
		
		editor.disable();
	} catch (error) {
		console.error('Error applying variable styling:', error);
		
		editor.disable();
	}
};


export const applyVariableStylingToHTML = (text) => {
	try {
		const variableRegex = /\$\$([^$]+)\$\$/g;
		
		
		const styledText = text.replace(variableRegex, (match, word) => {
			return `<span style="background: #e3f2fd; color: #1976d2; font-weight: bold; padding: 2px 4px; border-radius: 3px;">${word}</span>`;
		});
		
		return styledText;
	} catch (error) {
		console.error('Error applying HTML variable styling:', error);
		return text; 
	}
};


export const initializeQuillEditor = (containerId, content, options = {}) => {
	setTimeout(() => {
		const editorContainer = document.getElementById(containerId);
		
		if (editorContainer && typeof Quill !== 'undefined') {
			const defaultOptions = {
				theme: 'snow',
				readOnly: true,
				modules: {
					toolbar: false
				}
			};

			const quillOptions = { ...defaultOptions, ...options };
			const quill = new Quill(editorContainer, quillOptions);
							
			quill.setText(content || '');
			
			// Apply variable styling
			setTimeout(() => {
				applyVariableStyling(quill);
				// Set pointer events after styling if read-only
				if (quillOptions.readOnly) {
					quill.root.style.pointerEvents = 'none';
				}
			}, 50);

			return quill;
		} else if (editorContainer) {
			
			const styledContent = applyVariableStylingToHTML(content || '');
			editorContainer.innerHTML = styledContent;
			editorContainer.style.padding = '12px';
			editorContainer.style.overflow = 'auto';
			editorContainer.style.backgroundColor = '#f9f9f9';
			
			return null; 
		}
	}, 100);
};


export const isQuillAvailable = () => {
	return typeof Quill !== 'undefined';
};


export const getVariableStyling = () => {
	return {
		background: '#e3f2fd',
		color: '#1976d2',
		bold: true
	};
};


export default {
	applyVariableStyling,
	applyVariableStylingToHTML,
	initializeQuillEditor,
	isQuillAvailable,
	getVariableStyling
};
