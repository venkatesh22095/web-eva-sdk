import { encodeHtml } from "../utils/helper";
import { CheveronDownIcon, cheveronRightIcon } from "../icons-library";
import ResponseQueryFlowFunctionality from "../functionality/response-query-flow";

function render(data) { 
    if(data?.reqFlow?.length === 0){
        return `<div></div>`;
    }
    
    const uniqueId = `query-response-flow-${data?.messageId || data?.reqId}`;
    
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        ResponseQueryFlowFunctionality({ data, uniqueId });
    }, 100); // Reduced timeout for better responsiveness

    return `
            <div class='query-response-flow' id='query-response-flow-${uniqueId}'>
                <div class='query-response-flow-header-container'>
                    <div class="query-response-flow-header ans-generating">                    
                        <div class="query-response-flow-header-text">${data?.generatingAnswerMsg || data?.reqFlow?.[data?.reqFlow?.length - 1]?.content || 'Analyzing...'}</div>
                        <span class="query-response-flow-header-icon ${data?.status === 'completed' || data?.status === 'terminated' ? '' : 'hidden'}">${cheveronRightIcon({ size: 16, color: "#667085" })}</span>                
                    </div>                    
                </div>
                <div class="display-query-response-flow" style="display: none;">${renderReqFlow(data)}</div>
            </div>
    `        
}

function renderReqFlow(data) {
    if (!data.reqFlow) return "";

    let html = `
        <div class='query-response-flow-items'>
            ${data.reqFlow.map((item, index) => {
        return `
                    <div class='query-response-flow-item'>
                        <div class='query-response-flow-item-icon'>
                            <img src="${item?.icon || ''}" alt="Flow icon"/>
                        </div>
                        <div class='query-response-flow-item-content'>
                            ${encodeHtml(item?.content || '')}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
    return html;
}

export { render };