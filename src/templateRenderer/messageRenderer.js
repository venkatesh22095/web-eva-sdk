import * as TemplateComponents from "./templates";
import * as ambiguityTemplate from "./templates/ambiguity-template";
import * as intentAmbiguityTemplate from "./templates/intent-ambiguity-template";
import * as gptFormTemplate from "./templates/gpt-form-template";
import * as actionSendEmail from "./templates/action-send-email";
import * as connectionProvider from "./templates/connection-provider";
import * as agentWelcomeTemplate from "./templates/agent-welcome-template";
import * as interruptionTemplate from "./templates/interruption-template";
import * as searchAnswer from "./templates/search-answer";
import * as multiIntentExecution from "./templates/multi-intent-execution-template";
import * as multiResponses from "./templates/multi-responses-template";
import * as holdConversation from "./templates/hold-conversation-template";
import * as errorMessage from "./templates/error-message-template";
import * as genericErrorTemplate from "./templates/generic-error-template";
import * as feedbackTemplate from "./templates/feedback-template";
import { encodeHtml, SHOELACE_ATTRS, SHOELACE_TAGS } from "./utils/helper";
import { convertTemplateToHtml } from "../utils/helpers";
import botConversation from "./templates/bot-conversation";
import customMarkdownRenderer from "./utils/customMarkdownRenderer";
import * as itemsAmbiguityTemplate from "./templates/items-ambiguity-template";
import AnsFromChip from "./templates/ansFromChip";
import DOMPurify from "dompurify";

export function render(
	data,
	{ assistantIconTemplate, userIconTemplate, loadingText }
) {
	try {
		let loading = data?.loading;

		if(data?.botConversation && Object.values(data?.botConversation)[0]?.thoughts?.length > 0){
			loading = false;
		}

		if(loading){

			return TemplateComponents.wrapTemplate(
				TemplateComponents.renderLoading(
					data,
					assistantIconTemplate,
					loadingText,
					userIconTemplate
				),
				{ type: "loading", id: data.id }
			);
		} 


		let content = "";
	
		if (
			data?.question &&
			shouldShowQuestion(data?.templateType, data?.botConversation)
		) {
			content += TemplateComponents.renderQuestionBubble(
				data,
				userIconTemplate
			);
		}

		// Render template content based on type
		if (data.botConversation || data.viewType === "threadView") {
			let html = renderTemplateContent(
					data,
					assistantIconTemplate,
					userIconTemplate,
					loadingText
				)
			content += DOMPurify.sanitize(html, {
					ADD_TAGS: SHOELACE_TAGS,
					ADD_ATTR: SHOELACE_ATTRS,
				});
		} else {
			content += customMarkdownRenderer(
				renderTemplateContent(
					data,
					assistantIconTemplate,
					userIconTemplate,
					loadingText
				)
			);
		}
		if (!!data?.sources?.length && data?.templateType === "search_answer") {
			let chip = AnsFromChip({ item: data });
			content += chip;
		}
		let ele = TemplateComponents?.wrapTemplate(content, {
			type: data?.templateType,
			id: data?.id,
			className: data?.className,
		});
		return ele;
	} catch (error) {
		return genericErrorTemplate.render({
			error: {
				message: "Something went wrong, please try again later",
				code: "RENDER_ERROR",
			},
		});
	}
}

