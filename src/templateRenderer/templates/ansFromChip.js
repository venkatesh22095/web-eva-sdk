import { htmlDecode, renderIcons, getFileExtension, getExtIcon, getDownloadIcon, encodeHtml } from "../../utils/helpers";
import AnsFromChipFunctionality from "../functionality/ansFromChip";
import { getTimeline, highlightQuotedText } from "../utils/helper";
import htmlTableRenderer from "./htmlTableRenderer";
import { createCopyIcon, createExport, createThumbsDown, createThumbsDownFilled, createThumbsUp, createThumbsUpFilled, setContextIcon, EllipsisVertical, Gmail, Outlookimg, Slackimg, Teamsimg, JiraCommentsIcon, RadioButtonChecked, tickMarkIcon, Close } from "../icons-library";
import store from "../../redux/store";
import { updateChatData } from "../../redux/globalSlice";
import { cloneDeep } from "lodash";
import * as feedbackTemplate from "./feedback-template";
import * as copyQuestion from "./copy-question";
import { initializeQuillEditor } from "../../utils/quillUtils";

const AnsFromChip = ({ item, regeneratingAnswer }) => {
	const regeneratingChipRenderer = () => {
		return `
            <div class="threadName">
                <span class="ansFrom">Answer from:</span>
                <span class="koraSpecDr">
                    <div class="contextIcon"></div>
                    <span class="krSpecName">${htmlDecode(
						item?.title || "No subject"
					)}</span>
                </span>
            </div>
        `;
	};

	// Get available actions based on enabled agents
	const getAvailableActions = () => {
		const items = [
			{ icon: Gmail({ size: 14 }), label: 'Gmail', actionType: "send", appId: "gmail" },
			{ icon: Outlookimg({ size: 14 }), label: 'O365 mail', actionType: "send", appId: 'outlook' },
			{ icon: Slackimg({ size: 14 }), label: 'Slack', actionType: "send", appId: 'slack' },
			{ icon: Teamsimg({ size: 14 }), label: 'Teams', actionType: "send", appId: 'msteams' },
			{ icon: JiraCommentsIcon({ size: 15 }), label: 'Create Jira Issue', actionType: "create", appId: 'jira' },
		];

		const state = store.getState();
		const allAgents = state?.global?.allAgents?.data?.agents;

		const preBuitAgents = allAgents?.filter(agent => agent?.custom === false && agent?.type === 'dataAgent')?.map(item => item?.appId);

		return items?.filter(item => preBuitAgents?.includes(item?.appId));
	};

	const relevantQuestionsRenderer = () => {
		let html = "";

		let relevantQuestionsHeader = `
            <div class="relevantQuestionsHeader" id = "relevantQuestions-${item?.id}">
                <span class="relevantQuestionsHeader">Relevant Questions</span>
            </div>
        `;
		html += relevantQuestionsHeader;

		if (
			item?.altQuestions?.showAltQuestions &&
			item?.altQuestions?.questions?.length > 0
		) {
			let relevantQuestions = item?.altQuestions?.questions
				?.map((question, i) => {
					return `
                    <div class="relevantQuestionsItem" id = "relevantQuestionsItem-${
						item?.id
					}-${i}">
                        ${highlightQuotedText(question)}
                    </div>
                `;
				})
				.join("");
			html += relevantQuestions;
		}

		return html;
	};

	const tableChipRenderer = () => {
		let body = "";

		const source = item?.sources?.[0] || {};
		const attachment = source.source === "attachment";
		const icon = renderIcons(
			source.source,
			source.extIcon,
			source.providerIcon || source.icon
		).outerHTML;

		body += `
            <div class="tableChipRenderer" id = "ansFromChip-${item?.id}">
                <span class="datachip">${
					item?.sources?.length > 1 ? "Data:" : "Answer From:"
				}</span>
                <div class="contextIcon${attachment ? " attachment" : ""}">
                    ${icon}
                </div>
                <span class="krSpecName">${htmlDecode(
					source.title || ""
				)}</span>
            </div>
        `;

		if (item?.showData) {
			let payload = {
				columnData: item?.data?.[0]?.columns,
				rowData: item?.data?.[0]?.rows,
				cso: item?.data?.[0]?.views?.[0]?.cso,
				id: item?.id || item?.cId || item?.pId,
				showAllData: item?.showAllData,
			};
			let html = htmlTableRenderer(payload);
			body += html;

			if (
				item?.sources?.[0]?.canSetAsSourceContext !== false &&
				(item?.context?.source === "jira" ||
					item?.context?.source === "hubspot" ||
					item?.context?.source === "zendesk")
			) {
				body += relevantQuestionsRenderer();
			}
		}
		return `<div class="ansFromChip">${body}</div>`;
	};

	const ansFromChip = () => {
		if (item?.sources?.length > 1) {
			return `
                <div class="leftWrapperBlock" id = "ansFromChip-${item?.id}">
                    <span class="ansFrom">Answer From :</span>
                    <span class="krSpecName">${item?.sources?.length} Sources</span>
                </div>

            `;
		} else {
			return `<span class="ansFrom">Answer from :</span>`;
		}
	};

	const singleSourceChipRenderer = (source) => {
		// const attachment = source?.source === 'attachment';
		const warning = source?.warning;
		const icon = renderIcons(
			source.source,
			source.extIcon || source.iconUrl,
			source.providerIcon || source.icon
		).outerHTML;

		return `
            <div class="leftWrapperBlock">
                <span class="koraSpecDr${
					warning ? " fromWarning" : ""
				}" id = "ansFromChip-${item?.id}">
                    <div class="contextIcon">
                        ${icon}
                    </div>
                    <span class="krSpecName">${htmlDecode(
						source?.title || "No subject"
					)}</span>                    
                </span>
				${
					warning
						? `<div class="warningText">${warning}</div>`
						: ""
				}
            </div>            
        `;
	};

	const chatFilterGroupRenderer = () => {
		if (!item?.showData || item?.sources?.length !== 1 || !item?.data) {
			return '';
		}

		let body = `<div class="chatFilterGroup">`;
		body += `<div class="threadListGroup">`;
		item?.data?.map((data, i) => {
			body += `<div class="threadListItem" key="${i}">
                                <div class='leftCol'>
                                ${renderIcons(data?.source, null)?.outerHTML}
                            </div>
                            <div class="rightCol">
                                <div class="leftDetails">
                                    <div class="namgeGroup">
                                        <div class="name" id = "listItem-${
											item?.id
										}-${data?.docId}">${data?.title}</div>
                                    </div>
                                    <div class='details'>
                                        <span class='dtName'>Sent by: 
                                            ${data?.fromEmail}, ${getTimeline(
								data?.date,
								"dayDateAndTime"
							)}
                                        </span>
                                    </div>
                                </div>
                                <div class="rightDetails">
                                    <div class="listView setContextDr">
                                        <div class="subText">
                                            <span class="dtText askFollowupButton"  id = "askFollowupButton-${
												item?.id
											}-${data?.docId}">Ask Followup
                                            </span>
                                        </div>
                                    </div> 
                                   <div class="openInNewTabIcon" id="openInNewTabIcon-${
										item?.id
									}-${data?.docId}">
                                        <span>
                                            <svg class="wa-ChangeLog" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5.83333 14.1667L14.1667 5.83334M14.1667 5.83334H5.83333M14.1667 5.83334V14.1667" stroke="#667085" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </span>
                                   </div>
                                </div>
                            </div>
                        </div>`;
		});
		body += `</div>`;
		body += `</div>`;

		return body;
	};

	const knowledgeChipRenderer = () => {
		let body = "";

		if (
			(!!item?.data?.length || item?.hasData) &&
			!item?.citationAnswers?.length
		) {
			body += `<div class="leftWrapperBlockCntr"><span class="ansFrom">Data:</span>`;
		} else {
			body += ansFromChip();
		}

		if (item?.sources?.length > 1 && item?.showMultiSourceList) {
			const multiSourceList = item?.sources
				?.map(
					(_, i) => `
                <div class="multiSourceListItem" key="${i}" id = "multiSourceListItem-${item?.id}-${_?.docId}">${_?.title}</div>
                <button class="askFollowupButton" id = "askFollowupButton-${item?.id}-${_?.docId}">Ask Followup</button>
            `
				)
				.join("");

			body += `<div class="MultiSourceListView">${multiSourceList}</div>`;
		}

		if (item?.sources?.length === 1) {
			body += singleSourceChipRenderer(item.sources[0]);
		}

		return `<div class="ansFromChip">${body}</div>`;
	};

	const getDataValueforMultiAnswer = (id, value, index) => {
		let contextKey = Object.keys(
			item?.content?.formData?.contextFields
		)?.[0];
		let responseKey = item?.content?.formFields?.responseFields?.[0]?.key;
		let requiredField;
		let selectedFormField;
		if (value === contextKey) {
			selectedFormField = id === "0" ? "Initial Input" : `Response ${id}`;
		} else if (value === responseKey) {
			requiredField = item?.content?.formFields?.responseFields?.[0];
			selectedFormField = requiredField?.value?.choices?.find(
				(data) => data?.id === id
			)?.label;
		} else {
			requiredField = item?.content?.formFields?.paramFields?.find(
				(form) => form?.key === value
			);
			selectedFormField = requiredField?.value?.choices?.find(
				(data) => data?.id === id?.toLowerCase()
			)?.label;
		}
		return selectedFormField;
	};

	const getMultiDataValueForMultiAnswer = (values, value, index) => {
		let selectedLabels = [];
		values?.forEach((key) => {
			let requiredField = item?.content?.formFields?.paramFields?.find(
				(form) => form?.key === value
			);
			let selectedFormField = requiredField?.value?.choices?.find(
				(data) => data?.id === key
			)?.label;
			if (selectedFormField) {
				selectedLabels.push(selectedFormField);
			}
		});
		return selectedLabels.join(", ");
	};

	const multiAnswerChipRenderer = () => {
		let html = "";
		const contextKey = item?.content?.formData?.contextFields
			? Object.keys(item?.content?.formData?.contextFields)?.[0]
			: "";
		const responseLength = item?.content?.formData?.requestParams?.length;

		const contextValue =
			item?.content?.formData?.contextFields?.[contextKey]?.type === "file" 
											? item?.content?.formData?.contextFields?.[contextKey]?.value?.[0]?.title 
											: item?.content?.formData?.contextFields?.[contextKey]?.value || "";
		if (
			Object.keys(item?.content?.formData?.contextFields || {}).length > 0
		) {
			html += `
                <div class='m-0 multiresponse'>
                    <div class='responseHeader'>Context</div>
                    <div class='tvInputGroup'>
                        <div class='grpInput'>
                            <textarea rows="5" cols="30" readonly>${contextValue}</textarea>
                        </div>
                    </div>
                </div>
            `;
		}

		item?.content?.formData?.requestParams?.forEach((parameter, i) => {
			html += `<div class="m-0 multiresponse">`;

			if (responseLength > 1) {
				html += `<div class='responseHeader'>Response ${i + 1}</div>`;
			}

			Object.keys(parameter?.fields).forEach((data) => {
				let totalKeys = [];
				item?.content?.formFields?.paramFields?.forEach((param) =>
					totalKeys.push(param)
				);
				totalKeys.unshift(item.content.formFields?.responseFields?.[0]);
				totalKeys.unshift(item.content.formFields?.contextFields?.[0]);

				let dataKey = totalKeys?.find((obj) => obj?.key === data);
				let label =
					dataKey?.label || data[0].toUpperCase() + data.slice(1);

				html += `<div class='tvInputGroup'>`;
				html += `<div class='grpName'><div class='nameTitle'>${label}</div></div>`;

				if (data.toLowerCase() === "content") {
					if (parameter?.fields?.[data]?.type === "file") {
						html += `
                            <div class='grpInput'>
                                <div class='uploadedFile'>
                                    <div class='uploadedChip'>
                                        <div class='upImg'><img src="${getExtIcon(
											getFileExtension(
												parameter?.fields?.[data]?.title
											)
										)}" alt='' /></div>
                                        <div class='upText'>${
											parameter?.fields?.[data]?.title ||
											"file"
										}</div>
                                        <div class='downloadImg'>
                                            <img src="${getDownloadIcon()}" alt='' width="16"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
					} else {
						const val =
							parameter?.fields?.[data]?.value === "0"
								? "Initial Response"
								: `Response ${parameter?.fields?.[data]?.value}`;
						html += `
                            <div class='grpInput'>
                                <input type="text" readonly value="${val}" />
                            </div>
                        `;
					}
				} else {
					html += `<div class='grpInput'>`;

					if (data.toLowerCase() === "prompt") {
						const parsed = parameter?.fields?.prompt?.value || parameter?.fields?.prompt;
						const editorId = `quill-prompt-editor-${item?.id}-${Date.now()}`;
						
						html += `<div id="${editorId}" class="quill-prompt-container" style="height: 200px; border: 1px solid #ccc;"></div>`;
												
						initializeQuillEditor(editorId, parsed);
					} else {
						const field = parameter?.fields?.[data];
						const fieldValue =
							field?.type === "file"
								? field?.value?.length > 0 
											? field?.value?.[0]?.title 
											: ""
								: field?.title || field?.value;

						if (field?.type === "simpleText") {
							html += `<div class='grpInput answerFromChip'><input type="text" readonly value="${fieldValue}" /></div>`;
						} else if (field?.type === "dropdown") {
							let dropdownValue = Array.isArray(field?.value)
								? getMultiDataValueForMultiAnswer(
										field?.value,
										data,
										i
								  )
								: getDataValueforMultiAnswer(
										field?.value,
										data,
										i
								  );
							html += `<div class='grpInput answerFromChip'><input type="text" readonly value="${dropdownValue}" /></div>`;
						} else {
							html += `<div class='grpInput answerFromChip'><input type="text" readonly value="${fieldValue}" /></div>`;
						}
					}

					html += `</div>`; // end .grpInput
				}

				html += `</div>`; // end .tvInputGroup
			});

			html += `</div>`; // end .multiresponse
		});

		return html;
	};
	
	const copyAnswerChip = () => {
		return `
			<div class="copyAnswerButton"title="Copy Response" id="copyAnswerButton-${item?.messageId}">
			${copyQuestion.render(item, 'answer')}
			</div>
		`;
	}
/*feedbackTemplate */
	const feedbackChip = () => {
		return `
			<div class="feedbackChip">
			    ${item?.feedback === "like" ? 
					`<div class="feedbackLikeButton ${item?.feedback === "like" ? "active" : ""}" id="feedbackLikeButton-${item?.messageId}" title="Helpful">${createThumbsUpFilled({ size: 16, color: "#12B76A" })}</div>` 
					:
					`<div class="feedbackLikeButton" id="feedbackLikeButton-${item?.messageId}" title="Helpful">${createThumbsUp({ size: 16, color: "#667085" })}</div>`
				}
				${item?.feedback === "dislike" ? 
					`<div class="feedbackDislikeButton ${item?.feedback === "dislike" ? "active" : ""}" id="feedbackDislikeButton-${item?.messageId}" title="Not Helpful">${createThumbsDownFilled({ size: 16, color: "#F04438" })}</div>` 
					: 
					`<div class="feedbackDislikeButton" id="feedbackDislikeButton-${item?.messageId}" title="Not Helpful">${createThumbsDown({ size: 16, color: "#667085" })}</div>`
				}
				${renderFeedbackForm()}
			</div>
		`;
	}

	const exportWordChip = () => {
		return `
			<div class="exportWordButton" id="exportWordButton-${item?.messageId}" title="Export Response">${createExport({ size: 16, color: "#667085" })}</div>
		`;
	}

	const setContextChip = () => {
		return `
			<div class="setContextButton" id="setContextButton-${item?.messageId}" title="Set as Context">${setContextIcon({ size: 16, color: "#667085" })}</div>
		`;
	}

	const renderFeedbackForm = () => {
		// Feedback options array
		const feedbackOptions = [
			{ label: "Not factually correct", id: 0, active: false },
			{ label: "Intent mismatch", id: 1, active: false },
			{ label: "Delayed response", id: 2, active: false },
			{ label: "Incorrect source", id: 3, active: false },
			{ label: "Other", id: 4, active: false }
		];

		// Generate Shoelace button tags for feedback options
		const feedbackOptionsHtml = feedbackOptions.map(option => 
			`<button 
				class="feedbackChip ${option.active ? 'selectedChip' : ''}" 
				data-feedback-id="${option.id}" 
				data-message-id="${item?.messageId}">
				<div class="textsuggest">${option.label}</div>
				<div class='tickIcon'>${tickMarkIcon({ size: 10, color: "#475467" })}</div>
			</button>`
		).join('');

		return `
        <sl-popup 
			id="feedbackPopup-${item?.messageId}" 
			class="feedback-popup"
			placement="top-end" 
			strategy="absolute"
			auto-size="vertical">
			<div class="p-overlaypanel feedbackDownvoteOverlay">
				<div class="p-overlaypanel-content">
					<div class="downVoteOverlayData">
						<div class='disagreefeedbackbox'>
							<div class='disagreeheadertext'>Reasons for downvoting (optional)</div>
							<div class='feedbacklist'>
								${feedbackOptionsHtml}
							</div>
							<div class='commentsInput'>
                                <sl-textarea 
									placeholder="Additional comments.."
									resize="vertical"
									rows="3"
									id="feedbackInput-${item?.messageId}">
									${encodeHtml(item?.feedback?.comment || "")}
								</sl-textarea>
                            </div>
							<div class='submitfeedbackwrap'>
								<div class="feedbacksuccesstext" style="display: none;">
									<div class='radiocheckbtn'>${RadioButtonChecked({ size: 18})}</div>
									<div class='recievedfeedbacktext'>Thanks for your feedback</div>
								</div>
								<button
									data-action="submit-feedback" 
									data-message-id="${item?.messageId}"
									class="kr-primary-btn-black btn-sm disable"
									disabled>
									Submit
								</button>
                            </div>
						</div>
					</div>
				</div>
			</div>
			
		</sl-popup>
    `;
	}

	/*need to creata a menufunction that displays a shoelace menu on clicking */
	const threeDotMenu = () => {
		const messageId = item?.messageId || item?.id;
		
		
		// Get available integration actions
		const availableActions = getAvailableActions();
		
		// Generate Shoelace menu items for integration actions
		const integrationMenuItems = availableActions.map(action => `
			<button class="menu-item" data-menu-action="${action.appId}" data-action-type="integration">
				<div class="menu-item-icon">
					${action.icon}
				</div>
				<div class="menu-item-label">
					${action.label}
				</div>
			</button>
		`).join('');
		
		return `
			<div class="three-dot-menu-container">
				<sl-dropdown>
					<button class="three-dot-trigger" data-three-dot-trigger="${messageId}" title="More options" slot="trigger">${EllipsisVertical({ size: 16, color: "#667085" })}</button>				
					<sl-menu class="three-dot-dropdown" data-three-dot-dropdown="${messageId}">
						${integrationMenuItems}
					</sl-menu>
				</sl-dropdown>
			</div>
		`;
	}
	

	const renderChip = () => {
		let chipHTML = "";

		if (regeneratingAnswer) {
			chipHTML = regeneratingChipRenderer();
		} else if (item?.viewType === "table") {
			chipHTML = tableChipRenderer();
		} else {
			chipHTML = knowledgeChipRenderer();
			if (item?.showGPTDialog) {
				// Check if dialog already exists to prevent duplicates
				const existingDialog = document.getElementById(`gptDialog-${item?.id}`);
				if (!existingDialog) {
					const source = item?.sources?.[0] || {};
					const icon = renderIcons(
						source.source,
						source.extIcon || source.iconUrl,
						source.providerIcon || source.icon
					).outerHTML;
					const title = htmlDecode(source?.title || item?.title || "No subject");
					
					let html = `
	                    <sl-dialog class="gpt-form-dialog" id="gptDialog-${
							item?.id
						}" label="">
							<div class="gpt-form-dialog-header">
								<div class="left-section">
									<div class="gpt-form-dialog-header-icon">
										${icon}
									</div>
									<div class="gpt-form-dialog-header-title">
										${title}
									</div>
								</div>
								<div class="right-section" id="closeDialog-${item?.id}">
									${Close({ size: 12, color: "#667085" })}
								</div>
							</div>
	                        <div class="formModalContent">
	                            ${multiAnswerChipRenderer()}
	                        </div>
	                    </sl-dialog>
	                `;
					const container = document.createElement("div");
					container.innerHTML = html;
					const dialog = container.firstElementChild;
					document.body.appendChild(dialog);
					
					// Add close button functionality
					const closeButton = document.getElementById(`closeDialog-${item?.id}`);
					if (closeButton) {
						closeButton.addEventListener('click', () => {
							dialog.hide();
						});
					}
					
					// Show the dialog
					dialog.show();
					
					
					dialog.addEventListener('sl-hide', () => {
						// Update state to set showGPTDialog = false
						try {
							let state = store.getState()?.global;
							let _questions = cloneDeep(state?.questions);
							let constId = item?.reqId || item?.id;
							
							if (_questions[constId]) {
								_questions[constId].showGPTDialog = false;
								store.dispatch(updateChatData(_questions));
								console.log('Dialog closed - showGPTDialog set to false for:', constId);
							}
						} catch (error) {
							console.error('Error updating showGPTDialog state:', error);
						}
						
						// Remove dialog from DOM after state update
						setTimeout(() => {
							if (document.body.contains(dialog)) {
								document.body.removeChild(dialog);
							}
						}, 300); 
					});
				} else {					
					existingDialog.show();
				}
			}
		}
		let actionChipsHTML = `<div class="answerActionChips">`;
		// Add copy answer chip if answer exists
		if (item?.answer) {
			actionChipsHTML += copyAnswerChip();
		}

		// Add export to Word chip if answer exists
		if (item?.answer) {
			actionChipsHTML += exportWordChip();
		}
		if(item?.sources?.[0]?.canSetAsSourceContext !== false) {
			actionChipsHTML += setContextChip();
		}

		if(!item?.disableFeedback) {
			actionChipsHTML += feedbackChip();			
		}
		
		// Add three dot menu
		actionChipsHTML += threeDotMenu();
		
		actionChipsHTML += `</div>`;

		// Insert action chips inside .ansFromChip if present
		if (chipHTML.includes('class="ansFromChip"')) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = chipHTML;
			const ansFromChipDiv = tempDiv.querySelector('.ansFromChip');
			if (ansFromChipDiv) {
				ansFromChipDiv.insertAdjacentHTML('beforeend', actionChipsHTML);
				chipHTML = tempDiv.innerHTML;
			}
		} else {
			chipHTML += actionChipsHTML;
		}

		// Generate the chat filter group content 
		const chatFilterGroupHTML = chatFilterGroupRenderer();
		
		// Add chatFilterGroup inside answerFromChipDiv but outside chipHTML
		const chatFilterGroupWrapper = chatFilterGroupHTML ? `<div>${chatFilterGroupHTML}</div>` : '';
		
		return `<div class="answerFromChipDiv">${chipHTML}${chatFilterGroupWrapper}</div>`;
	};

	// Initialize functionality after DOM insertion
	setTimeout(() => {
		AnsFromChipFunctionality({
			item: item,
			regeneratingAnswer: regeneratingAnswer,
		});
	}, 100);

	return renderChip();
};

export default AnsFromChip;
