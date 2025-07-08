import { convertTemplateToHtml } from "../utils/helpers.js";
import MessageRenderer from "./messageRenderer.js";
import * as TemplateComponents from "./templates";

export function upgradeCustomElements(container) {
  if (!window.customElements || !container) return;

  const allEls = container.querySelectorAll('*');

  allEls.forEach(el => {
    const tagName = el.tagName.toLowerCase();
    if (tagName.startsWith('sl-') && customElements.get(tagName)) {
      customElements.upgrade(el);
    }
  });
}

/**
 * Generate DOM for message
 * @param {Object} data Message data
 * @returns {HTMLElement}
 */
export function generateHTMLTemplate(
	data,
	{
		assistantIconTemplate = () => {},
		userIconTemplate = () => {},
		loadingText,
	}
) {
	assistantIconTemplate = convertTemplateToHtml(assistantIconTemplate());
	userIconTemplate = convertTemplateToHtml(userIconTemplate());
	try {
		// Render the message to HTML string
		const html = MessageRenderer.render(data, {
			assistantIconTemplate,
			userIconTemplate,
			loadingText,
		});

		

		// Create temporary container
		const container = document.createElement("div");
		container.innerHTML = html.trim();

		// Get the first child (our message element)
		const messageElement = container.firstChild;

		// Add event listeners if needed
		// attachEventListeners(messageElement, data);

		return messageElement;
	} catch (error) {
		console.error("Error generating message DOM:", error);
		// Return error message element
		const errorContainer = document.createElement("div");
		errorContainer.innerHTML = TemplateComponents.renderError({
			message: "Failed to generate message",
			code: "DOM_ERROR",
			assistantIconTemplate,
		});
		return errorContainer.firstChild;
	}
}

/**
 * Attach event listeners to message element
 * @param {HTMLElement} element Message element
 * @param {Object} data Message data
 */
export function attachEventListeners(element, data) {
	// Attach feedback listeners if supported
	if (MessageRenderer.supportsFeedback(data.templateType)) {
		const feedbackButtons = element?.querySelectorAll(".feedback-btn");
		feedbackButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				handleFeedback(e, data);
			});
		});
	}

	// Attach template-specific listeners
	switch (data.templateType) {
		case "resolve_ambiguity":
		case "intent_ambiguity":
			attachAmbiguityListeners(element, data);
			break;

		case "multi_intent_execution":
			attachExecutionListeners(element, data);
			break;
	}
}

/**
 * Handle feedback button click
 * @param {Event} event Click event
 * @param {Object} data Message data
 */
export function handleFeedback(event, data) {
	const value = event.currentTarget.dataset.value;
	element;
	// Emit feedback event
	const feedbackEvent = new CustomEvent("message-feedback", {
		detail: {
			messageId: data.id,
			value,
			data,
		},
	});
	document.dispatchEvent(feedbackEvent);
}

/**
 * Attach listeners for ambiguity templates
 * @param {HTMLElement} element Message element
 * @param {Object} data Message data
 */
export function attachAmbiguityListeners(element, data) {
	const options = element.querySelectorAll(".ambiguity-option");
	const confirmButton = element.querySelector('[data-action="confirm"]');

	options.forEach((option) => {
		option.addEventListener("click", () => {
			options.forEach((opt) => opt.classList.remove("selected"));
			option.classList.add("selected");
			confirmButton.disabled = false;
		});
	});

	confirmButton.addEventListener("click", () => {
		const selectedOption = element.querySelector(
			".ambiguity-option.selected"
		);
		if (selectedOption) {
			const event = new CustomEvent("ambiguity-resolved", {
				detail: {
					messageId: data.id,
					value: selectedOption.dataset.value,
					index: selectedOption.dataset.index,
					data,
				},
			});
			document.dispatchEvent(event);
		}
	});
}

/**
 * Attach listeners for multi-intent execution template
 * @param {HTMLElement} element Message element
 * @param {Object} data Message data
 */
export function attachExecutionListeners(element, data) {
	const cancelButton = element.querySelector('[data-action="cancel"]');
	const skipButton = element.querySelector('[data-action="skip"]');

	if (cancelButton) {
		cancelButton.addEventListener("click", () => {
			const event = new CustomEvent("execution-cancelled", {
				detail: {
					messageId: data.id,
					data,
				},
			});
			document.dispatchEvent(event);
		});
	}

	if (skipButton) {
		skipButton.addEventListener("click", () => {
			const event = new CustomEvent("task-skipped", {
				detail: {
					messageId: data.id,
					data,
				},
			});
			document.dispatchEvent(event);
		});
	}
}

// Create a default export object to maintain compatibility with existing imports
const TemplateRenderer = {
	generateHTMLTemplate,
	attachEventListeners,
	handleFeedback,
	attachAmbiguityListeners,
	attachExecutionListeners,
	upgradeCustomElements
};

export default TemplateRenderer;
