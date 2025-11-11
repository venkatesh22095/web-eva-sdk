// import { encodeHtml } from "../utils/helper";
import IntentAmbiguityFunc from "../functionality/intent-ambiguity-template";
import { encodeHtml } from "../utils/helper";
import TemplateComponents from "./index";

// import TemplateComponents from "./index";
function render(data) {
	const ambiguousData = data?.templateInfo?.ambiguous?.find(
		(ob) => ob?.id === "intent"
	);
	const isMultipleAmbiguous =
		data?.templateInfo?.ambiguous?.[0]?.value?.choices?.length > 1
			? true
			: false;

	// function createThreadName(ambiguousData, selectedItem, sendIntent, renderIcons, TickMark, isMultipleAmbiguous, data, AddConnection) {
	const container = document.createElement("div");
	container.id = `intent-ambiguity-template-${data?._id}`;
	container.classList.add("intent-ambiguity-template");

	// First thread name div
	const threadNameDiv1 = document.createElement("div");
	threadNameDiv1.class = "threadName";
	threadNameDiv1.textContent = ambiguousData?.label || "";
	container.appendChild(threadNameDiv1);

	// Second thread name div
	const threadNameDiv2 = document.createElement("div");
	threadNameDiv2.class = "threadName";

	// Intent group div
	const intentGroupDiv = document.createElement("div");
	intentGroupDiv.class = "intentGroup";

	if (ambiguousData?.value?.choices?.length) {
		ambiguousData.value.choices.forEach((val, i) => {
			if (val?.connId?.length) {
				const intentDiv = document.createElement("div");
				// intentDiv.class = `intent${
				//  i === selectedItem ? " selected" : ""
				// }`;
				intentDiv.setAttribute("key", i);
				intentDiv.id = `intent-${i}`;
				// intentDiv.onclick = (e) => sendIntent(e, i, val);

				// Icon span
				const intIconSpan = document.createElement("img");
				intIconSpan.class = "intIcon";
				intIconSpan.src = val?.icon || "";
				intentDiv.appendChild(intIconSpan);

				// Text span
				const intTextSpan = document.createElement("span");
				intTextSpan.class = "intText";
				intTextSpan.textContent = val?.label || "";
				intentDiv.appendChild(intTextSpan);

				// Selection span
				const intSelectionSpan = document.createElement("span");
				intSelectionSpan.class = "intSelection";
				// intSelectionSpan.innerHTML = TickMark({
				//  size: 14,
				//  color: "#039855",
				// });
				intentDiv.appendChild(intSelectionSpan);

				intentGroupDiv.appendChild(intentDiv);
			} else {
				// const addConnectionComponent = AddConnection({
				//     data: val,
				//     isMultipleAmbiguous: isMultipleAmbiguous,
				//     questionData: data,
				// });
				// intentGroupDiv.appendChild(addConnectionComponent);
			}
		});
	}

	threadNameDiv2.appendChild(intentGroupDiv);
	container.appendChild(threadNameDiv2);

	let timeout;
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		IntentAmbiguityFunc(data);
	}, 1000);

	return container.outerHTML;
	// }
}

export { render };
