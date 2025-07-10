import { v4 as uuid } from 'uuid';
import { updateChatData, setActiveBoardId, setCurrentQuestion, setSelectedContext, setErrorState, setAllHistory, setQuickActions } from '../redux/globalSlice';
import store from '../redux/store';
import { cloneDeep, isEmpty } from 'lodash';
import constructGptForm from './gptTemplate/gptTemplateBody';
import gptFormFunctionality from './gptTemplate/gptTemplateFunc';
import { generateShortUUID, getCidByMessageId } from '../utils/helpers';
import AnswerFromChip from './AnswerFromChip';
import { chatTemplateTypes, msgStatus } from '../utils/constants';
import MultiResponse from './gptTemplate/MultiResponse';
import moment from "moment";
import { fetchHistory } from "../redux/actions/global.action";
import { multiIntentExecutionFunc } from "../templateRenderer/functionality/multi-intent-execution";

export const constructQuestionInitial = (args) => {
	let uniqueMsgId = args?.reqId;
	const questions = cloneDeep(store.getState().global.questions);

	if (args?.replaceExistingQsn && !args?.reqId) {
		uniqueMsgId = getCidByMessageId(questions, args?.messageId);
	}

	const activeBoardId = store.getState().global.activeBoardId;

	let question = args?.question;

	let obj = {};

	let isTask = questions[args?.reqId]?.isTask;
	let stepIndex = isTask ? questions[args?.reqId]?.stepIndex : null;

	if(args?.multiIntentExecution){

		obj = {
			...args?.task,
			id: args?.stepId,
			question: args?.task?.utterance,
			answer: "",
			loading: true,
			type: "search",
			isTask: true,
			parentMsgId: args?.reqId,
			cId: args?.stepId,
			reqId: args?.stepId,
			showResponse: true,
		}

		questions[args?.stepId] = obj;
		uniqueMsgId = args?.stepId;
		
	}
	else if(isTask){
		obj = {
			cId: uniqueMsgId,
			question,
			answer: "",
			loading: true,
			type: "search",
			reqId: uniqueMsgId,
			showResponse: true,
			isTask: true,
			parentMsgId: args?.reqId,
			isMultiIntentExecution: true,
			stepIndex: stepIndex,
		};

		questions[uniqueMsgId] = obj;
	}
	else{
		obj = {
			cId: uniqueMsgId,
			question,
			answer: "",
			loading: true,
			type: "search",
			reqId: uniqueMsgId,
		};

		questions[uniqueMsgId] = obj;
	}

	store.dispatch(updateChatData(questions));
	store.dispatch(setCurrentQuestion(obj));

	if (!activeBoardId) {
		let arr = store.getState().global?.history?.data?.boards || [];
		let threadObj = {
			createdOn: moment().valueOf(),
			name: "loader",
			loading: true,
		};
		store.dispatch(
			setAllHistory({
				...store.getState().global?.AllHistory,
				data: [threadObj, ...arr],
			})
		);
	}

	return uniqueMsgId;
};

