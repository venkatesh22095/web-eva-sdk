import axios from "axios";
import FileUploader from "../../utils/FileUploader";
import { generateComponentId, getFileExtension, getUID } from "../../utils/helpers";
import store from "../../redux/store";
import { setGptUploadedFiles, updateChatData } from "../../redux/globalSlice";
import { cloneDeep, isEmpty } from "lodash";

let gptFileData = null;

// const GptFileUpload = (event, id) => {
//     return new Promise((resolve, reject) => {
//         /*
//             Adding event.detail.files as Morgan stanley drag and drop functionality stores the drag and dropped files in event.detail
//         */
//         const fileList = event?.target?.files ?? event?.detail?.files ?? [];
//         const files = Array.from(fileList);
//         if (!files.length) return Promise.resolve([]);
//         // const files = Array.from(event?.target?.files || event?.detail?.files) || []; 
//         if (files?.length > 0) {
//             files?.map((file) => {
//                 uploadFileInitial(file, id, resolve, reject)
//             })
//         }
//     })
    
// }
const GptFileUpload = (event, id, questionId) => {
    const fileList = event?.target?.files ?? event?.detail?.files ?? [];
    const files = Array.from(fileList);

    if (!files.length) return Promise.resolve([]);

    // Create an array of upload promises
    const uploadPromises = files.map((file, ind) => {
        return new Promise((resolve, reject) => {
            uploadFileInitial(file, id, questionId, resolve, reject);
        });
    });

    // Wait for all uploads to finish
    return Promise.all(uploadPromises).then(() => gptFileData);
};

export default GptFileUpload;

const uploadFileInitial = (file, id, questionId, resolve, reject) => {
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

    let _questions = cloneDeep(store.getState().global.questions) || {}
    let currentQuestion = cloneDeep(_questions[questionId]);
    currentQuestion.loadingFiles = currentQuestion?.loadingFiles || [];
    currentQuestion.loadingFiles.push(id);
    _questions[questionId] = currentQuestion;
    store.dispatch(updateChatData(_questions));

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
                fileId:file?.fileUrl?.fileId,
                loading: false                
            });            

            gptFileData = currentFileData;
            store.dispatch(setGptUploadedFiles(currentFileData))

            let _questions = cloneDeep(store.getState().global.questions) || {}
            let currentQuestion = cloneDeep(_questions[questionId]);
            currentQuestion.filesUploaded = currentQuestion?.filesUploaded + 1 || 1;
            if(currentQuestion?.loadingFiles?.includes(id)){
                currentQuestion.loadingFiles = currentQuestion?.loadingFiles?.filter(file => file !== id);
            }
            _questions[questionId] = currentQuestion;
            store.dispatch(updateChatData(_questions));

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