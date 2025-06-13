import axios from "axios";
import FileUploader from "../../utils/FileUploader";
import { generateComponentId, getFileExtension, getUID } from "../../utils/helpers";
import store from "../../redux/store";
import { setGptUploadedFiles } from "../../redux/globalSlice";
import { cloneDeep, isEmpty } from "lodash";

let gptFileData = null;

const GptFileUpload = (event, id) => {
    return new Promise((resolve, reject) => {
        /*
            Adding event.detail.files as Morgan stanley drag and drop functionality stores the drag and dropped files in event.detail
        */
        const files = event?.target?.files || event?.detail?.files; 
        if (files?.length > 0) {
            uploadFileInitial(files?.[0], id, resolve, reject)
        }
    })
    
}

export default GptFileUpload;

const uploadFileInitial = (file, id, resolve, reject) => {
    const state = store.getState().global
    if(state?.enableDebugging){
        console.log(window.sdkConfig)
    }
    let userId = window.sdkConfig.userId;
    let userAccessToken = window.sdkConfig.accessToken;
    const source = axios.CancelToken.source();
    let obj = {
        mediaName: getUID(6),
        loading: true,
    };

    const uploadConfig = {
        file,
        userInfoId: userId,
        fileContext: 'knowledge',
        userAccessToken: userAccessToken,
        mediaName: obj.mediaName,
        source: source
    }

    const u = new FileUploader(uploadConfig);

    obj.fileName = u?.file?.name
    obj.title = u?.file?.name
    obj.source = "attachment"
    obj.extName = getFileExtension(u?.file?.name)
    obj.size = u?.file?.size
    u.start(
        (res) => { }, (file) => {
            let componentId = generateComponentId();                        
            let f = {
                ...file,
                loading: false,
                componentId,
                extName: getFileExtension(file?.fileName),
                source: "attachment",
                title: file?.fileName,
                docId: file?.fileUrl?.fileId
            }

            
            let currentFileData = cloneDeep(store.getState().global.GptUploadedFiles) || {}
            if(!Array.isArray(currentFileData[id])) {
                currentFileData[id] = [];
            }
            currentFileData[id].push({
                ...obj,
                type: "file",
                value: file?.fileUrl?.fileId,
                title: file?.title || file?.fileName,
                fileId:file?.fileUrl?.fileId                
            });            

            gptFileData = currentFileData;
            store.dispatch(setGptUploadedFiles(currentFileData))

            const reqdTextArea = document.getElementById(`inputValue-${id}`)
            if(reqdTextArea) {
                reqdTextArea.style.display = 'none';
            }

            const reqdButton = document.getElementById(`removeButton-${id}`)
            if(reqdButton) {
                reqdButton.style.display = 'block'
            }

            resolve(currentFileData, f)
        },
        (msg) => {            
            const reqdInputField = document.getElementById(`fileUpload-${id}`)
            if(reqdInputField) {
                reqdInputField.value = ''
            }
            let state = store.getState().global;
            let uploadedFiles = cloneDeep(state.GptUploadedFiles || {});
            if(isEmpty(uploadedFiles) || !Array.isArray(uploadedFiles[id])){
                uploadedFiles[id] = []
            }
            uploadedFiles[id].push(({
                ...obj,
                type: "file",                
                title: file?.title || file?.name,                 
                error:msg               
            }))
            // delete uploadedFiles[id];
            store.dispatch(setGptUploadedFiles(uploadedFiles));
            reject(msg)
        })
}