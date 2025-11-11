import { cloneDeep, debounce } from "lodash";
import { delayedSearchCallback } from "../../utils/helpers";
import store from "../../redux/store";
import { updateChatData } from "../../redux/globalSlice";
import { sendEmail, smartComposeEmail } from "../../redux/actions/global.action";



const sendEmailFunctionality = (data) => {

    const getState = () => {
        let state = store?.getState()?.global
        const currentData = state?.questions?.[data?.reqId];
        return { state, currentData };
    };

    // Local reference to current question 
    let { state: initialState, currentData: initialCurrentData } = getState();
    let localCurrentData = cloneDeep(initialCurrentData);

    // Store TomSelect instances to manually sync with local data
    const tomSelectInstances = {};
        
    let isSyncing = false;

    // Create a promise-aware debounce function
    const debouncedSearch = debounce(async (text, type, resolve, reject) => {
        try {
            if(text?.length === 0) {
                resolve([]);
                return;
            }
            
            let { state, currentData } = getState();

            let values = preserveEmailContent();
            let obj = {
                value: text,
                connectionSource : currentData?.provider,
                connectionId : currentData?.templateInfo?.defaultConnections,
                fieldTo : type 
            }

            let response = await delayedSearchCallback(obj);
            
            localCurrentData.content.subject = values?.subject;  
            localCurrentData.content.body = values?.body;
            localCurrentData[`${type}Choices`] = {
                res: response,
                input: text
            };

            
            
            resolve(response || []);
        } catch (error) {
            reject(error);
        }
    }, 500);

    const getSearchedUsers = (text, type) => {
        return new Promise((resolve, reject) => {
            debouncedSearch(text, type, resolve, reject);
        });
    };

    const insertEmail = (email, type) => {
        
        if (isSyncing) return;
        
        
        if (!localCurrentData.content) localCurrentData.content = {};
        if (!localCurrentData.content[type]) localCurrentData.content[type] = [];
        
        let existingEmails = [...localCurrentData.content[type]];
        existingEmails.push(email);
        localCurrentData.content[type] = existingEmails;

        
        let values = preserveEmailContent();
        localCurrentData.content.subject = values?.subject;
        localCurrentData.content.body = values?.body;

        
        if (localCurrentData[`${type}Choices`]) {
            delete localCurrentData[`${type}Choices`];
        }

        
        clearTomSelectSearchState(type);

        
        setTimeout(()=>validateSendButton(), 100);
    }

    const removePerson = (email, type) => {
        
        if (isSyncing) return;
        
        
        if (localCurrentData.content && localCurrentData.content[type]) {
            let existingEmails = [...localCurrentData.content[type]];
            existingEmails = existingEmails.filter(item => item?.id !== email?.id);
            localCurrentData.content[type] = existingEmails;
        }

        
        let values = preserveEmailContent();
        localCurrentData.content.subject = values?.subject;
        localCurrentData.content.body = values?.body;

        
        clearTomSelectSearchState(type);

        
        setTimeout(()=>validateSendButton(), 100);
    }

    
        

    
    const clearTomSelectSearchState = (type) => {
        const tomInstance = tomSelectInstances[type];
        if (!tomInstance) return;
        
        tomInstance.control_input.value = '';
        
        
        tomInstance.close();
        
        
        tomInstance.clearOptions();
        
        // Re-add only the selected items as options
        const selectedItems = localCurrentData?.content?.[type] || [];
        selectedItems.forEach(item => {
            if (!tomInstance.options[item.id]) {
                tomInstance.addOption({
                    value: item.id,
                    text: item.id,
                    raw: item
                });
            }
        });
    };

    const preserveEmailContent = () => {
        let { state, currentData } = getState();
        let emailSubject = document.getElementById(`email-subject-${currentData?.reqId}`);
        let _emailBody = document.getElementById(`email-body-${currentData?.reqId}`);

        let values = {
            subject: '',
            body: ''
        }
        if(emailSubject) {
            values.subject = emailSubject.value;
        }
        if(_emailBody) {
            values.body = _emailBody.innerHTML;
        }
        // Use local state as source of truth for email fields (not global state!)
        if(localCurrentData?.content?.to) {
            values.to = localCurrentData.content.to;
        }
        if(localCurrentData?.content?.cc) {
            values.cc = localCurrentData.content.cc;
        }
        if(localCurrentData?.content?.bcc) {
            values.bcc = localCurrentData.content.bcc;
        }
        if(currentData?.content?.includeSource) {
            values.includeSource = currentData?.content?.includeSource;
        }
        if(currentData?.content?.attachmentPreview) {
            values.attachments = currentData?.content?.attachmentPreview;
        }

        return values;
    }

    const send = async () => {
        let { state } = getState();
                
        let values = preserveEmailContent();
        localCurrentData.content.subject = values?.subject;
        localCurrentData.content.body = values?.body;
        
        const to = localCurrentData?.content?.to?.map(item => {
            return {
                label: item?.label,
                id:  item?.id
            }
        })?.flat();
        const cc = localCurrentData?.content?.cc?.map(item => {
            return {
                label: item?.label,
                id: item?.id
            }
        })?.flat();
        const bcc = localCurrentData?.content?.bcc?.map(item => {
            return {
                label: item?.label,
                id: item?.id
            }
        })?.flat();


        let emailSubject = document.getElementById(`email-subject-${data?.reqId}`);
        let emailBody = document.getElementById(`email-body-${data?.reqId}`);

        const includeSource =  localCurrentData?.includeSource;
        const subject = emailSubject?.value || '';
        const body = emailBody?.innerHTML || '';
        const connectionId = document.getElementById(`email-connection-${data?.reqId}`)?.value || '';
        const attachments =  localCurrentData?.attachmentPreview;
        const attachmentsIds = [], attachmentComponents= []
        attachments?.map(attach => {
            attachmentsIds.push(attach?.fileUrl?.fileId)
            attachmentComponents.push(attach?.fileUrl)
        })

        if(to?.length === 0) {
            return;
        }

        let params = {
            userId: state?.profile?.data?.id,
            provider: localCurrentData?.provider
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
                messageId:  localCurrentData?.messageId,
                dataId: localCurrentData?.parentMessageId || localCurrentData?.menuId
            }
        }

        let response = await store.dispatch(sendEmail({params, payload}));
        
        // Only update global store after successful response
        let updatedQuestions = cloneDeep(state?.questions);
        updatedQuestions[data?.reqId] = response?.payload;
        store.dispatch(updateChatData(updatedQuestions));
        
        // Update local reference with successful response
        localCurrentData = response?.payload;
    }

    let toSection = document.getElementById(`email-to-${data?.reqId}`);
    let ccSection = document.getElementById(`email-cc-${data?.reqId}`);
    let bccSection = document.getElementById(`email-bcc-${data?.reqId}`);

    if(toSection && !toSection?.eventListenerAdded) {
        const tomInstance = setupTomSelect({
            selectorId: `email-to-${data?.reqId}`,
            type: 'to',
            initialItems: localCurrentData?.content?.to || [],
            fetchSuggestions: getSearchedUsers,
            onAdd: insertEmail,
            onRemove: removePerson
          });

        // Store TomSelect instance for manual syncing
        tomSelectInstances['to'] = tomInstance;

        toSection.eventListenerAdded = true;
    }

    if(ccSection && !ccSection?.eventListenerAdded) {
        const ccInstance = setupTomSelect({
            selectorId: `email-cc-${data?.reqId}`,
            type: 'cc',
            initialItems: localCurrentData?.content?.cc || [],
            fetchSuggestions: getSearchedUsers,
            onAdd: insertEmail,
            onRemove: removePerson
        });

        // Store TomSelect instance for manual syncing
        tomSelectInstances['cc'] = ccInstance;

        ccSection.eventListenerAdded = true;
    }

    if(bccSection && !bccSection?.eventListenerAdded) {
        const bccInstance = setupTomSelect({
            selectorId: `email-bcc-${data?.reqId}`,
            type: 'bcc',
            initialItems: localCurrentData?.content?.bcc || [],
            fetchSuggestions: getSearchedUsers,
            onAdd: insertEmail,
            onRemove: removePerson
          });

        // Store TomSelect instance for manual syncing
        tomSelectInstances['bcc'] = bccInstance;

        bccSection.eventListenerAdded = true;
    }

    function validateSendButton() {
        const sendBtn = document.getElementById(`email-send-${data?.reqId}`);
        if (!sendBtn) return;

        // 1. Check if at least 1 user is present in "to" field (from TomSelect DOM)
        const toSelectElement = document.getElementById(`email-to-${data?.reqId}`);
        const tomToInstance = tomSelectInstances['to'];
        
        let hasToRecipient = false;
        if (tomToInstance && tomToInstance.items) {
            // Get selected items directly from TomSelect instance
            hasToRecipient = tomToInstance.items.length > 0;
        } else if (toSelectElement && toSelectElement.selectedOptions) {
            // Fallback: check DOM select element
            hasToRecipient = toSelectElement.selectedOptions.length > 0;
        } else {
            // Last fallback: check local data
            const toEmails = localCurrentData?.content?.to || [];
            hasToRecipient = toEmails.length > 0;
        }

        // 2. Check if subject is filled
        const subjectInput = document.getElementById(`email-subject-${data?.reqId}`);
        const hasSubject = subjectInput?.value?.trim().length > 0;

        // 3. Check if body text is filled
        const bodyDiv = document.getElementById(`email-body-${data?.reqId}`);
        const bodyText = bodyDiv?.innerText?.replace(/\s+/g, '').trim();
        const hasBodyText = bodyText.length > 0;

        // All conditions must be met to enable send button
        const allConditionsMet = hasToRecipient && hasSubject && hasBodyText;

        // Enable/disable send button based on conditions
        sendBtn.disabled = !allConditionsMet;

        // Optional: Add visual feedback classes
        if (allConditionsMet) {
            sendBtn.classList.remove('disabled');
        } else {
            sendBtn.classList.add('disabled');
        }
      }
      

    document.getElementById(`email-subject-${data?.reqId}`)?.addEventListener('input', validateSendButton);
    document.getElementById(`email-body-${data?.reqId}`)?.addEventListener('input', validateSendButton);

    // Initial validation on form load
    setTimeout(()=>validateSendButton(), 100);

    let sendButton = document.getElementById(`email-send-${data?.reqId}`);
    if(sendButton && !sendButton?.eventListenerAdded) {
        sendButton.addEventListener('click', () => {
            send();
        });
        sendButton.eventListenerAdded = true;
    }

    let emailBody = document.getElementById(`email-body-${data?.reqId}`);
    if(emailBody) {
        emailBody.contentEditable = true;
    }
    
    
}


export default sendEmailFunctionality;
