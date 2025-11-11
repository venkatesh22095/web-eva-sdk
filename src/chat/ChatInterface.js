import { advanceSearch, cancelAdvancedSearch, stopResponseGeneration } from "../redux/actions/global.action";
import { setChatInterfaceOptions, setCurrentQuestion, setCustomData, setEnableContextByFollowupContext, setEnabledCustomTemplates, setErrorState } from "../redux/globalSlice"
import { updateChatData } from "../redux/globalSlice";
import store from "../redux/store";
import { v4 as uuid } from 'uuid';
import { constructQuestionInitial, constructQuestionPostCall } from "./chat-utils";
import { checkHistoryAccessed, generateShortUUID, getCidByMessageId, getCidByReqId } from "../utils/helpers";
import { cloneDeep, isEmpty } from "lodash";
import BotConversation from "./botAgent/getBotConversation";
import { current } from "@reduxjs/toolkit";
import { sessionItemHandler } from "../Attachments/createContext";
import RecentAgentsFunc from "../LandingPageRecentAgents/RecentAgents";
const {hideRecentAgentsDiv} = RecentAgentsFunc();

const ChatInterface = (props) => {
    let state = store.getState().global, input = '', resIndexRef = 0;

    // Subscribe to store updates
    const subscribe = (cb) => {
        let callback = cb;
        const unsubscribe = store.subscribe(() => {
            state = store.getState().global;
            // If callback exists and API call is completed, invoke it
            // if (state.advanceSearchRes.status !== 'loading' && callback) {
                callback(state.questions, state.advanceSearchRes, state.chatHistoryMoreAvailable, state.errorState, state.quickActions);
                // console.log(state.questions, state.advanceSearchRes, state.chatHistoryMoreAvailable)
            // }
        });

        // Return a function to unsubscribe
        return () => {
            unsubscribe();
        };
    };

    const stopBotAnswer = async()=>{
     
        let updatedQuestions = state.questions;
        let cancelledQuestion;
        let currentQuestion = state.currentQuestion;
        if(currentQuestion){
                if(currentQuestion?.isTask){
                  cancelledQuestion = updatedQuestions?.[currentQuestion?.cId]
                }else{
                  cancelledQuestion = updatedQuestions?.[currentQuestion?.reqId]
                }                                      
        }
        else{
            cancelledQuestion = Object.values(updatedQuestions)?.find((ques) => ques?.status === 'threadRunning')
        }

        const params = {
          id: cancelledQuestion?.reqId, "quesId": cancelledQuestion?.id , userId : state?.profile?.data?.id
        }
        if(cancelledQuestion?.isTask){
          params.quesId = Object.values(cancelledQuestion?.botConversation)?.find(c => c?.status === 'in-progress')?.messageId
        }
        const payload = { boardId: state.activeBoardId }
        
        const response = await store.dispatch(stopResponseGeneration({params, payload}));
        const questions = cloneDeep(store.getState().global.questions);
        const reqdCId = getCidByReqId(questions, cancelledQuestion?.reqId);
        constructQuestionPostCall(response, reqdCId);
    

    }

    const sendMessageAction = async (value) => {
        hideRecentAgentsDiv('recent-agents-container');
      const state = store.getState()?.global
      if (value) {
        const { allAgents, selectedContext, commonAgents} = state
        let params = { reqId: generateShortUUID() }
        let payload = { question: value }
        if(state.activeBoardId) {
          payload.boardId = state.activeBoardId
        }
        if(!isEmpty(state.customData)){
          
          payload.customData = state.customData          
        }
        const qId = constructQuestionInitial({ ...params, ...payload })

        if(!isEmpty(selectedContext?.data)) {
          let _agents = cloneDeep(allAgents?.data?.agents)
          _agents = [..._agents, ...commonAgents]?.filter(ag => !ag.disabled)          
          let isAgentSetAsSource = _agents.find(ag => ag.id === selectedContext?.data?.sources?.[0]?.source)
          let isAgent = isAgentSetAsSource ? "agent" : null
          if(isAgent) {
            // when setted context is an agent
            payload.context = {
              agentType: isAgentSetAsSource?.type,
              title: isAgentSetAsSource?.name,
              "sources": [selectedContext?.data?.context || selectedContext?.data?.sources?.[0]]}
            if(selectedContext?.data?.messageId) {
              payload.contextParams = {messageId: selectedContext?.data?.messageId}
            }
            /*writing especially for botAgent, will remove this once search session api gives the context data, when we click on askFollowup after bot completion */
            if(selectedContext?.data?.sessionId){
              payload.context.sessionId = selectedContext?.data?.sessionId
            }
          } else {
            // when setted context is an attachment
            payload.context = {
              sessionId : selectedContext?.data?.sessionId
            }
          }
        }
        const scrollableElement = document.querySelector('.chatSec');
        if (scrollableElement) {
          requestAnimationFrame(() => {
            //scrollableElement.scrollTop = scrollableElement.scrollHeight;
            scrollableElement.scrollTo({ top: scrollableElement.scrollHeight, behavior: 'smooth' });
          });
        }
        console.log("payload in chat interface", payload)
        const Res = await store.dispatch(advanceSearch({ params, payload, userId: state.profile.data.id }))
        console.log("payload in chat interface", payload)
        constructQuestionPostCall(Res, qId)
        resIndexRef = 0
      }
    }

    const cancelMessageReqAction = async (id) => {


      const reqId = id || state.currentQuestion.reqId;
      const questions = cloneDeep(store.getState().global.questions);
      const payload = { boardId: state.activeBoardId };
      const currQuestion = state.currentQuestion?.isTask ? state.currentQuestion : questions[state.currentQuestion.reqId];
      if(currQuestion?.viewType === "threadView" && currQuestion?.botConversation) {
         stopBotAnswer()
        return;
      }
    
      const response = await store.dispatch(cancelAdvancedSearch({ 
        userId: state.profile.data.id, 
        reqId, 
        payload 
      }));
      
      const reqdCId = currQuestion?.isTask ? currQuestion?.cId : getCidByReqId(questions, reqId);
    
      constructQuestionPostCall(response, reqdCId);
    };
    

    const initiateChatConversationAction = async (arg) => {
      hideRecentAgentsDiv('recent-agents-container');
      const { enabledAgents, selectedContext } = state
      state = store.getState().global
      let params = { reqId: generateShortUUID() }
      let payload = {}
      let replaceExistingQsn = false;
      if (arg?.params?.reqId) {
        params.reqId = arg.params.reqId
        replaceExistingQsn = true
      }

      if (state.activeBoardId) {
        payload.boardId = state.activeBoardId
      }
      if(arg?.payload) {        
        payload = {...payload, ...arg.payload}
      }
      if(arg?.createIssue){
        if(arg?.from === "gptAgent"){
          params.agentType = "gptAgent"
          params.reqId = getCidByMessageId(state.questions, payload?.messageId)
          replaceExistingQsn = true
          if(arg?.isTask){
            params.parentMsgId = arg?.parentMsgId
          }
        }
      }  
            

      if(!isEmpty(state.customData)){
        console.log("custom data in chat interface line no 156", state.customData)
        console.log("custom data payload in chat interface line no 157", payload.customData)
        payload.customData = state.customData
        console.log("custom data payload in chat interface line no 157", payload.customData)
      }

		let qId = null;
		if(arg?.multiIntentExecution){
			qId = constructQuestionInitial({...arg?.params, ...params, ...arg?.payload, multiIntentExecution : true})
		}else{
			qId = constructQuestionInitial({...params, ...payload, replaceExistingQsn})
		}
    setTimeout(() => {
       const scrollableElement = document.querySelector('.chatSec');
       if (scrollableElement) {
            scrollableElement.scrollTo({
              top: scrollableElement.scrollHeight,
              behavior: 'smooth'
            });
       }
    }, 200);

		if(arg?.multiIntentExecution){
			// params.qId = arg?.params?.stepId;
		}else {
			if (!isEmpty(selectedContext?.data)) {
				let _agents = cloneDeep(enabledAgents);
				let isAgentSetAsSource = _agents.find(
					(ag) =>
						ag.id === selectedContext?.data?.sources?.[0]?.source
				);
				let isAgent = isAgentSetAsSource ? "agent" : null;
				if (isAgent) {
					// when setted context is an agent
					payload.context = {
            agentType: isAgentSetAsSource?.type,
            title: isAgentSetAsSource?.name,
						sources: [
							selectedContext?.data?.context ||
							selectedContext?.data?.sources?.[0],
						],
					};
					if (selectedContext?.data?.messageId) {
						payload.contextParams = {
							messageId: selectedContext?.data?.messageId,
						};
					}
					/*writing especially for botAgent, will remove this once search session api gives the context data, when we click on askFollowup after bot completion */
					if (selectedContext?.data?.sessionId) {
						payload.context.sessionId =
							selectedContext?.data?.sessionId;
					}
				} else {
					// when setted context is an attachment
					payload.context = {
						sessionId: selectedContext?.data?.sessionId,
					};
				}
			}
		}

    console.log("custom data payload in chat interface line no 206", payload.customData)

		const Res = await store.dispatch(advanceSearch({ params, payload, userId: state?.profile?.data?.id, multiIntentExecution: arg?.multiIntentExecution }))

    console.log("payload in chat interface line no 210", payload)
		/*
	  below condition triggers when templatetype is gpt_form_template and user doesnt have any input fields to enter, so application needs to make advancesearch api call with {} formData, as per EVA
	  */
    if (Res?.payload?.templateType === "gpt_form_template" && Res?.payload?.content?.formFields?.inputFields?.length === 0){
      delete payload.context
      payload.formData = {}
      const newRes = await store.dispatch(advanceSearch({ params, payload, userId: state?.profile?.data?.id }))
      constructQuestionPostCall(newRes, qId)
    }else{
      constructQuestionPostCall(Res, qId)
    }

    if(arg?.callback) {
      arg.callback()
    }
    resIndexRef = 0
	}

    const invokeGptAgentTemplate = (arg) => {
      const item = arg.item
      if (!item?.templateInfo?.suggestions?.[0]?.comingSoon) {
          let payload = {};
          let context =  arg?.item?.context
          /*for autonomous agent, the context should contain only sources */
          if(item?.context?.agentType === "aAAgent"){
            let _sources = cloneDeep(item?.sources)
            _sources[0].isAgent = true
            payload.context = { "sources": _sources, type:"commonAgent"}
          }else{
            payload.context = { ...context, "sources": item?.sources }
          }          
          payload.question = arg.utterance.label
          initiateChatConversationAction({payload})
      }
    }

    const askQuickActions = (arg) => {
      const payload = {
        action : arg
      }
      initiateChatConversationAction({payload})
    }

    const enableCustomTemplate = (payload) => {
      store.dispatch(setEnabledCustomTemplates(payload))
    }

    const enableContextByFollowupContext = (payload) => {
      store.dispatch(setEnableContextByFollowupContext(payload))
    }

    const storeCustomData = (payload) => {
      store.dispatch(setCustomData(payload))
    }

    const getCustomData = () => {
      console.log("custom data in chat interface line 267", state.customData)
      if(state?.enableDebugging){
        console.log("custom data in chat interface line 268", state.customData)
      }      
      return state.customData;
    }

  const responseFlowGeneration = (detail) => {
    let quesId = detail?.data?.reqId;
    let questions = cloneDeep(store.getState().global.questions);
    let question = questions[quesId];

    if (!question) {
      //Checking whether the question is one among the multi intent execution
      Object.values(questions)?.forEach(ques => {
        let reqdQues = ques?.reqId === quesId; //This it to check if the question is the main question or the multi Intent Execution
        let retryQues = ques?.retryId === quesId; //This is to check retry Questions.
        if (reqdQues && ques?.isTask) {
          question = ques;
          quesId = ques?._id; //The key of the id in multiintent execution is the _id, so we need to assign the _id to the quesId
          question.showResponseFlow = true;
        } else if (retryQues) {
          question = ques;
          quesId = ques?.id;
        }
      })
      if (!question) {
        //If the question is not found, then return
        return;
      }
    }

    if (question?.apiSuccess) {      
      question.generatingAnswerMsg = detail?.data?.suggestion    
      questions[quesId] = question
      store.dispatch(updateChatData(questions))
      return;
    }
    question.generatingAnswerMsg = detail?.data?.suggestion
    questions[quesId] = question
    store.dispatch(updateChatData(questions))        
  }

    const contentStreaming = (detail) => {
      let reqId;
      const {currentQuestion, questions, chatInterfaceOptions} = store.getState().global;
      let _questions = cloneDeep(questions);
      if(Object.keys(_questions).length === 0){
        return;
      }
      // if contentStreaming set to false by client than it will not stream the content
      if(chatInterfaceOptions?.contentStreaming === false) return;

      // questionsRef.current - because questions state updates not coming in eventBuzz

      /*when resuming the conversation from history, the history data is structured using uuid, so using redId, we can extract the question to be resumed, so need to target the id, present in question with the help of reqId */
      /*function to check the questions are from history */
      const isHistoryAccessed = checkHistoryAccessed(_questions)
      /*In case of multi intent execution, we need to get the id as we are putting that task as key in questions,
      so to get that firstly, we will check whether the currentQuestion is a task by checking the isTask flag
      if it is a task, then we will get the id from the currentQuestion
      if it is not a task, then we will get the id from the questions with the help of reqId
      */
      
      if(currentQuestion?.isTask){
        reqId = currentQuestion?.cId
      }else{
        reqId = detail?.data?.reqId
      }
      if(isHistoryAccessed){
        /*function to fetch the questio id based on the  requestId*/
        reqId = Object.entries(_questions).find(([key, value]) => value?.reqId === detail?.data?.reqId)?.[0]
      }
      let question = cloneDeep(_questions[reqId])

      /*if api returns a non 200 response, an error, straming should be stopped */
      if(question?.status === "error"){
        question.streamingStatus = "aborted"
        _questions[reqId] = question
        store.dispatch(updateChatData(_questions))
        return;
      }

      /*if api returns a non 200 response, an error, straming should be stopped */
      if(question?.status === "error"){
        question.streamingStatus = "aborted"
        questions[reqId] = question
        store.dispatch(updateChatData(questions))
        return;
      }

      if (question?.apiSuccess && question?.viewType !== "threadView") return; // Means adv search call success now no need to take socket updates, added condition for threadView

      if (detail?.data?.status === 'in-progress') {

        if (detail?.data?.templateType === 'multi_responses') {
          const resIndex = detail?.data?.respId


          if (!question.hasOwnProperty('responses')) {
            question.responses = []
          }
          if (!question?.responses?.[resIndex]) {
            question.responses[resIndex] = { answer: '' }
          }

          question.responses[resIndex].answer = question?.responses?.[resIndex]?.answer?.concat(detail?.data?.chunk)

          if (resIndexRef !== resIndex) {
            question.responses[resIndexRef].status = 'completed'
          }

          // One old index for comparing
          resIndexRef = resIndex;

        } else {
          /*adding streaming for autonomous agent */
          if(question?.viewType === "threadView" || question?.hasOwnProperty('botConversation')){
            /*while autonomous agent is streaming, need to add the chunked data to the outputId present in botConversation */
            if(!question?.botConversation) {
              question.botConversation = {}
            }
            if(detail?.data?.outputMessageId) {
              if(Object.values(question.botConversation)?.find(conv => conv?.outputMessageId === detail?.data?.outputMessageId)){
                delete question?.botConversation?.[detail?.data?.outputMessageId]  
                                              
              }else{
                question.botConversation[detail?.data?.outputMessageId] = {                    
                        question: (question?.botConversation?.[detail?.data?.outputMessageId]?.question || "").concat(detail?.data?.chunk),
                        status: detail?.data?.status,
                        templateType: detail?.data?.templateType,
                        "thoughts": question.botConversation[detail?.data?.outputMessageId]?.thoughts || [],
                    }
              }
              _questions[reqId] = question
              store.dispatch(updateChatData(_questions))
              return;               
            }
            
          }else{
            question.answer = question?.answer?.concat(detail?.data?.chunk)
          }          
        }

        question.templateType = detail?.data?.templateType || "search_answer"
        question.streamingStatus = 'in-progress'

        if (question?.loading) {
          delete question?.loading
        }
        
        _questions[reqId] = question
        store.dispatch(updateChatData(_questions))
      }

      if (detail?.data?.status === 'completed' || detail?.data?.status === 'aborted') {
        question.streamingStatus = detail?.data?.status // 'completed' or 'aborted'
        
        _questions[reqId] = question
        store.dispatch(updateChatData(_questions))

        resIndexRef = 0

        // setTimeout(() => {
        //   let dottt = document.querySelector('.dottt')
        //   if (dottt) {
        //     document.querySelector('.dottt').remove()
        //   }
        // }, 250);
      }
    }


    const agentThoughts = (detail) => {
      const state = store.getState().global
      let _questions = cloneDeep(state.questions)
      const cQFromStore = state.currentQuestion /*this helps to understand whether the current question is a part of agentic flow using isTask flag */
      let reqId = detail?.data?.reqId
      /*when resuming the conversation from history, the history data is structured using uuid, so using redId, we can extract the question to be resumed, so need to target the id, present in question with the help of reqId */
      const isHistoryAccessed = checkHistoryAccessed(_questions)
      if(isHistoryAccessed){
        reqId = Object.entries(_questions).find(([key, value]) => value?.reqId === detail?.data?.reqId)?.[0]
      }else if(cQFromStore?.isTask){
        reqId = cQFromStore?.cId
      }
      let currentQuestion = _questions[reqId]
      if(detail?.entity !== "answerContext"){      
      if(detail?.data?.answerMeta?.hasOwnProperty('messageId')) {
        currentQuestion = {...currentQuestion, ...detail?.data?.answerMeta}      
        currentQuestion.botConversation = {}  
      }
      /*we have to create botConversation with the outputMessageId add thoughts to it, once the advanceSearchApi is completed, need to replace that outputMessageId with the response of advSearch API */
      if(detail?.data?.answerMeta?.hasOwnProperty('outputMessageId')){
        if(!currentQuestion?.botConversation) {
              currentQuestion.botConversation = {}
        }
        /*check for the status of currentQuestion botConversation that is having outputMessageId, if it is error then return */
        if(currentQuestion?.botConversation?.[detail?.data?.answerMeta?.outputMessageId]?.status === "error"){
          return;
        }
        currentQuestion.botConversation[detail?.data?.answerMeta?.outputMessageId] = {
            "outputMessageId":detail?.data?.answerMeta?.outputMessageId,
            "suggestion":detail?.data?.suggestion,
            "thoughts":detail?.data?.answerMeta?.thoughts,
            "status": "in-progress",
            "templateType": detail?.data?.templateType || "search_answer",
        }
      } 
    } else {
      currentQuestion.agentIcon = detail?.data?.answerMeta?.agentIcon
      currentQuestion.agentName = detail?.data?.answerMeta?.agentName
      currentQuestion.viewType  = detail?.data?.answerMeta?.viewType
    }
      
      _questions[reqId] = currentQuestion      
      store.dispatch(updateChatData(_questions))      
      console.log("agentThoughts", detail)
    }

    const options = (_options) => {
      const chatOptions = cloneDeep(state.chatInterfaceOptions)
      store.dispatch(setChatInterfaceOptions({...chatOptions, ..._options}))
    }

    const clearErrorState = () => {
      // The current function can be used to clear all the error states that are stored whenever an API call fails.
      store.dispatch(setErrorState([]))
    }

    /**
     * Sends a message to either a bot conversation or initiates a regular chat message
     * 
     * @param {Object} question - The question object containing conversation details
     * @param {Object} conversation - The conversation object containing message details
     * @param {string} input - The user's input message to be sent
     * 
     * @description
     * This function handles two types of message sending:
     * 1. Bot Conversation: If the question has botConversation flag set, it sends the message
     *    to the bot conversation system with the required context and identifiers
     * 2. Regular Chat: If not a bot conversation, it uses the standard sendMessageAction
     *    to process the message through the regular chat flow
     */
    const sendMessage = (input, question) => {
      // Check if this is a bot conversation
      if(question?.botConversation && question?.status === "threadRunning") {
        // Get the conversation which is in-progress
      const conversation = Object.values(question?.botConversation)?.find(c => c?.status === 'in-progress')

        // Prepare payload for bot conversation
        const payload = {
          "cId": question?.cId || question?.reqId, // Use conversation ID or request ID
          "input": input, // User's input message
          // "context": question?.context, // Conversation context
          "messageId": conversation?.messageId, // Message identifier
        }
        // Submit the response to the bot conversation system
        BotConversation().submitBotResponse(payload)
      } else {
        // Handle as a regular chat message
        sendMessageAction(input)
      }
    }

    const setAgentContext = (agent) => {
      const agentDetails = {
			name: agent?.name,
			docId: agent?.id,
			source: agent?.id,
			title: agent?.name,
			icon: agent?.icon,
			isAgent: true,
		};
		sessionItemHandler({
			item: agentDetails,
			invokeAgent: true,
			type: "agent",
      })
    }


    return {
        subscribe,
        sendMessageAction,
        initiateChatConversationAction,
        cancelMessageReqAction,
        invokeGptAgentTemplate,
        askQuickActions,
        enableCustomTemplate,
        storeCustomData,
        getCustomData,
        contentStreaming,
        agentThoughts,
        options,
        enableContextByFollowupContext,
        clearErrorState,
        sendMessage,
        setAgentContext,
        stopBotAnswer,
      responseFlowGeneration
    }
}

export default ChatInterface;