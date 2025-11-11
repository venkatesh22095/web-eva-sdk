import { MessageRenderer } from "../../plugins/Markdown/message-renderer";
import { encodeHtml } from "../utils/helper";

function render(data) {

//     let html = `
//     <div class="search-answer-container">
//         ${renderSearchInfo(data)}
//         ${renderAnswer(data)}
//         ${renderSources(data)}
//     </div>
// `;

    let html = `
        <div class="search-answer-container">
            ${renderAnswer(data)}
        </div>
    `;

    return html;
}

function renderSearchInfo(data) {
	if (!data.suggestion) return "";

	return `
        <div class="generating-answer-block">
            <div class="generating-answer-block-item">
                <div class="msg">Searching for: <span>${encodeHtml(
					data.suggestion
				)}</span></div>
            </div>
        </div>
    `;
}

function renderAnswer(data) {
	if (!data.answer) return "";

    let html = `
        <div id="answer-${data.id}" class="threadName maxLength">
            ${MessageRenderer(data.answer)}
        </div>
    `;
    return html;
}

function renderSources(data) {
	if (!data.sources?.length) return "";

	return `
        <div class="sources-container">
            <div class="sources-list">
                ${data.sources
					.map(
						(source) => `
                    <div class="source-item">
                        <a href="${encodeHtml(
							source.url
						)}" target="_blank" rel="noopener noreferrer">
                            ${encodeHtml(source.title)}
                        </a>
                    </div>
                `
					)
					.join("")}
            </div>
        </div>
    `;
}

export { render };
