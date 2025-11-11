import MultiResponse from "./MultiResponse"

const RemoveUploadedGPTFile = (event, fileKey, questionId = null, mediaName = null) => {
    return MultiResponse().removeFile(event, fileKey, mediaName, questionId)
}

export default RemoveUploadedGPTFile;