export function renderTemplateContent(
	data,
	assistantIconTemplate,
	userIconTemplate,
	loadingText
) {
	let htmlTemplate = "";
	if (data.viewType === "threadView" || data.botConversation) {
		htmlTemplate = botConversation.render(
			data,
			assistantIconTemplate,
			userIconTemplate,
			loadingText
		);
		return `<div class="message-bubble answer"> 
					<div class="answerCntr">${htmlTemplate}</div>
				</div>`;
	} else if (data?.status === "terminated") {
		return `<div class="message-bubble answer"> 
					I see you interrupted the answer generation. Please feel free to provide more details or let me know how can I assist you further
				</div>`;
	} else if (data?.error) {
		htmlTemplate = `<div class="message-bubble answer"> 
					We’re unable to complete your request right now due to a server timeout or unexpected response. Please refresh or try again later.
				</div>`;
	} else {
		switch (data.templateType) {
			case "resolve_ambiguity":
				htmlTemplate = ambiguityTemplate.render(data);
				break;

			case "intent_ambiguity":
				htmlTemplate = intentAmbiguityTemplate.render(data);
				break;

			case "action_send_email":
				htmlTemplate = actionSendEmail.render(data);
				break;

			case "integrations_action_form":
				htmlTemplate = integrationActionTemplate.render(data);
				break;

			case "interruption_template":
				htmlTemplate = interruptionTemplate.render(data);
				break;

			case "gpt_form_template":
				htmlTemplate = gptFormTemplate.render(data);
				break;

			case "action_send_slack_message":
				htmlTemplate = actionSendSlackMessage.render(data);
				break;

			case "connection_provider":
			case "admin_config_action":
			case "error_message":
				htmlTemplate = connectionProvider.render({
					...data,
					llm: data.templateType !== "connection_provider",
					error: data.templateType === "error_message",
				});
				break;

			case "agent_welcome_template":
				htmlTemplate = agentWelcomeTemplate.render(data);
				break;
			// case "bot_template":
			// 	console.log("bottttt", data.template_html);
			// 	htmlTemplate = renderBotConversation(data);
			// 	break;

			case "search_answer":
			case "search_results":
				htmlTemplate = searchAnswer.render(data);
				break;

			case "multi_intent_execution":
				htmlTemplate = multiIntentExecution.render(data);
				break;

			case "multi_responses":
				htmlTemplate = multiResponses.render(data);
				break;

			case "hold_conversation":
				htmlTemplate = holdConversation.render(data);
				break;
			case "items_ambiguity_template":
				htmlTemplate = itemsAmbiguityTemplate.render(data);
				break;
			default:
				if(data.hasOwnProperty("templateType")){
					htmlTemplate = TemplateComponents.renderAnswerBubble(data);
					return htmlTemplate;
				}

				htmlTemplate = `<div class="message-bubble answer"> 
								We’re unable to complete your request right now due to a server timeout or unexpected response. Please refresh or try again later.
								</div>`
				
				
		}
	}
	// Add feedback if supported
	// if (supportsFeedback(data.templateType)) {
	// 	htmlTemplate += feedbackTemplate.render(data);
	// }
	return `<div class="message-bubble answer"> ${
		assistantIconTemplate ? assistantIconTemplate : ""
	} <div class="answerCntr">${htmlTemplate}</div>
	</div>`;
}

export function renderBotConversation(data) {
	let content = "";

	// Show transfer message for thread conversations
	if (
		data.thread &&
		data.sources?.[0]?.title &&
		data.status !== "terminated"
	) {
		content += `
            <div class='generating-answer-block mb-30'>
                <div class='generating-answer-block-item'>
                    <div class='icon'>
                        ${TemplateComponents.renderIcon("TickMark", {
							size: 18,
						})}
                    </div>
                    <div class='msg'>
                        <span>${encodeHtml(
							`Transferring to: "${data.sources[0].title}" agent`
						)}</span>
                    </div>
                </div>
            </div>
        `;
	}

	if (data.status === "terminated") {
		return `
            <div class="threadName">
                I see you interrupted the answer generation. Please feel free to provide more details or let me know how can I assist you further
            </div>
        `;
	}

	return content;
	// + TemplateComponents.renderBotConversation(data);
}

export function shouldShowQuestion(templateType, bot) {
	const noQuestionTemplates = [
		"hold_conversation",
		"error_message",
		"agent_welcome",
		"generic_error",
	];
	// if ( templateType === "error_template") return true;
	return !noQuestionTemplates.includes(templateType);
}

export function supportsFeedback(templateType) {
	const feedbackTemplates = ["search_answer", "multi_responses", "gpt_form"];
	return feedbackTemplates.includes(templateType);
}

// Create a default export object for backward compatibility
const MessageRenderer = {
	render,
	renderTemplateContent,
	renderBotConversation,
	shouldShowQuestion,
	supportsFeedback,
};

export default MessageRenderer;
