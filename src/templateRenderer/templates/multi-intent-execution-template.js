import { cloneDeep } from "lodash";
import store from "../../redux/store";
import { multiIntentExecutionFunc } from "../functionality/multi-intent-execution";
import TemplateRenderer from "../templateRenderer";
import "./../styles/template.scss";
import { Close, PlusIcon, DragHandleIcon, RadioButtonChecked, createDeleteIcon, EditIcon, HistoryIcon, AddStepFilledIcon, WarningStrokeCircle, tickMarkIcon, LoadingSpinner, AgenticSearchIcon } from "../icons-library";


const assistantIconTemplate = () => {
    return `<img src="https://www.google.com/imgres?q=green%20dot&imgurl=https%3A%2F%2Fi.pinimg.com%2F736x%2Fe2%2F29%2F50%2Fe22950b0a26db427c651dccba60ab62c.jpg&imgrefurl=https%3A%2F%2Fin.pinterest.com%2Fpin%2Fgreen-circle-logo--333547916161752097%2F&docid=C6G2J8KBo9zd2M&tbnid=Np_pFb0VPiJdvM&vet=12ahUKEwiE-dPf3JONAxV2cmwGHVL7JgcQM3oECG8QAA..i&w=735&h=752&hcb=2&ved=2ahUKEwiE-dPf3JONAxV2cmwGHVL7JgcQM3oECG8QAA" alt="Assistant Icon" height="20" width="20"/>`;
}
const userIconTemplate = () => {
    return `<img src="https://www.google.com/imgres?q=green%20dot&imgurl=https%3A%2F%2Fi.pinimg.com%2F736x%2Fe2%2F29%2F50%2Fe22950b0a26db427c651dccba60ab62c.jpg&imgrefurl=https%3A%2F%2Fin.pinterest.com%2Fpin%2Fgreen-circle-logo--333547916161752097%2F&docid=C6G2J8KBo9zd2M&tbnid=Np_pFb0VPiJdvM&vet=12ahUKEwiE-dPf3JONAxV2cmwGHVL7JgcQM3oECG8QAA..i&w=735&h=752&hcb=2&ved=2ahUKEwiE-dPf3JONAxV2cmwGHVL7JgcQM3oECG8QAA" alt="User Icon" height="20" width="20"/>`;
};

function render(data) {

    let state = store?.getState()?.global;
    let _questions = cloneDeep(state?.questions);
    let items = data || {};

    let initialState = items?.status === "draft"

    let header = `
        <div id="answer-${items?.reqId}" class="threadName maxLength" >
            ${items?.templateInfo?.label}
        </div>

        ${items?.status === 'draft' ? items?.executionPipeline?.length > 0 ? `
            <button class="kr-primary-btn-black btn-lg startBtn" id = "startBtn-${items?.reqId}">${items?.templateInfo?.action}</button>
            <button class="kr-secondary-btn btn-lg editFlowBtn" id = "editFlowBtn-${items?.reqId}">Edit</button>
        ` : '' : ''}
        `;


    let body = `
        ${items?.executionPipeline?.map((task, index) => {
        const originalTaskId = task?._id;
        task = { ...task, ..._questions[task?._id], isTask: true, _id: originalTaskId };
        let html = TemplateRenderer.generateHTMLTemplate(task, {});

        if (task?.type === 'addTask' || task?.type === 'modify') {
            return addNewTaskRenderer(task, index, items);
        }

            return `
                <div class="tasksToRun">
                    <div class="taskItems">
                        <div class='addNewLineWrapper'>
                            ${initialState ? `<div class='addNewLine'>
                                <span class="stepIcon addNewTaskBtn" id="addNewTaskBtn-${index}">
                                    ${AddStepFilledIcon({ size: 32, color: "#98A2B3" })}
                                </span>
                            </div>` : ''}
                        </div>
                        <div class="dragTaskItem" 
                            draggable="${initialState ? 'true' : 'false'}" 
                            data-task-id="${task?._id}" 
                            data-task-index="${index}">
                            ${initialState ? `<div class="dragHandle" title="Drag to reorder">
                                ${DragHandleIcon({ size: 14, color: "#9CA3AF" })}
                            </div>` : ''}
                            <div class="taskItem ${task?.showResponse ? 'loadingSkeleton' : ''}">
                                <div class="topCard">
                                    <div class="leftBlock">                                                                            
                                ${task?.loading ? `<div class="statusIcon">
                                    ${LoadingSpinner({ size: 16 })}    
                                </div>`:
                                task?.status === "completed"
                                    ? tickMarkIcon({ size: 16, color: "#475467" }) 
                                            : task?.status === "discard"
                                                ? WarningStrokeCircle({ size: 16, color: "white", stroke: "#F04438", insideFill: "#F04438" }) 
                                                : HistoryIcon({ size: 16, color: "#98A2B3" }) 
                                        } 
                              
                                        <div class="contentBlock">
                                            ${Array.isArray(task?.intents) && task.intents.length > 0 ? `
                                                <div class="agentsAmbiguity">
                                                ${task.intents.slice(0, 2).map((intent, idx) => `
                                                    <div class="agentIcon">
                                                        <img src="${intent?.agentMeta?.icon}" alt="Agent ${idx + 1}" />
                                                    </div>
                                                `).join('')}
                                                </div>
                                            ` : ''}                                    
                                            <div class="utterance">${task?.utterance}</div>                                            
                                        </div>
                                    </div>
                                    <div class="rightBlock">
                                    ${initialState ? `
                                        <div class="options">
                                            <div class="opItem" id="editBtn-${task?._id}">${EditIcon({ size: 14, color: "#667085" })}</div>
                                            <div class="opItem" id="deleteBtn-${task?._id}">${createDeleteIcon({ size: 14, color: "#667085" })}</div>
                                        </div>
                                    ` : ''}
                                    </div>
                                </div> 
                                ${task?.showResponse ? `
                                    <div class="bottomCard">
                                        ${html?.innerHTML}
                                        ${index < items?.executionPipeline?.length - 1  && ['draft', 'in-progress', 'threadRunning'].includes(task?.status) ?
                                        `<div class='continuebtn' id="continueBtn-${task?._id}">
                                            Continue Flow 
                                        </div>`    :''
                                        }
                                    </div>
                            ` : ''}                               
                            </div>                    
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;


    let multiIntentExecution = `
        <div class="multiIntentExecution ${items?.status} ${items?.executionPipeline?.length === 0 ? 'd-none' : ''}">
            ${header}
            ${body}
        </div>
    `;

    // multiIntentExecution += header;


    let timeout
    clearTimeout(timeout)
    timeout = setTimeout(() => {
        multiIntentExecutionFunc(data);
    }, 1000);

    return multiIntentExecution;
}

