import AgentWelcomeFunc from "../functionality/agent-welcome-template";
import { encodeHtml } from "../utils/helper";
import TemplateComponents from "./index";

export function render(item) {
	const suggestions = item?.templateInfo?.suggestions?.[0];
	const utterances = suggestions?.utterances || [];

	const utteranceHtml = utterances
		.map((utterance, i) => {
			return `
				<div class="chipone" id="awt-${item?.id}-${i}">
					<div class="leftBlock">
						<span class="tickmarkicon">
							<svg width="13" height="13" class="wa-RightArrow " viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.33337 6.00016H10.6667M10.6667 6.00016L6.00004 1.3335M10.6667 6.00016L6.00004 10.6668" stroke="#26272B" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"></path></svg>
						</span>
						<span class="newtext" key="${i}">${utterance?.label}</span>
					</div>
					${
						item?.utterances?.isNew
							? `
						<div class="rightBlock">
							<div class="rbText">New</div>
						</div>`
							: ""
					}
				</div>
			`;
		})
		.join("");

	const html = `
		<div class="answerCntr">
			<div class="threadName maxLength">${item?.answer || ""}</div>
			<div class="threadName maxLength">
				<div class="Answerschip msutteranceChip">
					<div class="ansdocwrap">
						<div class="chipheadertype">${suggestions?.title || ""}</div>
					</div>
					<div class="mulanschip">
						${utteranceHtml}
					</div>
				</div>
			</div>
		</div>
	`;

	setTimeout(() => {
		AgentWelcomeFunc(item);
	}, 1000);

	return html;
}

export default { render };
