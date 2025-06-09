// import BotConversation from "../chat/botAgent/getBotConversation.js"
import { isEmpty } from "lodash";
import BotConversation from "../../chat/botAgent/getBotConversation";
import TemplateComponents from "./index";
import { encodeHtml } from "../../utils/helpers";
import customMarkdownRenderer from "../utils/customMarkdownRenderer";

function escapeHTML(str) {
	if (!str) return "";
	return str
		?.replace(/&/g, "&amp;")
		?.replace(/</g, "&lt;")
		?.replace(/>/g, "&gt;")
		?.replace(/"/g, "&quot;")
		?.replace(/'/g, "&#039;");
}

function downloadDocument(docId, docName, dealId, btn) {
	const { url, token } = window.sdkConfig.customConfigURL || {};
	if (!url || !token || !docId || !dealId) {
		alert("Missing download parameters.");
		return;
	}

	// Show loader on button
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = `<span class="sources-loader"></span>`;

	fetch(`${url}/deals/${dealId}/documents/${docId}/download`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			if (!response.ok) throw new Error("Download failed");
			return response.blob();
		})
		.then((blob) => {
			const downloadUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = downloadUrl;
			a.download = docName || "document";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(downloadUrl);
		})
		.catch(() => {
			alert("Failed to download document.");
		})
		.finally(() => {
			btn.disabled = false;
			btn.innerHTML = originalText;
		});
}

function renderUserQuestion(question, userIconTemplate) {
	if (question) {
		return `<div class="message-bubble question">
					<div class="message-content">
						<div class="message-text">${encodeHtml(question)}</div>
						${userIconTemplate ? userIconTemplate : ""}
					</div>
				</div>`;
	}
	return "";
}

function renderThoughts(conversation) {
	const { thoughts, question } = conversation;
	if (!thoughts?.length) return "";
	return `
    <div class="thinking-dropdown">
      <details class="thoughts-accordion" ${!question ? "open" : ""}>
        <summary class="thoughts-header">
          <span>Thoughts</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </summary>
        <div class="thoughts-content">
          <ul>
            ${thoughts
              .map((thought) => `<li>${thought.content}</li>`)
              .join("")}
          </ul>
        </div>
      </details>
    </div>
    
  `;
}

function renderQuestion(question) {
	if (question) {
		return `${customMarkdownRenderer(escapeHTML(question))}`;
	}
	return "";
}
function renderAssistantQuestion(conversation, assistantIconTemplate) {
	const { question, thoughts } = conversation;
	const sources =
		question &&
		typeof question === "object" &&
		Array.isArray(question.sources)
			? question.sources
			: [];

	if (question || thoughts?.length || (sources && sources.length)) {
		const sourcesHtml =
			sources && sources.length ? renderSourcesAccordion(sources) : "";
		let questionContent =
			typeof question === "object" && question !== null
				? question.content
				: question;
		if (typeof questionContent === "string") {
			const refIndex = questionContent.indexOf("#### REFERENCES");
			if (refIndex !== -1) {
				questionContent = questionContent.substring(0, refIndex).trim();
			}
		}
		return `<div class="bc-question-wrapper">
                ${assistantIconTemplate}
                <div class="message-text">
                    ${thoughts?.length > 0 ? renderThoughts(conversation) : ""}
                    ${renderQuestion(questionContent)}
					${sourcesHtml}
                </div>
            </div>`;
	}
}

function createConversationHTML(
	conversation,
	props,
	assistantIconTemplate,
	userIconTemplate,
	loadingText
) {
	if (
		conversation?.hasOwnProperty("template_html") ||
		conversation?.templateType === "hold_conversation"
	) {
		return customMarkdownRenderer(`
            <div class="botTemplate-${conversation?.messageId}"></div>
        `);
	}

	if (conversation?.status === "in-progress") {
		let content;

		if (conversation?.templateType === "search_answer") {
			content = renderAssistantQuestion(
				conversation,
				assistantIconTemplate
			);
			if (conversation?.answer) {
				content += `<br/>`;
				content += renderUserQuestion(
					conversation?.answer,
					userIconTemplate
				);
				content += `<br/>`;
			}
		}

		// Only show loading if it's not a search_answer template and status is not in-progress
		if (conversation?.loading) {
			content += `<div class="message-bubble loading" >
					${assistantIconTemplate ? assistantIconTemplate : ""}
				<div class="loading-text">${encodeHtml(loadingText)}</div>   
			</div>`;
		}
		return content;
	} else {
		if (conversation?.templateType === "search_answer") {
			return `
                <div class="completed">
					${renderAssistantQuestion(conversation, assistantIconTemplate)}
					<br/>
					${renderUserQuestion(conversation?.answer, userIconTemplate)}
					<br/>
                </div>
            `;
		} else if (conversation?.templateType === "bot_template") {
			return `
				<div>
					${renderAssistantQuestion(conversation, assistantIconTemplate)}
					<br/>
					${renderUserQuestion(conversation?.answer, userIconTemplate)}
					<br/>
				</div>
			`; // add pointer events none
		}
	}

	return "";
}

function parseReference(ref) {
	if (!ref) return {};
	if (typeof ref === "object") return ref;
	if (typeof ref === "string") {
		try {
			const jsonStr = ref.replace(/'/g, '"');
			return JSON.parse(jsonStr);
		} catch (e) {
			return {};
		}
	}
	return {};
}

function renderSourcesAccordion(sources = []) {
	if (!sources.length) return "";

	const grouped = {};
	// Map to keep track of original source index for each chunk
	const chunkOriginalIndexes = {};
	sources.forEach((source, originalIdx) => {
		const ref = parseReference(source.reference);
		const docId = ref.document_id || "";
		if (!grouped[docId]) {
			grouped[docId] = {
				docType: encodeHtml(ref.document_type || ""),
				docName: encodeHtml(ref.document_name || ""),
				docId: encodeHtml(ref.document_id || ""),
				dealId: encodeHtml(ref.deal_id || ""),
				chunks: [],
			};
		}
		const chunkObj = {
			title: encodeHtml(source.title || ""),
			chunk:
				source.chunk != null && source.chunk !== ""
					? customMarkdownRenderer(escapeHTML(source.chunk))
					: "",
			originalIdx: originalIdx, // Save the original index
		};
		grouped[docId].chunks.push(chunkObj);
	});

	return `
		<div class="sourcesAccordionCntr">
			<button class="sac-toggleCntr">
				<span class="tc-toggleText" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
					Sources
					<span class="tc-arrowCntr" style="display: flex; align-items: center;">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</span>
				</span>
			</button>
			<div class="sac-listCntr" style="display:none;">
				${Object.values(grouped)
					.map((doc, idx) => {
						return `
							<div class="lc-cardCntr" data-source-idx="${idx}">
								<div class="cc-headerCntr">
									<span class="hc-type">${doc.docType}</span>
									<span class="hc-name">${doc.docName}</span>
									<button class="hc-viewBtn"
										data-doc-id="${doc.docId}"
										data-doc-name="${doc.docName}"
										data-deal-id="${doc.dealId}"
									>View</button>
									<button class="hc-showChunksBtn" data-chunk-idx="${idx}">Show References</button>
								</div>
								<div class="cc-chunksCntr" style="display:none;">
									${doc.chunks
										.map(
											(chunk) => `
												${chunk.title ? `<div class="cc-title">(${chunk.originalIdx + 1}) ${chunk.title}</div>` : ""}
												${chunk.chunk ? `<div class="cc-content">${chunk.chunk}</div>` : ""}
											`
										)
										.join('<hr class="cc-separator" />')}
								</div>
							</div>
						`;
					})
					.join("")}
			</div>
		</div>
	`;
}

function handleSubmit(conversation, input, props) {
	const payload = {
		cId: props?.cId || props?.reqId,
		input: input,
		context: props?.context,
		messageId: conversation?.messageId,
	};
	BotConversation().submitBotResponse(payload);
}

function setupEventListeners(botConversation, props) {
	// Input handlers
	document.querySelectorAll(".bot-input").forEach((input) => {
		input.addEventListener("keydown", (event) => {
			if (event.keyCode === 13 && !event.shiftKey) {
				event.preventDefault();
				const messageId = event.target.dataset.messageId;
				const conversation = Object.values(botConversation).find(
					(conv) => conv.messageId === messageId
				);

				if (conversation) {
					handleSubmit(conversation, event.target.value, props);
					event.target.value = "";
				}
			}
		});
	});

	// Button handlers
	document.querySelectorAll(".send-button").forEach((button) => {
		button.addEventListener("click", (event) => {
			const messageId = event.target.dataset.messageId;
			const input = document.querySelector(
				`.bot-input[data-message-id="${messageId}"]`
			);
			const conversation = Object.values(botConversation).find(
				(conv) => conv.messageId === messageId
			);

			if (conversation && input) {
				handleSubmit(conversation, input.value, props);
				input.value = "";
			}
		});
	});
}

function setupTemplates(botConversation) {
	if (!isEmpty(botConversation)) {
		const templateConversations = Object.values(botConversation)?.filter(
			(conversation) => conversation?.hasOwnProperty("template_html")
		);

		if (templateConversations?.length) {
			templateConversations.forEach((conversation) => {
				const templateDiv = document.querySelector(
					`.botTemplate-${conversation?.messageId}`
				);
				if (templateDiv && conversation?.template_html) {
					templateDiv.appendChild(conversation.template_html);
				}
			});
		}
	}
}

function setupSourcesAccordionListeners() {
	const wrapper = document.querySelector(".bot-conversation-wrapper");
	if (!wrapper) return;

	if (wrapper._sourcesAccordionListenerAttached) return;
	wrapper._sourcesAccordionListenerAttached = true;

	wrapper.addEventListener("click", function (e) {
		const sourcesToggle = e.target.closest(".sac-toggleCntr");
		if (sourcesToggle) {
			e.preventDefault();
			const accordion = sourcesToggle.closest(".sourcesAccordionCntr");
			const list = accordion
				? accordion.querySelector(".sac-listCntr")
				: null;
			if (list) {
				const isOpen = list.style.display === "grid";
				list.style.display = isOpen ? "none" : "grid";

				const arrowSvg = `
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				`;
				const arrowUpSvg = `
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M2 8L6 4L10 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				`;
				sourcesToggle.innerHTML = `Sources <span class="tc-arrowCntr">${isOpen ? arrowSvg : arrowUpSvg}</span>`;
			}
			return;
		}

		const viewBtn = e.target.closest(".hc-viewBtn");
		if (viewBtn) {
			const docId = viewBtn.getAttribute("data-doc-id");
			const docName = viewBtn.getAttribute("data-doc-name");
			const dealId = viewBtn.getAttribute("data-deal-id");
			downloadDocument(docId, docName, dealId, viewBtn);
			return;
		}

		const showChunksBtn = e.target.closest(".hc-showChunksBtn");
		if (showChunksBtn) {
			const card = showChunksBtn.closest(".lc-cardCntr");
			const chunkDiv = card.querySelector(".cc-chunksCntr");
			const isOpen = chunkDiv.style.display === "block";
			chunkDiv.style.display = isOpen ? "none" : "block";
			showChunksBtn.textContent = isOpen
				? "Show References"
				: "Hide References";
			if (!isOpen) {
				card.classList.add("expanded");
			} else {
				card.classList.remove("expanded");
			}
			return;
		}
	});
}

function renderBotConversation(
	props,
	assistantIconTemplate,
	userIconTemplate,
	loadingText
) {
	const botConversation = props?.botConversation;

	if (!Object.values(botConversation || {})?.length) {
		return "";
	}

	const conversationsHTML = Object.values(botConversation)
		.map((conversation) =>
			createConversationHTML(
				conversation,
				props,
				assistantIconTemplate,
				userIconTemplate,
				loadingText
			)
		)
		.join("");

	return `
        <div class="bot-conversation-wrapper">
            ${conversationsHTML}
        </div>
    `;
}

// Main function to be exported
export function render(
	props,
	assistantIconTemplate,
	userIconTemplate,
	loadingText
) {
	const html = renderBotConversation(
		props,
		assistantIconTemplate,
		userIconTemplate,
		loadingText
	);

	// Clear any existing timers
	if (window.accordionSetupTimer) {
		clearTimeout(window.accordionSetupTimer);
	}

	// Helper to ensure listeners are attached after DOM update
	function ensureSourcesListenersAttached(attempt = 0) {
		const wrapper = document.querySelector(".bot-conversation-wrapper");
		if (wrapper) {
			setupSourcesAccordionListeners();
		} else if (attempt < 5) {
			setTimeout(() => ensureSourcesListenersAttached(attempt + 1), 100);
		}
	}

	// Setup a new timer (short delay)
	window.accordionSetupTimer = setTimeout(() => {
		setupEventListeners(props?.botConversation, props);
		setupTemplates(props?.botConversation);
		ensureSourcesListenersAttached();
	}, 100); // Reduced timeout to 100ms for faster response

	return html;
}
export default { render , setupTemplates };
