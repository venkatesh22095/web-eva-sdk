import { cloneDeep, isEmpty } from "lodash";
import store from "../../redux/store";
import { setGptUploadedFiles, updateChatData } from "../../redux/globalSlice";
import InitiateChatConversationAction from "../InitiateChatConversationAction";
import constructGptForm from "./gptTemplateBody";
import gptFormFunctionality from "../../templateRenderer/functionality/gpt-form-template";

const MultiResponse = () => {
    let state = store.getState().global;
    let _questions = cloneDeep(state.questions);

    const getInitialFormData = (item) => {
        // The Initial gpt_forms data will be rendered here
        let forms = {}
        let parameterFields = [];
        let fieldValues = [];
        let responseFields = [];

        if (!isEmpty(item?.content?.formFields?.contextFields)) {
            forms.contextFields = item?.content?.formFields?.contextFields
        }
        if (!isEmpty(item?.content?.formFields?.paramFields)) {
            parameterFields = item?.content?.formFields?.paramFields
        }
        if (!isEmpty(item?.content?.formFields?.responseFields)) {
            responseFields = cloneDeep(item?.content?.formFields?.responseFields?.[0])
            if(responseFields?.value?.nested){
                responseFields.value.nested.value = responseFields?.value?.nested?.value?.values[0]?.value;
            }else if(responseFields?.value?.default){
                responseFields = responseFields;  
            }
            parameterFields = [responseFields, ...parameterFields];
        }

        // The context Data is saved in the ContextFields and rest of the data is saved in the fieldValues
        fieldValues.push(parameterFields)
        forms.fieldValues = fieldValues
        return forms
    }

    const getChoices = (len, contextField) => {
        // The Content dropdown will have the initial response and the rest of the responses to select
        let choices = [{ "id": "0", "label": "Original Content" }]
        for (let i = 0; i < len; i++) {
            choices.push({ "id": `${i + 1}`, "label": `Output ${i + 1}`})
        }
        let contextDropDownField = {
            "id": contextField?.id,
            "key": contextField?.key,
            "label": contextField?.label,
            "value": {
                "type": "dropdown",
                "required": contextField?.value?.required,
                "multi": false,
                "choices": choices
            }
        }
        return contextDropDownField
    }

    const addAdditionalResponse = (item, defaultTemplate = false) => {
        // The Additional responses will be added here
        let currentQuestion = cloneDeep(_questions[item?.cId]);
        let _formData = cloneDeep(currentQuestion?.gpt_forms);
        let cloneParamFields = cloneDeep(_formData.fieldValues[0]);

        // The choices dropdown will be added here
        let choicesDropdown;
        if(!isEmpty(item?.content?.formFields?.contextFields)) {
            let contextField = item?.content?.formFields?.contextFields?.[0];
            choicesDropdown = getChoices(_formData.fieldValues.length, contextField);
            cloneParamFields.unshift(choicesDropdown);
        }
        _formData.fieldValues.push(cloneParamFields);

        // The updated gpt_forms data will be saved here
        if(defaultTemplate){
            handleDefaultTemplateChanges(_formData, currentQuestion)
        } else {
            currentQuestion.gpt_forms = _formData;
            _questions[item?.cId] = currentQuestion;
            store.dispatch(updateChatData(_questions));
        }
    }

    const deleteAdditionalResponse = (item, subIndex, defaultTemplate = false) => {
        // The Additional responses will be deleted here
        let currentQuestion = cloneDeep(_questions[item?.cId]);
        let newFieldValues = cloneDeep(currentQuestion?.gpt_forms?.fieldValues);
        let contextField = currentQuestion?.gpt_forms?.contextFields?.[0]
        newFieldValues?.splice(subIndex, 1);

        // As a response is deleted, the choices dropdown needs to be updated with new choices and it is done here
        newFieldValues.forEach((fieldValues, index) => {
            let contentFieldIndex = fieldValues.findIndex(field => field.id === contextField?.id);
            if (contentFieldIndex !== -1) {
                fieldValues[contentFieldIndex] = getChoices(index, contextField);
            }
        });

        currentQuestion.gpt_forms.fieldValues = newFieldValues;

        // The updated gpt_forms data will be saved here

        if(defaultTemplate){
            handleDefaultTemplateChanges(currentQuestion.gpt_forms, currentQuestion)
        }else{
            _questions[item?.cId] = currentQuestion;
            store.dispatch(updateChatData(_questions));
        }
    }


    const submitGPTForm = (event, item) => {

        // Submit Button Action for the GPT Form
        event?.preventDefault()
        const state = store.getState().global;
        const uploadedFiles = state.GptUploadedFiles;
    
        let payload = {}
        payload.formData = {}
        if(state.activeBoardId) {
            payload.activeBoardId = state.activeBoardId
        }
        payload.question = item?.question
      
        let allResponseFields = item?.gpt_forms?.fieldValues   
        
        // Constructing contextFields
        let contextFields = item?.gpt_forms?.contextFields?.[0];
        let payloadContext = [];
        if (!isEmpty(contextFields)) {

            payloadContext = {
                [contextFields?.key]: {
                    type: contextFields?.value?.type,
                    required: !!contextFields?.value?.required,
                    label: contextFields?.label
                }    
            }

            let reqdValue;
            if(state?.enableDebugging){
                console.log("Recieved Context Fields", contextFields)
            }
            // Checking the Type of Context Field and getting Input Values
            if(contextFields?.value?.type === "file"){  
                let contextFieldDiv = document.getElementById(`fileUpload-${contextFields?.key}-${item?.messageId}`);

                // "MORGAN STANLEY REQUIREMENT" -> TO HANDLE CASES WHICH DOES NOT HAVE DEPENDENCY ON ID OF THE FILE UPLOADER. 
                if(contextFieldDiv){
                    let ind = Object.keys(state.GptUploadedFiles).indexOf(`${contextFields?.key}-${item?.messageId}`);
                    if(ind !== -1){
                        reqdValue = Object.values(state.GptUploadedFiles)?.[ind]?.map(({title, fileId}) => ({title, fileId}));   
                        payloadContext[contextFields?.key].value = reqdValue
                    }                    
                }else {
                   reqdValue = '' 
                }
            }else if(contextFields?.value?.canUploadFile){
                // "MORGAN STANLEY REQUIREMENT" -> TO HANDLE CASES WHICH DOES NOT HAVE DEPENDENCY ON ID OF THE FILE UPLOADER. 
                // FOR CASES WITH LONGTEXT AND SIMPLETEXT AS WELL, WE HAVE TO NOT RELY ON THE KEY OF THE FILE UPLOADER.

                /*Handling the case, where type can be be anything i.e.., simpleText, longText, richText and canUploadFile can be true, but user may or may not 
                upload the file. So, we need to check if the file is uploaded or not from the store and then get the value accordingly.
                */                
                if(state.GptUploadedFiles && (Object.keys(state.GptUploadedFiles)?.includes(`${contextFields?.key}-${item?.messageId}`))){
                    let ind = Object.keys(state.GptUploadedFiles).indexOf(`${contextFields?.key}-${item?.messageId}`);
                    // reqdValue = Object.values(state.GptUploadedFiles)[ind]?.value || '';
                    if(ind !== -1){                        
                        reqdValue = Object.values(state.GptUploadedFiles)?.[ind]?.map(({title, fileId}) => ({title, fileId}));   
                        payloadContext[contextFields?.key] = {
                            type:"file",
                            value:reqdValue || []
                        }                 
                    }
                }
                // if(contextFieldDiv){
                //     reqdValue = contextFieldDiv?.value || '';
                // }
                else {
                    // let contextFieldDiv = document.getElementById(`fileUpload-${contextFields?.key}-${item?.messageId}`);
                    let contextFieldDiv = document.getElementById(`inputValue-${contextFields?.key}-${item?.messageId}`);
                    reqdValue = contextFieldDiv?.value || contextFieldDiv?.textContent || '';
                 }
            }else{
                let contextFieldDiv = document.getElementById(`inputValue-${contextFields?.key}-${item?.messageId}`);
                reqdValue = contextFieldDiv?.value || contextFieldDiv?.textContent || '';
            }

            // Constructing the payloadContext
            //Latest Update :- moved this block to top
            // payloadContext = {
            //     [contextFields?.key]: {
            //         type: contextFields?.value?.type,
            //         required: !!contextFields?.value?.required,
            //         label: contextFields?.label
            //     }    
            // }
            if(state?.enableDebugging){
                console.log("Modified Payload Context", payloadContext)
            }

            // Checking if the Context Field has a file and getting the file from the uploadedFiles
            //latest update: to recheck
            if(contextFields?.value?.canUploadFile && uploadedFiles && (Object.keys(uploadedFiles)?.includes(`${contextFields?.key}`))) {
                let ind = Object.keys(uploadedFiles).indexOf(`${contextFields?.key}`);
                if (ind !== -1) {
                    payloadContext[contextFields?.key] = Object.values(uploadedFiles)[ind];
                    reqdValue = payloadContext[contextFields?.key].value || '';
                }
            }

            // Checking if the Required Field is empty and returning an Error
            if (reqdValue?.length === 0 && contextFields?.value?.required) {
                throw new Error(`Required field ${contextFields.label} is empty.`);
            }

            // Checking if the Required Field is not empty and setting the value to the payloadContext
            if(reqdValue?.length > 0 && payloadContext[contextFields?.key]?.type !== "file"){
                payloadContext[contextFields?.key].value = reqdValue;
            }else if (reqdValue?.length === 0 && payloadContext[contextFields?.key]?.type === "file"){
                // If there is no file uploaded, then we should send an empty object in Context Field
                payloadContext[contextFields?.key] = {};
            }
        }

        payload.formData.contextFields = payloadContext;
        if(state?.enableDebugging){
            console.log("Final Context Field", payloadContext)
        }

        // Constructing requestParams
        let requestParams = allResponseFields?.map((field, index) => {
            let totalMockParameters = field?.reduce((acc, field) => {
                let reqdInputElement;
                let reqdValue;
                if (field?.value?.type === 'dropdown') {
                    reqdInputElement = document.getElementById(`dropdownValue-${field?.key}-${item?.messageId}-${index}`);
                
                    if (field?.value?.multi) {
                        const reqdValues = Array.from(reqdInputElement.selectedOptions).map(option => option.value);
                        reqdValue = reqdValues; 
                    } else {
                        reqdValue = reqdInputElement?.value || reqdInputElement?.textContent || ""; 
                        reqdValue = /^Output\s\d+$/.test(reqdValue) ? reqdValue?.split(" ")?.[1] : reqdValue //this check is for multi output, where we need to pass the id of the output for the context
                    }

                    //for the filed 'prompts' sdk should pass the id of the selected option
                    if(field?.key === 'prompts'){
                        const promptId = field?.value?.choices?.find(choice => choice.label === reqdValue)?.id;
                        reqdValue = promptId;
                    }
                    if(state?.enableDebugging){
                        console.log(`Form field is ${`(dropdownValue-${field?.key})`} and value is {${reqdValue}}`)
                    }
                } else { 
                    reqdInputElement = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`)
                    reqdValue = reqdInputElement?.value || reqdInputElement?.textContent || ""
                    if(state?.enableDebugging){
                        console.log(`Form field is ${`(inputValue-${field?.key})`} and value is {${reqdInputElement?.value}}`)
                    }
                }
    
                acc[field.key] = {
                    type: field?.value?.type,
                    required: !!field?.value?.required
                };
        
                if (reqdValue) {
                    acc[field.key].value = reqdValue;
                }

                if(field?.value?.nested?.key === "prompt" || field?.key === 'prompt'){
                    // Need to send the Prompt Field Value as the prompt can be changed manually by the user if editable
                    let promptField = document.getElementById(`inputValue-${field?.key}-${item?.messageId}-${index}`); 
                    acc["prompt"] = promptField?.value || promptField?.textContent || "";
                }
    
                // Checking if the Field has a file and getting the file from the uploadedFiles
                if (field?.value?.canUploadFile && uploadedFiles && (Object.keys(uploadedFiles)?.includes(`${field?.key}-${item?.messageId}-${index}`))) {
                    let ind = Object.keys(uploadedFiles).indexOf(`${field?.key}-${item?.messageId}-${index}`);
                    if (ind !== -1) { 
                        acc[field.key].type = "file"
                        acc[field.key].value = Object.values(state.GptUploadedFiles)?.[ind]?.map(({title, fileId}) => ({title, fileId}));;
                        // reqdValue = acc[field.key].value;
                        reqdValue = acc[field.key];
                    }
                }

                if (field?.value?.type === 'file' && uploadedFiles && (Object.keys(uploadedFiles)?.includes(`${field?.key}-${item?.messageId}-${index}`))) {
                    let ind = Object.keys(uploadedFiles).indexOf(`${field?.key}-${item?.messageId}-${index}`);
                    if (ind !== -1) { 
                        acc[field.key].type = "file"
                        acc[field.key].value = Object.values(state.GptUploadedFiles)?.[ind]?.map(({title, fileId}) => ({title, fileId}));;
                        // reqdValue = acc[field.key].value;
                        reqdValue = acc[field.key];
                    }
                }
    
                // Checking if the Required Field is empty and returning an Error
                if (field?.required || field?.value?.required) {
                    if (reqdValue?.length === 0) {
                        throw new Error(`Required field ${field.label} is empty in ${index}th response.`);
                    }
                }

                // Setting the Content Field for the First Response
                if(index === 0 && !isEmpty(contextFields)) {
                    acc[contextFields?.key] =  {type: "dropdown", value: "0", required: false, id: contextFields?.id, label: contextFields?.label}
                }
                return acc;
            }, {})
            // requestParams.push(totalMockParameters)
            return { "fields" : totalMockParameters };
        })
    
        
        payload.formData.requestParams = requestParams

        payload.messageId = item?.messageId // Corrected to use item instead of question
        // console.log(payload)
    
        let obj = { createIssue: true, from: "gptAgent", botQuestionId: item?.id} // Corrected to use item instead of question
        if (item?.isTask) { // Corrected to use item instead of question
            obj.multiIntentExecution = true
        }
    
        let callback = () => {
            store.dispatch(setGptUploadedFiles(null))
        }
        
        InitiateChatConversationAction({payload, callback, ...obj})
    }

    const updatePrompt = (item, subIndex, value, defaultTemplate = false) => {
        let _forms = cloneDeep(item?.gpt_forms);

        // Getting the Prompt Field Value from the Response Fields
        let responseFields = cloneDeep(item?.content?.formFields?.responseFields?.[0]);
        let requiredPrompt = responseFields?.value?.nested?.value?.values?.find(val => val.id === value);

        //Context Field
        let contextField = _forms?.contextFields?.[0];

        // Getting the Variables for the Prompt Field
        let variableData = responseFields?.value?.choices?.find(val => val.id === value)?.variables;
        variableData.push("prompts")

        // Getting the Initial Form Data
        let newFormFields = getInitialFormData(item)
        let choicesDropdown = getChoices(subIndex, contextField);

        // Adding the Choices Dropdown for the Additional Responses
        if(subIndex > 0){
            // Adding the Content Field to the Variable Data as every additional response should have the Content Field to select the Response on which the answer needs to be generated
            if(!isEmpty(contextField)){
                variableData.push(contextField?.id)
                newFormFields?.fieldValues?.[0]?.unshift(choicesDropdown);    
            }
        }

        _forms.fieldValues[subIndex] = newFormFields?.fieldValues?.[0]?.filter(field => 
            variableData?.includes(field.id) 
        );
        
        let promptField = _forms.fieldValues[subIndex].find(field => field.id === "prompts");

        //Checking if the "show to users" is true or not and updating only if it is enabled
        if(promptField.value.nested){
            promptField.value.nested.value = requiredPrompt.value;
            promptField.value.nested.id = requiredPrompt.id
        }

        let currentQuestion = cloneDeep(_questions[item?.cId]);
        // Updating the GPT Forms Data
        if(defaultTemplate){
            handleDefaultTemplateChanges(_forms, currentQuestion)
        }else{
            currentQuestion.gpt_forms = _forms;
            _questions[item?.cId] = currentQuestion;
            store.dispatch(updateChatData(_questions));
        }
    }

    const removeFile = (e, index, mediaName=null) => {
        let uploadedFiles = cloneDeep(state.GptUploadedFiles);
        // Deleting that Particular File from the Uploaded Files
        //New Update:- As we are supporting multiple files, do updating the uploadedFiles object
        if(mediaName){
            uploadedFiles[index] = uploadedFiles[index]?.filter(file => file.mediaName !== mediaName);
        }else{
            delete uploadedFiles[index];
        }
        store.dispatch(setGptUploadedFiles(uploadedFiles));

        // Showing the Text Area and Button for the File Upload
        const reqdTextArea = document.getElementById(`inputValue-${index}`)
        if(reqdTextArea) {
            reqdTextArea.style.display = 'block';
        }

        // Hiding the Button for the File Upload
        const reqdButton = document.getElementById(`removeButton-${index}`)
        if(reqdButton) {
            reqdButton.style.display = 'none'
        }
    }

    const handleDefaultTemplateChanges = (formData, question, promptId = null, updatedRespIndex = null) => {
        const gptFormConstructedData = constructGptForm(formData, question, promptId, updatedRespIndex)
        question.template_html = gptFormConstructedData.outerHTML
        question.gpt_forms = formData;
        _questions[question?.cId] = question;
        store.dispatch(updateChatData(_questions));
        setTimeout(() => {
            gptFormFunctionality(formData, question);
        }, 1000);
    }

    return {
        getInitialFormData,
        addAdditionalResponse,
        deleteAdditionalResponse,
        submitGPTForm,
        updatePrompt,
        removeFile
    }
}
export default MultiResponse;