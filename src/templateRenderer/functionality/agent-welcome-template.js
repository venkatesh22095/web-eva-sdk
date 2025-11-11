import { InvokeGptAgentTemplate } from "../../chat";

const AgentWelcomeFunc = (item) => {
	item?.templateInfo?.suggestions?.[0]?.utterances?.forEach(
		(utterance, i) => {
			const chipOne = document.getElementById(`awt-${item?.id}-${i}`);
			if (chipOne) {
				chipOne.onclick = () => InvokeGptAgentTemplate({ item, utterance });
			}
		}
	);
};

export default AgentWelcomeFunc;
