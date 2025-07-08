import sendEmailFunctionality from "../functionality/action-send-email";
import { encodeHtml } from "../utils/helper";
import "./../styles/template.scss";

export function render(data) {

    if(data?.status === 'completed') {
        return renderEmailSummary(data);
    }

    let emailList = data?.templateInfo?.connections;
    let defaultConnectionId = data?.templateInfo?.defaultConnections;

    // let html = `
    //     <div class="email-template">
    //     <div class='email-selection-field'>
    //         <div class="email-field">
    //             <select id = ${`email-connection-${data?.reqId}`}>
    //                 ${emailList?.map((email, index) =>
    //                     `<option id = email-connection-${index} value="${email?.id}" ${email?.id === defaultConnectionId ? 'selected' : ''}>${email?.emailId}</option>`
    //                 ).join('')}
    //             </select>
    //         </div>
    //         <div class="email-header">
    //             <div class="email-field">
    //                 <label>To:</label>
    //                 ${getEmailValue(data, 'to')}
    //                 <input type="text" placeholder="Enter email address" id = ${`email-to-${data?.reqId}`} value = "${data?.toChoices ? data?.toChoices?.input : ''}"/>
    //                 <div class="email-suggestions-dropdown">
    //                     ${data?.toChoices ? data?.toChoices?.res?.map((email, index) =>
    //                         `<option id = email-to-${data?.reqId}-${index} value="${email?.id}">${email?.id}</option>`
    //                     ).join('') : ''}
    //                 </div>
    //             </div>
    //             <div class="email-field">
    //                 <label>CC:</label>
    //                 ${getEmailValue(data, 'cc')}
    //                 <input type="text" placeholder="Enter email address" id = ${`email-cc-${data?.reqId}`} value = "${data?.ccChoices ? data?.ccChoices?.input : ''}" />
    //                 <div class="email-suggestions-dropdown">
    //                     ${data?.ccChoices ? data?.ccChoices?.res?.map((email, index) =>
    //                         `<option id = email-cc-${data?.reqId}-${index} value="${email?.id}">${email?.id}</option>`
    //                     ).join('') : ''}
    //                 </div>
    //             </div>
    //             <div class="email-field">
    //                 <label>BCC:</label>
    //                 ${getEmailValue(data, 'bcc')}
    //                 <input type="text" placeholder="Enter email address" id = ${`email-bcc-${data?.reqId}`} value = "${data?.bccChoices ? data?.bccChoices?.input : ''}" />
    //                 <div class="email-suggestions-dropdown">
    //                     ${data?.bccChoices ? data?.bccChoices?.res?.map((email, index) =>
    //                         `<option id = email-bcc-${data?.reqId}-${index} value="${email?.id}">${email?.id}</option>`
    //                     ).join('') : ''}
    //                 </div>
    //             </div>
    //             <div class="email-field">
    //                 <sl-input label="Subject" placeholder="Enter subject" 
    //                     id="email-subject-${data?.reqId}" 
    //                     value="${data?.content?.subject || ''}">
    //                 </sl-input>
    //             </div>
    //         </div>
    //         <div class="email-body">
    //             <div
    //                 class="email-body-container"
    //                 id="${`email-body-${data?.reqId}`}"
    //                 contenteditable="true"
    //             >
    //                 ${data?.content?.body ? data?.content?.body : ''}
    //             </div>
    //         </div>
    //         <div class="email-footer">
    //             <div class="email-field">
    //                 <input type="file" id = ${`email-attachments-${data?.reqId}`} multiple></input>
    //             </div>
    //             <div class="email-field">
    //                 ${getSmartComposeData(data)}
    //             </div>
    //             <div class="email-field">
    //                 <sl-button id = ${`email-send-${data?.reqId}`}>Send</sl-button>
    //             </div>
    //         </div>
    //     </div>
    // `;

    let html = `
        <div class="email-template">
            <div class='email-selection-field'>
                <div class="email-field">
                    <sl-select id="email-connection-${data?.reqId}" value="${defaultConnectionId || ''}">
                        ${emailList?.map((email, index) =>
                        `
                        <sl-option value="${email?.id}" id="email-connection-${index}">${email?.emailId}</sl-option>
                        `
                        ).join('')}
                    </sl-select>
                </div>
                <div class="email-header">
                    <div class="email-field">
                        ${getEmailValue(data, 'to')}
                        <sl-input
                        label="To:"
                        type="text"
                        placeholder="Enter email address"
                        id="email-to-${data?.reqId}"
                        value="${data?.toChoices?.input || ''}"
                        ></sl-input>
                        <div class="email-suggestions-dropdown">
                        ${data?.toChoices?.res?.map((email, index) =>
                        `
                        <sl-option id="email-to-${data?.reqId}-${index}" value="${email?.id}">${email?.id}</sl-option>
                        `
                        ).join('') || ''}
                        </div>
                    </div>
                    <div class="email-field">
                        ${getEmailValue(data, 'cc')}
                        <sl-input
                        label="CC:"
                        type="text"
                        placeholder="Enter email address"
                        id="email-cc-${data?.reqId}"
                        value="${data?.ccChoices?.input || ''}"
                        ></sl-input>
                        <div class="email-suggestions-dropdown">
                        ${data?.ccChoices?.res?.map((email, index) =>
                        `
                        <sl-option id="email-cc-${data?.reqId}-${index}" value="${email?.id}">${email?.id}</sl-option>
                        `
                        ).join('') || ''}
                        </div>
                    </div>
                    <div class="email-field">
                        ${getEmailValue(data, 'bcc')}
                        <sl-input
                        label="BCC:"
                        type="text"
                        placeholder="Enter email address"
                        id="email-bcc-${data?.reqId}"
                        value="${data?.bccChoices?.input || ''}"
                        ></sl-input>
                        <div class="email-suggestions-dropdown">
                        ${data?.bccChoices?.res?.map((email, index) =>
                        `
                        <sl-option id="email-bcc-${data?.reqId}-${index}" value="${email?.id}">${email?.id}</sl-option>
                        `
                        ).join('') || ''}
                        </div>
                    </div>
                    <div class="email-field">
                        <sl-input
                        label="Subject"
                        placeholder="Enter subject"
                        id="email-subject-${data?.reqId}"
                        value="${data?.content?.subject || ''}"
                        ></sl-input>
                    </div>
                </div>
                <div class="email-body">
                    <div
                        class="email-body-container"
                        id="email-body-${data?.reqId}"
                        contenteditable="true"
                        >
                        ${data?.content?.body || ''}
                    </div>
                </div>
                <div class="email-footer">
                    <div class="email-field">
                        <sl-input
                        type="file"
                        id="email-attachments-${data?.reqId}"
                        multiple
                        ></sl-input>
                    </div>
                    <div class="email-field">
                        ${getSmartComposeData(data)}
                    </div>
                    <div class="email-field">
                        <sl-button id="email-send-${data?.reqId}" variant="primary">Send</sl-button>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        sendEmailFunctionality(data);
    }, 1000);

    return html;
}

const getSmartComposeData = (data) => {

    let html;

    let smartComposeButton = `
        <button id = ${`email-smart-compose-${data?.reqId}`}>Smart Compose</button>
    `

    let smartComposeInput = `
        <input type="text" placeholder="Enter prompt" id = ${`email-smart-prompt-${data?.reqId}`} style = "display: none;"/>
    `

    let suggestionsArray = [['Apply leave', 'Approve request'], ['Rephrase', 'Make it shorter']];
   
   
    return `
        ${smartComposeButton}
        ${smartComposeInput}
    `
}

const getEmailValue = (data, type) => {
    let html = `
    <div class="email-value-container">
      ${data?.content?.[type]
        ?.map(
          (email, index) => `
            <span class="email-value-item">
              <span class="email-value">${email?.id}</span>
              <span class="email-value-remove" id="email-value-remove-${data?.reqId}-${index}">X</span>
            </span>
          `
        )
        .join('') || ''}
    </div>
  `;
  
    return html;    
}

const renderEmailSummary = (data) => {

    let allRecievers = [...data?.content?.to || [], ...data?.content?.cc || [], ...data?.content?.bcc || []];

    let html = `
        <div class="emailSmallCard">
        <div class="email-summary">
            <h2>${data?.content?.subject}</h2>
        </div>
        <div class="email-summary-body">
                <div class="email-summary-to">
                    ${allRecievers?.map(email => `<span class="email-summary-to-item">${email?.name}</span>`).join('')}
                </div>
            <div class="email-summary-body-content">
                ${data?.content?.body}
            </div>
        </div>
        <div>
    `

    return html;
}

export default { render };