const addNewTaskRenderer = (task, index, items) => {
    return `
      <div class='addingNewTask'>
        <div class="headerSec">
            ${task?.type === 'addTask' ? `<div class="headerMsg">
               ? ${task?.headerMsg}
            </div>` : ''}
          <div class="headerInfo">
            <div class='step'>${task?.step || `Step ${index + 1}`}</div>
              ${items?.executionPipeline?.length > 1 ?
            `<div class="opItem" id = "deleteNewTaskBtn-${task?._id}">${createDeleteIcon({ size: 14, color: "#667085" })}</div>`
            : ''}
          </div>
          <div class="addDescription">
            <input type="text" value = "${task?.utterance}" placeholder="Add the description of step(s) which I missed!" id = "utterance-${task?._id}" />

            <div class="agentBlock ${task?.intents?.length === 0 ? 'space-between' : ''}">
            <span class="add-agent-label" id="addAgentLabel-${task?._id}">                
                + Add Agent
              </span>              
            ${task?.intents?.length > 0 ? task?.intents?.map((intent, idx) => `
                <div key="${intent?.agentId}" class="agentBadgeWrapper">
                    <div class="agentBadge">
                            <span class='badgeimg'><img src="${intent?.agentMeta?.icon}" /></span>
                            <span class='ellipsisTextBlock'>${intent?.agentMeta?.name}</span>
                            <span class='badge-close' id = "deleteIntent-${task?._id}-${intent?.agentMeta?.agentId}">
                            ${Close({ size: "8", color: "#98A2B3" })}
                            </span>
                    </div>
                </div>
            `).join('') : `<div class='agentBlock-last'>${AgenticSearchIcon({ size: 16})}<span class='defaultSearchText'>Default Search will respond</span></div>`}
          </div>
          </div>
          
          <div class="footerSec">
            <div class="btns">
                <button class="kr-secondary-btn btn-sm cancelBtn" id = "cancelBtn-${task?._id}">Cancel</button>
                <button class="kr-primary-btn-black btn-sm doneBtn" id = "doneBtn-${task?._id}">${task?.loading ? 'Loading...' : 'Done'}</button>                
            </div>
            ${task?.intents?.length === 0 ? "<span class='errorMessage'>Relevant agent not found</span>" : ''}
          </div>
        </div>
    `;
}



export { render };