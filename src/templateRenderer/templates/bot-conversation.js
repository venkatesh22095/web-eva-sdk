// import BotConversation from "../chat/botAgent/getBotConversation.js"
import { isEmpty } from "lodash";
import BotConversation from "../../chat/botAgent/getBotConversation";
import TemplateComponents from "./index";
import { encodeHtml } from "../../utils/helpers";
import customMarkdownRenderer from "../utils/customMarkdownRenderer";
import {
	renderFeedbackSection,
	setupFeedbackEventListeners,
} from "./feedbackBotFlow/feedback-template";

function escapeHTML(str) {
	if (!str) return "";
	return str
		?.replace(/&/g, "&amp;")
		?.replace(/</g, "&lt;")
		?.replace(/>/g, "&gt;")
		?.replace(/"/g, "&quot;")
		?.replace(/'/g, "&#039;");
}

function downloadDocument(docId, docName, dealId, btn, fundId) {
	const { url, token } = window.sdkConfig.customConfigURL || {};
	if (!url || !token || !docId || (!dealId && !fundId)) {
		alert("Missing download parameters.");
		showDocName(btn);
		return;
	}

	const downloadUrl = fundId
		? `${url}/funds/${fundId}/documents/${docId}/download`
		: `${url}/deals/${dealId}/documents/${docId}/download`;

	fetch(downloadUrl, {
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
			const fileUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = fileUrl;
			a.download = docName || "document";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(fileUrl);
			showDocName(btn);
		})
		.catch(() => {
			alert("Failed to download document.");
			showDocName(btn);
		});
}

function showDocumentViewer(
	docId,
	docName,
	dealId,
	sourceChunk,
	pageNumber,
	chunkTitle,
	fundId
) {
	// Create a custom event with document details
	const documentViewerEvent = new CustomEvent("showDocumentViewer", {
		detail: {
			docId: docId,
			docName: docName,
			dealId: dealId,
			fundId: fundId,
			sourceChunk: sourceChunk,
			pageNumber: pageNumber,
			chunkTitle: chunkTitle,
		},
	});

	window.dispatchEvent(documentViewerEvent);
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

// Helper to walk a DOM node and replace [n] references in all text nodes with tooltip spans
function replaceReferencesWithTooltips(rootNode, sources) {
	function walk(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const regex = /\[(\d+)\]/g;
			let match,
				lastIndex = 0,
				result = [];
			const text = node.textContent;
			let firstReferenceProcessed = false;

			while ((match = regex.exec(text)) !== null) {
				const idx = parseInt(match[1], 10) - 1;
				const source = sources[idx];
				result.push(
					document.createTextNode(text.slice(lastIndex, match.index))
				);
				if (source) {
					const docName = source.reference?.document_name || "";
					const span = document.createElement("span");
					span.className = "bc-source-ref";
					span.setAttribute("data-source-idx", idx);

					// Create tooltip container with proper isolation
					const tooltip = document.createElement("div");
					tooltip.className = "bc-source-tooltip";
					tooltip.style.cssText = `
						display: none;
						position: fixed;
						z-index: 9999;
						pointer-events: auto;
						opacity: 0;
						visibility: hidden;
						transition: opacity 0.2s ease, visibility 0.2s ease;
					`;

					// Build tooltip content with proper escaping
					let tooltipContent = `<div class="source-header"><span class="source-index">${match[1]}</span>`;
					if (source.title) {
						tooltipContent += `<span class="source-title">${escapeHTML(source.title)}</span>`;
					}
					tooltipContent += `</div>`;

					if (source.chunk) {
						tooltipContent += `<div class="source-content">${escapeHTML(source.chunk)}</div>`;
					}

					// Check if source has URL or needs download
					const ref = parseReference(source.reference);
					const hasUrl =
						(ref.url && typeof ref.url === "string") ||
						ref.isDirectUrl;

					// Get page number if available
					const pageNumber =
						ref.page_number || source.reference?.page_number;

					if (hasUrl) {
						tooltipContent += `<div class="source-footer">
							<a href="${encodeHtml(ref.url)}" target="_blank" rel="noopener noreferrer" class="source-link">
								<span class="url-icon-container url"></span>
								<span class="url-name">${encodeHtml(ref.url)}</span>
							</a>
						</div>`;
					} else if (ref.isSnpData) {
						tooltipContent += `<div class="source-footer">
							<div class="snp-data-reference">
								<span class="doc-icon-container snp"></span>
								<span class="text-content">${encodeHtml(ref.displayText)}</span>
							</div>
						</div>`;
					} else {
						tooltipContent += `<div class="source-footer">
							<button class="doc-download-btn" data-doc-id="${encodeHtml(ref.document_id || "")}" data-doc-name="${encodeHtml(docName)}" data-deal-id="${encodeHtml(ref.deal_id || "")}" data-fund-id="${encodeHtml(ref.fund_id || "")}" data-source-chunk="${encodeHtml(source.chunk || "")}" data-page-number="${encodeHtml(pageNumber || "")}" data-chunk-title="${encodeHtml(source.title || "")}">
								<span class="doc-icon-container ${getDocumentIconClass(docName)}"></span>
								<span class="doc-name">${encodeHtml(docName)}</span>
								<span class="download-loader" style="display: none;"></span>
							</button>
						</div>`;
					}

					tooltip.innerHTML = tooltipContent;

					// Create bordered reference number instead of plain text with brackets
					const refNumber = document.createElement("span");
					refNumber.className = "bc-ref-number";
					refNumber.textContent = match[1];
					span.appendChild(refNumber);
					span.appendChild(tooltip);

					// For the first occurrence of reference [1], hide the original and create a visible duplicate
					if (!firstReferenceProcessed && idx === 0) {
						// Hide the original first reference
						span.style.display = "none";
						result.push(span);

						// Create visible duplicate
						const duplicateSpan = document.createElement("span");
						duplicateSpan.className = "bc-source-ref";
						duplicateSpan.setAttribute("data-source-idx", idx);

						// Create duplicate tooltip
						const duplicateTooltip = document.createElement("div");
						duplicateTooltip.className = "bc-source-tooltip";
						duplicateTooltip.style.cssText = tooltip.style.cssText;
						duplicateTooltip.innerHTML = tooltipContent;

						// Create duplicate reference number
						const duplicateRefNumber =
							document.createElement("span");
						duplicateRefNumber.className = "bc-ref-number";
						duplicateRefNumber.textContent = match[1];
						duplicateSpan.appendChild(duplicateRefNumber);
						duplicateSpan.appendChild(duplicateTooltip);

						result.push(duplicateSpan);
						firstReferenceProcessed = true;
					} else {
						// For all other references, just add them normally
						result.push(span);
					}
				} else {
					result.push(document.createTextNode(match[0]));
				}
				lastIndex = regex.lastIndex;
			}
			if (lastIndex < text.length) {
				result.push(document.createTextNode(text.slice(lastIndex)));
			}
			if (result.length) {
				const frag = document.createDocumentFragment();
				result.forEach((n) => frag.appendChild(n));
				node.replaceWith(frag);
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			Array.from(node.childNodes).forEach(walk);
		}
	}
	walk(rootNode);
}

// Helper to inject SVG icons for all tooltips
function injectTooltipIcons(rootNode, sources) {
	// Skip if this rootNode is part of a tooltip
	if (rootNode.closest && rootNode.closest(".bc-source-tooltip")) {
		return;
	}

	rootNode.querySelectorAll(".bc-source-ref").forEach((ref) => {
		// Skip if this ref is inside a tooltip
		if (ref.closest(".bc-source-tooltip")) {
			return;
		}

		const idx = parseInt(ref.getAttribute("data-source-idx"), 10);
		const source = sources[idx];
		if (source) {
			const parsedRef = parseReference(source.reference);

			// Only inject SVG icons into icon containers that are NOT in tooltip footers
			const iconContainer = ref.querySelector(".doc-icon-container");
			if (iconContainer) {
				// Check if this icon container is inside a tooltip
				const isInTooltip = iconContainer.closest(".bc-source-tooltip");
				const isInTooltipFooter =
					iconContainer.closest(".source-footer");

				// Only inject if NOT in tooltip or tooltip footer
				if (!isInTooltip && !isInTooltipFooter) {
					iconContainer.innerHTML = "";

					if (parsedRef.isSnpData) {
						// For S&P data, add CSS class for styling
						iconContainer.classList.add("snp");
					} else {
						// For other document types, inject SVG icon
						const docName = source.reference?.document_name || "";
						const docIcon = getDocumentIcon(docName);
						if (docIcon) {
							const temp = document.createElement("div");
							temp.innerHTML = docIcon;
							const svg = temp.querySelector("svg");
							if (svg) iconContainer.appendChild(svg);
						}
					}
				}
			}
		}
	});
}

function renderQuestion(question, sources) {
	if (question) {
		if (sources && Array.isArray(sources) && sources.length > 0) {
			return renderContentWithSourceTooltips(question, sources);
		}
		return `${customMarkdownRenderer(escapeHTML(question))}`;
	}
	return "";
}

function renderAssistantQuestion(conversation, assistantIconTemplate, props) {
	let showFeedbackOption = window.sdkConfig.showFeedbackOption;
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

		let mainContent = questionContent;

		if (conversation?.status === "error") {
			mainContent =
				"We're unable to complete your request right now due to a server timeout or unexpected response. Please refresh or try again later.";
		} else if (typeof questionContent === "string") {
			const refIndex = questionContent.indexOf("#### REFERENCES");
			if (refIndex !== -1) {
				mainContent = questionContent.substring(0, refIndex).trim();
			}
		}

		const wrapper = document.createElement("div");
		wrapper.className = "bc-question-wrapper";
		wrapper.innerHTML = `
			${assistantIconTemplate}
			<div class="message-text">
				${thoughts?.length > 0 ? renderThoughts(conversation) : ""}
				<div class="bc-tooltip-content"></div>
				<div class="bottom-container">
					${sourcesHtml}
					${question && showFeedbackOption ? renderFeedbackSection(conversation, sources, props) : ""}
				</div>
			</div>
		`;
		const tooltipContainer = wrapper.querySelector(".bc-tooltip-content");
		if (tooltipContainer) {
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = customMarkdownRenderer(escapeHTML(mainContent));
			replaceReferencesWithTooltips(tempDiv, sources);
			injectTooltipIcons(tempDiv, sources);
			tooltipContainer.replaceChildren(...tempDiv.childNodes);

			// Set up tooltip listeners immediately after content is rendered
			requestAnimationFrame(() => {
				// Force reset the tooltip listeners flag to ensure first reference gets processed
				window.tooltipListenersAttached = false;
				setupSourceTooltipListeners();
			});
		}
		// Attach tooltip listeners if defined
		if (typeof setupSourceTooltipListeners === "function") {
			setTimeout(() => {
				// Force reset the tooltip listeners flag to ensure first reference gets processed
				window.tooltipListenersAttached = false;
				setupSourceTooltipListeners();
			}, 0);
		}
		return { html: wrapper.outerHTML, isHtml: true };
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
			const result = renderAssistantQuestion(
				conversation,
				assistantIconTemplate,
				props
			);
			if (result && result.isHtml) {
				content = result.html;
			} else {
				content = result;
			}
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
	} else if (conversation?.status === "error") {
		const result = renderAssistantQuestion(
			conversation,
			assistantIconTemplate
		);
		let content = result && result.isHtml ? result.html : result;
		return `
			<div class="completed">
			 <br/>
				${renderUserQuestion(conversation?.answer, userIconTemplate)}
			 <br/>
			${content}
			</div>
		`;
	} else {
		if (conversation?.templateType === "search_answer") {
			const result = renderAssistantQuestion(
				conversation,
				assistantIconTemplate,
				props
			);
			let content = result && result.isHtml ? result.html : result;
			return `
                <div class="completed">
					${content}
					<br/>
					${renderUserQuestion(conversation?.answer, userIconTemplate)}
					<br/>
                </div>
            `;
		} else if (conversation?.templateType === "bot_template") {
			const result = renderAssistantQuestion(
				conversation,
				assistantIconTemplate,
				props
			);
			let content = result && result.isHtml ? result.html : result;
			return `
				<div>
					${content}
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
			// Check if it includes search_snp_data
		if (ref === "SNP") {
			return { isSnpData: true, displayText: "S&P Capital IQ" };
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

function getDocumentIconClass(docName = "") {
	if (docName === "snp") return "snp";
	const extension = docName.split(".").pop()?.toLowerCase();
	if (["doc", "docx"].includes(extension)) return "doc";
	if (["xlsx", "xls", "csv"].includes(extension)) return "xls";
	if (extension === "pdf") return "pdf";
	return "generic";
}

function renderSourcesAccordion(sources = []) {
	if (!sources.length) return "";

	const sourceCount = sources.length;
	const sourcesText = `${sourceCount} ${sourceCount === 1 ? "Source" : "Sources"}`;

	let html = `
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

								// Get page number if available
								const pageNumber =
									ref.page_number ||
									source.reference?.page_number;

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
														<span class="url-icon-container url"></span>
														<span class="url-name">${encodeHtml(ref.url)}</span>
													</a>`
													: ref.isSnpData
														? `<div class="snp-data-reference">
														<span class="doc-icon-container snp"></span>
														<span class="text-content">${encodeHtml(ref.displayText)}</span>
													</div>`
														: `<button class="doc-download-btn" data-doc-id="${encodeHtml(ref.document_id || "")}" data-doc-name="${encodeHtml(docName)}" data-deal-id="${encodeHtml(ref.deal_id || "")}" data-fund-id="${encodeHtml(ref.fund_id || "")}" data-source-chunk="${encodeHtml(source.chunk || "")}" data-page-number="${encodeHtml(pageNumber || "")}" data-chunk-title="${encodeHtml(source.title || "")}">
														<span class="doc-icon-container ${getDocumentIconClass(docName)}"></span>
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

	return html;
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
			const fundId = downloadBtn.getAttribute("data-fund-id");
			const sourceChunk = downloadBtn.getAttribute("data-source-chunk");
			const pageNumber = downloadBtn.getAttribute("data-page-number");

			// Check file extension to determine action
			const fileExtension = docName.split(".").pop()?.toLowerCase();
			const isDownloadable = [
				"xls",
				"xlsx",
				"csv",
				"ppt",
				"pptx",
			].includes(fileExtension);

			if (isDownloadable) {
				// Show loader and hide doc name for download
				const loader = downloadBtn.querySelector(".download-loader");
				const docNameSpan = downloadBtn.querySelector(".doc-name");
				if (loader && docNameSpan) {
					loader.style.display = "inline-block";
					docNameSpan.style.display = "none";
				}
				downloadBtn.disabled = true;

				// Call downloadDocument for Excel and CSV files
				downloadDocument(docId, docName, dealId, downloadBtn, fundId);
			} else {
				// Call showDocumentViewer for other formats
				const chunkTitle = downloadBtn.getAttribute("data-chunk-title");
				showDocumentViewer(
					docId,
					docName,
					dealId,
					sourceChunk,
					pageNumber,
					chunkTitle,
					fundId
				);
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

function setupSourceTooltipListeners() {
	// Check if listeners are already attached to prevent duplicates
	if (window.tooltipListenersAttached) {
		// Even if already attached, ensure all current references have listeners
		document.querySelectorAll(".bc-source-ref").forEach((ref) => {
			if (!ref._tooltipListenersAttached) {
				attachTooltipListenersToRef(ref);
			}
		});
		return;
	}
	window.tooltipListenersAttached = true;

	document.querySelectorAll(".bc-source-ref").forEach((ref) => {
		attachTooltipListenersToRef(ref);
	});
}

function attachTooltipListenersToRef(ref) {
	// Mark this ref as having listeners attached
	ref._tooltipListenersAttached = true;

	let tooltipTimeout;
	let isTooltipVisible = false;
	let bridgeElement = null;
	let currentTooltip = null;

	// Add hover event listeners
	ref.addEventListener("mouseenter", function (e) {
		const tooltip = ref.querySelector(".bc-source-tooltip");
		if (tooltip && !isTooltipVisible) {
			if (tooltipTimeout) {
				clearTimeout(tooltipTimeout);
				tooltipTimeout = null;
			}

			// Set initial styles
			tooltip.style.maxWidth = "350px";
			tooltip.style.width = "auto";
			tooltip.style.maxHeight = "none";
			tooltip.style.overflowY = "visible";
			tooltip.style.display = "block";
			tooltip.style.opacity = "0";
			tooltip.style.visibility = "hidden";
			tooltip.style.position = "fixed";
			tooltip.style.left = "-9999px";
			tooltip.style.top = "-9999px";
			tooltip.style.pointerEvents = "auto";
			tooltip.style.zIndex = "9999";

			setTimeout(() => {
				const rect = ref.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;
				const availableWidth = viewportWidth - 40;
				const availableHeight = viewportHeight - 40;
				const maxTooltipHeight = Math.min(400, availableHeight * 0.8);

				tooltip.style.maxHeight = maxTooltipHeight + "px";
				tooltip.style.display = "flex";
				tooltip.style.flexDirection = "column";
				tooltip.style.overflow = "hidden";

				if (availableWidth < 350) {
					tooltip.style.maxWidth = availableWidth + "px";
					tooltip.style.width = availableWidth + "px";
				}

				const tooltipRect = tooltip.getBoundingClientRect();
				const tooltipWidth = tooltipRect.width;
				const tooltipHeight = Math.min(
					tooltipRect.height,
					maxTooltipHeight
				);

				// Calculate position
				let left = rect.left;
				let top = rect.bottom + 8;

				// Ensure tooltip stays within viewport
				if (left + tooltipWidth > viewportWidth - 20) {
					left = viewportWidth - tooltipWidth - 20;
				}
				if (left < 20) {
					left = 20;
				}

				// Position above if not enough space below
				if (top + tooltipHeight > viewportHeight - 20) {
					if (rect.top - tooltipHeight - 8 > 20) {
						top = rect.top - tooltipHeight - 8;
					} else {
						top = 20;
					}
				}

				// Final position validation
				if (top < 20) top = 20;
				if (top + tooltipHeight > viewportHeight - 20) {
					top = viewportHeight - tooltipHeight - 20;
				}

				// Set final position
				tooltip.style.left = left + "px";
				tooltip.style.top = top + "px";
				tooltip.style.opacity = "1";
				tooltip.style.visibility = "visible";
				tooltip.style.pointerEvents = "auto";
				isTooltipVisible = true;
				currentTooltip = tooltip;

				// Create bridge element only if tooltip is positioned below the reference
				if (top > rect.bottom) {
					bridgeElement = document.createElement("div");
					bridgeElement.style.cssText =
						"position: fixed;" +
						"left: " +
						Math.min(left, rect.left) +
						"px;" +
						"top: " +
						rect.bottom +
						"px;" +
						"width: " +
						Math.max(tooltipWidth, rect.width) +
						"px;" +
						"height: " +
						(top - rect.bottom) +
						"px;" +
						"pointer-events: auto;" +
						"z-index: 9998;" +
						"background: transparent;";
					bridgeElement.className = "tooltip-bridge";

					bridgeElement.addEventListener("mouseenter", function () {
						if (tooltipTimeout) {
							clearTimeout(tooltipTimeout);
							tooltipTimeout = null;
						}
					});

					bridgeElement.addEventListener("mouseleave", function () {
						tooltipTimeout = setTimeout(() => {
							hideTooltip(tooltip);
						}, 100);
					});

					document.body.appendChild(bridgeElement);
					tooltip._bridge = bridgeElement;
				}

				// Add tooltip listeners
				tooltip.addEventListener("mouseenter", function () {
					if (tooltipTimeout) {
						clearTimeout(tooltipTimeout);
						tooltipTimeout = null;
					}
				});

				tooltip.addEventListener("mouseleave", function () {
					tooltipTimeout = setTimeout(() => {
						hideTooltip(tooltip);
					}, 100);
				});
			}, 10);
		}
	});

	ref.addEventListener("mouseleave", function (e) {
		// Start timeout to hide tooltip when leaving reference
		// This will be cleared if mouse enters bridge or tooltip
		tooltipTimeout = setTimeout(() => {
			hideTooltip(ref.querySelector(".bc-source-tooltip"));
		}, 100);
	});

	// Add document-level mouse listener to catch when mouse leaves tooltip area
	document.addEventListener("mousemove", function (e) {
		if (currentTooltip && isTooltipVisible) {
			const tooltipRect = currentTooltip.getBoundingClientRect();
			const bridgeRect = bridgeElement
				? bridgeElement.getBoundingClientRect()
				: null;
			const refRect = ref.getBoundingClientRect();

			// Check if mouse is within any of the tooltip-related areas
			const isInTooltip =
				e.clientX >= tooltipRect.left &&
				e.clientX <= tooltipRect.right &&
				e.clientY >= tooltipRect.top &&
				e.clientY <= tooltipRect.bottom;

			const isInBridge = bridgeRect
				? e.clientX >= bridgeRect.left &&
					e.clientX <= bridgeRect.right &&
					e.clientY >= bridgeRect.top &&
					e.clientY <= bridgeRect.bottom
				: false;

			const isInRef =
				e.clientX >= refRect.left &&
				e.clientX <= refRect.right &&
				e.clientY >= refRect.top &&
				e.clientY <= refRect.bottom;

			// If mouse is not in any tooltip-related area, hide the tooltip
			if (!isInTooltip && !isInBridge && !isInRef) {
				if (tooltipTimeout) {
					clearTimeout(tooltipTimeout);
				}
				tooltipTimeout = setTimeout(() => {
					hideTooltip(currentTooltip);
				}, 50);
			} else {
				// Mouse is in tooltip area, clear any pending hide timeout
				if (tooltipTimeout) {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = null;
				}
			}
		}
	});

	function hideTooltip(tooltip) {
		if (!tooltip || !isTooltipVisible) return;

		isTooltipVisible = false;
		currentTooltip = null;

		if (tooltip._bridge) {
			document.body.removeChild(tooltip._bridge);
			tooltip._bridge = null;
			bridgeElement = null;
		}

		tooltip.style.opacity = "0";
		tooltip.style.visibility = "hidden";
		tooltip.style.pointerEvents = "none";

		setTimeout(() => {
			if (!isTooltipVisible) {
				tooltip.style.display = "none";
			}
		}, 200);
	}

	ref.addEventListener("click", function (e) {
		e.preventDefault();
		e.stopPropagation();
	});

	ref.removeEventListener("click", ref._downloadHandler);
	ref._downloadHandler = function (e) {
		const downloadBtn = e.target.closest(".doc-download-btn");
		if (downloadBtn) {
			e.preventDefault();
			e.stopPropagation();
			if (downloadBtn.disabled) {
				return;
			}
			const docId = downloadBtn.getAttribute("data-doc-id");
			const docName = downloadBtn.getAttribute("data-doc-name");
			const dealId = downloadBtn.getAttribute("data-deal-id");
			const fundId = downloadBtn.getAttribute("data-fund-id");
			const sourceChunk = downloadBtn.getAttribute("data-source-chunk");
			const pageNumber = downloadBtn.getAttribute("data-page-number");

			// Check file extension to determine action
			const fileExtension = docName.split(".").pop()?.toLowerCase();
			const isDownloadable = [
				"xls",
				"xlsx",
				"csv",
				"ppt",
				"pptx",
			].includes(fileExtension);

			// Close the tooltip first
			const tooltip = downloadBtn.closest(".bc-source-tooltip");
			if (tooltip) {
				hideTooltip(tooltip);
			}

			if (isDownloadable) {
				const loader = downloadBtn.querySelector(".download-loader");
				const docNameSpan = downloadBtn.querySelector(".doc-name");
				if (loader && docNameSpan) {
					loader.style.display = "inline-block";
					docNameSpan.style.display = "none";
				}
				downloadBtn.disabled = true;
				// Call downloadDocument for Excel and CSV files
				downloadDocument(docId, docName, dealId, downloadBtn, fundId);
			} else {
				// Call showDocumentViewer for other formats
				const chunkTitle = downloadBtn.getAttribute("data-chunk-title");
				showDocumentViewer(
					docId,
					docName,
					dealId,
					sourceChunk,
					pageNumber,
					chunkTitle,
					fundId
				);
			}
			return;
		}
	};
	ref.addEventListener("click", ref._downloadHandler);
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

	// Reset tooltip listeners flag to allow re-attachment
	window.tooltipListenersAttached = false;

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

	// Helper to ensure tooltip listeners are attached after DOM update
	function ensureTooltipListenersAttached(attempt = 0) {
		const tooltipRefs = document.querySelectorAll(".bc-source-ref");
		if (tooltipRefs.length > 0) {
			// Force setup even if already attached to ensure first reference gets processed
			window.tooltipListenersAttached = false;
			setupSourceTooltipListeners();
		} else if (attempt < 10) {
			requestAnimationFrame(() =>
				ensureTooltipListenersAttached(attempt + 1)
			);
		}
	}

	// Setup a new timer (short delay)
	window.accordionSetupTimer = setTimeout(() => {
		setupEventListeners(props?.botConversation, props);
		setupTemplates(props?.botConversation);
		ensureSourcesListenersAttached();
		ensureTooltipListenersAttached();
		setupFeedbackEventListeners();
	}, 50);

	return html;
}

export default { render, setupTemplates };
