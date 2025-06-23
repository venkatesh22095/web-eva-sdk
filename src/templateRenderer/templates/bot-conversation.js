// import BotConversation from "../chat/botAgent/getBotConversation.js"
import { isEmpty } from "lodash";
import BotConversation from "../../chat/botAgent/getBotConversation";
import TemplateComponents from "./index";
import { encodeHtml } from "../../utils/helpers";
import customMarkdownRenderer from "../utils/customMarkdownRenderer";
import { submitFeedback } from "../../redux/actions/global.action";
import store from "../../redux/store"


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
		showDocName(btn);
		return;
	}

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
			showDocName(btn);
		})
		.catch(() => {
			alert("Failed to download document.");
			showDocName(btn);
		});
}

function showDocName(btn) {
	if (!btn) return;

	btn.disabled = false;
	const loader = btn.querySelector(".download-loader");
	const docNameSpan = btn.querySelector(".doc-name");

	if (loader) {
		loader.style.display = "none";
	}
	if (docNameSpan) {
		docNameSpan.style.display = "inline";
	}
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
            ${thoughts.map((thought) => `<li>${thought.content}</li>`).join("")}
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

function renderFeedbackSection(conversation,sources) {
	const messageId = conversation.messageId || 'default';
	const existingFeedback = conversation.feedback; // Get existing feedback from conversation
	const existingCategories = conversation.category || []; // Get existing selected categories
	const existingComment = conversation.comment || ""; // Get existing comment
	
	// Default options - can be overridden by conversation.feedbackOptions
	const defaultPositiveOptions = [
		{ value: 'up-to-date', text: 'Up to date' },
		{ value: 'accurate', text: 'Accurate' },
		{ value: 'helpful', text: 'Helpful' },
		{ value: 'followed-instructions', text: 'Followed instructions' },
		{ value: 'good-sources', text: 'Good sources' },
		{ value: 'other-positive', text: 'Other' }
	];
	
	const defaultNegativeOptions = [
		{ value: 'not-factually-correct', text: 'Not factually correct' },
		{ value: 'intent-mismatch', text: 'Intent mismatch' },
		{ value: 'delayed-response', text: 'Delayed response' },
		{ value: 'incorrect-source', text: 'Incorrect source' },
		{ value: 'other-negative', text: 'Other' }
	];
	
	// Use conversation options if provided, otherwise use defaults
	const positiveOptions = conversation.feedbackOptions?.positive || defaultPositiveOptions;
	const negativeOptions = conversation.feedbackOptions?.negative || defaultNegativeOptions;
	
	// Helper function to render chips with pre-selected state
	const renderChips = (options, selectedCategories = []) => {
		return options.map(option => {
			const isSelected = selectedCategories.includes(option.text) ? 'selected' : '';
			return `<div class="feedback-chip ${isSelected}" data-value="${option.value}">${option.text}</div>`;
		}).join('');
	};
	
	// Determine button states based on existing feedback
	const thumbsUpClass = existingFeedback === "like" ? "feedback-btn thumbs-up submitted positive" : "feedback-btn thumbs-up";
	const thumbsDownClass = existingFeedback === "dislike" ? "feedback-btn thumbs-down submitted negative" : "feedback-btn thumbs-down";
	
	// Feedback options should only be shown when user actively clicks thumbs down, not for existing feedback
	const feedbackOptionsDisplay = "none";
	const negativeOptionsDisplay = "none";

	
	return `
		<div class="feedback-section ${sources?.length === 0 ? "feedback-section-with-sources" : ""}" data-message-id="${messageId}">
			<div class="feedback-actions">
				<button class="${thumbsUpClass}" data-feedback-type="positive" data-message-id="${messageId}">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9496 8.99672 19.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<button class="${thumbsDownClass}" data-feedback-type="negative" data-message-id="${messageId}">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M17 2H20C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4V11C22 11.5304 21.7893 12.0391 21.4142 12.4142C21.0391 12.7893 20.5304 13 20 13H17M10 15V19C10 19.7956 10.3161 20.5587 10.8787 21.1213C11.4413 21.6839 12.2044 22 13 22L17 13V2H5.72C5.23773 1.99448 4.76958 2.16359 4.40211 2.47599C4.03464 2.78840 3.79227 3.22311 3.72 3.7L2.34 12.7C2.29649 12.9866 2.31583 13.2793 2.39667 13.5577C2.47751 13.8362 2.61793 14.0937 2.80814 14.3125C2.99835 14.5313 3.23394 14.7061 3.49843 14.8248C3.76291 14.9435 4.05042 15.0033 4.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
			
			<div class="feedback-options" data-message-id="${messageId}" style="display: ${feedbackOptionsDisplay};">
				<div class="feedback-options-content">
					<!-- COMMENTED OUT: Positive feedback container modal
					<div class="positive-options" style="display: none;">
						<div class="feedback-options-title">What did you like about this response? (optional)</div>
						<div class="feedback-chips">
							${renderChips(positiveOptions)}
						</div>
						<textarea class="feedback-textarea" placeholder="Additional comments.." rows="3"></textarea>
					</div>
					-->
					
					<div class="negative-options" style="display: ${negativeOptionsDisplay};">
						<div class="feedback-options-title">What didn't you like about this response? (optional)</div>
						<div class="feedback-chips">
							${renderChips(negativeOptions, existingCategories)}
						</div>
						<textarea class="feedback-textarea" placeholder="Additional comments.." rows="3">${existingComment}</textarea>
					</div>
					
					<div class="feedback-actions-bottom">
						<button class="feedback-submit-btn" data-message-id="${messageId}" disabled>Submit</button>
					</div>
				</div>
			</div>
		</div>
	`;
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
					<div class="bottom-container">
						${sourcesHtml}
						${question ? renderFeedbackSection(conversation,sources) : ""}
					</div>
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
		// Check if it's a direct URL
		if (ref.startsWith("http://") || ref.startsWith("https://")) {
			return { url: ref, isDirectUrl: true };
		}
		// Try to parse as JSON
		try {
			const jsonStr = ref.replace(/'/g, '"');
			return JSON.parse(jsonStr);
		} catch (e) {
			return {};
		}
	}
	return {};
}

function getDocumentIcon(docName = "") {
	const extension = docName.split(".").pop()?.toLowerCase();

	if (extension === "doc" || extension === "docx") {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
			<rect x="3" y="0.75" width="9" height="10.5" rx="2" fill="url(#paint0_linear_22660_12468)"/>
			<path d="M3 8.625H12V9.25C12 10.3546 11.1046 11.25 10 11.25H5C3.89543 11.25 3 10.3546 3 9.25V8.625Z" fill="url(#paint1_linear_22660_12468)"/>
			<rect x="3" y="6" width="9" height="2.625" fill="url(#paint2_linear_22660_12468)"/>
			<rect x="3" y="3.375" width="9" height="2.625" fill="url(#paint3_linear_22660_12468)"/>
			<path d="M3 5.625C3 4.38236 4.00736 3.375 5.25 3.375C6.49264 3.375 7.5 4.38236 7.5 5.625V7.125C7.5 8.78185 6.15685 10.125 4.5 10.125H3V5.625Z" fill="black" fill-opacity="0.3"/>
			<rect y="2.625" width="6.75" height="6.75" rx="2" fill="url(#paint4_linear_22660_12468)"/>
			<path d="M5.625 4.13032H4.89461L4.32108 6.57713L3.69363 4.125H3.07598L2.44363 6.57713L1.875 4.13032H1.125L2.10049 7.875H2.74755L3.375 5.50798L4.00245 7.875H4.64951L5.625 4.13032Z" fill="white"/>
			<defs>
				<linearGradient id="paint0_linear_22660_12468" x1="3" y1="2.5" x2="12" y2="2.5" gradientUnits="userSpaceOnUse">
					<stop stop-color="#2B78B1"/>
					<stop offset="1" stop-color="#338ACD"/>
				</linearGradient>
				<linearGradient id="paint1_linear_22660_12468" x1="3" y1="10.2656" x2="12" y2="10.2656" gradientUnits="userSpaceOnUse">
					<stop stop-color="#1B366F"/>
					<stop offset="1" stop-color="#2657B0"/>
				</linearGradient>
				<linearGradient id="paint2_linear_22660_12468" x1="3" y1="7.3125" x2="12" y2="7.3125" gradientUnits="userSpaceOnUse">
					<stop stop-color="#236736"/>
					<stop offset="1" stop-color="#6BA642"/>
				</linearGradient>
				<linearGradient id="paint3_linear_22660_12468" x1="3" y1="4.6875" x2="12" y2="4.6875" gradientUnits="userSpaceOnUse">
					<stop stop-color="#E12029"/>
					<stop offset="1" stop-color="#FF4147"/>
				</linearGradient>
				<linearGradient id="paint4_linear_22660_12468" x1="0" y1="6" x2="6.75" y2="6" gradientUnits="userSpaceOnUse">
					<stop stop-color="#2B579A"/>
					<stop offset="1" stop-color="#4D89E4"/>
				</linearGradient>
			</defs>
		</svg>`;
	}

	if (extension === "xlsx" || extension === "xls" || extension === "csv") {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
			<rect x="3" y="0.75" width="9" height="10.5" rx="2" fill="#2FB776"/>
			<path d="M3 8.625H12V9.25C12 10.3546 11.1046 11.25 10 11.25H5C3.89543 11.25 3 10.3546 3 9.25V8.625Z" fill="url(#paint0_linear_22699_8955)"/>
			<rect x="7.5" y="6" width="4.5" height="2.625" fill="#229C5B"/>
			<rect x="7.5" y="3.375" width="4.5" height="2.625" fill="#27AE68"/>
			<path d="M3 2.75C3 1.64543 3.89543 0.75 5 0.75H7.5V3.375H3V2.75Z" fill="#1D854F"/>
			<rect x="3" y="3.375" width="4.5" height="2.625" fill="#197B43"/>
			<rect x="3" y="6" width="4.5" height="2.625" fill="#1B5B38"/>
			<path d="M3 5.625C3 4.38236 4.00736 3.375 5.25 3.375C6.49264 3.375 7.5 4.38236 7.5 5.625V7.125C7.5 8.78185 6.15685 10.125 4.5 10.125H3V5.625Z" fill="black" fill-opacity="0.3"/>
			<rect y="2.625" width="6.75" height="6.75" rx="2" fill="url(#paint1_linear_22699_8955)"/>
			<path d="M4.875 7.875L3.8183 5.9625L4.82861 4.125H4.00387L3.38015 5.29821L2.76675 4.125H1.91624L2.9317 5.9625L1.875 7.875H2.69974L3.36469 6.63214L4.02448 7.875H4.875Z" fill="white"/>
			<defs>
				<linearGradient id="paint0_linear_22699_8955" x1="3" y1="9.9375" x2="12" y2="9.9375" gradientUnits="userSpaceOnUse">
					<stop stop-color="#163C27"/>
					<stop offset="1" stop-color="#2A6043"/>
				</linearGradient>
				<linearGradient id="paint1_linear_22699_8955" x1="0" y1="6" x2="6.75" y2="6" gradientUnits="userSpaceOnUse">
					<stop stop-color="#1D854F"/>
					<stop offset="1" stop-color="#2FB776"/>
				</linearGradient>
			</defs>
		</svg>`;
	}

	if (extension === "pdf") {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none">
			<path d="M9.5 2.61296V10.125C9.5 10.9534 8.82843 11.625 8 11.625H2.375C1.54657 11.625 0.875 10.9534 0.875 10.125V1.875C0.875 1.04657 1.54657 0.375 2.375 0.375H7.00933L9.5 2.61296Z" fill="#F04438"/>
			<path d="M8.77845 5.25V5.76375H7.70595V6.31875H8.50845V6.8175H7.70595V7.8825H7.0647V5.25H8.77845Z" fill="white"/>
			<path d="M5.32634 5.25C5.60384 5.25 5.84634 5.305 6.05384 5.415C6.26134 5.525 6.42134 5.68 6.53384 5.88C6.64884 6.0775 6.70634 6.30625 6.70634 6.56625C6.70634 6.82375 6.64884 7.0525 6.53384 7.2525C6.42134 7.4525 6.26009 7.6075 6.05009 7.7175C5.84259 7.8275 5.60134 7.8825 5.32634 7.8825H4.34009V5.25H5.32634ZM5.28509 7.3275C5.52759 7.3275 5.71634 7.26125 5.85134 7.12875C5.98634 6.99625 6.05384 6.80875 6.05384 6.56625C6.05384 6.32375 5.98634 6.135 5.85134 6C5.71634 5.865 5.52759 5.7975 5.28509 5.7975H4.98134V7.3275H5.28509Z" fill="white"/>
			<path d="M4.00625 6.0975C4.00625 6.25 3.97125 6.39 3.90125 6.5175C3.83125 6.6425 3.72375 6.74375 3.57875 6.82125C3.43375 6.89875 3.25375 6.9375 3.03875 6.9375H2.64125V7.8825H2V5.25H3.03875C3.24875 5.25 3.42625 5.28625 3.57125 5.35875C3.71625 5.43125 3.825 5.53125 3.8975 5.65875C3.97 5.78625 4.00625 5.9325 4.00625 6.0975ZM2.99 6.4275C3.1125 6.4275 3.20375 6.39875 3.26375 6.34125C3.32375 6.28375 3.35375 6.2025 3.35375 6.0975C3.35375 5.9925 3.32375 5.91125 3.26375 5.85375C3.20375 5.79625 3.1125 5.7675 2.99 5.7675H2.64125V6.4275H2.99Z" fill="white"/>
		</svg>`;
	}

	return `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M9.33366 1.513V4.26669C9.33366 4.64006 9.33366 4.82675 9.40632 4.96935C9.47024 5.0948 9.57222 5.19678 9.69766 5.2607C9.84027 5.33336 10.027 5.33336 10.4003 5.33336H13.154M9.33366 11.3333H5.33366M10.667 8.66665H5.33366M13.3337 6.6588V11.4666C13.3337 12.5868 13.3337 13.1468 13.1157 13.5746C12.9239 13.951 12.618 14.2569 12.2416 14.4487C11.8138 14.6666 11.2538 14.6666 10.1337 14.6666H5.86699C4.74689 14.6666 4.18683 14.6666 3.75901 14.4487C3.38269 14.2569 3.07673 13.951 2.88498 13.5746C2.66699 13.1468 2.66699 12.5868 2.66699 11.4666V4.53331C2.66699 3.41321 2.66699 2.85316 2.88498 2.42533C3.07673 2.04901 3.38269 1.74305 3.75901 1.5513C4.18683 1.33331 4.74689 1.33331 5.86699 1.33331H8.00818C8.49736 1.33331 8.74195 1.33331 8.97212 1.38857C9.17619 1.43757 9.37128 1.51838 9.55023 1.62803C9.75206 1.75172 9.92501 1.92467 10.2709 2.27057L12.3964 4.39605C12.7423 4.74196 12.9153 4.91491 13.0389 5.11674C13.1486 5.29569 13.2294 5.49078 13.2784 5.69485C13.3337 5.92502 13.3337 6.16962 13.3337 6.6588Z"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>`;
}

function renderSourcesAccordion(sources = []) {
	if (!sources.length) return "";

	const sourceCount = sources.length;
	const sourcesText = `${sourceCount} ${sourceCount === 1 ? "Source" : "Sources"}`;

	return `
		<div class="sourcesAccordionCntr">
			<button class="sac-toggleCntr sources-toggle-btn">
				<span class="tc-toggleText">
					${sourcesText}
					<span class="tc-arrowCntr">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</span>
				</span>
			</button>
			<div class="sources-popup">
				<div class="sources-popup-overlay"></div>
				<div class="sources-popup-content">
					<div class="sources-popup-header">
						<div class="header-left">

							<h3>${sourcesText}</h3>
						</div>
						<button class="sources-popup-close">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
					<div class="sources-popup-body">
						${sources
							.map((source, idx) => {
								const ref = parseReference(source.reference);
								const hasUrl =
									(ref.url && typeof ref.url === "string") ||
									ref.isDirectUrl;
								const docName = ref.document_name || "";
								const docIcon = getDocumentIcon(docName);

								return `
								<div class="source-item">
									<div class="source-header">
										<span class="source-index">${idx + 1}</span>
										${source.title ? `<span class="source-title">${encodeHtml(source.title)}</span>` : ""}
									</div>
									${source.chunk ? `<div class="source-content">${customMarkdownRenderer(escapeHTML(source.chunk))}</div>` : ""}
									<div class="source-footer">
										${
											hasUrl
												? `<a href="${encodeHtml(ref.url)}" target="_blank" rel="noopener noreferrer" class="source-link">
												<span class="url-icon-container">
													<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
														<path d="M1 6H11M1 6C1 8.76142 3.23858 11 6 11M1 6C1 3.23858 3.23858 1 6 1M11 6C11 8.76142 8.76142 11 6 11M11 6C11 3.23858 8.76142 1 6 1M6 1C7.25064 2.36918 7.96138 4.14602 8 6C7.96138 7.85398 7.25064 9.63082 6 11M6 1C4.74936 2.36918 4.03862 4.14602 4 6C4.03862 7.85398 4.74936 9.63082 6 11" stroke="#EC0100" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
													</svg>
												</span>
												<span class="url-name">${encodeHtml(ref.url)}</span>
											</a>`
												: `<button class="doc-download-btn" data-doc-id="${encodeHtml(ref.document_id || "")}" data-doc-name="${encodeHtml(docName)}" data-deal-id="${encodeHtml(ref.deal_id || "")}">
												<span class="doc-icon-container">
													${docIcon}
												</span>
												<span class="doc-name">${encodeHtml(docName)}</span>
												<span class="download-loader" style="display: none;"></span>
											</button>`
										}
									</div>
								</div>
							`;
							})
							.join("")}
					</div>
				</div>
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

function closeSourcesPopup(popup) {
	if (popup) {
		popup.classList.remove("active");
		document.body.style.overflow = "";
		if (window.sdkConfig) {
			window.sdkConfig.isSourcesOpen = false;
			window.dispatchEvent(new Event("sourcesOpenChange"));
		}
	}
}

function closeAllSourcePopups() {
	const activePopups = document.querySelectorAll(".sources-popup.active");

	// Close all active popups
	activePopups.forEach((popup) => {
		popup.classList.remove("active");
	});

	// Reset body overflow and global state only once after all popups are closed
	if (activePopups.length > 0) {
		document.body.style.overflow = "";
		if (window.sdkConfig) {
			window.sdkConfig.isSourcesOpen = false;
			window.dispatchEvent(new Event("sourcesOpenChange"));
		}
	}
}

function resetSourcesOpenState() {
	// Check if there are any active popups
	const activePopup = document.querySelector(".sources-popup.active");

	if (!activePopup && window.sdkConfig && window.sdkConfig.isSourcesOpen) {
		window.sdkConfig.isSourcesOpen = false;
		window.dispatchEvent(new Event("sourcesOpenChange"));
	}
}
const submitUserFeedbackBot = async ({messageId,payload}) => {
    const state = store.getState().global    
    if(state?.enableDebugging){        
        console.log(`
            boardId: ${state.activeBoardId}
            messageId: ${messageId}
            Payload: ${payload}
            state: ${state}
        `);
    }
    const response = await store.dispatch(submitFeedback({ boardId: state.activeBoardId, messageId:messageId,payload: payload }));
    return response;
}

function updateSubmitButtonState(feedbackSection) {
	const activeBtn = feedbackSection.querySelector(".feedback-btn.active");
	const submitBtn = feedbackSection.querySelector(".feedback-submit-btn");
	
	if (!activeBtn || !submitBtn) return;
	
	const feedbackType = activeBtn.getAttribute("data-feedback-type");
	const feedbackOptions = feedbackSection.querySelector(".feedback-options");
	const activeOptionsDiv = feedbackType === "positive" 
		? feedbackOptions.querySelector(".positive-options")
		: feedbackOptions.querySelector(".negative-options");
	
	const hasSelectedChips = activeOptionsDiv.querySelectorAll(".feedback-chip.selected").length > 0;
	const hasTextareaContent = activeOptionsDiv.querySelector(".feedback-textarea").value.trim().length > 0;
	
	// Enable submit button if user has selected chips or entered text
	if (hasSelectedChips || hasTextareaContent) {
		submitBtn.classList.add("active");
		submitBtn.disabled = false;
	} else {
		submitBtn.classList.remove("active");
		submitBtn.disabled = true;
	}
}

function handleFeedback(feedbackType, messageId, feedbackSection) {
	// Check if feedback already exists for this conversation
	const feedbackBtn = feedbackSection.querySelector(`.feedback-btn[data-feedback-type="${feedbackType}"]`);
	const isAlreadySubmitted = feedbackBtn.classList.contains('submitted');
	
	// Handle positive feedback - direct API call
	if (feedbackType === "positive") {
		const cId = messageId;

		// If already submitted, handle undo
		if (isAlreadySubmitted) {
			const undoPayload = { "action": "undo" };
			
			submitUserFeedbackBot({ messageId: cId, payload: undoPayload }).then(response => {
				feedbackBtn.classList.remove("submitted", "positive");
			}).catch(error => {
				console.error("Error undoing positive feedback:", error);
			});
			return;
		}

		// If dislike is already submitted, undo it first
		const dislikeBtn = feedbackSection.querySelector('.feedback-btn[data-feedback-type="negative"]');
		if (dislikeBtn && dislikeBtn.classList.contains('submitted')) {
			const undoPayload = { "action": "undo" };
			submitUserFeedbackBot({ messageId: cId, payload: undoPayload }).then(response => {
				dislikeBtn.classList.remove("submitted", "negative");
				
				// Hide and reset the feedback options
				const feedbackOptions = feedbackSection.querySelector(".feedback-options");
				const negativeOptions = feedbackOptions.querySelector(".negative-options");
				feedbackOptions.style.display = "none";
				negativeOptions.style.display = "none";
				
				// Reset form
				negativeOptions.querySelectorAll(".feedback-chip").forEach(chip => {
					chip.classList.remove("selected");
				});
				negativeOptions.querySelector(".feedback-textarea").value = "";
				
				// Now submit the positive feedback
				const feedBackPayload = {
					feedback: "like",
					comment: ""
				}
				submitUserFeedbackBot({ messageId: cId, payload: feedBackPayload }).then(response => {
					window.dispatchEvent(new Event("feedbackSubmitted"));
					feedbackBtn.classList.add("submitted", "positive");
				}).catch(error => {
					console.error("Error submitting positive feedback:", error);
				});
			}).catch(error => {
				console.error("Error undoing negative feedback:", error);
			});
			return;
		}

		const feedBackPayload = {
			feedback: "like",
			comment: ""
		}
		submitUserFeedbackBot({ messageId: cId, payload: feedBackPayload }).then(response => {
			window.dispatchEvent(new Event("feedbackSubmitted"));
			feedbackBtn.classList.add("submitted", "positive");
		}).catch(error => {
			console.error("Error submitting positive feedback:", error);
		});
		return;
	}
	
	// Handle negative feedback - show modal first or undo if already submitted
	if (feedbackType === "negative") {
		// If already submitted, handle undo
		if (isAlreadySubmitted) {
			const cId = messageId;
			const undoPayload = { "action": "undo" };
			
			submitUserFeedbackBot({ messageId: cId, payload: undoPayload }).then(response => {
				window.dispatchEvent(new Event("feedbackSubmitted"));
				console.log("Negative feedback undo successful:", response);
				feedbackBtn.classList.remove("submitted", "negative");
				
				// Hide and reset the feedback options
				const feedbackOptions = feedbackSection.querySelector(".feedback-options");
				const negativeOptions = feedbackOptions.querySelector(".negative-options");
				feedbackOptions.style.display = "none";
				negativeOptions.style.display = "none";
				
				// Reset form
				negativeOptions.querySelectorAll(".feedback-chip").forEach(chip => {
					chip.classList.remove("selected");
				});
				negativeOptions.querySelector(".feedback-textarea").value = "";
				
			}).catch(error => {
				console.error("Error undoing negative feedback:", error);
			});
			return;
		}

		// If like is already submitted, undo it first
		const likeBtn = feedbackSection.querySelector('.feedback-btn[data-feedback-type="positive"]');
		if (likeBtn && likeBtn.classList.contains('submitted')) {
			const cId = messageId;
			const undoPayload = { "action": "undo" };
			submitUserFeedbackBot({ messageId: cId, payload: undoPayload }).then(response => {
				likeBtn.classList.remove("submitted", "positive");
				
				// Now show the negative feedback options
				const feedbackOptions = feedbackSection.querySelector(".feedback-options");
				const negativeOptions = feedbackOptions.querySelector(".negative-options");
				
				// Reset other feedback buttons in the same section
				feedbackSection.querySelectorAll(".feedback-btn").forEach(btn => {
					btn.classList.remove("active", "positive", "negative");
				});
				
				// Set active state
				feedbackBtn.classList.add("active", "negative");
				negativeOptions.style.display = "block";
				
				// Show feedback options
				feedbackOptions.style.display = "block";
				
				// Update submit button state
				updateSubmitButtonState(feedbackSection);
			}).catch(error => {
				console.error("Error undoing positive feedback:", error);
			});
			return;
		}

		const feedbackOptions = feedbackSection.querySelector(".feedback-options");
		const negativeOptions = feedbackOptions.querySelector(".negative-options");
		
		// Reset other feedback buttons in the same section
		feedbackSection.querySelectorAll(".feedback-btn").forEach(btn => {
			btn.classList.remove("active", "positive", "negative");
		});
		
		// Set active state
		feedbackBtn.classList.add("active", "negative");
		negativeOptions.style.display = "block";
		
		// Show feedback options
		feedbackOptions.style.display = "block";
		
		// Update submit button state
		updateSubmitButtonState(feedbackSection);
		return;
	}
}

function submitNegativeFeedback(messageId, feedbackSection) {
	const feedbackOptions = feedbackSection.querySelector(".feedback-options");
	const negativeOptions = feedbackOptions.querySelector(".negative-options");
	
	// Collect selected chip texts
	const selectedCategories = [];
	negativeOptions.querySelectorAll(".feedback-chip.selected").forEach(chip => {
		selectedCategories.push(chip.textContent.trim());
	});
	
	// Get textarea value
	const comment = negativeOptions.querySelector(".feedback-textarea").value.trim();
	
	// Create payload
	const dislikePayload = {
		feedback: "dislike",
		category: selectedCategories,
		comment: comment
	};
	
	const cId = messageId;

	submitUserFeedbackBot({ messageId: cId, payload: dislikePayload }).then(response => {
		console.log("Negative feedback submitted:", response);
		window.dispatchEvent(new Event("feedbackSubmitted"));
	
		// Hide feedback options modal
		feedbackOptions.style.display = "none";
		negativeOptions.style.display = "none";
		
		// Add submitted state to the button
		const feedbackBtn = feedbackSection.querySelector('.feedback-btn[data-feedback-type="negative"]');
		feedbackBtn.classList.remove("active");
		feedbackBtn.classList.add("submitted", "negative");
		
		// Reset form for next use
		negativeOptions.querySelectorAll(".feedback-chip").forEach(chip => {
			chip.classList.remove("selected");
		});
		negativeOptions.querySelector(".feedback-textarea").value = "";
		
	}).catch(error => {
		console.error("Error submitting negative feedback:", error);
	});
	
	return;
}

function setupSourcesAccordionListeners() {
	const wrapper = document.querySelector(".bot-conversation-wrapper");
	if (!wrapper) return;

	if (wrapper._sourcesAccordionListenerAttached) return;
	wrapper._sourcesAccordionListenerAttached = true;

	// Reset state on setup to ensure consistency
	resetSourcesOpenState();

	// Add MutationObserver to watch for DOM changes that might close popups
	if (!window.sourcesMutationObserver) {
		window.sourcesMutationObserver = new MutationObserver(function (
			mutations
		) {
			mutations.forEach(function (mutation) {
				if (mutation.type === "childList") {
					// Check if any sources-popup elements were removed
					mutation.removedNodes.forEach(function (node) {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const removedPopup = node.querySelector
								? node.querySelector(".sources-popup.active")
								: null;
							if (
								removedPopup ||
								(node.classList &&
									node.classList.contains("sources-popup") &&
									node.classList.contains("active"))
							) {
								if (window.sdkConfig) {
									window.sdkConfig.isSourcesOpen = false;
									window.dispatchEvent(
										new Event("sourcesOpenChange")
									);
								}
							}
						}
					});
				}
			});
		});

		// Start observing the document body for changes
		window.sourcesMutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// Add ESC key listener for closing popup
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" || e.keyCode === 27) {
			const activePopup = document.querySelector(".sources-popup.active");
			if (activePopup) {
				closeSourcesPopup(activePopup);
			}
		}
	});

	// Add document-level listener for popup close events (overlay, close button, etc.)
	document.addEventListener("click", function (e) {
		const closeBtn = e.target.closest(".sources-popup-close");
		const backBtn = e.target.closest(".sources-popup-back");
		const overlay = e.target.closest(".sources-popup-overlay");

		if (closeBtn || backBtn || overlay) {
			e.preventDefault();
			e.stopPropagation();
			const popup = e.target.closest(".sources-popup");
			closeSourcesPopup(popup);
			return;
		}
	});

	wrapper.addEventListener("click", function (e) {
		const sourcesToggle = e.target.closest(".sources-toggle-btn");
		if (sourcesToggle) {
			e.preventDefault();

			// Close any existing source popups before opening a new one
			closeAllSourcePopups();

			const popup = sourcesToggle
				.closest(".sourcesAccordionCntr")
				.querySelector(".sources-popup");
			if (popup) {
				popup.classList.add("active");
				document.body.style.overflow = "hidden";
				if (window.sdkConfig) {
					window.sdkConfig.isSourcesOpen = true;
					window.dispatchEvent(new Event("sourcesOpenChange"));
				}
			}
			return;
		}

		const sourceLink = e.target.closest(".source-link");
		if (sourceLink) {
			e.preventDefault();
			const url = sourceLink.getAttribute("href");
			if (url) {
				window.open(url, "_blank", "noopener,noreferrer");
			}
			return;
		}

		const downloadBtn = e.target.closest(".doc-download-btn");
		if (downloadBtn) {
			const docId = downloadBtn.getAttribute("data-doc-id");
			const docName = downloadBtn.getAttribute("data-doc-name");
			const dealId = downloadBtn.getAttribute("data-deal-id");

			// Show loader and hide doc name
			const loader = downloadBtn.querySelector(".download-loader");
			const docNameSpan = downloadBtn.querySelector(".doc-name");
			if (loader && docNameSpan) {
				loader.style.display = "inline-block";
				docNameSpan.style.display = "none";
			}
			downloadBtn.disabled = true;

			downloadDocument(docId, docName, dealId, downloadBtn);
			return;
		}

		// Feedback button handlers
		const feedbackBtn = e.target.closest(".feedback-btn");
		if (feedbackBtn) {
			e.preventDefault();
			const messageId = feedbackBtn.getAttribute("data-message-id");
			const feedbackType = feedbackBtn.getAttribute("data-feedback-type");
			const feedbackSection = feedbackBtn.closest(".feedback-section");
			
			// Use the refactored handleFeedback function
			handleFeedback(feedbackType, messageId, feedbackSection);
			return;
		}

		// Feedback chip handlers
		const feedbackChip = e.target.closest(".feedback-chip");
		if (feedbackChip) {
			e.preventDefault();
			feedbackChip.classList.toggle("selected");
			
			// Update submit button state
			const feedbackSection = feedbackChip.closest(".feedback-section");
			updateSubmitButtonState(feedbackSection);
			return;
		}

		// Feedback submit handler
		const submitBtn = e.target.closest(".feedback-submit-btn");
		if (submitBtn) {
			e.preventDefault();
			const messageId = submitBtn.getAttribute("data-message-id");
			const feedbackSection = document.querySelector(`.feedback-section[data-message-id="${messageId}"]`);
			
			// Use the refactored submitNegativeFeedback function
			submitNegativeFeedback(messageId, feedbackSection);
			return;
		}
	});

	// Add textarea input listener for feedback
	wrapper.addEventListener("input", function (e) {
		const textarea = e.target.closest(".feedback-textarea");
		if (textarea) {
			const feedbackSection = textarea.closest(".feedback-section");
			updateSubmitButtonState(feedbackSection);
		}
	});

	// Add document click listener to close feedback options when clicking outside
	document.addEventListener("click", function (e) {
		// Check if click is outside any feedback options
		const feedbackOptions = e.target.closest(".feedback-options");
		const feedbackBtn = e.target.closest(".feedback-btn");
		
		// If clicked outside feedback options and not on a feedback button
		if (!feedbackOptions && !feedbackBtn) {
			// Close all open feedback options
			document.querySelectorAll(".feedback-options").forEach(options => {
				if (options.style.display === "block") {
					options.style.display = "none";
					
					// Reset the associated feedback button state
					const feedbackSection = options.closest(".feedback-section");
					const activeBtn = feedbackSection.querySelector(".feedback-btn.active");
					if (activeBtn) {
						activeBtn.classList.remove("active", "positive", "negative");
					}
					
					// Reset form
					options.querySelectorAll(".feedback-chip").forEach(chip => {
						chip.classList.remove("selected");
					});
					options.querySelectorAll(".feedback-textarea").forEach(textarea => {
						textarea.value = "";
					});
				}
			});
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
	// Reset sources open state on every render to ensure consistency
	resetSourcesOpenState();

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
export default { render, setupTemplates };
