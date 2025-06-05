import { isEmpty } from "lodash";
import { getCurrentQuestion } from "../../utils/helpers";
import UpdateGPTPromptValue from "../../chat/gptTemplate/updateGPTPromptValue";
import Choices from "choices.js";
import MultiResponse from "../../chat/gptTemplate/MultiResponse";
import gptFormFunctionality from "../functionality/gpt-form-template";

export function render(item) {
	// const { formData } = item;

	const formData = MultiResponse().getInitialFormData(item);
	let contextField = null;
	let fieldValues = [];
	if (!isEmpty(formData?.contextFields)) {
		contextField = formData?.contextFields?.[0];
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

	const delIconDiv = document.createElement("button");
	delIconDiv.id = `deleteAnswer-${item?.messageId}`;
	delIconDiv.className = "delIcon";
	delIconDiv.textContent = "Delete";
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
				formFieldLongTextElement.appendChild(fileUploadLabel);

				const inputField = document.createElement("input");
				inputField.type = "file";
				inputField.id = `fileUpload-${contextField?.key}-${item?.messageId}`;
				formFieldLongTextElement.appendChild(inputField);

				const removeButton = document.createElement("button");
				removeButton.textContent = "Remove";
				removeButton.id = `removeButton-${contextField?.key}-${item?.messageId}`;
				removeButton.style.display = "none";
				formFieldLongTextElement.appendChild(removeButton);

				grpInputDiv.appendChild(formFieldLongTextElement);
			}

			const textareaElement = document.createElement("textarea");
			textareaElement.id = `inputValue-${contextField?.key}-${item?.messageId}`;
			textareaElement.placeholder =
				contextField?.value?.placeholder || "Enter Text...";
			textareaElement.textContent = contextField?.value?.default || "";
			grpInputDiv.appendChild(textareaElement);
		}

		if (contextField?.value?.type === "file") {
			const inputField = document.createElement("input");
			inputField.type = "file";
			inputField.id = `fileUpload-${contextField?.key}-${item?.messageId}`;
			grpInputDiv.appendChild(inputField);

			const removeButton = document.createElement("button");
			removeButton.textContent = "Remove";
			removeButton.id = `removeButton-${contextField?.key}-${item?.messageId}`;
			removeButton.style.display = "none";
			grpInputDiv.appendChild(removeButton);
		}

		tvInputGroupDiv.appendChild(grpInputDiv);
		contextFieldWrapper.appendChild(tvInputGroupDiv);
		tvBodyDiv.appendChild(contextFieldWrapper);
	}

	formData?.fieldValues?.forEach((parameters, index) => {
		const responsesFieldWrapper = document.createElement("div");
		responsesFieldWrapper.className = "responsesFieldWrapper";

		const singleResponseWrapper = document.createElement("div");
		singleResponseWrapper.className = `response-${index}`;

		const responseHeader = document.createElement("div");
		responseHeader.className = "responseHeader";
		responseHeader.textContent =
			formData?.fieldValues?.length > 1
				? `Response ${index + 1}`
				: "Response";
		singleResponseWrapper.appendChild(responseHeader);

		if (index > 0) {
			const deleteResponse = document.createElement("button");
			deleteResponse.textContent = "Delete";
			deleteResponse.id = `deleteResponse-${item?.messageId}-${index}`;
			singleResponseWrapper.appendChild(deleteResponse);
		}

		parameters?.forEach((field, i) => {
			const tvInputGroupDiv = document.createElement("div");
			tvInputGroupDiv.className = `tvInputGroup ${field?.value?.type} ${
				field?.value?.canUploadFile ? "uploadGrp" : ""
			}`;

			const grpInputDiv = document.createElement("div");
			grpInputDiv.className = "grpInput";

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
					formFieldLongTextElement.appendChild(fileUploadLabel);

					const inputField = document.createElement("input");
					inputField.type = "file";
					inputField.id = `fileUpload-${field?.key}-${item?.messageId}-${index}`;
					formFieldLongTextElement.appendChild(inputField);

					const removeButton = document.createElement("button");
					removeButton.textContent = "Remove";
					removeButton.id = `removeButton-${field?.key}-${item?.messageId}-${index}`;
					removeButton.style.display = "none";
					formFieldLongTextElement.appendChild(removeButton);

					grpInputDiv.appendChild(formFieldLongTextElement);
				}

				const textareaElement = document.createElement("textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.placeholder =
					field?.value?.placeholder || "Enter Text...";
				textareaElement.textContent = field?.value?.default || "";
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
				grpInputDiv.appendChild(grpWrapDiv);

				const textareaElement = document.createElement("textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.placeholder =
					field?.value?.placeholder || "Enter Text...";
				textareaElement.textContent = field?.value?.default || "";
				grpInputDiv.appendChild(textareaElement);
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

				const selectElement = document.createElement("select");
				selectElement.id = `dropdownValue-${field?.key}-${item?.messageId}-${index}`;

				// Initialize Choices.js when the dropdown is available
				let obj = {
					selector: `#dropdownValue-${field?.key}-${item?.messageId}-${index}`,
					isMulti: false,
					field,
					index,
					item,
					callback: initializeChoicesForElement,
				};

				observeDOMChanges(obj);

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

				const dropdownElement = document.createElement("select");
				dropdownElement.id = `dropdownValue-${field?.key}-${item?.messageId}-${index}`;
				dropdownElement.setAttribute("multiple", true);

				// Initialize Choices.js when the dropdown is available

				let obj = {
					selector: `#dropdownValue-${field?.key}-${item?.messageId}-${index}`,
					isMulti: true,
					field,
					index,
					callback: initializeChoicesForElement,
				};

				observeDOMChanges(obj);

				grpWrapDiv.appendChild(dropdownElement);
				grpInputDiv.appendChild(grpWrapDiv);
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

				const textareaElement = document.createElement("textarea");
				textareaElement.className = "promptId";
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.rows = 10;
				textareaElement.cols = 30;
				textareaElement.value = field?.value?.default || "";
				if (field?.value?.readOnly) {
					textareaElement.disabled = true;
				}

				grpWrapDiv.appendChild(textareaElement);
				grpInputDiv.appendChild(grpWrapDiv);
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

				const textareaElement = document.createElement("textarea");
				textareaElement.className = "promptId";
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.rows = 10;
				textareaElement.cols = 30;

				const initialPromptValue = formData?.fieldValues?.find(
					(field) => field?.key === "prompts"
				)?.value?.nested?.value?.values?.[0]?.value;
				textareaElement.value =
					field?.value?.default || initialPromptValue || "";
				if (field?.value?.nested?.readOnly) {
					textareaElement.disabled = true;
				}

				grpWrapDiv.appendChild(textareaElement);
				grpInputDiv.appendChild(grpWrapDiv);
			}

			if (field?.value?.type === "simpleText") {
				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpInputDiv.appendChild(nameTitleDiv);

				const textareaElement = document.createElement("textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.placeholder =
					field?.value?.placeholder || "Enter text...";
				textareaElement.textContent = field?.value?.default || "";
				grpInputDiv.appendChild(textareaElement);
			}

			if (field?.value?.type === "number") {
				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpInputDiv.appendChild(nameTitleDiv);

				const numberElement = document.createElement("input");
				numberElement.type = "number";
				numberElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				numberElement.placeholder =
					field?.value?.placeholder || "Enter Number...";
				numberElement.value = field?.value?.default || "";
				grpInputDiv.appendChild(numberElement);
			}

			if (field?.value?.type === "file") {
				const nameTitleDiv = document.createElement("div");
				nameTitleDiv.className = "nameTitle";
				nameTitleDiv.textContent = `${field?.label} ${
					field?.required || field?.value?.required ? "*" : ""
				}`;
				grpInputDiv.appendChild(nameTitleDiv);

				const textareaElement = document.createElement("textarea");
				textareaElement.id = `inputValue-${field?.key}-${item?.messageId}-${index}`;
				textareaElement.placeholder =
					field?.value?.placeholder || "Enter Content...";
				textareaElement.textContent = field?.value?.default || "";
				grpInputDiv.appendChild(textareaElement);
			}

			if (field?.value?.canUploadFile) {
				const formFieldLongTextElement = document.createElement("div");
				formFieldLongTextElement.className = "formField LongText";
				const fileUploadLabel = document.createElement("label");
				fileUploadLabel.textContent = "Upload";
				formFieldLongTextElement.appendChild(fileUploadLabel);

				const inputField = document.createElement("input");
				inputField.type = "file";
				inputField.id = `fileUpload-${field?.key}-${item?.messageId}-${index}`;
				formFieldLongTextElement.appendChild(inputField);

				const removeButton = document.createElement("button");
				removeButton.textContent = "Remove";
				removeButton.id = `removeButton-${field?.key}-${item?.messageId}-${index}`;
				removeButton.style.display = "none";
				formFieldLongTextElement.appendChild(removeButton);

				grpInputDiv.appendChild(formFieldLongTextElement);
			}

			tvInputGroupDiv.appendChild(grpInputDiv);
			singleResponseWrapper.appendChild(tvInputGroupDiv);
		});
		responsesFieldWrapper.appendChild(singleResponseWrapper);
		tvBodyDiv.appendChild(responsesFieldWrapper);
	});

	const buttonWrapper = document.createElement("div");
	buttonWrapper.className = "buttonsGrp";

	const cancelButton = document.createElement("button");
	cancelButton.type = "button";
	cancelButton.textContent = "Cancel";
	cancelButton.id = `discardAnswer-${item?.messageId}`;
	buttonWrapper.appendChild(cancelButton);

	const submitButton = document.createElement("button");
	submitButton.type = "button";
	submitButton.id = `submitGptForm-${item?.messageId}`;
	submitButton.textContent = item?.content?.formFields?.submitAction?.title;
	buttonWrapper.appendChild(submitButton);

	if (item?.content?.allowMultiResponse) {
		const addResponseButton = document.createElement("button");
		addResponseButton.type = "button";
		addResponseButton.id = `addAdditionalResponse-${item?.messageId}`;
		addResponseButton.textContent = "+ Add Response";
		buttonWrapper.appendChild(addResponseButton);
	}

	translateFormViewDiv.appendChild(tvBodyDiv);

	gptAgentDiv.appendChild(translateFormViewDiv);

	tvBodyDiv.appendChild(buttonWrapper);

	setTimeout(() => {
		gptFormFunctionality(formData, item);
	}, 1000);

	return gptAgentDiv.outerHTML;
}

