import { keyBy, orderBy } from "lodash"
import { getSearchHistory } from "../redux/actions/global.action"
import store from "../redux/store"
import { v4 as uuid } from 'uuid';
import { setActiveBoardId, updateChatData, setChatHistoryMoreAvailable, setCurrentQuestion } from "../redux/globalSlice";
import constructGptForm from "./gptTemplate/gptTemplateBody";
import gptFormFunctionality from "./gptTemplate/gptTemplateFunc";
import MultiResponse from "./gptTemplate/MultiResponse";
import BotConversation from "./botAgent/getBotConversation";

let chatHistoryOffset = 0;

const JoinChatThread = async (props) => {
    const state = store.getState().global;

	if (props?.pagination) {
		chatHistoryOffset += 1;
	}

    let params = {
        // limit: props?.limit || 20,
        // offset: chatHistoryOffset * (props?.limit || 20)
        limit: 20,
        offset: chatHistoryOffset * 20
    }

    if(props?.redirectFromNotification) {
        params.showdata = true
    }

    const Res = await store.dispatch(getSearchHistory({boardId: props.boardId, params}))

    // Setting active boardId
    store.dispatch(setActiveBoardId(props.boardId))
    // offset will increase only if its pagination call
    // if(props?.pagination) {
        // chatHistoryOffset++
    // }

    const afterApiCallSuccess = async(data, args) => {
        const {history, moreAvailable} = Res.payload;

        let historyData = [];

        historyData = orderBy(history, 'cOn', 'asc')
        let updatedQuestions = {}
        for(const q of historyData){
        let msgId = q?.reqId || uuid();
            let obj = {
                ...q,
                // id: msgId,
                messageId: q?.id,
                context: {...q?.context, messageId: q?.id},
                type: q?.postType === "follow-up" ? "followup" : "search",
                historicalData: true
            }
    
            // if(q?.templateType === "action_send_email" && q?.status === "draft") {    
            //     let emailObj = {
            //         canIncludeSource: q?.canIncludeSource,
            //         emailData: emailData({id: msgId}, q),
            //     }
            //     let connMeta = getConnMetaEmail(appContext, obj);
            //     if(connMeta) {
            //         emailObj.connMeta =  connMeta
            //     }
            //     obj = {...obj, ...emailObj}
            // }
    
            // if(q?.templateType === "action_send_slack_message" || q?.templateType === "action_send_msteams_message") {    
            //     let ConnectionObj = {
            //         canIncludeSource: q?.canIncludeSource,
            //         externalIntegrationAction : true
            //     }
            //     let connMeta = getConnMetaCommon(appContext, obj)
            //     if(connMeta) {
            //         ConnectionObj.connMeta =  connMeta
            //         ConnectionObj.skills = (obj?.templateType === "action_send_slack_message") ? "slack" : "msteams"
            //     }
            //     obj = {...obj, ...ConnectionObj}
            // }
            if(q?.viewType === "threadView") {
                let params = {
                    limit: 20,
                    showdata: true,
                    pId: q?.messageId
                }
                const botChatData = await store.dispatch(getSearchHistory({"boardId":q?.boardId,  params }))                
                if(botChatData?.payload?.history?.length) {
                const orderedBotChatData = orderBy(botChatData.payload.history, 'msgNo', 'asc')
                /*constructing botConversation from orderedBotChatData */
                /*if templateType is bot_template, need to include template_html key in the object */
                orderedBotChatData.map(detail => {
                    if (detail?.templateType === "bot_template"){
                        if (state?.enableKoreBotSDK){
                            detail.template_html = BotConversation().generateHTMLforBotTemplate(detail)
                        }                    

                    }})                
                obj.botConversation = keyBy(orderedBotChatData, 'messageId')
                if(state?.enableDebugging){
                    console.log("ordered bot chat data: ", orderedBotChatData)
                }
                }else{
                    obj.botConversation = {}
                }
            }

            if(q?.templateType === 'gpt_form_template') {
                const gptFormConstructedData = constructGptForm(q)
                obj.template_html = gptFormConstructedData.outerHTML
                let multiResponseData = MultiResponse().getInitialFormData(q)
                obj.gpt_forms = multiResponseData
                setTimeout(() => {
                    gptFormFunctionality(q);
                }, 1000);
            }
    
            if(q?.postType === "follow-up" && !q?.context) {
                /* setting the context of the follow-up question, which is nothing but parent question context */
                let parentQuestion = data?.history?.find(value => value?.context && q?.pId === value?.context?.sessionId);
                obj.context = parentQuestion?.context;
                obj.viewType = parentQuestion?.viewType;
            }
    
            // Kiaas form
            // if(q?.templateType === "bulk_action" && q?.status === "draft") {
            //     let formFields = {}
            //     obj.content.formFields.map(f => {
            //         formFields[f.formId] = f
            //     })
            //     obj.formsLength = obj.content.formFields?.length;
            //     obj.content.formFields = formFields;
            // }
    
            updatedQuestions[msgId] = obj;
            // return obj;
        }
    
        let _questions = {}
        if(props?.pagination) {
            let newquestions = { ...state.questions, ...updatedQuestions };
            newquestions = Object.entries(newquestions);
            newquestions = orderBy(newquestions, ([key, value]) => value.cOn, 'asc');
            newquestions = Object.fromEntries(newquestions);
            _questions = newquestions
        } else {
            _questions = updatedQuestions
        }

        /*set the current question when accessed from history i.e question that is not in completed state*/
        const currentQuestion = Object.values(_questions).find(q => q?.status !== "completed");
        store.dispatch(setCurrentQuestion(currentQuestion))
        store.dispatch(setChatHistoryMoreAvailable(moreAvailable))
        store.dispatch(updateChatData(_questions))
    }
    await afterApiCallSuccess()
    if(state?.enableDebugging){
        console.log(Res)
    }
}

const constructBotAgentDataStructure = async (q) => {      

    let params = {
        limit: 20,
        showdata: true,
        pId: q?.messageId
    }

	const Res = await store.dispatch(getSearchHistory({ params }));
};

export default JoinChatThread;