export const constructQuestionPostCall = (data, qId) => {

    // data.payload = contains api response
    // data.meta.arg = contains passed params and payload

    const state = store.getState().global
    const questions = cloneDeep(state.questions)
    const activeBoardId = state.activeBoardId

    // let followupFromSuggestionModal = data?.params?.suggestionContext;
    let question = questions?.[qId] || {};
    delete question?.loading;

	if (!activeBoardId) {
		store.dispatch(
			fetchHistory({ deleteLoader: true, params: { limit: 10 } })
		);
	}
    if(state.enabledCustomTemplates?.[data?.payload?.templateType]) {
        if(data?.payload?.templateType === chatTemplateTypes.GPT_FORM_TEMPLATE) {
            let multiResponseData = MultiResponse().getInitialFormData(data?.payload)
            question.gpt_forms = multiResponseData
        }
        // If custom template enabled for this data?.payload?.templateType template type
    } else {
        // DEFAULT GPT FORM TEMPLATE
        if(data?.payload?.history?.status !== msgStatus.TERMINATED && data?.payload?.templateType === chatTemplateTypes.GPT_FORM_TEMPLATE) {
            let multiResponseData = MultiResponse().getInitialFormData(data?.payload);
            question.gpt_forms = multiResponseData;
            const gptFormConstructedData = constructGptForm(multiResponseData, data?.payload)
			// question.template_html = gptFormConstructedData.outerHTML;
			// setTimeout(() => {
			// 	gptFormFunctionality(multiResponseData, data?.payload);
			// }, 1000);
		}
	}

	if (data?.payload?.templateType === chatTemplateTypes.SEARCH_ANSWER) {
		if (data?.payload?.sources?.length > 0 ){
			// const ansFromChipData = AnswerFromChip({item: data?.payload });
			// question.answerFrom_html = ansFromChipData.outerHTML;
			// setTimeout(() => {
			//     MenuOptions(data?.payload)
			// }, 1000);
		}
		if (Object.values(data?.payload?.thread || {})?.length > 0) {
			if (!question?.botConversation) {
				question.botConversation = {};
				question.parentMessage = data?.payload;
				data?.payload?.thread?.messages?.map((message) => {
					question.botConversation[message?.messageId] = message;
				});
			} else {
				if (data?.payload?.thread?.nextMessages?.length) {
					// question = updatedQuestions?.[currentQuestion]
					question.botConversation[data?.payload?.messageId].status =
						data?.payload?.status;
					question.botConversation[data?.payload?.messageId].answer =
						data?.payload?.answer;
					data?.payload?.thread?.nextMessages?.map((message) => {
						question.botConversation[message?.messageId] = message;
					});
					if (
						data?.payload?.thread?.parentMessage?.status ===
						"completed"
					) {
						question.parentMessage =
							data?.payload?.thread?.parentMessage;
						question.status = "completed";
						// question.collapseBotConversation = true
						// updateState({
						//     isBotRunning: false
						// })
					}
				}
			}
		}
	}

    if(data?.payload?.queryExhaustionInfo?.queryLimitExhausted){
        question.queryExhaustionInfo = data?.payload?.queryExhaustionInfo
        store.dispatch(setErrorState(data?.payload?.queryExhaustionInfo))
    }

	if(data?.payload?.quickactions){
		store.dispatch(setQuickActions(data?.payload?.quickactions));
	}else{
		store.dispatch(setQuickActions([]));
	}
    // if(data?.params?.arg?.retry) {
    //     delete question?.error;
    // }

    // if (data?.res?.viewType === "list" || data?.res?.viewType === "table") {
    //     question.showData = true
    //     {showSearchResults && props?.setRelevantQuestions(false)}
    // }

    //for email
    // if(data?.res?.templateType === "action_send_email" && data?.res?.status === "draft") {    
    //     let obj = {
    //         canIncludeSource: data?.res?.canIncludeSource,
    //         emailData: emailData(question, data?.res)
    //     }
    //     question = {...question, ...obj}
    // }

    //for slack and msTeams 
    // if((data?.res?.templateType === "action_send_slack_message" || data?.res?.templateType === "action_send_teams_message" || data?.res?.templateType === "action_send_msteams_message") && data?.res?.status === "draft") {    
    //     question = {...question, ...{externalIntegrationAction : true, skills: `${data?.res?.templateType === "action_send_teams_message" || data?.res?.templateType === "action_send_msteams_message" ? "msteams" : "slack"}`}}
    // }

    // if(data?.res?.templateType === 'resolve_ambiguity' || data?.res?.templateType === 'intent_ambiguity'){
    //     setAmbiguityState(true)
    // }

    //Query Limit Exhaustion Pop-up
    // let _limitExhausted;
    // if(data?.res?.queryExhaustionInfo?.queryLimitExhausted){
    //     _limitExhausted = data?.res?.queryExhaustionInfo
    // }

    // Kiaas form
    // if(data?.res?.templateType === "bulk_action") {
    //     let formFields = {}
    //     data.res.content.formFields.map(f => {
    //         formFields[f.formId] = f
    //     })
    //     data.res.formsLength = data.res.content.formFields?.length;
    //     data.res.content.formFields = formFields;
    // }

    // if(data?.res?.templateType === "connection_provider") {
    //     question.params = data?.params
    // }

    if(data?.error) {
        /*when the api request returns error, need to update the question status accordingly */
        
        if (question?.viewType === "threadView"){
            /*add error status to the child question present in the botConversation */
            question = addErrorStateToBotConversation(questions?.[qId], data)
        }else{
            question.status = "error"            
            question.templateType = "error_template"
            question.error = data?.error
        }
        questions[qId] = { ...question, apiSuccess: false };
        store.dispatch(updateChatData(questions))
        return;

        // question = { ...question, error: data?.error, errInfo: data?.errInfo};
        // if(data?.errInfo?.errors[0]?.code === 'MaximumPointsExceeded'){
        //     _limitExhausted = data?.errInfo?.errors[0]
        // }
    } else if (data?.meta?.arg?.multiIntentExecution || question?.isMultiIntentExecution) {
		const stepIndex = question?.stepIndex;
		question = { ...question, ...data?.payload, showResponse: true};
		questions[question?.parentMsgId].executingActionId = question?.id
		if(stepIndex === 0) {
		    questions[question?.parentMsgId].status = 'in-progress'
		}
		if(question?.isTask) {
				const stepIndex = question?.stepIndex;
				setTimeout(() => {
					multiIntentExecutionFunc().runNextTask(stepIndex, data?.payload?.status , question)
				}, 1000);
		}
	}
    else if(data?.payload?.history?.status === msgStatus.TERMINATED){
        if(data?.payload?.history?.templateType === chatTemplateTypes.GPT_FORM_TEMPLATE){
            delete question.template_html
        }
        let terminatedAnswerResponse = "I see you interrupted the answer generation. Please feel free to provide more details or let me know how can I assist you further"
        question = { ...question,  ...data?.payload?.history, answer : terminatedAnswerResponse};
	} 
    else {      
        if(data?.meta?.arg?.params?.from !== "botAgent") {
            question = { ...question, ...data?.payload}; 
        }
                        
    }
   
    // let context;
    // if(data?.res?.context && data?.res?.context?.hasOwnProperty("enable") && !!data?.res?.context?.enable) {
    //     let type = data?.params?.type || data?.res?.context?.type || data?.res?.context?.agentType//this type is required while removing the context that is set
    //     context = {...data?.res?.context, messageId: data?.res.messageId, sources: (!isEmpty(data?.res?.sources) ? data?.res?.sources : data?.res?.context?.sources), viewType: data?.res?.viewType, type: type}
    // } else if(data?.params?.quickActions) {
    //     if(data?.params?.context?.viewType === "table") {
    //         // record level summarise button
    //         context = selectedContext
    //     } else {
    //         context = data?.params?.context
    //     }
    // } else {
    //     context = null
    // }
    // const _selectedContext = {...selectedContext, messageId: data?.res?.messageId };

    //if the response contains thread intiating the bot conversation
    if (data?.payload?.thread) {
        //rename the answer to question and include botConversation object.
        // question.question = data?.res?.thread?.previousMessage?.question
        question = removeOutputMessageId(question, {res: data?.payload})
        if (!question?.botConversation || isEmpty(question?.botConversation)) {
            question.botConversation = {}
            question.parentMessage = data.payload.res
            data?.payload?.thread?.messages?.map(message => {
                question.botConversation[message?.messageId] = message
            })                        
        }
        if (data?.payload?.thread && data?.payload?.thread?.nextMessages && data?.payload?.thread?.nextMessages?.length) {    
            /*when the advancedSearch resolves for autonomous agents, need to remove the botConversation key that is formed using outputMessageId */        
            question.botConversation[data?.payload?.messageId].status = data?.payload?.status
            question.botConversation[data?.payload?.messageId].answer = data?.payload?.answer
            data?.payload?.thread?.nextMessages?.map(message => {
                question.botConversation[message?.messageId] = message
            })
            if (data?.payload?.thread?.parentMessage?.status === "completed") {
                question.status = "completed"                
                question.parentMessage = data?.payload?.thread?.parentMessage
                
            }
        }
        // question.question = data?.res?.question
    }

    if(data?.payload?.viewType === "threadView" && (!data?.payload?.hasOwnProperty('thread'))){
        question = {...question, ...data?.payload}
    }

    /*cancelrequest / closing the botconversation logic, check for the status as completed and viewType as threadView */
    if(data?.payload?.history?.status === msgStatus.COMPLETED && data?.payload?.history?.viewType === "threadView") {
        question = {
            ...question,
            "status": data?.payload?.history?.status,
            "answer": data?.payload?.history?.answer,

        }
    }

    // if(data?.res?.viewType === "threadView"){
    //     if(!question.hasOwnProperty("botConversation")){
    //         question.parentMessage = data.res  
    //         question.botConversation = {}
    //         updateState({
    //             isBotRunning: true
    //         })
    //     }
    // }    
    questions[qId] = {...question, apiSuccess: true};

    // updateState({
    //     searchResultData: data?.res,
    //     showError: false,
    //     selectedContext: followupFromSuggestionModal ? _selectedContext : context,
    //     questions: updatedQuestions,
    //     generatingAnswerMsg: null,
    //     showQuickActions: data?.res?.quickactions,
    //     currentMessageId : data?.res?.messageId,
    //     limitExhausted : _limitExhausted,
    //     searchInput: document.getElementById("search-input")?.innerText,
    // }, () => {
    //     scrollBottom(data?.params?.qId)
    // })

    if(!activeBoardId) {
        if(data?.payload?.history?.status === msgStatus.TERMINATED){    
            store.dispatch(setActiveBoardId(data?.payload?.history?.bId))
        }else{
            store.dispatch(setActiveBoardId(data?.payload?.boardId))
        } 
    }
    if (data?.payload?.followUpContext && state.enableContextByFollowupContext) {
        // console.log("data?.payload?.followUpContext", { ...data?.payload?.followUpContext, messageId: data?.payload?.messageId })
        let context = {
            context: data?.payload?.followUpContext,
            messageId: data?.payload?.messageId,
            sources: data?.payload?.sources,
            viewType: data?.payload?.viewType,
            type: "agent",
            'isAgent': true,
            sessionId: data?.payload?.followUpContext?.sessionId
        }
        store.dispatch(setSelectedContext({data: context}))
    }
    store.dispatch(updateChatData(questions))

    // if(question?.isTask) {
    //     setTimeout(() => {
    //         const stepIndex = question?.stepIndex;
    //         props.MultiIntentExecutionRef.current.runNextTask(stepIndex, data?.res?.status)
    //     }, 1000);
    //     setTimeout(() => {
    //         let getEl = document.querySelector('.taskItem.loading')
    //         getEl?.scrollIntoView({ block: "nearest", behavior: 'smooth' });
    //     }, 1500);
    // }
}

