import MultiResponse from "./MultiResponse"

const RemoveUploadedGPTFile = (item, index, mediaName, questionId, ind) => {
    return MultiResponse().removeFile(item, index, mediaName, questionId, ind)
}

export default RemoveUploadedGPTFile;