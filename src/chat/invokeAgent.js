import { sessionItemHandler } from "../Attachments/createContext";
import InitiateChatConversationAction from './InitiateChatConversationAction';

const InvokeAgent = (agent) => {
    let payload = {
        intent: "welcome",
        question: `How can the "${agent?.name}" agent assist me`,
        source: agent?.id
    }
    const agentDetails = {
        "name": agent?.name,
        "docId": agent?.id,
        "source": agent?.id,
        "title": agent?.name,
        "icon": agent?.icon,
        'agentType': agent?.type,
        isAgent: true
    }

    if(agent?.type === "agenticApp") {
        const intentList = [];
        agent?.config?.executionPipeline?.map((task, index) => {
            task?.intents?.map((intent) => {
                if(intentList?.find((i) => i?.agentMeta?.name === intent?.agentMeta?.name)) return;
                intentList?.push(intent)
            })
        });
        agentDetails.agenticAppIcons = intentList;
    }

    payload.context = {
        sources : [agentDetails]
    }
    sessionItemHandler({item: agentDetails, invokeAgent: true, type : 'agent'})
    InitiateChatConversationAction({payload})
}

export default InvokeAgent