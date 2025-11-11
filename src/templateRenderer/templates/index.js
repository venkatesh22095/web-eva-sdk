import { encodeHtml } from "../utils/helper";
import * as responseQueryFlow from "./response-query-flow";
import * as copyQuestion from "./copy-question";
import store from "../../redux/store";
import { convertToTimeFormat } from "../../utils/helpers";
// import { encodeHtml } from "../utils/helper";

/**
 * Render a question bubble
 * @param {Object} data Question data
 * @returns {string} HTML string
 */
export function renderQuestionBubble(data, userIconTemplate = false, displayTimestamp = true) {
	const { question, timestamp, icon} = data;
    if(data?.isTask) return "";
	return `
        <div class="message-bubble question ${data?.isTask ? 'task-item' : ''}">
            <div class="message-content">  
                <div class="user-content">
                    ${userIconTemplate ? renderUserIconTemplate() : ""}
                    ${displayTimestamp ? renderQuestionBubbleTimeStamp(timestamp) : ""}
                </div>
                <div class="question-content">
                    ${copyQuestion.render(data)}                
                    <div class="message-text" id="message-text-${data?.messageId || data?.reqId}">                    
                        ${encodeHtml(question)}
                    </div>
                </div>                
            </div>
        </div>
        `;
}

/**
 * ${userIconTemplate ? userIconTemplate : ""}
 * Render an answer bubble
 * @param {Object} data Answer data
 * @returns {string} HTML string
 */
export function renderAnswerBubble(data) {
	const { answer, timestamp, icon, source, status } = data;

	return `
        <div class="${status || ""}" >
            ${
				icon
					? `
                <div class="bot-icon">
                    <img src="${encodeHtml(icon)}" alt="${encodeHtml(
							source || "Bot"
					  )}" />
                </div>
            `
					: ""
			}
    <div class="message-content">
        <div class="message-text">
            ${typeof answer === "string" ? encodeHtml(answer) : answer}
        </div>
        ${
			timestamp
				? `
                    <div class="message-timestamp">${encodeHtml(
						timestamp
					)}</div>
                `
				: ""
		}
        ${
			source
				? `
                    <div class="message-source">${encodeHtml(source)}</div>
                `
				: ""
		}
    </div>
        </ >
        `;
}

/**
 * Render a loading indicator
 * @param {Object} data Loading data
 * @returns {string} HTML string
 */
export function renderLoading(
	data = {},
	assistantIconTemplate,
	loadingText,
	userIconTemplate,
    displayTimestamp = true
) {
	// const { text = "Thinking...", icon } = data;
	const text = loadingText || "Thinking...";
    let html = "";
    if(data?.isTask){
        html = `<div class="task-item-loader">Loading...</div>`
    }else{
        html = ` <div class="message-bubble question">
                    <div class="message-content"> 
                        <div class="user-content">
                            ${userIconTemplate ? renderUserIconTemplate() : ""}
                            ${displayTimestamp ? renderQuestionBubbleTimeStamp(data.timestamp) : ""}
                        </div>
                        <div class="question-content">
                            ${copyQuestion.render(data)}
                            <div class="message-text">                    
                                ${encodeHtml(data?.question)}
                            </div> 
                        </div> 
                    </div>
            </div>
            <div class="message-bubble loading">
                ${assistantIconTemplate ? assistantIconTemplate : ""}
                ${responseQueryFlow.render(data)}
            </div>`
    }
	return html;
}

/**
 * Wrap template content in a message container
 * @param {string} content Template content
 * @param {Object} data Template data
 * @returns {string} HTML string
 */
export function wrapTemplate(content, data) {
	const { type, className = "", id } = data;
	return `<div class="message-container ${type || ""} ${className}" ${
		id ? `id="${id}"` : ""
	}>
            ${content}    
        </div > `;
}

/**
 * Render error state
 * @param {Object} data Error data
 * @returns {string} HTML string
 */
export function renderError(data) {
	const { message, code, icon, assistantIconTemplate } = data;

	return `
    <div class="message-bubble answer">
        ${assistantIconTemplate}
        <div class="message-bubble error" >
            ${
				icon
					? `
                <div class="error-icon">
                    <img src="${encodeHtml(icon)}" alt="Error" />
                </div>
            `
					: ""
			}
            <div class="message-content">
                <div class="error-message">${
					encodeHtml(message) ||
					"Sorry, there seems to be a problem connecting to the server. Please try again later."
				}</div>
                ${
					code
						? `
                            <div class="error-code">Error code: ${encodeHtml(
								code
							)}</div>
                        `
						: ""
				}
            </div>
        </div >
    </div>
    `;
}

export function renderAppAvatar(appName = "AI4Work", appIcon = "https://ai4web.com/wp-content/uploads/2023/01/cropped-cropped-ai4web-logo-1-180x180.png", timestamp) {
    return `
    <div class='question-profile'>
        <div class="avatar">
            <img src="${appIcon}" alt="${appName}" />
        </div>
        <span class="username"> ${appName} </span>        
        <span class="message-timestamp">${convertToTimeFormat(timestamp)}</span>
    </div>
    `
}

/**
 * Render feedback buttons
 * @param {Object} data Feedback data
 * @returns {string} HTML string
 */
export function renderFeedback(data) {
	const { enabled = true } = data;

	if (!enabled) return "";

	return `
        < div class="message-feedback" >
            <button class="feedback-btn" data-value="positive" aria-label="Helpful">
                <svg class="thumbs-up" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            <button class="feedback-btn" data-value="negative" aria-label="Not Helpful">
                <svg class="thumbs-down" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        </div >
        `;
}

export const renderIcon = (icon) => {
	// Your icon rendering logic
};

const renderUserIconTemplate = () => {
    const userProfile = store.getState().global.profile.data
    return `
    <div class='answer-profile'>
        <div class="avatar letter-avatar">
            ${userProfile?.fullName?.charAt(0)}
        </div>
        <span class="username"> ${userProfile?.fullName} </span>        
    </div>
    `
}

const renderQuestionBubbleTimeStamp = (timestamp) => {
    return `
    <div class="message-timestamp">${convertToTimeFormat(timestamp)}</div>
    `
}

// Create default export object for backward compatibility
const TemplateComponents = {
	renderQuestionBubble,
	renderAnswerBubble,
	renderLoading,
	wrapTemplate,
	renderError,
	renderFeedback,
    renderAppAvatar,
};

export default TemplateComponents;
