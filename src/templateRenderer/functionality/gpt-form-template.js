import cancelAdvanceSearch from "../../chat/cancelAdvanceSearch";
import SubmitGPTForm from "../../chat/gptTemplate/submitGPTForm";
import { getCurrentQuestion } from "../../utils/helpers";
import RemoveUploadedGPTFile from "../../chat/gptTemplate/removeUploadedGPTFile";
import DeleteGPTResponse from "../../chat/gptTemplate/deleteGPTResponse";
import AddAdditionalGPTResponse from "../../chat/gptTemplate/addAdditionalGPTResponse";
import GptFileUpload from "../../chat/gptTemplate/gptFileUpload";
import { cloneDeep } from "lodash";
import store from "../../redux/store";

const gptFormFunctionality = (formData, item) => {
	let contextField = formData?.contextFields?.[0];
	let uploadedFiles = item?.filesUploaded;

	let uploadedFilesState = cloneDeep(store.getState().global.GptUploadedFiles);
	let contextFieldFileKey = `${contextField?.key}-${item?.messageId}`;
	let contextFieldFileDetails = uploadedFilesState?.[contextFieldFileKey];

	const cancelAction = (event) => {
		event.preventDefault();
		cancelAdvanceSearch(item?.reqId);
	};

	const removeUploadedFile = (event, id, questionId, index) => {
		event.preventDefault();
		RemoveUploadedGPTFile(event, id, null, questionId, index);
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
					removeUploadedFile(event, `${contextField?.key}-${item?.messageId}`, item?.id, index);
				});
			}

		});
	}

	if (contextField?.value?.canUploadFile) {
		const inputField = document.getElementById(
			`fileUpload-${contextField?.key}-${item?.messageId}`
		);
		if(inputField){
		inputField.addEventListener("change", (event) => {
			if (!inputField.eventListenerAdded) {
				inputField.eventListenerAdded = true;
					GptFileUpload(event, `${contextField?.key}-${item?.messageId}`, item?.id);
				}
			});
		}

	}

	formData?.fieldValues?.forEach((parameters, index) => {
		parameters?.forEach((field, i) => {
			//Checking if the field has uploaded files
			let parameterFileKey = `${field?.key}-${item?.messageId}-${index}`;
			let fileDetails = uploadedFilesState?.[parameterFileKey];
			let hasUploadedFiles = fileDetails && fileDetails?.length > 0;

			if (field?.value?.canUploadFile) {
				const inputField = document.getElementById(
					`fileUpload-${field?.key}-${item?.messageId}-${index}`
				);
				if(inputField){
				inputField.addEventListener("change", (event) => {
					if (!inputField.eventListenerAdded) {
						inputField.eventListenerAdded = true;
						GptFileUpload(event, `${field?.key}-${item?.messageId}-${index}`, item?.id);
						}
					});
				}

				if(hasUploadedFiles){
					const removeButton = document.getElementById(
						`removeButton-${field?.key}-${item?.messageId}-${index}`
					);
					if(removeButton && !removeButton.eventListenerAdded){
						removeButton.eventListenerAdded = true;
					removeButton.addEventListener("click", (event) => {
						removeUploadedFile(event, `${field?.key}-${item?.messageId}-${index}`, item?.id, index);
						});
					}
				}
			}

			if (field?.key === "prompt") {
				const textareaElement = document.getElementById(
					`inputValue-${field?.key}-${item?.messageId}-${index}`
				);
				textareaElement.value = field?.value?.default || "";
			}

			if (field?.value?.nested?.key === "prompt") {
				const textareaElement = document.getElementById(
					`inputValue-${field?.key}-${item?.messageId}-${index}`
				);

				const initialPromptValue = field?.value?.nested?.value;
				textareaElement.value = initialPromptValue || "";
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
};

export default gptFormFunctionality;