const removeOutputMessageId = (question, apiResponse) => {
        /*check for the outputMessageId's present in either messages / nextMessages array of apiResponse
        if found remove it from question.botConversation object
        */
        if(apiResponse?.res?.thread?.messages && apiResponse?.res?.thread?.messages.length > 0){
            apiResponse?.res?.thread?.messages.map(message => {
                if(Object.keys(question?.botConversation)?.length > 0 && question?.botConversation[message?.outputMessageId]) {
                    delete question?.botConversation[message?.outputMessageId]
                }
            })
        }
        if(apiResponse?.res?.thread?.nextMessages && apiResponse?.res?.thread?.nextMessages.length > 0){
            apiResponse?.res?.thread?.nextMessages.map(message => {
                if(Object.keys(question?.botConversation)?.length > 0 && question?.botConversation[message?.outputMessageId]) {
                    delete question?.botConversation[message?.outputMessageId]
                }
            })
        }

        return question;

    }

    const addErrorStateToBotConversation = (question, resp) =>{
        const currentQuestion = cloneDeep(question)
        if(currentQuestion?.botConversation?.[resp?.meta?.arg?.params?.quesId]){
            currentQuestion.botConversation[resp?.meta?.arg?.params?.quesId].status = "error"
            currentQuestion.botConversation[resp?.meta?.arg?.params?.quesId].error = resp?.error
        }
        /*because of though streaming, we wont be getting the quesId in the params, so saerch for the status 'thoughtStreaming' or 'threadRunning' inside bot conversation and make its status as 'error'*/
        const isChildQuestionHavingThoughtStreaming = Object.values(currentQuestion?.botConversation)?.find(childQuestion => childQuestion?.status === "thoughtStreaming" || childQuestion?.status === "threadRunning")
        if(isChildQuestionHavingThoughtStreaming){
            currentQuestion.botConversation[isChildQuestionHavingThoughtStreaming?.outputMessageId].status = "error"
            // question.botConversation[isChildQuestionHavingThoughtStreaming?.messageId].error = resp?.error
        }else{
            /*if we dont have any run id's check for the question that is in in-progress status */
        /*if we dont have runId, create a new messageId inside the botConversation and store the error */
        const errorId = generateShortUUID()
        currentQuestion.botConversation[errorId] = {
            status: "error",
            error: resp?.error,
            answer: resp?.meta?.arg?.payload?.question,
            messageId: errorId,
            question: resp?.error?.message || resp?.error?.msg || "We’re unable to complete your request right now due to a server timeout or unexpected response. Please refresh or try again later.",
        }

        
        /*also make all loading status as false */
        Object.values(currentQuestion?.botConversation)?.forEach(childQuestion => {
            if(childQuestion?.loading){
                delete childQuestion?.loading
            }
        })
        return currentQuestion;
    }
    }