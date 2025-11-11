import AmbiguityTemplateFunc from "../functionality/ambiguity-template";

export function render(data) {
	const ambiguous = data?.templateInfo?.ambiguous || [];

	const renderOptions = (el) =>
		(el?.value?.choices || [])
			.map((choice) => {
				const value = choice.value || choice.name;
				const label = choice.label || choice.name;
				return `<sl-option value="${value}">${label}</sl-option>`;
			})
			.join("");

	const renderSelects = ambiguous
		.map((el, index) => {
			const multiple = el?.value?.multi ? "multiple" : "";
			const checkedChoice = el?.value?.choices?.find(choice => choice.checked);
			const checkedValue = checkedChoice ? (checkedChoice.value || checkedChoice.name) : '';
			return `
				<div class="drpdwnboxclass">
					<div class="headerdropdowns" title="Tooltip for ${el.label}">${el.label}</div>
					<sl-select id="resolve-ambiguity-select-${data?.id}" ${multiple} value="${checkedValue}">
						${renderOptions(el)}
					</sl-select>
				</div>
			`;
		})
		.join("");

	const html = `
		<div id="resolve-ambiguity-container-${data?.id}" class="resolve-ambiguity-container">
			<div class="threadName">${data?.answer || AmbiguityNameDisplayer()}</div>
			<div class="threadName">
				<div class="maildrpbox" id="ambquityDropdown">
					${renderSelects}
					<div class="amb-action-box" id="resolve-ambiguity-action-box-${data?.id}">
						<sl-button size="medium" variant="default" class="secondary-button" id="resolve-ambiguity-cancel-btn-${data?.id}">Cancel</sl-button>
						<sl-button size="medium" variant="primary" class="primary-button-black" id="resolve-ambiguity-confirm-btn-${data?.id}">Confirm</sl-button>
					</div>
				</div>
			</div>
		</div>
	`;

	let timer;
	clearTimeout(timer);
	timer = setTimeout(() => {
		AmbiguityTemplateFunc(data);
	}, 1000);

	return html;

	// Helper functions
	function AmbiguityNameDisplayer() {
		const names = ambiguous.map((item) => item?.label);
		if (names.length > 1) {
			return `There are conflicts on few inputs. Please confirm`;
		} else {
			return `We found more than one result for "${names[0]}". Please confirm.`;
		}
	}
}

export default { render };
