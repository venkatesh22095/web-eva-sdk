import { cloneDeep, isEmpty } from "lodash";
import { getCurrentQuestion, getFileExtension } from "../../utils/helpers";
import UpdateGPTPromptValue from "../../chat/gptTemplate/updateGPTPromptValue";
import MultiResponse from "../../chat/gptTemplate/MultiResponse";
import gptFormFunctionality from "../functionality/gpt-form-template";
import store from "../../redux/store";
import { QuillEditor } from "../../components";
import { createDeleteIcon, Close, createExport, createCloseIcon, EllipsisVertical, ExportIcon, CheckCircle, ToastWarningIcon } from "../icons-library";

// Helper function to initialize Quill editor for a container
const initializeQuillForContainer = (container, field, item, promptDropdownWords, index) => {
	try {
		const quillEditor = new QuillEditor(container, {
			placeholder: field?.value?.placeholder || "Enter your prompt...",
			modules: {
				toolbar: false  // Completely disable the toolbar
			}
		});

		quillEditor.init();



		// Debounce timer for styling
		let styleTimeout;
		

		// Function to apply styling immediately (for dropdown insertions)
		const applyImmediateStyling = () => {
			try {
				const editor = quillEditor.getQuill();
				const text = editor.getText();
				const variableRegex = /\$\$([^$]+)\$\$/g;								

				// Store current selection
				const currentSelection = editor.getSelection();
				
				// Find and replace variables (remove $$ and style the word)
				const matches = [];
				let regexMatch;
				
				// Reset regex to find all matches
				variableRegex.lastIndex = 0;
				while ((regexMatch = variableRegex.exec(text)) !== null) {
					matches.push({
						index: regexMatch.index,
						length: regexMatch[0].length,
						fullText: regexMatch[0], // $$word$$
						wordOnly: regexMatch[1]  // word
					});
				}
				
				// Process matches in reverse order to maintain correct indices
				for (let i = matches.length - 1; i >= 0; i--) {
					const { index, length, wordOnly } = matches[i];										
					
					// Check if this text is already styled to avoid re-processing
					const existingFormat = editor.getFormat(index, wordOnly.length);
					const isAlreadyStyled = existingFormat.background === '#e3f2fd' && 
											existingFormat.color === '#1976d2' && 
											existingFormat.bold === true;
										
					
					// Only process if not already styled
					if (!isAlreadyStyled) {
						// Replace $$word$$ with word + unformatted space
						editor.deleteText(index, length, 'silent');
						editor.insertText(index, wordOnly + ' ', 'silent');
						
						// Style only the word part (not the space)
						editor.formatText(index, wordOnly.length, {
							'background': '#e3f2fd',
							'color': '#1976d2',
							'bold': true
						}, 'silent');
						
						// Ensure the space after is unformatted
						editor.formatText(index + wordOnly.length, 1, {
							'background': false,
							'color': false,
							'bold': false
						}, 'silent');
					}
				}

				// Restore selection
				if (currentSelection) {
					editor.setSelection(currentSelection.index, currentSelection.length, 'silent');
				}
			} catch (error) {
				console.error('Error applying immediate styling:', error);
			}
		};

		// Function to apply styling only when user stops typing
		const applyDelayedStyling = () => {
			// Clear any existing timeout
			if (styleTimeout) {
				clearTimeout(styleTimeout);
			}

			// Set a new timeout to apply styling after user stops typing
			styleTimeout = setTimeout(() => {
				applyImmediateStyling();
			}, 500); 
		};

		// Create dropdown for word selection
		const createWordDropdown = (x, y, editorContainer, insertCallback) => {
			// Remove any existing dropdown
			const existingAnchor = document.querySelector('.variable-dropdown-anchor');
			const existingPopup = document.querySelector('.variable-dropdown');
			if (existingAnchor) {
				existingAnchor.remove();
			}
			if (existingPopup) {
				existingPopup.remove();
			}

			// Create anchor element for positioning
			const anchor = document.createElement('div');
			anchor.className = 'variable-dropdown-anchor';
			anchor.style.cssText = `
				position: fixed;
				left: ${x}px;
				top: ${y}px;
				width: 1px;
				height: 1px;
				z-index: 9999;
				pointer-events: none;
			`;

			// Create Shoelace popup (better for precise positioning)
			const popup = document.createElement('sl-popup');
			popup.className = 'variable-dropdown';
			popup.setAttribute('placement', 'bottom-start');
			popup.setAttribute('auto-size', 'vertical');
			popup.setAttribute('flip', 'true');
			popup.setAttribute('shift', 'true');
			popup.style.cssText = `
				pointer-events: auto;
			`;

			// Create menu
			const menu = document.createElement('sl-menu');
			menu.style.cssText = `
				max-height: 180px;
				overflow-y: auto;
				min-width: 160px;
				background: white;
				border: 1px solid #ccc;
				border-radius: 6px;
				box-shadow: 0 8px 16px rgba(0,0,0,0.15);
			`;

			// Add menu label
			const menuLabel = document.createElement('sl-menu-label');
			menuLabel.textContent = 'Select Variable';
			menu.appendChild(menuLabel);

			// Add divider
			const divider = document.createElement('sl-divider');
			menu.appendChild(divider);

			// Create menu items
			promptDropdownWords.forEach(word => {
				const menuItem = document.createElement('sl-menu-item');
				menuItem.textContent = word;
				menuItem.setAttribute('value', word);
				
				// Add click handler
				menuItem.addEventListener('click', (e) => {
					e.stopPropagation();
					insertCallback(word);
					popup.active = false;
					setTimeout(() => {
						anchor.remove();
					}, 100);
				});

				menu.appendChild(menuItem);
			});

			// Add menu to popup
			popup.appendChild(menu);

			// Set anchor as the popup's anchor
			popup.anchor = anchor;

			// Add both to document body
			document.body.appendChild(anchor);
			document.body.appendChild(popup);

			// Open popup immediately
			setTimeout(() => {
				popup.active = true;
			}, 10);

			// Close popup when clicking outside
			const closePopup = (e) => {
				if (!popup.contains(e.target) && !anchor.contains(e.target)) {
					popup.active = false;
					setTimeout(() => {
						anchor.remove();
						popup.remove();
						document.removeEventListener('click', closePopup);
					}, 100);
				}
			};

			// Handle popup close event
			popup.addEventListener('sl-hide', () => {
				setTimeout(() => {
					anchor.remove();
					popup.remove();
					document.removeEventListener('click', closePopup);
				}, 100);
			});

			// Add close listener after a small delay to prevent immediate closing
			setTimeout(() => {
				document.addEventListener('click', closePopup);
			}, 100);

			return popup;
		};

		// Handle click in editor to show dropdown - direct click event approach
		const handleEditorClick = (event) => {			
			
			// Get editor and cursor position
			const editor = quillEditor.getQuill();
			
			// Small delay to ensure selection is updated
			setTimeout(() => {
				const selection = editor.getSelection();
				if (selection) {
					// Check if click is on a styled variable - if so, don't open dropdown
					if (selection.index > 0) {
						// Check the format at the current position
						const currentFormat = editor.getFormat(selection.index, 1);
						const previousFormat = editor.getFormat(selection.index - 1, 1);
						
						// Check if current position or previous position has variable styling
						const isOnStyledVariable = (currentFormat.background === '#e3f2fd' && 
													currentFormat.color === '#1976d2' && 
													currentFormat.bold === true) ||
												   (previousFormat.background === '#e3f2fd' && 
													previousFormat.color === '#1976d2' && 
													previousFormat.bold === true);
						
						if (isOnStyledVariable) {
							return; // Don't open dropdown on styled variables
						}
					}
					
					// Get the editor container for positioning
					const editorContainer = container; // The main container passed to this function
					const editorRect = editorContainer.getBoundingClientRect();
					const bounds = editor.getBounds(selection.index);
					
					// Calculate absolute position on the page
					const x = editorRect.left + bounds.left + 10; // Small offset from cursor
					const y = editorRect.top + bounds.top + bounds.height + 5; // Below the cursor line
					
					// Create dropdown with insert callback
					createWordDropdown(x, y, editorContainer, (selectedWord) => {
						// Insert the selected word wrapped in $$ (space will be added during styling)
						const wrappedWord = `$$${selectedWord}$$`;
						editor.insertText(selection.index, wrappedWord, 'user');
						
						// Position cursor after the inserted text
						editor.setSelection(selection.index + wrappedWord.length);
						
						// Apply styling immediately for the dropdown insertion
						setTimeout(() => {
							applyImmediateStyling();
						}, 10);
					});
				}
			}, 50);
		};

		// Function to clear formatting for new text after variables
		const clearFormattingForNewText = () => {
			const editor = quillEditor.getQuill();
			const selection = editor.getSelection();
			
			if (selection && selection.length === 0) {
				// Check if we're at the end of a formatted section
				const format = editor.getFormat(selection.index - 1, 1);
				if (format.background || format.color || format.bold) {
					// Clear formatting for the current position
					editor.format('background', false, 'silent');
					editor.format('color', false, 'silent');
					editor.format('bold', false, 'silent');
				}
			}
		};

		// Function to handle backspace for styled variables
		const handleBackspaceForVariables = (event) => {
			try {
				// Only handle Backspace key
				if (event.key !== 'Backspace') {
					return; // Let default behavior handle it
				}
				
				const editor = quillEditor.getQuill();
				if (!editor) {
					return; // Editor not ready
				}
				
				const selection = editor.getSelection();
				
				// Only handle when there's a cursor position (not a selection)
				if (!selection || selection.length > 0) {
					return; // Let default behavior handle it
				}
				
				const cursorIndex = selection.index;
				
				// Check if we're at the beginning of the document
				if (cursorIndex === 0) {
					return; // Let default behavior handle it
				}
				
				// Get the text and find all styled variables
				const text = editor.getText();
				const allFormats = editor.getContents()?.ops;
				
				if (!allFormats || !Array.isArray(allFormats)) {
					return; // No valid format data
				}
				
				// Find styled variable ranges
				const styledRanges = [];
				let currentIndex = 0;
				
				for (let op of allFormats) {
					if (op.insert && typeof op.insert === 'string') {
						const insertText = op.insert;
						const hasVariableStyle = op.attributes && 
							op.attributes.background === '#e3f2fd' && 
							op.attributes.color === '#1976d2' && 
							op.attributes.bold === true;
						
						if (hasVariableStyle) {
							// This is a styled variable
							styledRanges.push({
								start: currentIndex,
								end: currentIndex + insertText.length,
								text: insertText
							});
						}
						
						currentIndex += insertText.length;
					}
				}
				
				// Check if cursor is positioned to delete a styled variable
				for (let range of styledRanges) {
					// Check if cursor is right after this styled variable (including space)
					if (cursorIndex === range.end + 1) {
						// Delete the entire styled variable + space
						const deleteLength = range.end - range.start + 1; // +1 for the space
						editor.deleteText(range.start, deleteLength, 'user');
						editor.setSelection(range.start, 0, 'user');
						
						// Prevent default backspace behavior
						event.preventDefault();
						event.stopPropagation();
						return;
					}
					
					// Check if cursor is within or at the end of a styled variable
					if (cursorIndex > range.start && cursorIndex <= range.end) {
						// Delete the entire styled variable
						const deleteLength = range.end - range.start;
						editor.deleteText(range.start, deleteLength, 'user');
						editor.setSelection(range.start, 0, 'user');

						// Prevent default backspace behavior
						event.preventDefault();
						event.stopPropagation();
						return;
					}
				}
				
				// If we get here, let default behavior handle it
				return;
			} catch (error) {
				console.error('Error in handleBackspaceForVariables:', error);
				// On error, let default behavior handle it
				return;
			}
		};

		// Function to handle text input on styled variables
		const handleTextInput = (event) => {
			try {
				// Only handle printable characters (not special keys)
				if (event.key.length !== 1) {
					return; // Let default behavior handle it
				}
				
				const editor = quillEditor.getQuill();
				if (!editor) {
					return; // Editor not ready
				}
				
				const selection = editor.getSelection();
				
				// Only handle when there's a cursor position (not a selection)
				if (!selection || selection.length > 0) {
					return; // Let default behavior handle it
				}
				
				const cursorIndex = selection.index;
				
				// Check if we're typing within a styled variable
				const currentFormat = editor.getFormat(cursorIndex, 1);
				const previousFormat = cursorIndex > 0 ? editor.getFormat(cursorIndex - 1, 1) : {};
				
				const isWithinStyledVariable = (currentFormat.background === '#e3f2fd' && 
												currentFormat.color === '#1976d2' && 
												currentFormat.bold === true) ||
											   (previousFormat.background === '#e3f2fd' && 
												previousFormat.color === '#1976d2' && 
												previousFormat.bold === true);
				
				if (isWithinStyledVariable) {
					// Simply prevent any text input within styled variables
					// Styled variables should be immutable (only deletable with backspace)
					event.preventDefault();
					event.stopPropagation();
					return;
				}
				
				// If we get here, let default behavior handle it
				return;
			} catch (error) {
				console.error('Error in handleTextInput:', error);
				// On error, let default behavior handle it
				return;
			}
		};

		// Add click event listener to editor
		const editorRoot = quillEditor.getQuill().root;
		editorRoot.addEventListener('click', handleEditorClick);

		// Add keydown event listener to handle backspace for styled variables
		editorRoot.addEventListener('keydown', handleBackspaceForVariables);

		// Add keydown event listener to handle text input on styled variables
		editorRoot.addEventListener('keydown', handleTextInput);

		// Function to convert styled variables back to $$word$$ format
		const convertStyledToVariables = () => {
			try {
				const editor = quillEditor.getQuill();
				const text = editor.getText();
				const allFormats = editor.getContents()?.ops;
				
				if (!allFormats || !Array.isArray(allFormats)) {
					return text; // Return plain text if no format data
				}
				
				let result = '';
				let currentIndex = 0;
				
				for (let op of allFormats) {
					if (op.insert && typeof op.insert === 'string') {
						const insertText = op.insert;
						const hasVariableStyle = op.attributes && 
							op.attributes.background === '#e3f2fd' && 
							op.attributes.color === '#1976d2' && 
							op.attributes.bold === true;
						
						if (hasVariableStyle) {
							// Convert styled variable back to $$word$$ format
							result += `$$${insertText}$$`;
						} else {
							// Keep regular text as is
							result += insertText;
						}
					}
				}
				
				return result;
			} catch (error) {
				console.error('Error converting styled to variables:', error);
				return quillEditor.getText(); // Fallback to plain text
			}
		};

		//the below event listener is to listen to the changes made in editor
		quillEditor.on('textChange', (delta, oldDelta, source) => {
			const convertedContent = convertStyledToVariables();
			console.log(`Content changed in field: ${field?.key}`, {
				fieldKey: field?.key,
				itemId: item?.messageId,
				index: index,
				newContent: quillEditor.getText(),
				convertedContent: convertedContent,
				htmlContent: quillEditor.getContent('html'),
				source: source // 'user' or 'api'
			});
			
			// Apply delayed styling when user types
			if (source === 'user') {
				applyDelayedStyling();
				
				// Close any open popup when user starts typing
				const openPopup = document.querySelector('.variable-dropdown');
				const openAnchor = document.querySelector('.variable-dropdown-anchor');
				if (openPopup && openAnchor) {
					openPopup.active = false;
					setTimeout(() => {
						openAnchor.remove();
						openPopup.remove();
					}, 100);
				}
				
				// Clear formatting for new text after a short delay
				setTimeout(() => {
					clearFormattingForNewText();
				}, 10);
			}
		});
		
		// Set default value if available
		const defaultValue = field?.value?.default || field?.default || '';
		
		if (defaultValue) {
			setTimeout(() => {
				try {
					quillEditor.setText(defaultValue);
					// Apply styling to initial content after a delay
					setTimeout(() => {
						applyImmediateStyling();
					}, 500);
				} catch (error) {
					console.error('Error setting default value:', error);
				}
			}, 200);
		}

		// Handle read-only state
		if (field?.value?.readOnly) {
			quillEditor.enable(false);
		}

		// Store the editor instance
		container.quillEditor = quillEditor;
		container.setAttribute('data-quill-init', 'completed');
		
		return quillEditor;
	} catch (error) {
		console.error('Error initializing Quill editor:', error);
		container.setAttribute('data-quill-init', 'failed');
		return null;
	}
};

