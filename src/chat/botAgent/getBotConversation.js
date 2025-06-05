import { cloneDeep, isEmpty } from "lodash";
import {chatWindow, chatConfig} from "@koredev/kore-web-sdk"
import store from "../../redux/store";
import { checkHistoryAccessed, getReqIdByMessageId } from "../../utils/helpers";
import { updateChatData, setBotSDKInstance, setCurrentQuestion, setEnableKoreBotSDK } from "../../redux/globalSlice";
import { advanceSearch } from "../../redux/actions/global.action";
import { constructQuestionPostCall } from "../chat-utils";
import { setBotInstance, getBotInstance } from "./botSDKManager";
import { setupTemplates } from "../../templateRenderer/templates/bot-conversation";


const BotConversation = (args) => {
    let state = store.getState().global
    let currentBotSDKInstance = getBotInstance();

    const initializeBotSDK = (botDetails) => {
        let botOptions = chatConfig.botOptions;        
        botOptions.JWTUrl = "https://mk2r2rmj21.execute-api.us-east-1.amazonaws.com/dev/users/sts";
        botOptions.userIdentity = state?.profile?.data?.emailId || botDetails?.userEmailId;// Provide users email id here
        botOptions.botInfo = { name: botDetails?.name, "_id": botDetails?.streamId }; // bot name is case sensitive
        botOptions.clientId = botDetails?.webhook?.clientId;
        botOptions.clientSecret = botDetails?.webhook?.clientSecret;
        let botSDKInstance =  new chatWindow(chatConfig)
        if(state?.enableDebugging){
            console.log("bot sdk initialized: ", botSDKInstance)
        }
        currentBotSDKInstance = botSDKInstance
        // store.dispatch(setBotSDKInstance(botSDKInstance))
        setBotInstance(currentBotSDKInstance)
    }      
    if(currentBotSDKInstance){
        currentBotSDKInstance.sendMessage = (msg, renderTxt) => {
            /*
            msg is the payload to be sent to server,
            renderTxt is the object that cotains the data to be rendered at the client application
            */
            if (msg) {
                if(state?.enableDebugging){
                    console.log(msg, renderTxt)
                }
                submitBotResponse({
                    "input": msg,
                    "cId": state?.currentQuestion?.reqId,
                    "messageId": Object.values(store.getState().global?.currentQuestion?.botConversation)?.find(c => c.hasOwnProperty('template_html') && c.status === "in-progress")?.messageId,
                    "context": state?.currentQuestion?.context,
                    "source": "bot",
                    "renderMsgPayload": renderTxt?.renderMsg
                })
            }
        }
    }
    
    const setBotConversation = (detail) => {
        let question;
        let questions = cloneDeep(state?.questions)   
        if (isEmpty(questions)) {
            return;
        }     
        if(detail?.action === "create"){
            question = questions[getReqIdByMessageId(detail?.pId)]
            if (isEmpty(question)) {
                //corresponding bot question is unavailable
                console.error(`bot question with id: ${detail?.messageId} is unavailable, please check the store`)
            } else {
                if (!question?.hasOwnProperty('botConversation')) {
                    question.botConversation = {}
                }
                question.botConversation[detail?.messageId] = detail?.message
                if (detail?.message?.templateType === "bot_template" || detail?.message?.templateType === "hold_conversation"){
                    if (state.enableKoreBotSDK){                        
                        const templatePayload = {
                            "type": "bot_response",
                            "from": "bot",
                            "messageId": detail?.message?.messageId,
                            "message": [
                                {
                                    "type": "text",
                                    "component": detail?.message?.content
                                }
                            ]
                        }
                        currentBotSDKInstance.chatEle = document.getElementById("chatTestComp")
                        if(state?.enableDebugging){
                            console.log("template html: ", currentBotSDKInstance.generateMessageDOM(templatePayload))
                        }
                        question.botConversation[detail?.messageId].template_html = currentBotSDKInstance.generateMessageDOM(templatePayload) || new chatWindow().generateMessageDOM(templatePayload)
                    }                    
                }
            }
        }
        if(detail?.action === "update"){         
            /*reqId only comes when updating the parentMessage clo */   
            if (detail?.message?.hasOwnProperty('reqId') && Object.keys(questions || {}).length > 0) {
                const currentQuestion = Object.values(questions).find(ques => ques.reqId === detail.message.reqId)
                if(currentQuestion?.historicalData){
                    question = questions?.[currentQuestion?.id]
                }else{
                    question = questions?.[currentQuestion?.reqId]
                }                
                question = {...question, 'answer': detail?.message?.answer, 'status': detail?.message?.status}
            }else{
                question = questions[getReqIdByMessageId(detail?.message?.pId)]
                question.botConversation[detail?.messageId] = detail?.message
            }         
            /*should retain the id of the question when accessing from history */
            // if(question?.historicalData){
            //     const questionHistoryId = question.id
            //     question = { ...question, ...detail?.message }
            //     question.id = questionHistoryId
            // }else{
            //     // question = { ...question, ...detail?.message }
            // }  
            if(state?.enableDebugging){
                console.log("question after update: ", question)
            }         
        }        
        store.dispatch(setCurrentQuestion(question))
        /*In case of history data we need to depend on id of the question */
        if(question?.historicalData){
            questions[question?.id] = question
        }else{
            questions[question?.reqId] = question
        }        
        // questions[question?.reqId] = question
        store.dispatch(updateChatData(questions))
        // BotConversation().setupTemplates(props?.botConversation);
        // const currentBotConv = question.botConversation[detail?.messageId]
        setupTemplates(question.botConversation);
    }

    const enableEVABotSdk = (payload) => {
        store.dispatch(setEnableKoreBotSDK(payload))
    }


    const submitBotResponse = async (data) => {
        /**
         * needed payload
         payload = {
         "question": "nothing but used entered answer",
         "context": "current question's context",
         "messageId": "current bot question's messageId"
         "source": "bot"
         }
         */
        state = store.getState().global
        const params = {
            "reqId": data?.cId, //use reqId
            "from": "botAgent"
        }
        let payload = {
            "question": data?.input,
            "context": data?.context,
            "messageId": data?.messageId,
            "source": "bot"
        }
        if (data?.renderMsgPayload){
            payload.renderMsgPayload = data?.renderMsgPayload 
        }
        if (!isEmpty(state.customData)) {
            payload.customData = state.customData
        }
        if(state?.enableDebugging){
            console.log("state data: ", state)        
        }
        /*need to add a loading state for the current question */
        addLoadingStateToCurrentQuestion(data?.cId, data?.messageId, data?.input)
        if(state?.enableDebugging){
            console.log("params data: ", data)
        }
        const res = await store.dispatch(advanceSearch({ params, payload, userId: state?.profile?.data?.id || data?.userId}))
        constructQuestionPostCall(res, data?.cId)
    }

    const addLoadingStateToCurrentQuestion = (quesReqId, messageId, input) => {
        let reqId = quesReqId
        let questions = cloneDeep(state?.questions)
        const isHistoryAccessed = checkHistoryAccessed(questions)
        if(isHistoryAccessed){
            reqId = Object.entries(questions).find(([key, value]) => value?.reqId === reqId)?.[0]
        }
        let currentQuestion = questions[reqId]
        if (currentQuestion) {
            let botConversation = currentQuestion?.botConversation
            if (botConversation) {
                let currentBotQuestion = botConversation?.[messageId]
                if (currentBotQuestion) {                    
                    currentBotQuestion.loading = true
                    currentBotQuestion.answer = input
                    if(state?.enableDebugging){
                        console.log("added loading state: ", currentBotQuestion)
                    }
                    botConversation[messageId] = currentBotQuestion
                    currentQuestion.botConversation = botConversation
                    questions[reqId] = currentQuestion                    
                    store.dispatch(updateChatData(questions))
                }
            }
        }
    }
    const installOwnTemplate = (templateInstance) => {
        currentBotSDKInstance?.templateManager?.installTemplate(templateInstance) //Here templateInstance should be a component
    }

    const generateHTMLforBotTemplate = (templatePayload) => {        
        const xoTemplatePayload = {
            "type": "bot_response",
            "from": "bot",
            "messageId": templatePayload?.messageId,
            "message": [
                {
                    "type": "text",
                    "component": templatePayload?.content
                }
            ]
        }
        currentBotSDKInstance.chatEle = document.getElementById("chatTestComp")
        return currentBotSDKInstance.generateMessageDOM(xoTemplatePayload)
        
    }
    return{
        setBotConversation,
        submitBotResponse,
        installOwnTemplate,
        initializeBotSDK,
        enableEVABotSdk,
        generateHTMLforBotTemplate
    }
}

export default BotConversation;