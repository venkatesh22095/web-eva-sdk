import cancelAdvanceSearch from "../../chat/cancelAdvanceSearch";
import SubmitGPTForm from "../../chat/gptTemplate/submitGPTForm";
import { getCurrentQuestion } from "../../utils/helpers";
import RemoveUploadedGPTFile from "../../chat/gptTemplate/removeUploadedGPTFile";
import DeleteGPTResponse from "../../chat/gptTemplate/deleteGPTResponse";
import AddAdditionalGPTResponse from "../../chat/gptTemplate/addAdditionalGPTResponse";
import GptFileUpload from "../../chat/gptTemplate/gptFileUpload";
import { cloneDeep } from "lodash";
import store from "../../redux/store";
import toast from "../../utils/toast";

const gptFormFunctionality = (formData, item, preservedValues = {}) => {
	let contextField = formData?.contextFields?.[0];
	let uploadedFiles = item?.filesUploaded;

	let uploadedFilesState = cloneDeep(store.getState().global.GptUploadedFiles);
	let contextFieldFileKey = `${contextField?.key}-${item?.messageId}`;
	let contextFieldFileDetails = uploadedFilesState?.[contextFieldFileKey];

	const cancelAction = (event) => {
		event.preventDefault();
		cancelAdvanceSearch(item?.reqId);
	};

	const removeUploadedFile = (event, id, questionId, fileMediaName) => {
		event.preventDefault();
		RemoveUploadedGPTFile(event, id, questionId, fileMediaName);
	};

	const addResponse = (event) => {
		event.preventDefault();
		const currentQsn = getCurrentQuestion(item);
		AddAdditionalGPTResponse(currentQsn, true);
	};

	const deleteResponse = (event, index) => {
		event.preventDefault();
		const currentQsn = getCurrentQuestion(item);
		DeleteGPTResponse(currentQsn, index, true);
	};

	const submitAnswer = (event, item) => {
		event.preventDefault();
		const currentQsn = getCurrentQuestion(item);
		SubmitGPTForm(event, currentQsn);
	};

	const delIconDiv = document.getElementById(`deleteAnswer-${item?.messageId}`);
	if (delIconDiv) {
		delIconDiv.addEventListener("click", (event) => {
			if (!delIconDiv.eventListenerAdded) {
				delIconDiv.eventListenerAdded = true;
				cancelAction(event);
			}
		});
	}

	if(contextFieldFileDetails && contextFieldFileDetails?.length > 0){

		contextFieldFileDetails?.forEach((file, index) => {
			const removeButton = document.getElementById(
				`removeButton-${contextField?.key}-${item?.messageId}-${index}`
			);
			if(removeButton && !removeButton.eventListenerAdded){
				removeButton.eventListenerAdded = true;
				removeButton.addEventListener("click", (event) => {
					removeUploadedFile(event, `${contextField?.key}-${item?.messageId}`, item?.reqId, file?.mediaName);
				});
			}

		});
	}

	if (contextField?.value?.canUploadFile) {
		const inputField = document.getElementById(
			`fileUpload-${contextField?.key}-${item?.messageId}`
		);

		const browseField = document.getElementById(
			`browseLink-${contextField?.key}-${item?.messageId}`
		);
		if(browseField && !browseField.eventListenerAdded){
			browseField.eventListenerAdded = true;
			browseField.addEventListener("click", (event) => {
				event.preventDefault();				
				document.getElementById(`fileUpload-${contextField?.key}-${item?.messageId}`)?.click();
			});
		}
		if(inputField && !inputField.eventListenerAdded){
			inputField.eventListenerAdded = true;
			inputField.addEventListener("change", (event) => {
				const questionId = item?.isTask ? item?.cId : item?.reqId;
				GptFileUpload(event, `${contextField?.key}-${item?.messageId}`, questionId);				
				setTimeout(() => {
					const submitButton = document.getElementById(`submitGptForm-${item?.messageId}`);
					if (submitButton) {
						const isContextFieldValid = checkContextField(formData?.contextFields?.[0], item?.messageId);
						const isParamFieldsValid = checkParamFields(formData?.fieldValues, item?.messageId);
						const isFormValid = isContextFieldValid && isParamFieldsValid;
						
						if (isFormValid) {
							submitButton.removeAttribute("disabled");
						} else {
							submitButton.setAttribute("disabled", "");
						}
					}
				}, 500); 
			});
		}

		// Add click listener for disabled context field upload inputs to show toast
		if (contextField?.value?.canUploadFile && !contextField?.value?.allowMultipleFiles) {
			const contextInputField = document.getElementById(
				`fileUpload-${contextField?.key}-${item?.messageId}`
			);
			
			if (contextInputField && !contextInputField.disabledClickListenerAdded) {
				contextInputField.disabledClickListenerAdded = true;
				
				// Check if the context field has uploaded files to determine if input should be disabled
				setTimeout(() => {
					const contextFileKey = `${contextField?.key}-${item?.messageId}`;
					const contextFileDetails = uploadedFilesState?.[contextFileKey];
					const hasContextFiles = contextFileDetails && contextFileDetails?.length > 0;
					
					if (hasContextFiles) {
						contextInputField.disabled = true;
					}
					
					// Listen on parent label to catch both label and input clicks
					const parentLabel = contextInputField.closest('label');
					if (parentLabel && !parentLabel.disabledClickListenerAdded) {
						parentLabel.disabledClickListenerAdded = true;
						parentLabel.addEventListener("click", (event) => {
							if (contextInputField.disabled) {
								event.preventDefault();
								event.stopPropagation();
								
								// Show warning message div
								const messageDiv = document.getElementById(`upload-limit-message-${contextField?.key}-${item?.messageId}`);
								if (messageDiv) {
									messageDiv.style.display = 'flex';
									
									// Hide the message div after 3 seconds
									setTimeout(() => {
										messageDiv.style.display = 'none';
									}, 3000);
								}
							}
						});
					}
				}, 100); 
			}
		}

	}

	// Handle contextField dropdown functionality
	if (contextField?.value?.type === "dropdown") {
		const contextDropdownElement = document.getElementById(`dropdownValue-${contextField?.key}-${item?.messageId}`);
		if (contextDropdownElement && !contextDropdownElement.eventListenerAdded) {
			contextDropdownElement.eventListenerAdded = true;
			
			// Initialize context dropdown value with checked items
			setTimeout(() => {
				const contextDropDownChoices = contextField?.value?.choices || [];
				const preservedContextDropdownValue = preservedValues[`dropdownValue-${contextField?.key}-${item?.messageId}`];
				
				if (!preservedContextDropdownValue && contextDropdownElement?.value.length === 0) {
					const checkedChoice = contextDropDownChoices.find(choice => choice?.checked);
					if (checkedChoice) {
						const optionValue = checkedChoice?.id || checkedChoice?.value;
						contextDropdownElement.value = optionValue;
					}
				}
			}, 100);
			
			contextDropdownElement.addEventListener("sl-change", (event) => {
				console.log('Context field dropdown changed:', contextField?.key, 'New value:', event.target.value);
				
				// Trigger validation after dropdown change
				setTimeout(() => {
					const submitButton = document.getElementById(`submitGptForm-${item?.messageId}`);
					if (submitButton) {
						const isContextFieldValid = checkContextField(formData?.contextFields?.[0], item?.messageId);
						const isParamFieldsValid = checkParamFields(formData?.fieldValues, item?.messageId);
						const isFormValid = isContextFieldValid && isParamFieldsValid;
						
						if (isFormValid) {
							submitButton.removeAttribute("disabled");
						} else {
							submitButton.setAttribute("disabled", "");
						}
					}
				}, 100);
			});
		}
	}

	formData?.fieldValues?.forEach((parameters, index) => {
		parameters?.forEach((field, i) => {
			//Checking if the field has uploaded files
			let parameterFileKey = `${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`;
			let fileDetails = uploadedFilesState?.[parameterFileKey];
			let hasUploadedFiles = fileDetails && fileDetails?.length > 0;

			if (field?.value?.canUploadFile) {
				const inputField = document.getElementById(
					`fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`
				);
				if(inputField && !inputField.eventListenerAdded){
					inputField.eventListenerAdded = true;
					inputField.addEventListener("change", (event) => {
						const questionId = item?.isTask ? item?.cId : item?.reqId;
						GptFileUpload(event, `${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`, questionId);						
						setTimeout(() => {
							const submitButton = document.getElementById(`submitGptForm-${item?.messageId}`);
							if (submitButton) {
								const isContextFieldValid = checkContextField(formData?.contextFields?.[0], item?.messageId);
								const isParamFieldsValid = checkParamFields(formData?.fieldValues, item?.messageId);
								const isFormValid = isContextFieldValid && isParamFieldsValid;
								
								if (isFormValid) {
									submitButton.removeAttribute("disabled");
								} else {
									submitButton.setAttribute("disabled", "");
								}
							}
						}, 500); 
					});
				}

				if(hasUploadedFiles){
					fileDetails?.forEach((file, fileIndex) => {
				const removeButton = document.getElementById(
							`removeButton-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}-${fileIndex}`
						);
						if(removeButton && !removeButton.eventListenerAdded){
							removeButton.eventListenerAdded = true;
							removeButton.addEventListener("click", (event) => {
								const questionId = item?.isTask ? item?.cId : item?.reqId;
								removeUploadedFile(event, `${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`, questionId, file?.mediaName);
								
								setTimeout(() => {
									const submitButton = document.getElementById(`submitGptForm-${item?.messageId}`);
									if (submitButton) {
										const isContextFieldValid = checkContextField(formData?.contextFields?.[0], item?.messageId);
										const isParamFieldsValid = checkParamFields(formData?.fieldValues, item?.messageId);
										const isFormValid = isContextFieldValid && isParamFieldsValid;
										
										if (isFormValid) {
											submitButton.removeAttribute("disabled");
										} else {
											submitButton.setAttribute("disabled", "");
										}
									}
								}, 500); 
							});
						}
					});
				}
			}

			// Add click listener for disabled upload inputs to show toast
			if (field?.value?.canUploadFile && !field?.value?.allowMultipleFiles) {
				const inputField = document.getElementById(
					`fileUpload-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`
				);
				
				if (inputField && !inputField.disabledClickListenerAdded) {
					inputField.disabledClickListenerAdded = true;
					
					// Listen on parent label to catch both label and input clicks
					const parentLabel = inputField.closest('label');
					if (parentLabel && !parentLabel.disabledClickListenerAdded) {
						parentLabel.disabledClickListenerAdded = true;
						parentLabel.addEventListener("click", (event) => {
						if (inputField.disabled) {
							event.preventDefault();
							event.stopPropagation();
							
							// Show warning message div
							const messageDiv = document.getElementById(`upload-limit-message-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`);
							if (messageDiv) {
								messageDiv.style.display = 'flex';
								
								// Hide the message div after 3 seconds
								setTimeout(() => {
									messageDiv.style.display = 'none';
								}, 3000);
							}
							}
						});
					}
				}
			}

			if (field?.key === "prompt") {
				const quillContainer = document.getElementById(
					`inputValue-${field?.key}-${item?.messageId}-${index}`
				);
				
				// Wait for Quill editor to be initialized
				setTimeout(() => {
					if (quillContainer && quillContainer.quillEditor) {
						
						const preservedQuillValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
						const defaultValue = field?.value?.default || "";
						const valueToSet = preservedQuillValue || defaultValue;
						
						if (valueToSet) {
							quillContainer.quillEditor.setContent(valueToSet, 'text');
						}
					}
				}, 200);
			}

			if (field?.value?.nested?.key === "prompt") {
				const quillContainer = document.getElementById(
					`inputValue-${field?.key}-${item?.messageId}-${index}`
				);

				// Wait for Quill editor to be initialized
				setTimeout(() => {
					if (quillContainer && quillContainer.quillEditor) {
						
						const preservedNestedQuillValue = preservedValues[`inputValue-${field?.key}-${item?.messageId}-${index}`];
						const initialPromptValue = field?.value?.nested?.value || "";
						const valueToSet = preservedNestedQuillValue || initialPromptValue;
						
						if (valueToSet) {
							quillContainer.quillEditor.setContent(valueToSet, 'text');
						}
					}
				}, 200);
			}
		});
		if (index > 0) {
			const deleteResponseButton = document.getElementById(
				`deleteResponse-${item?.messageId}-${index}`
			);
			if (deleteResponseButton) {
				deleteResponseButton.addEventListener("click", (event) => {
					if (!deleteResponseButton.eventListenerAdded) {
						deleteResponseButton.eventListenerAdded = true;
						deleteResponse(event, index);
					}
				});
			}
		}
	});

	const cancelButton = document.getElementById(
		`discardAnswer-${item?.messageId}`
	);
	if (cancelButton) {
		cancelButton.addEventListener("click", (event) => {
			if (!cancelButton.eventListenerAdded) {
				cancelButton.eventListenerAdded = true;
				cancelAction(event);
			}
		});
	}

	const submitButton = document.getElementById(
		`submitGptForm-${item?.messageId}`
	);
	if (submitButton && !submitButton?.eventListenerAdded) {
		submitButton.eventListenerAdded = true;
		submitButton.addEventListener("click", (event) => {
			submitAnswer(event, item);
		});
	}

	const addAdditionalResponseButton = document.getElementById(
		`addAdditionalResponse-${item?.messageId}`
	);
	if (addAdditionalResponseButton) {
		addAdditionalResponseButton.addEventListener("click", (event) => {
			if (!addAdditionalResponseButton.eventListenerAdded) {
				addAdditionalResponseButton.eventListenerAdded = true;
				addResponse(event);
			}
		});
	}

	// CLOSE ICON FUNCTIONALITY FOR UPLOAD LIMIT MESSAGES
	// Add close functionality for context field upload limit message
	if (contextField?.value?.canUploadFile && !contextField?.value?.allowMultipleFiles) {
		const contextCloseIcon = document.querySelector(`#upload-limit-message-${contextField?.key}-${item?.messageId} .close-icon`);
		if (contextCloseIcon && !contextCloseIcon.eventListenerAdded) {
			contextCloseIcon.eventListenerAdded = true;
			contextCloseIcon.addEventListener("click", () => {
				const messageDiv = document.getElementById(`upload-limit-message-${contextField?.key}-${item?.messageId}`);
				if (messageDiv) {
					messageDiv.style.display = 'none';
				}
			});
		}
	}

	// Add close functionality for parameter field upload limit messages
	formData?.fieldValues?.forEach((parameters, index) => {
		parameters?.forEach((field, i) => {
			if (field?.value?.canUploadFile && !field?.value?.allowMultipleFiles) {
				const paramCloseIcon = document.querySelector(`#upload-limit-message-${field?.key}-${item?.messageId}-${field?.uniqueFieldId} .close-icon`);
				if (paramCloseIcon && !paramCloseIcon.eventListenerAdded) {
					paramCloseIcon.eventListenerAdded = true;
					paramCloseIcon.addEventListener("click", () => {
						const messageDiv = document.getElementById(`upload-limit-message-${field?.key}-${item?.messageId}-${field?.uniqueFieldId}`);
						if (messageDiv) {
							messageDiv.style.display = 'none';
						}
					});
				}
			}
		});
	});

	// SUBMIT BUTTON VALIDATION
	setupRealTimeValidation(formData, item);
};