const initializeChoicesForElement = (el, isMulti, field, item, i) => {
	if (typeof window !== "undefined" && typeof document !== "undefined") {
		if (el) {
			let obj = {};
			if (isMulti) {
				obj = {
					silent: false,
					placeholder: true,
					addChoices: false,
					placeholderValue: "Select Multiple Options",
					searchEnabled: false,
					removeItemButton: true,
					maxItemCount: -1,
					duplicateItemsAllowed: false,
					removeItems: true,
					itemSelectText: "",
					noChoicesText: "",
				};
			} else {
				obj = {
					silent: false,
					placeholder: true,
					addChoices: false,
					placeholderValue: "Select an option",
					searchEnabled: false,
					containerOuter: `choices-${field?.key}`,
				};
			}
			const choices = new Choices(el, obj);

			let dropDownChoices = field?.value?.choices;
			if (field?.key === "prompts" && !isMulti) {
				el.addEventListener("change", (event) =>
					updateChoice(event, item, i)
				);

				dropDownChoices = field?.value?.choices.map(
					(choice, index) => ({
						...choice,
						selected:
							choice?.id === field?.value?.nested?.id ||
							index === 0,
					})
				);
			}

			choices.setChoices(dropDownChoices, "id", "label", true);
		}
	}
};

const updateChoice = (event, item, index) => {
	const currentQsn = getCurrentQuestion(item);
	event.preventDefault();
	const updatedPromptValue = event?.detail?.value;
	UpdateGPTPromptValue(currentQsn, index, updatedPromptValue, true);
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
