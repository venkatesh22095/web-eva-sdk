import cancelAdvanceSearch from "../../chat/cancelAdvanceSearch";
import SubmitGPTForm from "../../chat/gptTemplate/submitGPTForm";
import { getCurrentQuestion } from "../../utils/helpers";
import RemoveUploadedGPTFile from "../../chat/gptTemplate/removeUploadedGPTFile";
import DeleteGPTResponse from "../../chat/gptTemplate/deleteGPTResponse";
import AddAdditionalGPTResponse from "../../chat/gptTemplate/addAdditionalGPTResponse";
import GptFileUpload from "../../chat/gptTemplate/gptFileUpload";

const gptFormFunctionality = (formData, item) => {
	let contextField = formData?.contextFields?.[0];

	const cancelAction = (event) => {
		event.preventDefault();
		cancelAdvanceSearch(item?.reqId);
	};

	const removeUploadedFile = (event, id) => {
		event.preventDefault();
		RemoveUploadedGPTFile(event, id);
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
		delIconDiv.addEventListener("click", (event) => cancelAction(event));
	}

	if (contextField?.value?.canUploadFile) {
		const inputField = document.getElementById(
			`fileUpload-${contextField?.key}-${item?.messageId}`
		);
		inputField.addEventListener("change", (event) =>
			GptFileUpload(event, `${contextField?.key}-${item?.messageId}`)
		);

		const removeButton = document.getElementById(
			`removeButton-${contextField?.key}-${item?.messageId}`
		);
		removeButton.addEventListener("click", (event) =>
			removeUploadedFile(event, `${contextField?.key}-${item?.messageId}`)
		);
	}

	formData?.fieldValues?.forEach((parameters, index) => {
		parameters?.forEach((field, i) => {
			if (field?.value?.canUploadFile) {
				const inputField = document.getElementById(
					`fileUpload-${field?.key}-${item?.messageId}-${index}`
				);
				inputField.addEventListener("change", (event) =>
					GptFileUpload(event, `${field?.key}-${item?.messageId}-${index}`)
				);

				const removeButton = document.getElementById(
					`removeButton-${field?.key}-${item?.messageId}-${index}`
				);
				removeButton.addEventListener("click", (event) =>
					removeUploadedFile(event, `${field?.key}-${index}`)
				);
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
				deleteResponseButton.addEventListener("click", (event) =>
					deleteResponse(event, index)
				);
			}
		}
	});

	const cancelButton = document.getElementById(
		`discardAnswer-${item?.messageId}`
	);
	if (cancelButton) {
		cancelButton.addEventListener("click", (event) => cancelAction(event));
	}

	const submitButton = document.getElementById(
		`submitGptForm-${item?.messageId}`
	);
	if (submitButton && !submitButton?.eventListenerAdded) {
		submitButton.eventListenerAdded = true;
		submitButton.addEventListener("click", (event) =>
			submitAnswer(event, item)
		);
	}

	const addAdditionalResponseButton = document.getElementById(
		`addAdditionalResponse-${item?.messageId}`
	);
	if (addAdditionalResponseButton) {
		addAdditionalResponseButton.addEventListener("click", (event) =>
			addResponse(event)
		);
	}
};

export default gptFormFunctionality;
