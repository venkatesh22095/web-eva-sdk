import { submitFeedback } from "../redux/actions/global.action"
import store from "../redux/store"
/*mock payload for feedback body is

Like:
{
    "userFeedback": {
        "type": "like",
        "rating": 2,
        "comment": "Not that great"
    }
}

Dislike
{
    "userFeedback": {
        "type": "dislike",
        "category": [
            "Intent mismatch"
        ],
        "reason": "nope",
        "rating": 2,
        "comment": "Not that great"
    }
}


undo
{
    "action": "undo"
}

*/

const submitUserFeedback = async ({ type, cId, messageId = null, payload }) => {
    // console.log("inside submitFeedback: ", question, payload)
    const state = store.getState().global
    if (state?.enableDebugging) {
        console.log("type, cId, payload", type, cId, payload)
    }
    let feedBackPayload = {}
    const currentQuestion = state.questions[cId]
    if (state?.enableDebugging) {
        console.log(" cId: ", cId)
        console.log('question with the given cId: ', currentQuestion)
    }
    if (!payload) {
        const feedbackComment = document.getElementById("comment-" + currentQuestion?.messageId)
        if (type === "like") {
            feedBackPayload.type = "like"
            feedBackPayload.rating = document.getElementById("rating")?.value || ''
        }

        if (type === "dislike") {
            feedBackPayload.type = "dislike"
            feedBackPayload.rating = document.getElementById("rating")?.value || ''
            const checkedRadio = document.querySelector(
                'ul.radio-group input[name="categories"]:checked'
            );
            feedBackPayload.category = []
            if (checkedRadio?.value) {
                feedBackPayload.category.push(checkedRadio?.value)
            }
            feedBackPayload.reason = document.getElementById("reason")?.value || ''
        }
        //feedback comment logic
        feedBackPayload.comment = feedbackComment?.value || ""
        feedBackPayload = { userFeedback: feedBackPayload }
        if (state?.enableDebugging) {
            console.log("feedback payload: ", feedBackPayload)
        }
        if (currentQuestion?.hasOwnProperty("feedback") && currentQuestion.type === type && (feedBackPayload.comment ? (feedBackPayload.comment === currentQuestion?.comment) : true)) {
            feedBackPayload = { "action": "undo" }
        }
    } else {
        feedBackPayload = payload
        if (currentQuestion?.hasOwnProperty("feedback") && currentQuestion?.feedback === type) {
            feedBackPayload = { "action": "undo" }
        }
    }
    if (state?.enableDebugging) {
        console.log(`
            boardId: ${state.activeBoardId}
            messageId: ${currentQuestion?.messageId}
            cId: ${cId}
            Payload: ${feedBackPayload}
        `);
    }
    if (!messageId) {
        messageId = currentQuestion?.messageId
    }
    const response = await store.dispatch(submitFeedback({ boardId: state.activeBoardId, messageId: messageId, cId: cId, payload: feedBackPayload }));
    return response;
}

export default submitUserFeedback