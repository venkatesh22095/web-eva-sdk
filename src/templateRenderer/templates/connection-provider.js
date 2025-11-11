import store from "../../redux/store";
import ConnectionProviderFunc from "../functionality/connection-provider";
import { PlusIcon } from "../icons-library";
import eventBus from "../utils/eventbus";

eventBus.on("basicAuth", basicAuthHandler);

function basicAuthHandler({ detail }) {
	const { response, data } = detail;
	const inputFields = response?.payload?.authProfiles?.[0]?.inputFields;

	const inputsHTML = inputFields
		?.filter((inputField) => inputField?.hidden !== true)
		?.map((field) => {
			const required = field?.required ? "required" : "";
			const help = field?.helpText
				? `<small>${field.helpText}</small>`
				: "";
			return `
        <div class="input-field">
            <label>${field?.label}</label>
            <input 
                id="basicAuthInput-${data?.id}-${field?.key}"
                name="${field.key}"
                placeholder="Enter ${field?.label}"
                type="${field?.value?.type || "text"}"
                ${required}
            />
            ${help}
        </div>
      `;
		})
		.join("");

	const html = `
    <dialog id="basicAuthDialog-${data?.id}" class="formDialog" style="width:500px; padding:20px;">
      <div class="formModalContent">
        <form id="basicAuthForm-${data?.id}">
          <div class="connectionTitle">${data?.provider}</div>
          <div class="autorisation-form">${inputsHTML}</div>
          <div class="footer">
            <button type="button" class="basicAuth-cancel-btn" id="basicAuthCancelBtn-${data?.id}">Cancel</button>
            <button class="basicAuth-submit-btn" id="basicAuthSubmitBtn-${data?.id}" type="submit">Done</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

	const container = document.createElement("div");
	container.innerHTML = html;
	const dialog = container.firstElementChild;
	document.body.appendChild(dialog);
	dialog.showModal();

	let timeout;
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		ConnectionProviderFunc(data, response);
	}, 1000);
}

function render(data) {
	const state = store.getState().global;
	const { profile } = state;

	const providerName = data?.templateInfo?.label || data?.label || "";
	const providerIcon = data?.templateInfo?.icon || data?.icon || "";

	const isMicrosoftOrGoogle = ["outlook", "gmail", "gdrive", "onedrive"].includes(
		data?.provider
	);

	const authText = isMicrosoftOrGoogle
		? `Please provide the authentication to ${profile?.data?.emailId} so we can proceed with your request.`
		: `Please complete the ${providerName} authentication so we can proceed with your request.`;

	const html = `
    <div class="add-connection">
      <div class="mainactwrap">
        <div class="choosenimage">
          <img src="${providerIcon}" alt="" />
        </div>		      
      </div>
      <div class="contentAreawrap">
			<div class="choosedtext">${providerName}</div>
			<div class="rightside">
				<div class="authenticationstatus">
					<div class="authenticateverify">${authText}</div>
					<div class="addConnection" id="addConnection-${data?.id}">
					<div class="acIcon">${PlusIcon({ size: 13, color: "#131316" })}</div>
					<div class="acText">Add connection</div>
					</div>
				</div>
			</div>
		</div>  
    </div>
  `;

	const container = document.createElement("div");
	container.innerHTML = html;

	// container.querySelector(`#addConnection-${data?.id}`)?.addEventListener("click", () => {
	// 	addConnectionHandler();
	// });

	let timeout;
	clearTimeout(timeout);
	timeout = setTimeout(() => {
		ConnectionProviderFunc(data);
	}, 1000);

	return container.innerHTML;
}

export { render };
