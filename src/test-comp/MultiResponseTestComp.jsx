import React, { useEffect, useState } from "react";
import { GptFileUpload } from "../chat";
import DeleteGPTResponse from "../chat/gptTemplate/deleteGPTResponse";
import UpdateGPTPromptValue from "../chat/gptTemplate/updateGPTPromptValue";
import AddAdditionalGPTResponse from "../chat/gptTemplate/addAdditionalGPTResponse";
import SubmitGPTForm from "../chat/gptTemplate/submitGPTForm";
import RemoveUploadedGPTFile from "../chat/gptTemplate/removeUploadedGPTFile";
import store from "../redux/store";
import { use } from "marked";
import { set } from "lodash";

const MultiResponseTestComp = ({ item }) => {        
    let forms = item?.gpt_forms;
    const [files, setFiles] = useState({})
    return (
        <>
            <div>
                {forms?.contextFields?.length > 0 && forms?.contextFields?.map((contextField, index) => {
                    return (
                        <>
                            <div className='contextFiledHeader'>Context</div>
                            {(contextField?.value?.type === "longText" || contextField?.value?.type === "richText") && (
                                <>
                                    <div contentEditable="true" placeholder={contextField?.placeholder} value={contextField?.value} id={`inputValue-${contextField?.key}-${item?.messageId}`}></div>
                                </>
                            )}
                            {(contextField?.value?.type === "simpleText") && (
                                <div contentEditable="true" placeholder={contextField?.value?.placeholder} value={contextField?.value} id={`inputValue-${contextField?.key}-${item?.messageId}`}></div>
                            )}

                            {(contextField?.value?.type === "file" || contextField?.value?.canUploadFile) && (
                                <>
                                    <input type="file" id={`fileUpload-${contextField?.key}-${item?.messageId}`} multiple onChange={
                                        async (e) => {
                                            try {
                                                const res = await GptFileUpload(e, `${contextField?.key}-${item?.messageId}`)
                                                setFiles(res)
                                            }    catch(err){
                                                console.log("error", err)
                                            }                                 
                                        
                                    }
                                        }/>                                    
                                    {files?.[`${contextField?.key}-${item?.messageId}`]?.map((file, fileIndex) => {
                                        return (
                                            <div key={fileIndex}>
                                                <span>{file.title}</span>
                                                <button onClick={(e) => RemoveUploadedGPTFile(e, `${contextField?.key}-${item?.messageId}`, file?.mediaName)} id = {`removeButton-${contextField?.key}-${item?.messageId}-${file?.value}`}>Remove</button>
                                            </div>
                                        )
                                    })}
                                </>
                            )}

                            {/* {contextField?.value?.canUploadFile && (
                                <>  
                                    <input type="file" id={`fileUpload-${contextField?.key}`} onChange={(e) => GptFileUpload(e, `${contextField?.key}`)}/>
                                    <button onClick={(e) => RemoveUploadedGPTFile(e, `${contextField?.key}`)} id = {`removeButton-${contextField?.key}`}style={{display: "none"}}>Remove</button>
                                </>
                            )} */}
                        </>
                    )
                })}
                {forms?.fieldValues?.map((fieldValue, subIndex) => {
                    return (
                        <>
                            {subIndex > 0 && <button onClick={() => { DeleteGPTResponse(item, subIndex) }}>Delete</button>}
                            {fieldValue?.map((subItem, anotherIndex) => {
                                return (
                                    <>
                                        {(subItem?.value?.type === "dropdown" && subItem?.value?.multi) && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <select id={`dropdownValue-${subItem?.key}-${item?.messageId}-${subIndex}`} multiple>
                                                    {subItem?.value?.choices?.map((choice, choiceIndex) => {
                                                        return <option value={choice?.id}>{choice?.label}</option>
                                                    })}
                                                </select>
                                            </>
                                        )}
                                        {(subItem?.value?.type === "dropdown" && !subItem?.value?.multi) && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <select id={`dropdownValue-${subItem?.key}-${item?.messageId}-${subIndex}`} >
                                                    {subItem?.value?.choices?.map((choice, choiceIndex) => {
                                                        return <option value={choice?.label}>{choice?.label}</option>
                                                    })}
                                                </select>
                                            </>
                                        )}
                                        {(subItem?.value?.type === "simpleText") && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <div key={subIndex} value={subItem?.value} contentEditable="true" id={`inputValue-${subItem?.key}-${item?.messageId}-${subIndex}`} />
                                            </>
                                        )}
                                        {(subItem?.value?.type === "number") && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <input type="number" id={`inputValue-${subItem?.key}-${item?.messageId}-${subIndex}`} />
                                            </>
                                        )}
                                        {(subItem?.value?.type === "longText") && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <div key={subIndex} value={subItem?.value} contentEditable="true" id={`inputValue-${subItem?.key}-${item?.messageId}-${subIndex}`} />
                                            </>
                                        )}
                                        {(subItem?.value?.canUploadFile || subItem?.value?.type === 'file') && (
                                            <>  
                                                <input type="file" id={`fileUpload-${subItem?.key}-${item?.messageId}-${subIndex}`} multiple onChange={
                                                    async(e) => {
                                                        try{
                                                          const res =  await GptFileUpload(e, `${subItem?.key}-${item?.messageId}-${subIndex}`)
                                                          setFiles(res)
                                                        }catch(err){
                                                            console.log("error", err)
                                                        }
                                                    }}/>
                                                {files?.[`${subItem?.key}-${item?.messageId}-${subIndex}`]?.map((file, fileIndex) =>{
                                                    return(
                                                        <div key={fileIndex}>
                                                            <span>{file.title}</span>
                                                             <button onClick={(e) => RemoveUploadedGPTFile(e, `${subItem?.key}-${item?.messageId}-${subIndex}`, file?.mediaName)} id = {`removeButton-${subItem?.key}-${item?.messageId}-${subIndex}`}>Remove</button>
                                                        </div>
                                                    )
                                                })}                                               
                                            </>
                                        )}
                                        {(subItem?.key === "prompt") && (
                                            <>
                                                <div>{subItem?.label}</div>
                                                <div id={`inputValue-${subItem?.key}-${item?.messageId}-${subIndex}`} contentEditable={subItem?.value?.readOnly ? false : true}>{subItem?.value?.default}</div>
                                            </>
                                        )}
                                        {subItem?.value?.nested?.key === "prompt" && (
                                            <>  
                                                <div>{subItem?.value?.nested?.label}</div>
                                                <div id={`inputValue-${subItem?.key}-${item?.messageId}-${subIndex}`} contentEditable={subItem?.value?.nested?.readOnly ? false : true}>{subItem?.value?.nested?.value}</div>
                                            </>
                                        )}
                                    </>
                                )
                            })}
                        </>
                    )
                })}
            </div>

            <button onClick={() => {
                AddAdditionalGPTResponse(item)
            }}>Add</button>
            <button onClick={(e) => {
                SubmitGPTForm(e, item)
            }}>Submit</button>
        </>
    )
}
export default MultiResponseTestComp;