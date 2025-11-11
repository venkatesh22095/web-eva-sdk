import { CheveronDownIcon, cheveronRightIcon } from "../icons-library";

const ResponseQueryFlowFunctionality = ({ data, uniqueId }) => {
    

    if(data?.status === 'completed' || data?.status === 'terminated'){
        const queryResponseFlow = document.getElementById(`query-response-flow-${uniqueId}`);
        if (queryResponseFlow) {                        
            const icon = queryResponseFlow.querySelector('.query-response-flow-header-icon');
            const queryResponseFlowMainDiv = queryResponseFlow.querySelector('.query-response-flow-header.ans-generating');
            if(queryResponseFlowMainDiv){
                queryResponseFlowMainDiv.classList.remove('ans-generating');
            }

            if (icon) {
                icon.style.display = 'flex';
                
                
                // Add click functionality to toggle the flow
                const headerContainer = queryResponseFlow.querySelector('.query-response-flow-header-container');
                if (headerContainer) {
                    headerContainer.style.cursor = 'pointer';
                    
                    
                    // Remove any existing listeners and add new one
                    const newHeaderContainer = headerContainer.cloneNode(true);
                    headerContainer.parentNode.replaceChild(newHeaderContainer, headerContainer);
                    
                    newHeaderContainer.addEventListener('click', function(event) {
                        console.log('Click handler triggered for messageId:', data.messageId || data.id);
                        toggleResponseFlow(event, data?.reqFlow?.[data?.reqFlow?.length - 1]?.content);
                    });
                } else {
                    
                }
            } else {
                
            }
        } else {
            console.log('Query response flow element not found');
        }
    }
}

function toggleResponseFlow(event, content) {
    console.log('toggleResponseFlow called');

    const queryResponseFlow = event.currentTarget.closest('.query-response-flow');
    if (!queryResponseFlow) {
        console.log('Query response flow not found');
        return;
    }
    
    const icon = queryResponseFlow.querySelector('.query-response-flow-header-icon');
    const displayDiv = queryResponseFlow.querySelector('.display-query-response-flow');
    const queryResponseHeader = queryResponseFlow.querySelector('.query-response-flow-header-text');
    
    
    if (!icon) return;
    
    // Check current state based on icon content
    const isCurrentlyExpanded = icon.innerHTML.includes('wa-CheveronDownIcon');
    
    if (isCurrentlyExpanded) {
        // Collapse: Switch to right chevron and hide display div
        icon.innerHTML = `${cheveronRightIcon({ size: 10, color: "#667085" })}`;
        if (displayDiv) {
            displayDiv.style.display = 'none';
            queryResponseHeader.innerText = content;
        }
    } else {
        // Expand: Switch to down chevron and show display div
        icon.innerHTML = `${CheveronDownIcon({ size: 10, color: "#667085" })}`;
        if (displayDiv) {
            displayDiv.style.display = 'block';
            queryResponseHeader.innerText = "Response Flow";
        }
    }
}

export default ResponseQueryFlowFunctionality;