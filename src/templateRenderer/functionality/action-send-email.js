import { cloneDeep, debounce } from "lodash";
import { delayedSearchCallback } from "../../utils/helpers";
import store from "../../redux/store";
import { updateChatData } from "../../redux/globalSlice";
import { sendEmail, smartComposeEmail } from "../../redux/actions/global.action";

const sendEmailFunctionality = (data) => {

    let state = store?.getState()?.global

    const getSearchedUsers = debounce(async (text, type) => {
        if(text?.length === 0) {
            return;
        }

        let values = preserveEmailContent();
        let obj = {
            value: text,
            connectionSource : data?.provider,
            connectionId : data?.templateInfo?.defaultConnections,
            fieldTo : type 
        }

        let response = await delayedSearchCallback(obj);

        let _questions = cloneDeep(state?.questions)
        let content = cloneDeep(data?.content);
        content.subject = values?.subject;  
        content.body = values?.body;
        _questions[data?.reqId] = {
            ..._questions[data?.reqId],
            content,
            [`${type}Choices`] : {
                res : response,
                input : text
            }
        }

        store.dispatch(updateChatData(_questions))
    }, 500);


    const composeSmartEmail = async (prompt, type) => {
        let params = {
            userId: state?.profile?.data?.id,
        }

        let payload;
        if(type === 'generate') {
            payload = {
                userInput : prompt,
                type: type
            }
        } else {
            payload = {
                text: prompt,
                type: 'generate'
            }
        }

        let response = await store.dispatch(smartComposeEmail({params, payload}));
        let textBody = document.getElementById(`email-body-${data?.reqId}`);
        if(textBody) {
            textBody.innerHTML = response?.payload?.textSuggestions?.[0]?.body;
        }
    }

    const insertEmail = (email, type) => {
        let _content = cloneDeep(data?.content);
        let existingEmails = cloneDeep(_content?.[type]);
        if(existingEmails) {
                existingEmails.push(email);
            } else {
                existingEmails = [email];
        }

        _content[type] = existingEmails;

        let _questions = cloneDeep(state?.questions);
        let values = preserveEmailContent();
        _content.subject = values?.subject;
        _content.body = values?.body;

        if (_questions[data?.reqId]) {
            delete _questions[data?.reqId][`${type}Choices`];
            _questions[data?.reqId].content = _content;
        }

        store.dispatch(updateChatData(_questions));

    }

    const removePerson = (email, type) => {
        let _content = cloneDeep(data?.content);
        let existingEmails = cloneDeep(_content?.[type]);
        existingEmails = existingEmails.filter(item => item?.id !== email?.id);
        _content[type] = existingEmails;

        let _questions = cloneDeep(state?.questions);
        let values = preserveEmailContent();
        _content.subject = values?.subject;
        _content.body = values?.body;
        if (_questions[data?.reqId]) {
            _questions[data?.reqId].content = _content;
        }
        store.dispatch(updateChatData(_questions));
    }

    const preserveEmailContent = () => {
        let emailSubject = document.getElementById(`email-subject-${data?.reqId}`);
        let emailBody = document.getElementById(`email-body-${data?.reqId}`);

        let values = {
            subject: '',
            body: ''
        }
        if(emailSubject) {
            values.subject = emailSubject.value;
        }
        if(emailBody) {
            values.body = emailBody.innerHTML;
        }

        return values;
    }

    const send = async () => {
        const to = data?.content?.to?.map(item => {
            return {
                label: item?.label,
                id:  item?.id
            }
        })?.flat();
        const cc = data?.content?.cc?.map(item => {
            return {
                label: item?.label,
                id: item?.id
            }
        })?.flat();
        const bcc = data?.content?.bcc?.map(item => {
            return {
                label: item?.label,
                id: item?.id
            }
        })?.flat();


        let emailSubject = document.getElementById(`email-subject-${data?.reqId}`);
        let emailBody = document.getElementById(`email-body-${data?.reqId}`);

        const includeSource = data?.includeSource;
        const subject = emailSubject?.value || '';
        const body = emailBody?.innerHTML || '';
        const connectionId = document.getElementById(`email-connection-${data?.reqId}`)?.value || '';
        const attachments = data?.attachmentPreview
        const attachmentsIds = [], attachmentComponents= []
        data?.attachmentPreview?.map(attach => {
            attachmentsIds.push(attach?.fileUrl?.fileId)
            attachmentComponents.push(attach?.fileUrl)
        })

        if(to?.length === 0) {
            return;
        }

        let params = {
            userId: state?.profile?.data?.id,
            provider: data?.provider
        }

        const payload = {
            connectionId: connectionId,
            params: {
                subject,
                content: body,
                to,
                cc,
                bcc,
                attachments: attachmentsIds,
                components: attachmentComponents
            },
            contextParams: {
                includeSource,                
                messageId:  data?.messageId,
                dataId: data?.parentMessageId || data?.menuId
            }
        }

        let response = await store.dispatch(sendEmail({params, payload}));
        let _questions = cloneDeep(state?.questions);
        _questions[data?.reqId] = response?.payload;
        store.dispatch(updateChatData(_questions));
    }

    let toSection = document.getElementById(`email-to-${data?.reqId}`);
    let ccSection = document.getElementById(`email-cc-${data?.reqId}`);
    let bccSection = document.getElementById(`email-bcc-${data?.reqId}`);

    if(toSection && !toSection?.eventListenerAdded) {
        toSection.addEventListener('input', (e) => {
            getSearchedUsers(e.target.value, 'to');
        });
        toSection.eventListenerAdded = true;
    }

    if(ccSection && !ccSection?.eventListenerAdded) {
        ccSection.addEventListener('input', (e) => {
            getSearchedUsers(e.target.value, 'cc');
        });
        ccSection.eventListenerAdded = true;
    }

    if(bccSection && !bccSection?.eventListenerAdded) {
        bccSection.addEventListener('input', (e) => {
            getSearchedUsers(e.target.value, 'bcc');
        });
        bccSection.eventListenerAdded = true;
    }

    let smartComposeButton = document.getElementById(`email-smart-compose-${data?.reqId}`);
    let smartComposeInput = document.getElementById(`email-smart-prompt-${data?.reqId}`);

    if(smartComposeButton && !smartComposeButton?.eventListenerAdded) {
        smartComposeButton.addEventListener('click', () => {
            smartComposeInput.style.display = 'block';
        });
        smartComposeButton.eventListenerAdded = true;
    }

    if(smartComposeInput && !smartComposeInput?.eventListenerAdded) {
        smartComposeInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                composeSmartEmail(e.target.value, 'generate');
            }
        });
        smartComposeInput.eventListenerAdded = true;
    }

    if(data?.toChoices) {
        data?.toChoices?.res?.forEach((email, index) => {
            let option = document.getElementById(`email-to-${data?.reqId}-${index}`);
            if(option && !option?.eventListenerAdded) {
                option.addEventListener('click', () => {
                    insertEmail(email, 'to');
                });
                option.eventListenerAdded = true;
            }
        })
    }

    if(data?.ccChoices) {
        data?.ccChoices?.res?.forEach((email, index) => {
            let option = document.getElementById(`email-cc-${data?.reqId}-${index}`);
            if(option && !option?.eventListenerAdded) {
                option.addEventListener('click', () => {
                    insertEmail(email, 'cc');
                });
                option.eventListenerAdded = true;
            }
        })
    }

    if(data?.bccChoices) {
        data?.bccChoices?.res?.forEach((email, index) => {
            let option = document.getElementById(`email-bcc-${data?.reqId}-${index}`);
            if(option && !option?.eventListenerAdded) {
                option.addEventListener('click', () => {
                    insertEmail(email, 'bcc');
                });
                option.eventListenerAdded = true;
            }
        })
    }

    let sendButton = document.getElementById(`email-send-${data?.reqId}`);
    if(sendButton && !sendButton?.eventListenerAdded) {
        sendButton.addEventListener('click', () => {
            send();
        });
        sendButton.eventListenerAdded = true;
    }

    data?.content?.to?.map((item, index) => {
        let option = document.getElementById(`email-value-remove-${data?.reqId}-${index}`);
        if(option && !option?.eventListenerAdded) {
            option.addEventListener('click', () => {
                removePerson(item, 'to');
            });
            option.eventListenerAdded = true;
        }
    })

    data?.content?.cc?.map((item, index) => {
        let option = document.getElementById(`email-value-remove-${data?.reqId}-${index}`);
        if(option && !option?.eventListenerAdded) {
            option.addEventListener('click', () => {
                removePerson(item, 'cc');
            });
            option.eventListenerAdded = true;
        }
    })

    data?.content?.bcc?.map((item, index) => {
        let option = document.getElementById(`email-value-remove-${data?.reqId}-${index}`);
        if(option && !option?.eventListenerAdded) {
            option.addEventListener('click', () => {
                removePerson(item, 'bcc');
            });
            option.eventListenerAdded = true;
        }
    })

    let emailBody = document.getElementById(`email-body-${data?.reqId}`);
    if(emailBody) {
        emailBody.contentEditable = true;
    }
    
    
}


export default sendEmailFunctionality;