const setupRealTimeValidation = (formData, item) => {
	const submitButton = document.getElementById(`submitGptForm-${item?.messageId}`);
	if (!submitButton) return;
	
	const updateSubmitButtonState = () => {		
		const isContextFieldValid = checkContextField(formData?.contextFields?.[0], item?.messageId);
		const isParamFieldsValid = checkParamFields(formData?.fieldValues, item?.messageId);
		const isFormValid = isContextFieldValid && isParamFieldsValid;

		if (isFormValid) {
			submitButton.removeAttribute("disabled");
		} else {
			submitButton.setAttribute("disabled", "");
		}
	};

	// CONTEXT FIELD VALIDATION
	if (formData?.contextFields?.[0]) {
		const contextField = formData.contextFields[0];
		
		// Handle dropdown type context field
		if (contextField.value?.type === "dropdown") {
			const contextDropdownElement = document.getElementById(`dropdownValue-${contextField?.key}-${item?.messageId}`);
			if (contextDropdownElement && !contextDropdownElement.validationListenerAdded) {
				contextDropdownElement.validationListenerAdded = true;
				contextDropdownElement.addEventListener("sl-change", updateSubmitButtonState);
			}
		} else {
			// Handle text-based context fields
			const contextTextArea = document.getElementById(`inputValue-${contextField?.key}-${item?.messageId}`);
			if (contextTextArea && !contextTextArea.validationListenerAdded) {
				contextTextArea.validationListenerAdded = true;
				
				// Add input event listener for real-time validation
				contextTextArea.addEventListener("input", updateSubmitButtonState);
				contextTextArea.addEventListener("change", updateSubmitButtonState);
			}
		}
	}

	// PARAMETER FIELDS VALIDATION
	if (formData?.fieldValues) {
		formData.fieldValues.forEach((parameters, index) => {
			parameters?.forEach((field, i) => {
				const fieldElement = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`);
				if (fieldElement && !fieldElement.validationListenerAdded) {
					fieldElement.validationListenerAdded = true;
										
					fieldElement.addEventListener("input", updateSubmitButtonState);
					fieldElement.addEventListener("change", updateSubmitButtonState);
										
					setTimeout(() => {
						if (fieldElement.quillEditor) {
							fieldElement.quillEditor.on('text-change', updateSubmitButtonState);
						}
					}, 200);
				}
				
				const dropdownElement = document.getElementById(`dropdownValue-${field?.key}-${item?.messageId}-${index}`);
				if (dropdownElement && !dropdownElement.validationListenerAdded) {
					dropdownElement.validationListenerAdded = true;
					dropdownElement.addEventListener("sl-change", updateSubmitButtonState);
				}
			});
		});
	}

	
	updateSubmitButtonState();
};


const checkContextField = (contextField, messageId) => {
	if (!contextField || !contextField.value.required) return true;
	
	// Handle dropdown type context field
	if (contextField.value?.type === "dropdown") {
		const contextDropdownElement = document.getElementById(`dropdownValue-${contextField?.key}-${messageId}`);
		if (contextDropdownElement) {
			const selectedValue = contextDropdownElement.value;
			return selectedValue && selectedValue.trim().length > 0;
		}
		return false;
	}
	
	if (contextField.value?.canUploadFile) {
		const uploadedFilesState = cloneDeep(store.getState().global.GptUploadedFiles);
		const contextFieldFileKey = `${contextField?.key}-${messageId}`;
		const fileDetails = uploadedFilesState?.[contextFieldFileKey]?.filter(file => !file?.loading) || [];
		
		if (contextField.value?.type === "file") {
			return fileDetails?.length > 0;
		} else {
			const contextTextArea = document.getElementById(`inputValue-${contextField?.key}-${messageId}`);
			const hasText = contextTextArea?.value?.trim()?.length > 0;
			return hasText || fileDetails.length > 0;
		}
	} else {
		const contextTextArea = document.getElementById(`inputValue-${contextField?.key}-${messageId}`);
		return contextTextArea?.value?.trim()?.length > 0;
	}
};


const checkParamFields = (paramFields, messageId) => {
	if (!paramFields) return true;
	
	const uploadedFilesState = cloneDeep(store.getState().global.GptUploadedFiles);
	
	for (let OuterIndex=0; OuterIndex < paramFields.length; OuterIndex++) {
		const parameters = paramFields[OuterIndex];
		for (const [index, field] of parameters.entries()) {
			if (field?.value?.required) {
				if (field?.value?.canUploadFile) {
					const paramFieldKey = `${field?.key}-${messageId}-${field?.uniqueFieldId}`;
					const paramFieldFileDetails = uploadedFilesState?.[paramFieldKey]?.filter(file => !file?.loading) || [];
					
					if (field?.value?.type === "file") {
						if (paramFieldFileDetails.length === 0) return false;
					} else {
						const paramFieldDiv = document.getElementById(`inputValue-${field?.key}-${messageId}-${OuterIndex}`);
						const hasText = paramFieldDiv?.value?.trim()?.length > 0;
						if (!hasText && paramFieldFileDetails.length === 0) return false;
					}
				} else {
					if(field?.value?.type === "dropdown"){
						const paramFieldDiv = document.getElementById(`dropdownValue-${field?.key}-${messageId}-${OuterIndex}`);
						if (paramFieldDiv?.hasAttribute('multiple')) {
							const currentValues = Array.isArray(paramFieldDiv.value) ? paramFieldDiv.value : [];
							if (currentValues.length === 0) return false;
						} else {
							const selectedValue = paramFieldDiv?.value;
							if (!selectedValue || selectedValue.trim().length === 0) return false;
						}			
					} else {
						const paramFieldDiv = document.getElementById(`inputValue-${field?.key}-${messageId}-${OuterIndex}`);
						if (!paramFieldDiv?.value?.trim()?.length) return false;
					}
				}
			}
		}
	}
	return true;
};

export default gptFormFunctionality;