// initializeQuillWhenReady function removed - no longer needed

export function render(item) {
	// const { formData } = item;

	const formData = item?.gpt_forms;	
	let contextField = null;
	let fieldValues = [];
	if (!isEmpty(formData?.contextFields)) {
		contextField = formData?.contextFields?.[0];
	}

	let uploadedFileState = cloneDeep(store.getState().global.GptUploadedFiles);

	// preserving values
	const preservedValues = {};
		
	if (contextField) {
		const contextTextArea = document.getElementById(`inputValue-${contextField?.key}-${item?.messageId}`);
		if (contextTextArea && contextTextArea.value) {
			preservedValues[`inputValue-${contextField?.key}-${item?.messageId}`] = contextTextArea.value;
		}
		
		// Preserve contextField dropdown values
		const contextDropdownElement = document.getElementById(`dropdownValue-${contextField?.key}-${item?.messageId}`);
		if (contextDropdownElement && contextDropdownElement.value) {
			preservedValues[`dropdownValue-${contextField?.key}-${item?.messageId}`] = contextDropdownElement.value;
		}
	}
		
	if (!isEmpty(formData?.fieldValues)) {
		formData.fieldValues.forEach((parameters, index) => {
			parameters?.forEach((field, i) => {
				const fieldElement = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`);
				if (fieldElement) {					
					if (fieldElement.quillEditor) {
						// Quill editor
						preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`] = fieldElement.quillEditor.getText();
					} else if (fieldElement.value !== undefined) {
						// Regular textarea/input
						preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`] = fieldElement.value;
					}
				}
				
				const dropdownElement = document.getElementById(`dropdownValue-${field?.key}-${item?.messageId}-${index}`);
				if (dropdownElement && dropdownElement.value) {
					
					if (dropdownElement.hasAttribute('multiple')) {
						
						const multiValues = Array.isArray(dropdownElement.value) ? dropdownElement.value : [];
						preservedValues[`dropdownValue-${field?.key}-${item?.messageId}-${index}`] = multiValues;
					} else {
						
						preservedValues[`dropdownValue-${field?.key}-${item?.messageId}-${index}`] = dropdownElement.value;
					}
				}
			});
		});
	}

	if (!isEmpty(formData?.fieldValues)) {
		fieldValues = formData?.fieldValues;
	}

	const gptAgentDiv = document.createElement("div");
	gptAgentDiv.className = "gptAgentWrapper";

	const threadNameDiv = document.createElement("div");
	threadNameDiv.className = "threadName";
	threadNameDiv.textContent = item?.answer;
	gptAgentDiv.appendChild(threadNameDiv);

	const translateFormViewDiv = document.createElement("div");
	translateFormViewDiv.className = "translateForm-view";

	const tvHeaderDiv = document.createElement("div");
	tvHeaderDiv.className = "tvHeader";

	const leftNameDiv = document.createElement("div");
	leftNameDiv.className = "leftName";

	const imgBlockDiv = document.createElement("div");
	imgBlockDiv.className = "imgBlock";
	const imgElement = document.createElement("img");
	imgElement.src = item?.content?.formFields?.icon;
	imgElement.alt = "";
	imgElement.style.width = "50px";
	imgElement.style.height = "50px";
	imgBlockDiv.appendChild(imgElement);

	const ltTitleDiv = document.createElement("div");
	ltTitleDiv.className = "ltTitle";
	ltTitleDiv.textContent = item?.content?.formFields?.title;

	const delIconDiv = document.createElement("div");
	delIconDiv.id = `deleteAnswer-${item?.messageId}`;
	delIconDiv.innerHTML = Close({ size: 13, color: "#A3A3A3" });
	delIconDiv.className = "delIcon";
	leftNameDiv.appendChild(imgBlockDiv);
	leftNameDiv.appendChild(ltTitleDiv);
	leftNameDiv.appendChild(delIconDiv);
	tvHeaderDiv.appendChild(leftNameDiv);
	translateFormViewDiv.appendChild(tvHeaderDiv);

	const tvBodyDiv = document.createElement("div");
	tvBodyDiv.className = "tvBody";

	if (contextField) {
		const contextFieldWrapper = document.createElement("div");
		contextFieldWrapper.className = "contextFieldWrapper";

		const headerDiv = document.createElement("div");
		headerDiv.className = "contextFieldHeader";
		headerDiv.textContent = "Context";
		contextFieldWrapper.appendChild(headerDiv);

		const tvInputGroupDiv = document.createElement("div");
		tvInputGroupDiv.className = `tvInputGroup ${
			contextField?.value?.type
		} ${contextField?.value?.canUploadFile ? "uploadGrp" : ""}`;

		const grpInputDiv = document.createElement("div");
		grpInputDiv.className = "grpInput";

		let contextFieldFileKey = `${contextField?.key}-${item?.messageId}`;
		let fileDetails = uploadedFileState?.[contextFieldFileKey];
		
		if (
			contextField?.value?.type === "longText" ||
			contextField?.value?.type === "simpleText" ||
			contextField?.value?.type === "richText"
		) {
			const grpWrapDiv = document.createElement("div");
			grpWrapDiv.className = "grpwrap";

			const grpNameDiv = document.createElement("div");
			grpNameDiv.className = "grpName";

			const nameTitleDiv = document.createElement("div");
			nameTitleDiv.className = "nameTitle";
			nameTitleDiv.textContent = `${contextField?.label} ${
				contextField?.required || contextField?.value?.required
					? "*"
					: ""
			}`;
			grpNameDiv.appendChild(nameTitleDiv);
			grpWrapDiv.appendChild(grpNameDiv);
			grpInputDiv.appendChild(grpWrapDiv);

			if (contextField?.value?.canUploadFile) {
				const formFieldLongTextElement = document.createElement("div");
				formFieldLongTextElement.className = "formField LongText";
				const fileUploadLabel = document.createElement("label");
				fileUploadLabel.textContent = "Upload";
				fileUploadLabel.className = "fileUploadLabel";				
				formFieldLongTextElement.appendChild(fileUploadLabel);

				const inputField = document.createElement("input");
				/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
				if (contextField?.value?.allowMultipleFiles) {
					inputField.multiple = true;
				}
				inputField.type = "file";
				inputField.id = `fileUpload-${contextField?.key}-${item?.messageId}`;
				fileUploadLabel.appendChild(inputField);

				// Add upload limit message div
				const uploadLimitMessageDiv = document.createElement("div");
				uploadLimitMessageDiv.id = `upload-limit-message-${contextField?.key}-${item?.messageId}`;
				uploadLimitMessageDiv.className = "generic-common-error wa-dropdown-enter-anim";
				uploadLimitMessageDiv.style.display = "none";
				uploadLimitMessageDiv.innerHTML = `
					<div class='message-content'>
						<div class='copy-message-icon'>
							${ToastWarningIcon({ size: 46})}
							</div>
							<div class='copy-message-text warning-message'>
								<div class='copy-message-text-type'>Warning</div>
								<div class='copy-message-text-description'>Maximum 1 file can be selected</div>
							</div>
					</div>
					<div class='close-icon'>
						${Close({ size: 12, color: '#212121' })}
					</div>
				`;
				formFieldLongTextElement.appendChild(uploadLimitMessageDiv);

				grpWrapDiv.appendChild(formFieldLongTextElement);
			}

			const textareaElement = document.createElement("sl-textarea");
			textareaElement.id = `inputValue-${contextField?.key}-${item?.messageId}`;
			textareaElement.setAttribute('placeholder', contextField?.value?.placeholder || "Enter Text...");				
						
			const preservedValue = preservedValues[`inputValue-${contextField?.key}-${item?.messageId}`];
			textareaElement.setAttribute('value', preservedValue || contextField?.value?.default || "");
			grpInputDiv.appendChild(textareaElement);
		}

		else if (contextField?.value?.type === "file") 
		// 	{
			
		// 	// Create the browse-field wrapper
		// 	const browseFieldDiv = document.createElement("div");
		// 	browseFieldDiv.className = "browse-field";
			
		// 	// Create the browse-text-field container
		// 	const browseTextFieldDiv = document.createElement("div");
		// 	browseTextFieldDiv.className = "browse-text-field";
			
		// 	// Create upload icon span
		// 	const uploadIconSpan = document.createElement("span");
		// 	uploadIconSpan.className = "uploadIcon";
		// 	uploadIconSpan.innerHTML = createExport({ size: 20, color: '#667085' });
			
		// 	// Create text span
		// 	const textSpan = document.createElement("span");
		// 	textSpan.className = "text";
		// 	textSpan.textContent = "Drop files to attach or ";
			
		// 	// Create browse link span
		// 	const linkTextSpan = document.createElement("span");
		// 	linkTextSpan.className = "linkText";
		// 	linkTextSpan.textContent = "browse";
		// 	linkTextSpan.id = `browseLink-${contextField?.key}-${item?.messageId}`; 
		// 	linkTextSpan.style.cursor = "pointer";
		// 	linkTextSpan.style.color = "#667085";
		// 	linkTextSpan.style.textDecoration = "underline";
			
		// 	// Create hidden input field
		// 	const inputField = document.createElement("input");
		// 	inputField.type = "file";
		// 	/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
		// 	if (contextField?.value?.allowMultipleFiles) {
		// 		inputField.multiple = true;
		// 	}
		// 	inputField.id = `fileUpload-${contextField?.key}-${item?.messageId}`;
		// 	// Make input transparent and position it properly instead of display:none
		// 	inputField.style.display = "none";			
			
		// 	// Append elements to build the structure first
		// 	browseTextFieldDiv.appendChild(uploadIconSpan);
		// 	browseTextFieldDiv.appendChild(textSpan);
		// 	browseTextFieldDiv.appendChild(linkTextSpan);
		// 	browseTextFieldDiv.appendChild(inputField);
			
		// 	browseFieldDiv.appendChild(browseTextFieldDiv);
		// 	grpInputDiv.appendChild(browseFieldDiv);
			
		// 	const removeButton = document.createElement("button");
		// 	removeButton.textContent = "Remove";
		// 	removeButton.id = `removeButton-${contextField?.key}-${item?.messageId}`;
		// 	removeButton.style.display = "none";
		// 	grpInputDiv.appendChild(removeButton);
		// }
		{				
			const formFieldLongTextElement = document.createElement("div");
			formFieldLongTextElement.className = "formField file";

			const uploadIconSpan = document.createElement("span");
			uploadIconSpan.className = "uploadIcon";
			uploadIconSpan.innerHTML = createExport({ size: 20, color: '#667085' });
			formFieldLongTextElement.appendChild(uploadIconSpan);
			const fileUploadLabel = document.createElement("label");
			fileUploadLabel.textContent = "Drop files to attach or browse";
			fileUploadLabel.className = "fileUploadLabel";
			formFieldLongTextElement.appendChild(fileUploadLabel);

			const inputField = document.createElement("input");
			inputField.type = "file";
			/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
			if (contextField?.value?.allowMultipleFiles) {
				inputField.multiple = true;
			}
			inputField.id = `fileUpload-${contextField?.key}-${item?.messageId}`;
			fileUploadLabel.appendChild(inputField);				
			
			const grpWrapDiv = document.createElement("div");
			grpWrapDiv.className = "grpwrap";

			const grpNameDiv = document.createElement("div");
			grpNameDiv.className = "grpName";

			const nameTitleDiv = document.createElement("div");
			nameTitleDiv.className = "nameTitle";
			nameTitleDiv.textContent = `${contextField?.label} ${contextField?.required || contextField?.value?.required ? "*" : ""
				}`;
			grpNameDiv.appendChild(nameTitleDiv);
			grpWrapDiv.appendChild(grpNameDiv);	
			grpWrapDiv.appendChild(formFieldLongTextElement);			
			grpInputDiv.appendChild(grpWrapDiv);
			
		}

		else if(contextField?.value?.type === "dropdown"){
			/*add shoelace dropdown */
			const grpWrapDiv = document.createElement("div");
			grpWrapDiv.className = "grpwrap";
			const grpNameDiv = document.createElement("div");
			grpNameDiv.className = "grpName";
			const nameTitleDiv = document.createElement("div");
			nameTitleDiv.className = "nameTitle";
			nameTitleDiv.textContent = `${contextField?.label} ${contextField?.required || contextField?.value?.required ? "*" : ""}`;
			grpNameDiv.appendChild(nameTitleDiv);
			grpWrapDiv.appendChild(grpNameDiv);
			const dropdownElement = document.createElement("sl-select");
			dropdownElement.id = `dropdownValue-${contextField?.key}-${item?.messageId}`;
			dropdownElement.setAttribute("placeholder", contextField?.value?.placeholder || "Select an option");
			grpWrapDiv.appendChild(dropdownElement);
			grpInputDiv.appendChild(grpWrapDiv);
			if(contextField?.required || contextField?.value?.required){
				dropdownElement.setAttribute("required", "");
			}
			const dropDownChoices = contextField?.value?.choices || [];
			/*Create all options first*/
			dropDownChoices.forEach((choice, choiceIndex) => {
				const optionElement = document.createElement("sl-option");
				const optionValue = choice?.id || `option-${choiceIndex}`;
				optionElement.setAttribute("value", optionValue);
				optionElement.textContent = choice.label || choice.text || `Option ${choiceIndex + 1}`;
				dropdownElement.appendChild(optionElement);
			});
			
			/*Now set the value after options are created - if any dropdown choice has checked as true, set the value*/
			const checkedChoice = dropDownChoices.find((choice) => choice?.checked);
			if(checkedChoice){
				dropdownElement.value = checkedChoice?.id;
			}
			
			// Restore preserved dropdown value for contextField (this takes precedence)
			const preservedContextDropdownValue = preservedValues[`dropdownValue-${contextField?.key}-${item?.messageId}`];
			if (preservedContextDropdownValue) {
				dropdownElement.value = preservedContextDropdownValue;
			}
			grpInputDiv.appendChild(grpWrapDiv);

		}
		

		if (fileDetails && fileDetails?.length > 0) 		
		fileDetails?.forEach((file, index) => {
			/*if field has allowMultipleFiles as false, need to disable the upload button */
			if (!contextField?.value?.allowMultipleFiles) {
				const inputFieldToDisable = document.getElementById(`fileUpload-${contextField?.key}-${item?.messageId}`);
				if (inputFieldToDisable) {
					inputFieldToDisable.disabled = true;
				}
			}
			const contextFieldTextAreaDiv = document.getElementById(`inputValue-${contextField?.key}-${item?.messageId}`);
			if (contextFieldTextAreaDiv) {
				contextFieldTextAreaDiv.remove();
			}

			const uploadedFileDiv = document.createElement("div");
			uploadedFileDiv.className = "uploadedFileDetails";
			uploadedFileDiv.id = `uploadedFile-${contextField?.key}-${item?.messageId}-${index}`;

			const fileImageDiv = document.createElement("div");
			fileImageDiv.className = "fileImage";
			fileImageDiv.innerHTML = `<img src="images/${getFileExtension(file?.name || file?.fileName || '')}.png" alt="${file?.title}" />`;
			uploadedFileDiv.appendChild(fileImageDiv);

			const fileTitleDiv = document.createElement("div");
			fileTitleDiv.className = "fileTitle";
			fileTitleDiv.textContent = file?.title;
			const fileInfoDiv = document.createElement("div");
			fileInfoDiv.className = "fileInfo";
			fileInfoDiv.appendChild(fileTitleDiv);

			/*when file is in loading state, need to append a loading div */
			if (file?.loading) {
				const loadingFileDiv = document.createElement("div");
				loadingFileDiv.className = "loadingOverlay";
				loadingFileDiv.id = `loadingFile-${contextField?.key}-${item?.messageId}-${index}`;
				const waloaderDiv = document.createElement("div");
				waloaderDiv.className ="waloader";
				loadingFileDiv.appendChild(waloaderDiv)
				fileInfoDiv.appendChild(loadingFileDiv);
			}
			/*add file size div */
			const fileSizeDiv = document.createElement("div");
			fileSizeDiv.className = "fileSize";
			fileSizeDiv.textContent = (file?.size >= 1024 * 1024
				? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
				: `${(file.size / 1024).toFixed(2)} KB`
			);
			fileInfoDiv.appendChild(fileSizeDiv);
			uploadedFileDiv.appendChild(fileInfoDiv);
			/*add remove button */
			const removeButton = document.createElement("span");
			removeButton.innerHTML = createCloseIcon({ size: 10, color: '#A0A0AB' });
			removeButton.className = "closeIcon";
			removeButton.id = `removeButton-${contextField?.key}-${item?.messageId}-${index}`;
			uploadedFileDiv.appendChild(removeButton);

			// grpInputDiv.appendChild(uploadedFileDiv);
			/*add uploaded file wrapper */
			const uploadedFileWrapper = document.createElement("div");
			uploadedFileWrapper.className = "uploadedFileWrapper";
			uploadedFileWrapper.appendChild(uploadedFileDiv);
			grpInputDiv.appendChild(uploadedFileWrapper);

		});

		tvInputGroupDiv.appendChild(grpInputDiv);
		contextFieldWrapper.appendChild(tvInputGroupDiv);
		tvBodyDiv.appendChild(contextFieldWrapper);
	}

	formData?.fieldValues?.forEach((parameters, index) => {
		const responsesFieldWrapper = document.createElement("div");
		responsesFieldWrapper.className = "responsesFieldWrapper";

		const singleResponseWrapper = document.createElement("div");
		singleResponseWrapper.className = `response-wrapper response-${index}`;

		const responseHeaderWrapper = document.createElement("div");
		responseHeaderWrapper.className = "responseHeaderWrapper";

		const responseHeader = document.createElement("div");
		responseHeader.className = "responseHeader";
		responseHeader.textContent =
			formData?.fieldValues?.length > 1
				? `Response ${index + 1}`
				: "Response";
		responseHeaderWrapper.appendChild(responseHeader);

		if (index > 0) {
			const deleteResponse = document.createElement("div");
			deleteResponse.className = "deleteIcon";
			deleteResponse.innerHTML = Close({ size: 13, color: '##A3A3A3'});
			deleteResponse.id = `deleteResponse-${item?.messageId}-${index}`;
			responseHeaderWrapper.appendChild(deleteResponse);
		}
		singleResponseWrapper.appendChild(responseHeaderWrapper);
		parameters?.forEach((field, i) => {

			let parameterFileKey = `${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
			let fileDetails = uploadedFileState?.[parameterFileKey] || [];
			let hasUploadedFiles = fileDetails && fileDetails?.length > 0;
			let isLoading = item?.loadingFiles?.includes(parameterFileKey);

			let displayFieldTextArea = fileDetails?.length === 0 ;
		
			const tvInputGroupDiv = document.createElement("div");
			const formFieldLongTextElement = document.createElement("div");
			tvInputGroupDiv.className = `tvInputGroup ${field?.value?.type} ${
				field?.value?.canUploadFile ? "uploadGrp" : ""
			}`;
		
			const grpInputDiv = document.createElement("div");
			grpInputDiv.className = "grpInput";
			/*the below block prepares upload button for all the fields except file */
			if (field?.value?.canUploadFile && field?.value?.type !== "file" ) {				
				formFieldLongTextElement.className = "formField LongText";
				const fileUploadLabel = document.createElement("label");
				fileUploadLabel.textContent = "Upload";
				fileUploadLabel.className = "fileUploadLabel";
				formFieldLongTextElement.appendChild(fileUploadLabel);

				const inputField = document.createElement("input");
				inputField.type = "file";
				/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
				if (field?.value?.allowMultipleFiles) {
					inputField.multiple = true;
				}
				inputField.id = `fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
				fileUploadLabel.appendChild(inputField);

				const removeButton = document.createElement("button");
				removeButton.textContent = "Remove";
				removeButton.id = `removeButton-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
				removeButton.style.display = "none";
				formFieldLongTextElement.appendChild(removeButton);

				// Add upload limit message div
				const uploadLimitMessageDiv = document.createElement("div");
				uploadLimitMessageDiv.id = `upload-limit-message-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
				uploadLimitMessageDiv.className = "generic-common-error wa-dropdown-enter-anim";
				uploadLimitMessageDiv.style.display = "none";
				uploadLimitMessageDiv.innerHTML = `
					<div class='message-content'>
						<div class='copy-message-icon'>
							${ToastWarningIcon({ size: 46})}
							</div>
							<div class='copy-message-text warning-message'>
								<div class='copy-message-text-type'>Warning</div>
								<div class='copy-message-text-description'>Maximum 1 file can be selected</div>
							</div>
					</div>
					<div class='close-icon'>
						${Close({ size: 12, color: '#212121' })}
					</div>
				`;
				formFieldLongTextElement.appendChild(uploadLimitMessageDiv);

				// grpInputDiv.appendChild(formFieldLongTextElement);
			}											
			if (field?.value?.type === "richText" && field?.key === "content") {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);
				grpInputDiv.appendChild(grpWrapDiv);

				if (field?.value?.canUploadFile) {
					const formFieldLongTextElement =
					document.createElement("div");
					formFieldLongTextElement.className = "formField LongText";
					const fileUploadLabel = document.createElement("label");
					fileUploadLabel.textContent = "Upload";
					fileUploadLabel.className = "fileUploadLabel";
					formFieldLongTextElement.appendChild(fileUploadLabel);

					const inputField = document.createElement("input");
					inputField.type = "file";
					/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
					if (field?.value?.allowMultipleFiles) {
						inputField.multiple = true;
					}
					inputField.id = `fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
					fileUploadLabel.appendChild(inputField);

					const removeButton = document.createElement("button");
					removeButton.textContent = "Remove";
					removeButton.id = `removeButton-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
					removeButton.style.display = "none";
					formFieldLongTextElement.appendChild(removeButton);

					grpInputDiv.appendChild(formFieldLongTextElement);
				}

				const textareaElement = document.createElement("sl-textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.setAttribute("placeholder", field?.value?.placeholder || "Enter Text...");
				
				
				const preservedParamValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
				textareaElement.setAttribute('value', preservedParamValue || field?.value?.default || "");
				grpInputDiv.appendChild(textareaElement);
			}

			if (
				field?.value?.type === "longText" &&
				field?.key !== "prompts" &&
				field?.key !== "prompt"
			) {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);				
				grpWrapDiv.appendChild(formFieldLongTextElement);
				// }

				grpInputDiv.appendChild(grpWrapDiv);
				if(displayFieldTextArea){
				const textareaElement = document.createElement("sl-textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.setAttribute('placeholder', field?.value?.placeholder || "Enter Text...");					
									
				const preservedLongTextValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
				textareaElement.setAttribute('value', preservedLongTextValue || field?.value?.default || "");
				grpInputDiv.appendChild(textareaElement);
				}
			}

			if (field?.value?.type === "dropdown" && !field?.value?.multi) {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);

				const selectElement = document.createElement("sl-select");
				selectElement.id = `dropdownValue-${field?.key}-${item?.messageId}-${index}`;
				selectElement.placeholder = "Select an option";
				selectElement.clearable = true;
				if (field?.required || field?.value?.required) {
					selectElement.required = true;
				}

				// Add options for single dropdown
				const dropDownChoices = field?.value?.choices || [];
				let defaultSelectedValue = null;
				
				dropDownChoices.forEach((choice, choiceIndex) => {
					const optionElement = document.createElement("sl-option");
					// Ensure each option has a unique, non-empty value
					const optionValue = choice?.id || `option-${choiceIndex}`;
					/*shoelace option wont take space in value, so we are replacing them with % */
					optionElement.setAttribute('value', optionValue?.replaceAll(' ', '%'))
					optionElement.value = optionValue;
					optionElement.textContent = choice.label || choice.text || `Option ${choiceIndex + 1}`;
					
					// Determine default selected value for prompts field
					if (field?.key === "prompts" && (
						choice?.id === (field?.value?.nested?.id || choice?.selected) ? choice : null
					)) {
						defaultSelectedValue = optionValue;
					}
					
					selectElement.appendChild(optionElement);
				});
				
				// Set the default selected value after all options are added
				if (defaultSelectedValue) {
					selectElement.value = defaultSelectedValue;
				}else{
					selectElement.setAttribute('value', dropDownChoices[0]?.id?.replaceAll(' ', '%'));
				}

				// Add event listener for dropdown selection
				selectElement.addEventListener("sl-change", (event) => {
					// Check if this is a multi-select dropdown
					const isMultiSelect = event.target.hasAttribute('multiple');
					
					if (isMultiSelect) {
						// Handle multi-select dropdown
						const selectedValues = Array.isArray(event.target.value) ? event.target.value : [event.target.value];
						const selectedTexts = selectedValues.map(value => {
							const option = event.target.querySelector(`sl-option[value="${value}"]`);
							return option ? option.textContent : value;
						});
						
						
					
						
					} else {
						
						const selectedValue = event.target.value;
						const selectedOption = event.target.querySelector(`sl-option[value="${selectedValue}"]`);
						const selectedText = selectedOption ? selectedOption.textContent : '';
						
						if (field?.key === "prompts") {
							updateChoice(event, item, index);
						} else {
							
						}
					}
				});

				grpWrapDiv.appendChild(selectElement);
				grpInputDiv.appendChild(grpWrapDiv);
			}

			if (field?.value?.type === "dropdown" && field?.value?.multi) {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);

				const dropdownElement = document.createElement("sl-select");
				dropdownElement.id = `dropdownValue-${field?.key}-${item?.messageId}-${index}`;
				
				// Set multiple attribute properly for Shoelace
				dropdownElement.setAttribute('multiple', '');
				dropdownElement.setAttribute('placeholder', 'Select Multiple Options');
				
				if (field?.required || field?.value?.required) {
					dropdownElement.setAttribute('required', '');
				}

				// Add options for multi dropdown
				const dropDownChoices = field?.value?.choices || [];
				dropDownChoices.forEach((choice, choiceIndex) => {
					const optionElement = document.createElement("sl-option");
					// Ensure each option has a unique, non-empty value
					const optionValue = choice?.id || `option-${choiceIndex}`;
					optionElement.setAttribute('value', optionValue);
					optionElement.textContent = choice.label || choice.text || `Option ${choiceIndex + 1}`;
					dropdownElement.appendChild(optionElement);
				});

				
				const preservedMultiValues = preservedValues[`dropdownValue-${field?.key}-${item?.messageId}-${index}`];
				if (preservedMultiValues && Array.isArray(preservedMultiValues) && preservedMultiValues.length > 0) {										
					
					dropdownElement.value = preservedMultiValues;					
					
					preservedMultiValues.forEach(value => {
						const option = dropdownElement.querySelector(`sl-option[value="${value}"]`);
						if (option) {
							option.setAttribute('selected', '');
						}
					});
					
					
					dropdownElement.setAttribute('data-preserved-values', JSON.stringify(preservedMultiValues));
				}
				
				const updateDropdownVisibility = (dropdown, selectedValues) => {
					const allOptions = dropdown.querySelectorAll('sl-option');
					
					allOptions.forEach(option => {
						const optionValue = option.getAttribute('value');
						
						if (selectedValues.includes(optionValue)) {
							// Hide selected options
							option.style.display = 'none';
							option.setAttribute('hidden', '');
						} else {
							// Show unselected options
							option.style.display = '';
							option.removeAttribute('hidden');
						}
					});
				};

				// Add event listener for multi-select dropdown
				dropdownElement.addEventListener("sl-change", (event) => {
					const selectedValues = Array.isArray(event.target.value) ? event.target.value : [event.target.value].filter(Boolean);
					const selectedTexts = selectedValues.map(value => {
						const option = event.target.querySelector(`sl-option[value="${value}"]`);
						return option ? option.textContent : value;
					});
					
					console.log('Multi-select field changed:', field?.key);
					console.log('Selected values:', selectedValues);
					console.log('Selected texts:', selectedTexts);
					
					// Store the selected values for form submission
					event.target.setAttribute('data-selected-values', JSON.stringify(selectedValues));
					
					// Hide selected options from dropdown list
					updateDropdownVisibility(event.target, selectedValues);
				});

				grpWrapDiv.appendChild(dropdownElement);
				grpInputDiv.appendChild(grpWrapDiv);

				
				setTimeout(() => {
					const dropdown = document.getElementById(`dropdownValue-${field?.key}-${item?.messageId}-${index}`);
					if (dropdown) {
						
						if (!dropdown.hasAttribute('multiple')) {
							dropdown.setAttribute('multiple', '');
						}
						
						
						const currentValues = Array.isArray(dropdown.value) ? dropdown.value : [];
						if (currentValues.length > 0) {
							console.log('Hiding preserved selected options:', currentValues);
							updateDropdownVisibility(dropdown, currentValues);
						}
						

						const observer = new MutationObserver((mutations) => {
							mutations.forEach((mutation) => {
								if (mutation.type === 'childList' || mutation.type === 'attributes') {
									
									const currentValues = Array.isArray(dropdown.value) ? dropdown.value : [dropdown.value].filter(Boolean);
									updateDropdownVisibility(dropdown, currentValues);
								}
							});
						});
						
						observer.observe(dropdown, { 
							childList: true, 
							subtree: true, 
							attributes: true,
							attributeFilter: ['value']
						});
					}
				}, 100);
			}

			if (field?.key === "prompt") {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label || "Prompt"}${
					field?.required || field?.value?.required ? " *" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);

				const quillContainer = document.createElement("div");
				quillContainer.className = "eva-quill-editor promptId";
				quillContainer.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				
				grpWrapDiv.appendChild(quillContainer);
				grpInputDiv.appendChild(grpWrapDiv);

				// Store initialization status
				quillContainer.setAttribute('data-quill-init', 'pending');
				
				//create dropdown variables for the prompt editor
				let flatFields = Object.values(formData)?.map(field => Array.isArray(field) ? field?.flat() ?? field : [])?.flat();
				let promptDropdownWords = field?.variables?.map(variable => flatFields?.find(field => field?.key === variable)?.label);

				// Use a simple timeout approach since DOM isn't attached yet
				// This will run after the HTML is rendered to the page
				setTimeout(() => {
					const container = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`);
					if (container) {
						initializeQuillForContainer(container, field, item, promptDropdownWords, index);
					}
				}, 1500); 

				// Remove backup initialization to prevent double toolbar
			}

			if (field?.value?.nested?.key === "prompt") {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);

				const quillContainer = document.createElement("div");
				quillContainer.className = "eva-quill-editor promptId";
				quillContainer.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;

				grpWrapDiv.appendChild(quillContainer);
				grpInputDiv.appendChild(grpWrapDiv);

				// Initialize nested prompt with timeout approach 
				setTimeout(() => {
					const container = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`);
					if (container) {
						try {
							const quillEditor = new QuillEditor(container, {
								placeholder: field?.value?.placeholder || "Enter your prompt...",
								modules: {
									toolbar: false  // Completely disable the toolbar
								}
							});

							quillEditor.init();

							// Set initial content
							const initialPromptValue = formData?.fieldValues?.find(
								(field) => field?.key === "prompts"
							)?.value?.nested?.value?.values?.[0]?.value;
							const initialContent = field?.value?.default || initialPromptValue || "";
							
							if (initialContent) {
								setTimeout(() => {
									quillEditor.setText(initialContent);
								}, 200);
							}

							// Handle read-only state
							if (field?.value?.nested?.readOnly) {
								quillEditor.enable(false);
							}

							// Store the editor instance
							container.quillEditor = quillEditor;
							container.setAttribute('data-quill-init', 'completed');
						} catch (error) {
							console.error('Error initializing nested Quill editor:', error);
						}
					}
				}, 1500);
			}

			if (field?.value?.type === "simpleText") {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);
				grpWrapDiv.appendChild(formFieldLongTextElement);
				
				grpInputDiv.appendChild(grpWrapDiv);
				if(displayFieldTextArea){
				const textareaElement = document.createElement("sl-textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.setAttribute('placeholder', field?.value?.placeholder || "Enter Text...");
								
				const preservedSimpleTextValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
				textareaElement.setAttribute('value', preservedSimpleTextValue || field?.value?.default || "");
				grpInputDiv.appendChild(textareaElement);
				}
			}

			if (field?.value?.type === "number") {
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);
				
				grpInputDiv.appendChild(grpWrapDiv);

				const numberElement = document.createElement("sl-input");
				numberElement.setAttribute("type", "number");
				numberElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				numberElement.setAttribute('placeholder', field?.value?.placeholder || "Enter Number...");				
				
					
				const preservedNumberValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
				numberElement.setAttribute('value', preservedNumberValue || field?.value?.default || "");
				
				// Add additional number-specific attributes if needed
				if (field?.value?.min !== undefined) {
					numberElement.setAttribute("min", 0);
				}
				
				grpInputDiv.appendChild(numberElement);
			}
			/*need to revisit, as for the type file, we need to show upload bar only */
			if (field?.value?.type === "file") {				
				const formFieldLongTextElement = document.createElement("div");
				formFieldLongTextElement.className = "formField file";

								
				const fileUploadLabel = document.createElement("label");
				fileUploadLabel.innerHTML = `${ExportIcon({ size: 16, color: "#667085" })} Drop files to attach or <span class='browseText'>browse</span>`;
				fileUploadLabel.className = "fileUploadLabel";
				formFieldLongTextElement.appendChild(fileUploadLabel);

				const inputField = document.createElement("input");
				inputField.type = "file";
				/*if allowMultipleFiles is true, then we need to add multiple attribute to the input field*/
				if (field?.value?.allowMultipleFiles) {
					inputField.multiple = true;
				}
				inputField.id = `fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
				fileUploadLabel.appendChild(inputField);				
				
				const grpWrapDiv = document.createElement("div");
				grpWrapDiv.className = "grpwrap";

				const grpNameDiv = document.createElement("div");
				grpNameDiv.className = "grpName";

				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${field?.required || field?.value?.required ? "*" : ""
					}`;
				grpNameDiv.appendChild(nameTitleDiv);
				grpWrapDiv.appendChild(grpNameDiv);	
				grpWrapDiv.appendChild(formFieldLongTextElement);			
				grpInputDiv.appendChild(grpWrapDiv);
				
			}
			if (hasUploadedFiles || isLoading) {				
				fileDetails?.forEach((file, fileIndex) => {
					/*if field has allowMultipleFiles as false, need to disable the upload button */
					if (!field?.value?.allowMultipleFiles) {
						const inputFieldToDisable = document.getElementById(`fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`);
						if (inputFieldToDisable) {
							inputFieldToDisable.disabled = true;
						}
					}

					const uploadedFileDiv = document.createElement("div");
					uploadedFileDiv.className = "uploadedFileDetails";
					uploadedFileDiv.id = `uploadedFile-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}-${fileIndex}`;

					const fileImageDiv = document.createElement("div");
					fileImageDiv.className = "fileImage";
					fileImageDiv.innerHTML = `<img src="images/${getFileExtension(file?.name || file?.fileName || '')}.png" alt="${file?.title}" />`;
					uploadedFileDiv.appendChild(fileImageDiv);

					const fileTitleDiv = document.createElement("div");
					fileTitleDiv.className = "fileTitle";
					fileTitleDiv.textContent = file?.title;
					const fileInfoDiv = document.createElement("div");
					fileInfoDiv.className = "fileInfo";
					fileInfoDiv.appendChild(fileTitleDiv);

					/*when file is in loading state, need to append a loading div */
					if (file?.loading) {
						const loadingFileDiv = document.createElement("div");
						loadingFileDiv.className = "loadingOverlay";
						loadingFileDiv.id = `loadingFile-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}-${fileIndex}`;
						const waloaderDiv = document.createElement("div");
						waloaderDiv.className ="waloader";
						loadingFileDiv.appendChild(waloaderDiv)
						fileInfoDiv.appendChild(loadingFileDiv);
					}
					/*add file size div */
					const fileSizeDiv = document.createElement("div");
					fileSizeDiv.className = "fileSize";
					fileSizeDiv.textContent = (file?.size >= 1024 * 1024
						? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
						: `${(file.size / 1024).toFixed(2)} KB`
					);
					fileInfoDiv.appendChild(fileSizeDiv);
					uploadedFileDiv.appendChild(fileInfoDiv);
					/*add remove button */
					const removeButton = document.createElement("span");
					removeButton.innerHTML = createCloseIcon({ size: 10, color: '#A0A0AB' });
					removeButton.className = "closeIcon";
					removeButton.id = `removeButton-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}-${fileIndex}`;
					uploadedFileDiv.appendChild(removeButton);

					// grpInputDiv.appendChild(uploadedFileDiv);
					/*add uploaded file wrapper */
					const uploadedFileWrapper = document.createElement("div");
					uploadedFileWrapper.className = "uploadedFileWrapper";
					uploadedFileWrapper.appendChild(uploadedFileDiv);
					grpInputDiv.appendChild(uploadedFileWrapper);

				});

				// tvInputGroupDiv.appendChild(grpInputDiv);
				// singleResponseWrapper.appendChild(tvInputGroupDiv);


			}
			
			tvInputGroupDiv.appendChild(grpInputDiv);
			singleResponseWrapper.appendChild(tvInputGroupDiv);
		});
		responsesFieldWrapper.appendChild(singleResponseWrapper);
		tvBodyDiv.appendChild(responsesFieldWrapper);
	});

	const buttonWrapper = document.createElement("div");
	buttonWrapper.className = "buttonsGrp";

	const actionButtonsDiv = document.createElement("div");
	actionButtonsDiv.className = "action-buttons";

	const cancelButton = document.createElement("sl-button");
	cancelButton.className = "secondary-button";
	cancelButton.type = "button";
	cancelButton.textContent = "Cancel";
	cancelButton.id = `discardAnswer-${item?.messageId}`;
	actionButtonsDiv.appendChild(cancelButton);

	const submitButton = document.createElement("sl-button");
	submitButton.className = "primary-button-black";
	submitButton.type = "button";
	submitButton.textContent = item?.content?.formFields?.submitAction?.title;
	submitButton.setAttribute("variant", "primary");
	submitButton.id = `submitGptForm-${item?.messageId}`;		
	actionButtonsDiv.appendChild(submitButton);

	buttonWrapper.appendChild(actionButtonsDiv);

	if (item?.content?.allowMultiResponse) {
		const addResponseButton = document.createElement("sl-button");
		addResponseButton.className = "secondary-button";
		addResponseButton.type = "button";
		addResponseButton.id = `addAdditionalResponse-${item?.messageId}`;
		addResponseButton.textContent = "+ Add Response";
		buttonWrapper.appendChild(addResponseButton);
	}

	translateFormViewDiv.appendChild(tvBodyDiv);

	gptAgentDiv.appendChild(translateFormViewDiv);

	tvBodyDiv.appendChild(buttonWrapper);

	setTimeout(() => {
		gptFormFunctionality(formData, item, preservedValues);
	}, 1000);

	return gptAgentDiv.outerHTML;
}



const updateChoice = (event, item, index) => {
	const currentQsn = getCurrentQuestion(item);
	event.preventDefault();
	const updatedPromptValue = event?.target?.value;
	UpdateGPTPromptValue(currentQsn, index, updatedPromptValue, true);
};






// Utility function to get selected value from any dropdown
const getDropdownSelectedValue = (dropdownId) => {
	const selectElement = document.getElementById(dropdownId);
	if (selectElement) {
		return {
			value: selectElement.value,
			text: selectElement.selectedOptions[0]?.textContent || '',
			element: selectElement
		};
	}
	return null;
};

const observeDOMChanges = (obj) => {
	let { selector, isMulti, field, index, item, callback } = obj;
	const observer = new MutationObserver((mutationsList, observer) => {
		const element = document.querySelector(selector);
		if (element) {
			observer.disconnect(); // Stop observing once the element is found
			callback(element, isMulti, field, item, index);
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
};


export default { render };
