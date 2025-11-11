import { cloneDeep } from "lodash";
import { updateChatData } from "../../redux/globalSlice";
import store from "../../redux/store";
import { sessionItemHandler } from "../../Attachments/createContext";
import { getRelevantQuestions } from "../../redux/actions/global.action";
import { highlightQuotedText } from "../utils/helper";
import { InitiateChatConversationAction, toast } from "../../chat";
import { submitUserFeedback } from "../../Feedback";
import customMarkdownRenderer from "../utils/customMarkdownRenderer";
import chatInterface from "../../chat/ChatInterface";

const AnsFromChipFunctionality = ({ item }) => {
	const getRelevantQuestionsData = async () => {
		let state = store.getState()?.global;
		let _questions = cloneDeep(state?.questions);
		let constId = item?.reqId || item?.id;

		if (item?.altQuestions?.showAltQuestions) {
			_questions[constId].altQuestions.showAltQuestions = false;
		} else if (
			item?.altQuestions?.questions?.length > 0 &&
			item?.altQuestions?.showAltQuestions === false
		) {
			_questions[constId].altQuestions.showAltQuestions = true;
		} else {
			let userId = state?.profile?.data?.id;

			let context = item?.context;

			let params = {
				userId: userId,
				sessionId: context?.sessionId,
				appId: context?.tabId,
				qId: item?.id,
			};

			const response = await store.dispatch(getRelevantQuestions(params));

			if (!!response?.payload) {
				let altQuestions = response?.payload?.altQuestions;
				let alternateQuestionsObj = {
					questions: altQuestions,
					showAltQuestions: true,
				};
				_questions[constId].altQuestions = alternateQuestionsObj;
			}
		}
		store.dispatch(updateChatData(_questions));
	};

	const tableChipLogic = () => {
		let chip = document.getElementById(`ansFromChip-${item?.id}`);
		if (chip && !chip.eventListenerAdded) {
			chip.addEventListener("click", (e) => {
				e?.preventDefault();
				e?.stopPropagation();
				showDataAction();
			});
			chip.eventListenerAdded = true;
		}

		if (item?.showData) {
			// any actions on Table Chip has to be added here

			if (
				item?.sources?.[0]?.canSetAsSourceContext !== false &&
				(item?.context?.source === "jira" ||
					item?.context?.source === "hubspot" ||
					item?.context?.source === "zendesk")
			) {
				let relevantQuestions = document.getElementById(
					`relevantQuestions-${item?.id}`
				);
				if (
					relevantQuestions &&
					!relevantQuestions.eventListenerAdded
				) {
					relevantQuestions.addEventListener("click", (e) => {
						e?.preventDefault();
						e?.stopPropagation();
						getRelevantQuestionsData();
					});
					relevantQuestions.eventListenerAdded = true;
				}

				if (
					item?.altQuestions?.showAltQuestions &&
					item?.altQuestions?.questions?.length > 0
				) {
					item?.altQuestions?.questions?.map((question, i) => {
						let relevantQuestionsItem = document.getElementById(
							`relevantQuestionsItem-${item?.id}-${i}`
						);
						if (
							relevantQuestionsItem &&
							!relevantQuestionsItem.eventListenerAdded
						) {
							relevantQuestionsItem.addEventListener(
								"click",
								(e) => {
									e?.preventDefault();
									e?.stopPropagation();
									let payload = {
										question: question,
									};
									InitiateChatConversationAction({ payload });
								}
							);
							relevantQuestionsItem.eventListenerAdded = true;
						}
					});
				}
			}
		}
	};

	const showDataAction = () => {
		if (
			!!item?.context &&
			(item?.context?.type === "gptAgent" ||
				item?.context?.agentType === "gptAgent" ||
				item?.context?.agentType === "galeAgent")
		) {
			let state = store.getState()?.global;
			let _questions = cloneDeep(state?.questions);
			let constId = item?.reqId || item?.id;
			let showGPTDialog = !!_questions[constId]?.showGPTDialog;
			_questions[constId].showGPTDialog = !showGPTDialog;
			store.dispatch(updateChatData(_questions));
		}
		if (
			item?.sources?.length === 1 &&
			item?.sources[0]?.hasOwnProperty("redirectUrl")
		) {
			openInNewTab(item?.sources?.[0]);
		} else if (item?.sources?.length > 1) {
			let state = store.getState()?.global;
			let _questions = cloneDeep(state?.questions);
			let constId = item?.reqId || item?.id;
			let showMultiSourceList =
				!!_questions[constId]?.showMultiSourceList;
			_questions[constId].showMultiSourceList = !showMultiSourceList;
			store.dispatch(updateChatData(_questions));
		} else {
			let state = store.getState()?.global;
			let _questions = cloneDeep(state?.questions);
			let constId = item?.reqId || item?.id;
			let showData = !!_questions[constId]?.showData;
			_questions[constId].showData = !showData;
			store.dispatch(updateChatData(_questions));
		}
	};

	const openInNewTab = (data) => {
		window.open(data?.redirectUrl?.dweb, "_blank");
	};

	const copyAnswerToClipboard = async () => {
		try {			
			if (item?.answer) {
				await navigator.clipboard.writeText(item.answer);
				toast.success("Response copied");
			}
		} catch (err) {
			console.error("Failed to copy answer to clipboard:", err);
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = item?.answer || "";
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
		}
	};

	const exportAnswerToWord = () => {
		try {
			if (!item?.answer) {
				console.warn("No answer to export");
				return;
			}

			// Convert markdown to HTML using the custom renderer
			const renderedAnswer = customMarkdownRenderer(item.answer);

			// Create HTML content for the Word document
			const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Answer Export</title>
					<style>
						body { 
							font-family: Arial, sans-serif; 
							margin: 20px; 
							line-height: 1.6; 
						}
						h1, h2, h3, h4, h5, h6 { 
							color: #333; 
							margin-top: 20px; 
							margin-bottom: 10px; 
						}
						p { margin-bottom: 10px; }
						ul, ol { margin-bottom: 10px; }
						li { margin-bottom: 5px; }
						blockquote { 
							border-left: 4px solid #ddd; 
							padding-left: 15px; 
							margin: 10px 0; 
							color: #666; 
						}
						code { 
							background-color: #f5f5f5; 
							padding: 2px 4px; 
							border-radius: 3px; 
							font-family: monospace; 
						}
						pre { 
							background-color: #f5f5f5; 
							padding: 10px; 
							border-radius: 5px; 
							overflow-x: auto; 
						}
						table { 
							border-collapse: collapse; 
							width: 100%; 
							margin: 10px 0; 
						}
						th, td { 
							border: 1px solid #ddd; 
							padding: 8px; 
							text-align: left; 
						}
						th { background-color: #f2f2f2; }
						.answer-content { margin-top: 20px; }
					</style>
				</head>
				<body>					
					<div class="answer-content">
						${renderedAnswer}
					</div>
					<hr>
					<p><small>Exported on: ${new Date().toLocaleString()}</small></p>
				</body>
				</html>
			`;

			// Create blob with HTML content
			const blob = new Blob([htmlContent], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			});

			// Create download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${item?.messageId}-${new Date().toISOString().slice(0, 10)}.doc`;
			
			// Trigger download
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			
			// Clean up
			URL.revokeObjectURL(url);
			
			console.log("Answer exported to Word document");
		} catch (err) {
			console.error("Failed to export answer to Word:", err);
		}
	};

	const onSetAsSource = (e, data) => {
		e.stopPropagation();
		if (data?.ext === "gsheet") {
			// fetchListItems(e)
		} else {
			let state = store.getState()?.global;
			let _agents = cloneDeep(state?.enabledAgents);
			let isAgentSetAsSource = _agents.find(
				(ag) => ag?.id === data?.source
			);
			let sourceType = isAgentSetAsSource ? "agent" : null;
			sessionItemHandler({
				item: data,
				duplicateErr: true,
				type: sourceType,
			});
		}
	};

	/*Latest functionality for askFollowup*/
	const setContextData = (e, item) => {
		e.stopPropagation()
		const msgType = item?.type
		// const messageId = msgType === "followup" ? ellipsisDr?.parentMessageId : ellipsisDr?.messageId;
		const messageId = item?.messageId; //Shpuld send the messageId of the question clicked for Followup
		const _selectedContext = { ...item?.context, messageId, sources: item?.sources, viewType: item?.viewType }
		let obj = {}
		let enabledUserAgents = store.getState()?.global?.allAgents?.data?.agents?.filter(a => !!a?.enabled)
		let _agents = cloneDeep(enabledUserAgents)
		let isAgentSetAsSource = _agents.find(ag => ag.id === item?.sources?.[0]?.source)
		let sourceType = isAgentSetAsSource ? "agent" : null

		if (item?.viewType === "table" && _selectedContext?.hasOwnProperty("sessionId")) {
			// sessionItemHandler({ appContext, dispatch, item: { ..._selectedContext, source: 'attachment' }, viewType: item?.viewType, type: sourceType })
		} else if (item?.templateType === 'search_results') {
			// Specific for search result 
			obj = {			
				item: item?.sources?.[0],
				type: 'accountKnowledge',
				discardPrevSession: true
			}
			sessionItemHandler(obj)
		} else {

			obj = {
				boardId: item.boardId,
				messageId,
			
				item: item?.sources?.[0],
				duplicateErr: true,
				viewType: item?.viewType,
				type: sourceType
			}
			// if(selectedContext?.sources?.[0]?.isAgent) {
			// if (sourceType === 'agent' || selectedContext?.sources?.[0]?.isAgent) {
			// 	obj.discardPrevSession = true
			// }
			// if (selectedContext?.viewType === "table") {
			// 	obj.override = true
			// }
			sessionItemHandler(obj)
		}
		// menuHide()
		
	}

	const IntegrationsActions = (e, source, item) => {	
		let payload = {}
		if(source === 'gmail') {
			payload = {				
				question: "Send as email",
				contextParams: {
					messageId: item?.messageId
				},
				source: 'gmail',
				intent: 'sendEmail'
			}
		}
		if (source === 'msteams') {
			/*append the above payload */
			payload = {				
				question: "Send as Teams message",
				contextParams: {
					messageId: item?.messageId
				},
				source: 'msteams',
				intent: 'sendTeamsMessage'
			}
		}


		if (source === 'slack') {
			payload = {				
				question: "Send as Slack message",
				contextParams: {
					messageId: item?.messageId
				},
				source: 'slack',
				intent: 'sendSlackMessage'
			}
		}
		if (source === 'jira') {
			payload = {				
				question: "Create Jira Issue",
				contextParams: {
					messageId: item?.messageId
				},
				source: 'jira',
				intent: 'createJiraIssue'
			}
		}
		if (source === 'outlook') {
			payload = {				
				question: "Send as email",
				contextParams: {
					messageId: item?.messageId
				},
				source: 'outlook',
				intent: 'sendEmail'
			}
		}
		chatInterface().initiateChatConversationAction({ payload, "action": "send" })
	}
	/*need to make advance search api call */
	

	

	const executeSlackAction = (e, item) => {
		const payload = {
			question: "Send as Slack message",
			contextParams: {
				messageId: item?.messageId
			},
		}
		/*need to make advance search api call */		
		chatInterface().initiateChatConversationAction({payload})
	}
	

	const knowledgeChipLogic = () => {
		if (item?.sources?.length > 1) {
			let chip = document.getElementById(`ansFromChip-${item?.id}`);
			if (chip && !chip.eventListenerAdded) {
				chip.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();
					showDataAction();
				});
				chip.eventListenerAdded = true;
			}
		}

		if (item?.showMultiSourceList) {
			item?.sources?.map((data, i) => {
				let listItem = document.getElementById(
					`multiSourceListItem-${item?.id}-${data?.docId}`
				);
				let askFollowupButton = document.getElementById(
					`askFollowupButton-${item?.id}-${data?.docId}`
				);
				if (listItem && !listItem.eventListenerAdded) {
					listItem.addEventListener("click", () => {
						openInNewTab(data);
					});
					listItem.eventListenerAdded = true;
				}
				if (
					askFollowupButton &&
					!askFollowupButton.eventListenerAdded
				) {
					askFollowupButton.addEventListener("click", (e) => {
						e?.preventDefault();
						e?.stopPropagation();
						onSetAsSource(e, data);
					});
					askFollowupButton.eventListenerAdded = true;
				}
			});
		}

		if (item?.sources?.length === 1) {
			let chip = document.getElementById(`ansFromChip-${item?.id}`);
			if (chip && !chip.eventListenerAdded) {
				chip.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();
					showDataAction();
				});
				chip.eventListenerAdded = true;
			}
		}

		if (item?.showData) {
			item?.data?.map((data, i) => {
				let listItem = document.getElementById(
					`listItem-${item?.id}-${data?.docId}`
				);
				let newTabIcon = document.getElementById(
					`openInNewTabIcon-${item?.id}-${data?.docId}`
				);
				let askFollowupButton = document.getElementById(
					`askFollowupButton-${item?.id}-${data?.docId}`
				);
				if (listItem && !listItem.eventListenerAdded) {
					listItem.addEventListener("click", () => {
						openInNewTab(data);
					});
					listItem.eventListenerAdded = true;
				}
				if (newTabIcon && !newTabIcon.eventListenerAdded) {
					newTabIcon.addEventListener("click", () => {
						openInNewTab(data);
					});
					newTabIcon.eventListenerAdded = true;
				}
				if (
					askFollowupButton &&
					!askFollowupButton.eventListenerAdded
				) {
					askFollowupButton.addEventListener("click", (e) => {
						e?.preventDefault();
						e?.stopPropagation();
						onSetAsSource(e, data);
					});
					askFollowupButton.eventListenerAdded = true;
				}
			});
		}
		

		// Add copy answer button event listener
		if (item?.answer) {
			// let copyAnswerButton = document.getElementById(
			// 	`copyAnswerButton-${item?.id}`
			// );
			// if (copyAnswerButton && !copyAnswerButton.eventListenerAdded) {
			// 	copyAnswerButton.addEventListener("click", (e) => {
			// 		e?.preventDefault();
			// 		e?.stopPropagation();
			// 		copyAnswerToClipboard();
			// 	});
			// 	copyAnswerButton.eventListenerAdded = true;
			// }

			let exportWordButton = document.getElementById(
				`exportWordButton-${item?.messageId}`
			);
			if (exportWordButton && !exportWordButton.eventListenerAdded) {
				exportWordButton.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();
					exportAnswerToWord();
				});
				exportWordButton.eventListenerAdded = true;
			}
		}
		
		if(!item?.disableFeedback) {
			let feedbackLikeButton = document.getElementById(
				`feedbackLikeButton-${item?.messageId}`
			);
			if (feedbackLikeButton && !feedbackLikeButton.eventListenerAdded) {
				feedbackLikeButton.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();
					console.log("feedbackLikeButton clicked");
					submitUserFeedback({
						type: "like",
						cId: item?.cId || item?.reqId,
						payload: {
							feedback: "like",
						},
					});
				});
			}
			let feedbackDislikeButton = document.getElementById(
				`feedbackDislikeButton-${item?.messageId}`
			);
			if (feedbackDislikeButton && !feedbackDislikeButton.eventListenerAdded) {
				feedbackDislikeButton.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();
					console.log("feedbackDislikeButton clicked");
						if(item?.feedback === "dislike") {
							submitUserFeedback({
								type: "dislike",
								cId: item?.cId || item?.reqId,
								payload:{
									"action": "undo",
								}								
							});
							return;
						}
					
					// Toggle feedback popup overlay
					const feedbackPopup = document.getElementById(`feedbackPopup-${item?.messageId}`);
					if (feedbackPopup) {
																							
						if (feedbackPopup.tagName.toLowerCase() === 'sl-popup' && typeof feedbackPopup.show !== 'function') {							
							if (window.customElements && window.customElements.upgrade) {
								customElements.upgrade(feedbackPopup);
							}
																					
						}
												
						const isOpen = feedbackPopup.hasAttribute('active') || feedbackPopup.active;
						
						if (isOpen) {
							// Hide popup with fallback
							if (typeof feedbackPopup.hide === 'function') {
								feedbackPopup.hide();
							} else {
								console.warn("Shoelace hide() method not available, using fallback");
								feedbackPopup.removeAttribute('active');
								feedbackPopup.style.display = 'none';
							}
							feedbackDislikeButton.classList.remove('active');
						} else {
							
							feedbackPopup.anchor = feedbackDislikeButton;
							
							
							// Show popup with fallback
							if (typeof feedbackPopup.show === 'function') {
								feedbackPopup.show();
							} else {								
								feedbackPopup.setAttribute('active', '');
								feedbackPopup.style.display = 'block';
							}
							feedbackDislikeButton.classList.add('active');
						}
					} else {
						console.error("Feedback popup not found:", `feedbackPopup-${item?.messageId}`);
					}
				});
			}
			feedbackLikeButton.eventListenerAdded = true;
			feedbackDislikeButton.eventListenerAdded = true;
			
			const checkSubmitButtonState = () => {
				const feedbackPopup = document.getElementById(`feedbackPopup-${item?.messageId}`);
				const submitBtn = feedbackPopup?.querySelector('button[data-action="submit-feedback"]');
				
				if (submitBtn && feedbackPopup) {
					// Check if any feedback option is selected
					const selectedOptionsData = feedbackPopup.getAttribute('data-selected-options');
					const selectedOptions = selectedOptionsData ? JSON.parse(selectedOptionsData) : [];
					const hasSelectedOption = selectedOptions.length > 0;
					
					// Check if textarea has content
					const textarea = feedbackPopup.querySelector('sl-textarea');
					const hasTextContent = textarea && textarea.value && textarea.value.trim().length > 0;
					
					// Enable submit button if either condition is met
					if (hasSelectedOption || hasTextContent) {
						submitBtn.disabled = false;
						submitBtn.classList.remove('disable');
					} else {
						submitBtn.disabled = true;
						submitBtn.classList.add('disable');
					}
				}
			};

			// Add feedback options multi-selection functionality for Shoelace buttons
			const feedbackOptions = document.querySelectorAll(`.feedbackChip[data-message-id="${item?.messageId}"]`);
			feedbackOptions.forEach(option => {
				if (!option.eventListenerAdded) {
					option.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();
						
						// Toggle active state for Shoelace button
						const isActive = option.classList.contains('selectedChip');
						if (isActive) {
							option.classList.remove('selectedChip');
							option.variant = 'default';
						} else {
							option.classList.add('selectedChip');
							option.variant = 'primary';
						}
						
						// Log selected options for debugging
						const selectedOptions = Array.from(feedbackOptions)
							.filter(opt => opt.classList.contains('selectedChip'))
							.map(opt => ({
								id: opt.getAttribute('data-feedback-id'),
								label: opt.textContent.trim()
							}));
												
						
						// Storing selected options in data attribute for submission
						const feedbackPopup = document.getElementById(`feedbackPopup-${item?.messageId}`);
						if (feedbackPopup) {
							feedbackPopup.setAttribute('data-selected-options', JSON.stringify(selectedOptions));
						}
						
						// Check if submit button should be enabled
						checkSubmitButtonState();
					});
					option.eventListenerAdded = true;
				}
			});
			
			const feedbackPopup = document.getElementById(`feedbackPopup-${item?.messageId}`);
			if (feedbackPopup) {
				const textarea = feedbackPopup.querySelector('sl-textarea');
				if (textarea && !textarea.inputListenerAdded) {
					textarea.addEventListener('sl-input', () => {
						checkSubmitButtonState();
					});					
					textarea.inputListenerAdded = true;
				}
			}
			
			if (feedbackPopup && !feedbackPopup.eventListenerAdded) {																
				
				// Submit button handler
				const submitBtn = feedbackPopup.querySelector('button[data-action="submit-feedback"]');
				if (submitBtn) {
					submitBtn.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();
						
						// Get message ID from button data attribute
						const messageId = submitBtn.getAttribute('data-message-id');
						
						// Get selected options
						const selectedOptionsData = feedbackPopup.getAttribute('data-selected-options');
						const selectedOptions = selectedOptionsData ? JSON.parse(selectedOptionsData) : [];
						
						// Get textarea content - Shoelace textarea
						const textarea = feedbackPopup.querySelector('sl-textarea');
						const comment = textarea ? textarea.value.trim() : '';
						
						// Submit feedback with selected options and comment
						submitUserFeedback({
							type: "dislike",
							cId: item?.cId || item?.reqId,
							messageId: messageId, // Use the messageId from button attribute
							payload: {
								feedback: "dislike",
								comment: comment,								
								category: selectedOptions.map(opt => opt.label) // For backward compatibility
							},
						});
																		
						/*need to display received feedback text*/
						const feedbacksuccesstextDiv = document.querySelector('.feedbacksuccesstext');
						if (feedbacksuccesstextDiv) {
							feedbacksuccesstextDiv.style.display = 'block';
						}
						setTimeout(() => {
							if (typeof feedbackPopup.hide === 'function') {
								feedbackPopup.hide();
							} else {
								feedbackPopup.removeAttribute('active');
								feedbackPopup.style.display = 'none';
							}
						}, 2000);
												
					});
				}
				
				// Handle click outside to close popup
				const handlePopupHide = () => {
					const dislikeBtn = document.getElementById(`feedbackDislikeButton-${item?.messageId}`);
					if (dislikeBtn) {
						dislikeBtn.classList.remove('active');
					}
				};
				
				// Listen for hide events
				feedbackPopup.addEventListener('sl-hide', handlePopupHide);
				feedbackPopup.addEventListener('sl-after-hide', handlePopupHide);
				
				// Click outside to close popup
				const clickOutsideHandler = (event) => {
					const isPopupOpen = feedbackPopup.hasAttribute('active') || feedbackPopup.active;
					
					if (isPopupOpen) {
						// Check if click is outside the popup and dislike button
						const isClickInsidePopup = feedbackPopup.contains(event.target);
						const isClickOnDislikeButton = event.target.closest(`#feedbackDislikeButton-${item?.messageId}`);
						
						if (!isClickInsidePopup && !isClickOnDislikeButton) {
							submitUserFeedback({
								type: "dislike",
								cId: item?.cId || item?.reqId,
								payload: {
									feedback: "dislike"
								},
							});
							
							// Hide popup with fallback
							if (typeof feedbackPopup.hide === 'function') {
								feedbackPopup.hide();
							} else {
								console.warn("Shoelace hide() method not available, using fallback");
								feedbackPopup.removeAttribute('active');
								feedbackPopup.style.display = 'none';
							}
							
							// Remove active state from dislike button
							const dislikeBtn = document.getElementById(`feedbackDislikeButton-${item?.messageId}`);
							if (dislikeBtn) {
								dislikeBtn.classList.remove('active');
							}
						}
					}
				};
				
				// Add click outside listener to document
				document.addEventListener('click', clickOutsideHandler);
				
				// Store reference to remove listener later if needed
				feedbackPopup._clickOutsideHandler = clickOutsideHandler;
				
				// Also check for attribute changes as fallback
				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === 'attributes' && mutation.attributeName === 'active') {
							if (!feedbackPopup.hasAttribute('active')) {
								handlePopupHide();
							}
						}
					});
				});
				observer.observe(feedbackPopup, { attributes: true, attributeFilter: ['active'] });
				
				feedbackPopup.eventListenerAdded = true;
			}
		}

		if(item?.context?.enable){
			let setContextButton = document.getElementById(
				`setContextButton-${item?.messageId}`
			);
			if (setContextButton && !setContextButton.eventListenerAdded) {
				setContextButton.addEventListener("click", (e) => {
					e?.preventDefault();
					e?.stopPropagation();

				});
				setContextButton.eventListenerAdded = true;
			}
		}

		// Add three dot menu functionality
		const messageId = item?.messageId || item?.reqId;
		const threeDotTrigger = document.querySelector(`[data-three-dot-trigger="${messageId}"]`);
		const threeDotDropdown = document.querySelector(`[data-three-dot-dropdown="${messageId}"]`);
		
		
		// Let Shoelace handle dropdown behavior automatically - no manual control needed

		// Add menu item event listeners
		if (threeDotDropdown && !threeDotDropdown.eventListenerAdded) {
			const menuItems = threeDotDropdown.querySelectorAll('.menu-item');			
			
			menuItems.forEach(menuItem => {
				menuItem.addEventListener('click', (e) => {
					console.log('Menu item clicked');
					e.preventDefault();
					e.stopPropagation();
					
					const action = menuItem.getAttribute('data-menu-action');
					const actionType = menuItem.getAttribute('data-action-type');
					
					// Close Shoelace dropdown after selection
					const dropdown = threeDotDropdown.closest('sl-dropdown');
					if (dropdown) {
						dropdown.hide();
					}
					
					console.log('Menu action:', action, 'Type:', actionType);
					
					// Handle integration actions
					if (actionType === 'integration') {
						console.log(`Executing integration action: ${action}`);
						
						switch(action) {
							case 'gmail':
								IntegrationsActions(e, 'gmail', item);
								// Add Gmail integration logic here
								break;
							case 'outlook':
								IntegrationsActions(e, 'outlook', item);
								// Add Outlook integration logic here
								break;
							case 'slack':
								IntegrationsActions(e, 'slack', item);
								// Add Slack integration logic here
								break;
							case 'msteams':
								IntegrationsActions(e, 'msteams', item);
								// Add Teams integration logic here
								break;
							case 'jira':
								IntegrationsActions(e, 'jira', item);
								// Add Jira integration logic here
								break;
							default:
								console.log('Unknown integration action:', action);
						}
						return;
					}
					
					// Handle default actions
					switch(action) {
						case 'copy':
							// Trigger copy functionality
							const copyButton = document.getElementById(`copyAnswerButton-${item?.id}`);
							if (copyButton) {								
								copyButton.click();
							} else {
								console.log('Copy button not found for id:', `copyAnswerButton-${item?.id}`);
							}
							break;
						case 'regenerate':
							// Trigger regenerate functionality
							console.log('Regenerate response for:', messageId);
							// Add regenerate logic here
							break;
						case 'feedback':
							// Trigger feedback functionality
							console.log('Provide feedback for:', messageId);
							// Add feedback logic here
							break;
						case 'share':
							// Trigger share functionality
							console.log('Share response for:', messageId);
							// Add share logic here
							break;
						default:
							console.log('Unknown menu action:', action);
					}
				});
			});
			
			threeDotDropdown.eventListenerAdded = true;
		}

		// Shoelace handles outside clicks automatically - no manual handling needed
	};

	const renderLogic = () => {
		if (item?.viewType === "table") {
			tableChipLogic();
		} else {
			knowledgeChipLogic();
		}
	};

	return renderLogic();
};

export default AnsFromChipFunctionality;
