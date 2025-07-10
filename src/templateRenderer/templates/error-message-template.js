import { encodeHtml } from "../utils/helper";

export function render(data, assistantIconTemplate) {
	const { error } = data;

	let msg =
		error?.message || error?.msg||
		"Sorry, there seems to be a problem connecting to the server. Please try again later.";
	return `
    <div class="message-bubble answer">
        ${assistantIconTemplate}
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <h3>Error</h3>
                <p>${msg}</p>
                ${error.code ? `<code>${error.code}</code>` : ""}
            </div>
        </div>
    </div>
    `;
}

export default { render };
