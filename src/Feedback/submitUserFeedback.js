import { submitFeedback } from "../redux/actions/global.action"
import store from "../redux/store"

const submitUserFeedback = async ({ type, cId, messageId = null, payload }) => {
    // console.log("inside submitFeedback: ", question, payload)
    const state = store.getState().global
    if(state?.enableDebugging){
        console.log("type, cId, payload", type, cId, payload)
    }
    let feedBackPayload = {}    
    const currentQuestion = state.questions[cId]
    if(state?.enableDebugging){
        console.log(" cId: ", cId)
        console.log('question with the given cId: ', currentQuestion)
    }
    if (!payload) {
        const feedbackComment = document.getElementById("comment-" + currentQuestion?.messageId)
        if (type === "like") {
            feedBackPayload.feedback = "like"
        }

        if (type === "dislike") {
            const checkedRadio = document.querySelector(
                'ul.radio-group input[name="categories"]:checked'
            );
            feedBackPayload.category = []
            if(checkedRadio?.value){
                feedBackPayload.category.push(checkedRadio?.value)
            }            
            feedBackPayload.feedback = type
        }
        //feedback comment logic
        feedBackPayload.comment = feedbackComment?.value || ""
        if(state?.enableDebugging){
            console.log("feedback payload: ", feedBackPayload)
        }
        if (currentQuestion?.hasOwnProperty("feedback") && currentQuestion.feedback === type && (feedBackPayload.comment ? (feedBackPayload.comment === currentQuestion?.comment) : true)) {
            feedBackPayload = { "action": "undo" }
        }
    } else {
        feedBackPayload = payload
    }
    if(state?.enableDebugging){        
        console.log(`
            boardId: ${state.activeBoardId}
            messageId: ${currentQuestion?.messageId}
            cId: ${cId}
            Payload: ${feedBackPayload}
        `);
    }    
    if(!messageId){
        messageId = currentQuestion?.messageId
    }
    const response = await store.dispatch(submitFeedback({ boardId: state.activeBoardId, messageId: messageId, cId: cId, payload: feedBackPayload }));
    return response;
}

export default submitUserFeedback