import MultiResponse from "./MultiResponse"

const RemoveUploadedGPTFile = (item, index, mediaName) => {
    return MultiResponse().removeFile(item, index, mediaName)
}

export default RemoveUploadedGPTFile;