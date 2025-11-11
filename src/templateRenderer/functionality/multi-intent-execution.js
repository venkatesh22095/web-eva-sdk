import { cloneDeep, isEmpty, isUndefined } from "lodash";
import store from "../../redux/store";
import InitiateChatConversationAction from "../../chat/InitiateChatConversationAction";
import { updateChatData } from "../../redux/globalSlice";
import { executionPipelineActions } from "../../redux/actions/global.action";
import { createCloseIcon, tickMarkIcon } from "../icons-library.js";
import { cancelOngoingCall } from "../utils/helper.js";
import "./multi-intent-execution.css";

const multiIntentExecutionFunc = (item) => {

    let state = store.getState().global;

    const runTask = (index, q) => {
        const {activeBoardId} = state;  
        if(!!q){
          let updatedQuestion = cloneDeep(state.questions);
          item = Object.values(updatedQuestion).find(qId => (updatedQuestion[qId.parentMsgId]?.executingActionId ===  q?.id))
          item = updatedQuestion[item?.parentMsgId] || updatedQuestion[q?.parentMsgId] || updatedQuestion[state?.questions[q?.id]?.parentMsgId]
        }
        let _item = cloneDeep(item);
        let task = _item?.executionPipeline?.[index];
        task.stepIndex = index;
        store.dispatch(updateChatData({
          ...state.questions,
          [item?.reqId]: {
            ...item,
            status: "in-progress"
          }
        }))

      const params = { cId: _item?.id, type: _item?.type, stepId: task?._id, task, currentRunningQuestion: _item, parentMsgId: _item?.reqId}

        const payload = {
            "question": task?.utterance,
            "boardId": activeBoardId,
            "parentId": _item?.messageId,
            "context": {
              "intentId": task?.intents?.[0]?.id,
              "agentId": task?.intents?.[0]?.agentId,
              "stepId": task?._id
            }
          }

        InitiateChatConversationAction({params, payload, multiIntentExecution: true })
    }

    const runNextTask = (index, status , question) => {
        const nextTaskIndex = index+1;
        if([undefined, null, '', 'draft', 'in-progress', 'threadRunning'].includes(status)){
          return;
        }
        else runTask(nextTaskIndex , question)
      }

    const addNewTask = (index, task) => {
        const _questions = cloneDeep(state?.questions);
        let currentExecutionPipeline = cloneDeep(_questions[item?.reqId]?.executionPipeline);
        

        if(isEmpty(_questions[item?.reqId]?.savedExecutionPipeline)){
          _questions[item?.reqId].savedExecutionPipeline = currentExecutionPipeline;
        }else{
          currentExecutionPipeline = _questions[item?.reqId].savedExecutionPipeline;
        }

        let newTask = {
          _id: index, // temp id, it will get replaced with backend id later
          utterance: '',
          headerMsg: 'Oh, it seems I have missed a step. My apologies. Please describe and add the steps.',
          step: `Step ${index+1}`,
          type: 'addTask' 
        }

        const updatedPipeline = [..._questions[item?.reqId].executionPipeline];
        updatedPipeline.splice(index, 0, newTask);
        
        const updatedQuestions = {
          ..._questions,
          [item?.reqId]: { 
            ..._questions[item?.reqId], 
            executionPipeline: updatedPipeline 
          }
        };
        store.dispatch(updateChatData(updatedQuestions))
      }

    const saveTask = async (index, task, executionPipeline) => {

      let _questions = cloneDeep(state?.questions);
      let utterance = document.getElementById(`utterance-${task?._id}`)?.value;

      let payload = {
        utterance: utterance,
        action: task?.type == 'addTask' ? 'add' : 'update',
      }

      if(task?._id > 0 && task?.type === 'addTask'){
        payload.stepId = executionPipeline[task?._id - 1]?._id;
      }else if(task?.type === 'modify'){
        payload.stepId = task?._id;        
        /*check for additional intents that might have been added */
        let additionalIntents = task?.intents?.filter(intent => !intent?._id);
        if(additionalIntents?.length > 0){
          payload.addIntents = additionalIntents?.map(intent => intent?.id);
        }
      }
      payload.index = index;

      let params = {
        messageId: item?.messageId,
        boardId: state?.activeBoardId,
      }
      
      /*put the loading state in the task */
      let currentExecutionPipeline = cloneDeep(_questions[item?.reqId]?.executionPipeline);
      currentExecutionPipeline[index] = { ...currentExecutionPipeline[index], loading: true };
      const updatedQuestions = {
        ..._questions,
        [item?.reqId]: {
          ..._questions[item?.reqId],
          executionPipeline: currentExecutionPipeline
        }
      };
      store.dispatch(updateChatData(updatedQuestions))

      const response = await store.dispatch(executionPipelineActions({params, payload}))
      
      if(!!response?.payload){
        const updatedQuestions = {
          ..._questions,
          [item?.reqId]: {
            ..._questions[item?.reqId],
            executionPipeline: response?.payload?.executionPipeline,
            savedExecutionPipeline: response?.payload?.executionPipeline
          }
        };
        store.dispatch(updateChatData(updatedQuestions))
      }
    }

    const deleteNewTask = (taskId) => {
        const _questions = cloneDeep(state?.questions);
        /*remove type key from the savedExecutionPipeline of that particular task which is having _id as task?._id*/
      const taskIndex = _questions[item?.reqId].savedExecutionPipeline?.findIndex(task => task?._id === taskId);
        const {type, ...rest} = _questions[item?.reqId].savedExecutionPipeline?.[taskIndex];  
        _questions[item?.reqId].savedExecutionPipeline[taskIndex] = rest;      

        const updatedQuestions = {
          ..._questions,
          [item?.reqId]: { 
            ..._questions[item?.reqId], 
          executionPipeline: _questions[item?.reqId].savedExecutionPipeline
          }
        };
        store.dispatch(updateChatData(updatedQuestions))
    }

    const deleteExistingTask = async (index, task) => {
      let _questions = cloneDeep(state?.questions);

      let params = {
        messageId: item?.messageId,
        boardId: state?.activeBoardId,
      }

      let payload = {
        action: "delete",
        stepId: task?._id,
      }

      const response = await store.dispatch(executionPipelineActions({params, payload}))

      if(!!response?.payload){
        const updatedQuestions = {
          ..._questions,
          [item?.reqId]: {
            ..._questions[item?.reqId],
            executionPipeline: response?.payload?.executionPipeline,
            savedExecutionPipeline: response?.payload?.executionPipeline
          }
        };
        store.dispatch(updateChatData(updatedQuestions))
      }
    }

    const editTask = (index, task) => {
      const _questions = cloneDeep(state?.questions);
      let currentExecutionPipeline = cloneDeep(_questions[item?.reqId]?.executionPipeline);

      if(isEmpty(_questions[item?.reqId]?.savedExecutionPipeline)){
        _questions[item?.reqId].savedExecutionPipeline = currentExecutionPipeline;
      }else{
        currentExecutionPipeline = _questions[item?.reqId].savedExecutionPipeline;
      }

      let _task = {...task, type : 'modify', step : `Step ${index+1}`}

      currentExecutionPipeline.splice(index, 1, _task);
      /*need to remove the type key from other tasks which are having type key other than this index */
      currentExecutionPipeline.forEach((task, pipeLineIndex) => {
        if(pipeLineIndex !== index){
          task.hasOwnProperty('type') ? delete task.type : '';
        }
      });

      const updatedQuestions = {
        ..._questions,
        [item?.reqId]: { ..._questions[item?.reqId], executionPipeline: currentExecutionPipeline }
      };
      store.dispatch(updateChatData(updatedQuestions))
    }

    const addIntent = (index, task, selectedAgent) => {
      const _questions = cloneDeep(state?.questions);
      let currentExecutionPipeline = cloneDeep(_questions[item?.reqId]?.executionPipeline);
      let savedExecutionPipeline = cloneDeep(currentExecutionPipeline);
      if(!currentExecutionPipeline[index].intents){
        currentExecutionPipeline[index].intents = [];
      }
      currentExecutionPipeline[index].intents.push({
        agentId: selectedAgent.id,
        agentMeta: {
          name: selectedAgent.name,
          icon: selectedAgent.icon
        },
        name: selectedAgent.name,
        id: selectedAgent.id
      });
      
      const updatedQuestions = {
        ..._questions,
        [item?.reqId]: { ..._questions[item?.reqId], executionPipeline: currentExecutionPipeline, savedExecutionPipeline }
      };
      store.dispatch(updateChatData(updatedQuestions));
      
      // Trigger change check for Done button
      const doneBtn = document.getElementById(`doneBtn-${task?._id}`);
      if (doneBtn && doneBtn.checkForChanges) {
        
        doneBtn.checkForChanges();
      }
    }

    const showAgentSelectionPopup = (buttonElement, index, task, reqId) => {
      const existingPopup = document.querySelector('.agent-selection-popup');
      if (existingPopup) {
        existingPopup.remove();
      }

      const state = store.getState();
      const allAgents = state?.global?.allAgents?.data?.agents || [];
      const enabledAgents = allAgents.filter(agent => agent?.enabled && agent?.type !== "agenticApp");

      if (enabledAgents.length === 0) {
        console.warn('No enabled agents available');
        return;
      }

      // Create agent menu item HTML
      const createAgentMenuItemHTML = (agent) => {
        const isSelected = task?.intents?.length > 0 && task?.intents?.find(intent => intent?.agentId === agent.id);
        const disabledAttr = isSelected ? 'disabled' : '';
        const className = isSelected ? 'menu-item disabled' : 'menu-item';
        
        return `
          <sl-menu-item 
            value="${agent.id}" 
            class="${className}" 
            ${disabledAttr}
            data-agent-id="${agent.id}"
            data-agent-name="${agent.name}"
            data-agent-icon="${agent.icon || ''}"
            data-is-selected="${isSelected}"
          >
            <div slot="prefix" style="display: flex; align-items: center; margin-right: 8px;">
              <img src="${agent.icon || ''}" alt="${agent.name}" style="max-width: 1.5rem; height: 1rem; object-fit: contain;" onerror="this.style.display='none'" />
            </div>
            <span style="font-size: .875rem; font-weight: 500; line-height: 1.25rem; color: #424242; max-width: 16.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${agent.name}</span>
            ${isSelected ? `<div slot="suffix" style="display: flex;margin-left: 0.5rem;align-items: center;">${tickMarkIcon({ size: 12, color: "#475467" })}</div>` : ''}
          </sl-menu-item>
        `;
      };

      // Generate agents HTML
      const generateAgentsHTML = (agentsToRender = enabledAgents) => {
        if (agentsToRender.length === 0) {
          return '<div class="no-results">No agents found</div>';
        }
        
        return agentsToRender.map(agent => createAgentMenuItemHTML(agent)).join('');
      };

      // Create popup HTML
      const popupHTML = `
        <div class="popup-container">
          <div class="agentsTabWrapper">
            <div class="agentsHeader">
              <div class="agentsTabHeadingWrapper">All agents published to you</div>
              <div class="agentSearch">
                <input type="text" placeholder="Search" class="popup-search-input" id="popup-search-input" />
                <div class="agentCancel popup-close-button" id="popup-close-button">${createCloseIcon({ size: 12, color: "#667085" })}</div>
              </div>
            </div>
          </div>
          <sl-menu class="popup-menu" id="popup-menu">
            ${generateAgentsHTML()}
          </sl-menu>
        </div>
      `;

      // Create popup element
      const popup = document.createElement('sl-popup');
      popup.className = 'agent-selection-popup';
      popup.setAttribute('placement', 'top-start');
      popup.setAttribute('auto-size', 'vertical');
      popup.setAttribute('flip', 'true');
      popup.setAttribute('shift', 'true');
      popup.innerHTML = popupHTML;

      document.body.appendChild(popup);
      popup.anchor = buttonElement;

      // Get references to elements after DOM creation
      const searchInput = popup.querySelector('#popup-search-input');
      const closeButton = popup.querySelector('#popup-close-button');
      const menu = popup.querySelector('#popup-menu');

      // Function to render agents based on search
      const renderAgents = (agentsToRender = enabledAgents) => {
        menu.innerHTML = generateAgentsHTML(agentsToRender);
        attachMenuItemListeners();
      };

      // Attach event listeners to menu items
      const attachMenuItemListeners = () => {
        const menuItems = menu.querySelectorAll('sl-menu-item:not([disabled])');
        menuItems.forEach(menuItem => {
          menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const agentData = {
              id: menuItem.dataset.agentId,
              name: menuItem.dataset.agentName,
              icon: menuItem.dataset.agentIcon
            };
            
            addIntent(index, task, agentData);
            
            // Trigger change check after adding agent
            const doneBtn = document.getElementById(`doneBtn-${task?._id}`);
            if (doneBtn && doneBtn.checkForChanges) {
              setTimeout(() => doneBtn.checkForChanges(), 50);
            }
            
            closePopupFunction();
          });
        });
      };

      // Close popup function
      const closePopupFunction = () => {
        if (popup.hide) {
          popup.hide();
        } else {
          popup.removeAttribute('active');
          popup.style.display = 'none';
        }
        setTimeout(() => popup.remove(), 100);
        document.removeEventListener('click', closePopup);
      };

      // Initial attach of menu item listeners
      attachMenuItemListeners();

      // Add search functionality
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
          renderAgents();
        } else {
          const filteredAgents = enabledAgents.filter(agent => 
            agent.name.toLowerCase().includes(searchTerm)
          );
          renderAgents(filteredAgents);
        }
      });

      // Add keyboard navigation
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closePopupFunction();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Select the first available (non-disabled) agent from current filter
          const firstMenuItem = menu.querySelector('sl-menu-item:not([disabled])');
          if (firstMenuItem) {
            firstMenuItem.click();
          }
        }
      });

      // Add close button functionality
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePopupFunction();
      });

      // Show popup with fallback
      if (popup.show) {
        popup.show();
      } else {
        popup.setAttribute('active', '');
        popup.style.display = 'block';
      }

      // Close popup when clicking outside
      const closePopup = (e) => {
        if (!popup.contains(e.target) && !buttonElement.contains(e.target)) {
          closePopupFunction();
        }
      };

      // Add close handler with delay to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('click', closePopup);
      }, 100);
      
      setTimeout(() => {
        searchInput.focus();
      }, 150);
    }

    const deleteIntent = (index, intentToDelete) => {
      const _questions = cloneDeep(state?.questions);
      let currentQuestion = cloneDeep(_questions[item?.reqId]);
      let currentExecutionPipeline = cloneDeep(currentQuestion?.executionPipeline);
      let savedExecutionPipeline = cloneDeep(currentExecutionPipeline); 
      let task = currentExecutionPipeline[index];     
      currentExecutionPipeline[index].intents = currentExecutionPipeline[index]?.intents?.filter(intent => intent?.agentId !== intentToDelete?.agentId);
            
      currentQuestion.executionPipeline[index].intents = currentExecutionPipeline?.[index]?.intents || [];
      
      /*lets check whether the utterance is changed or not for the executionPipeline with this index */
      const utteranceInput = document.getElementById(`utterance-${task?._id}`);
      const utterance = utteranceInput.value || '';
      const currentUtterance = currentExecutionPipeline[index]?.utterance || '';
      if(utterance !== currentUtterance){
        currentExecutionPipeline[index].utterance = utterance;
        currentQuestion.executionPipeline[index].utterance = utterance;
      }
      const updatedQuestions = {
        ..._questions,
        [item?.reqId]: { ...currentQuestion, savedExecutionPipeline }
      };
      store.dispatch(updateChatData(updatedQuestions));
      
      // Trigger change check for Done button      
      const doneBtn = document.getElementById(`doneBtn-${task?._id}`);
      if (doneBtn && doneBtn.checkForChanges) {
        doneBtn.checkForChanges();
      }
    }
/*this compare array should check where the array are same or not, if same then not changes are required so it should return false, else true */
    const compareArrays = (arr1, arr2) => {
      if(arr1.length !== arr2.length) return true;
      /*this below line should check whether the arrays are same, if same then no changes are required so it should return false, else true */
      return !arr1.every(item => arr2.some(item2 => item2.agentId === item.agentId));
    }

    const cancelTask = (task) => {
      cancelOngoingCall(task?._id);
    }

    // Drag and Drop functionality
    let draggedElement = null;
    let draggedIndex = null;
    let dropIndicator = null;

    const createDropIndicator = () => {
      const indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
      indicator.style.cssText = `
        height: 2px;
        background-color: #3b82f6;
        border-radius: 1px;
        margin: 4px 0;
        transition: all 0.2s ease;
        opacity: 0;
      `;
      return indicator;
    };

    const showDropIndicator = (target, position) => {
      hideDropIndicator();
      dropIndicator = createDropIndicator();
      dropIndicator.style.opacity = '1';
      
      if (position === 'before') {
        target.parentNode.insertBefore(dropIndicator, target);
      } else {
        target.parentNode.insertBefore(dropIndicator, target.nextSibling);
      }
    };

    const hideDropIndicator = () => {
      if (dropIndicator) {
        dropIndicator.remove();
        dropIndicator = null;
      }
    };

    const reorderExecutionPipeline = (fromIndex, toIndex) => {
      const _questions = cloneDeep(state?.questions);
      let currentExecutionPipeline = cloneDeep(_questions[item?.reqId]?.executionPipeline);
      
      // Remove the dragged item
      const draggedItem = currentExecutionPipeline.splice(fromIndex, 1)[0];
      
      // Insert it at the new position
      currentExecutionPipeline.splice(toIndex, 0, draggedItem);
      
      const updatedQuestions = {
        ..._questions,
        [item?.reqId]: {
          ..._questions[item?.reqId],
          executionPipeline: currentExecutionPipeline,
          savedExecutionPipeline: currentExecutionPipeline
        }
      };
      
      store.dispatch(updateChatData(updatedQuestions));
    };

    const setupDragAndDrop = () => {
      const taskItems = document.querySelectorAll('.dragTaskItem[draggable="true"]');
      
      taskItems.forEach((taskItem, index) => {
        
        if (taskItem.dragListenersAdded) return;
        
        taskItem.addEventListener('dragstart', (e) => {
          draggedElement = taskItem;
          draggedIndex = parseInt(taskItem.dataset.taskIndex);
          
          
          taskItem.style.opacity = '0.5';
          taskItem.classList.add('dragging');
          
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/html', taskItem.outerHTML);
        });

        taskItem.addEventListener('dragend', (e) => {
          // Reset visual state
          taskItem.style.opacity = '';
          taskItem.classList.remove('dragging');
          hideDropIndicator();
          
          // Reset drag variables
          draggedElement = null;
          draggedIndex = null;
        });

        taskItem.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          
          if (draggedElement && draggedElement !== taskItem) {
            const rect = taskItem.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const position = e.clientY < midpoint ? 'before' : 'after';
            
            showDropIndicator(taskItem, position);
          }
        });

        taskItem.addEventListener('drop', (e) => {
          e.preventDefault();
          hideDropIndicator();
          
          if (draggedElement && draggedElement !== taskItem) {
            const targetIndex = parseInt(taskItem.dataset.taskIndex);
            const rect = taskItem.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            let newIndex;
            if (e.clientY < midpoint) {
              // Dropping before the target
              newIndex = targetIndex;
            } else {
              // Dropping after the target
              newIndex = targetIndex + 1;
            }
            
            
            if (draggedIndex < newIndex) {
              newIndex--;
            }
            
            
            if (draggedIndex !== newIndex) {
              reorderExecutionPipeline(draggedIndex, newIndex);
            }
          }
        });

        
        taskItem.dragListenersAdded = true;
      });

      
      const container = document.querySelector('.multiIntentExecution');
      if (container && !container.dragOverListenerAdded) {
        container.addEventListener('dragover', (e) => {
          e.preventDefault();
          hideDropIndicator();
        });
        
        container.addEventListener('drop', (e) => {
          e.preventDefault();
          hideDropIndicator();
        });
        
        container.dragOverListenerAdded = true;
      }
    };

     const runButton = document.getElementById(`startBtn-${item?.reqId}`);
     const editButton = document.getElementById(`editFlowBtn-${item?.reqId}`);

     if(runButton && !runButton.eventListenerAdded){
        runButton.addEventListener("click", () => {
            runTask(0);
        });
        runButton.eventListenerAdded = true;
     }

     if(editButton && !editButton.eventListenerAdded){
        editButton.addEventListener("click", () => {            
            const isEditMode = editButton.textContent === 'Edit';
            if(isEditMode){
            /*fetch the class with taskIteam and  dragHandle and append showOptions to those divs*/
            /*when we click again on this button it should remove the appended showOptions */
            const taskItems = document.querySelectorAll('.taskItem');
            const dragHandles = document.querySelectorAll('.dragHandle');
            taskItems.forEach(taskItem => {
                taskItem.classList.add('showOptions');
            });
            dragHandles.forEach(dragHandle => {
                dragHandle.classList.add('showOptions');
            });   
          }else{
            const taskItems = document.querySelectorAll('.taskItem');
            const dragHandles = document.querySelectorAll('.dragHandle');
            taskItems.forEach(taskItem => {
                taskItem.classList.remove('showOptions');
            });
            dragHandles.forEach(dragHandle => {
                dragHandle.classList.remove('showOptions');
            });
          }          
          editButton.textContent = isEditMode ? 'Done' : 'Edit';
        });
        editButton.eventListenerAdded = true;
     }

     item?.executionPipeline?.forEach((task, index) => {
        const addNewTaskBtn = document.getElementById(`addNewTaskBtn-${index}`);
        const continueBtn = document.getElementById(`continueBtn-${task?._id}`);
        if(continueBtn && !continueBtn.eventListenerAdded){
            continueBtn.addEventListener("click", () => {
                cancelTask(task);
            });
            continueBtn.eventListenerAdded = true;
        }

        if(addNewTaskBtn && !addNewTaskBtn.eventListenerAdded){
            addNewTaskBtn.addEventListener("click", () => {
                addNewTask(index, task);
            });
            addNewTaskBtn.eventListenerAdded = true;
        }

        const deleteBtn = document.getElementById(`deleteBtn-${task?._id}`);
        if(deleteBtn && !deleteBtn.eventListenerAdded){
            deleteBtn.addEventListener("click", () => {
                deleteExistingTask(index, task);
            });
            deleteBtn.eventListenerAdded = true;
        }

        const editBtn = document.getElementById(`editBtn-${task?._id}`);
        if(editBtn && !editBtn.eventListenerAdded){
            editBtn.addEventListener("click", () => {
                editTask(index, task);
            });
            editBtn.eventListenerAdded = true;
        }

       if (task?.type === 'addTask' || task?.type === 'modify') {
         const cancelBtn = document.getElementById(`cancelBtn-${task?._id}`);
         if (cancelBtn && !cancelBtn.eventListenerAdded) {
           cancelBtn.addEventListener("click", () => {
            deleteNewTask(task?._id);
           });
           cancelBtn.eventListenerAdded = true;
         }

         const doneBtn = document.getElementById(`doneBtn-${task?._id}`);
         const utteranceInput = document.getElementById(`utterance-${task?._id}`);         
         
         // Function to check if there are changes by comparing with store values
         const checkForChanges = () => {
           if (!doneBtn || !utteranceInput) return;
           
           const currentState = store.getState().global;
           const currentTask = currentState?.questions[item?.reqId]?.executionPipeline?.[index];
           
           if (!currentTask) return;
           
           const domUtterance = utteranceInput.value || '';
           const storeUtterance = currentTask?.utterance || '';           
           const taskIntents = currentTask?.intents || [];
           const currentTaskSavedIntents = currentState?.questions[item?.reqId]?.savedExecutionPipeline?.[index]?.intents || [];
           
           const hasChanges = 
             domUtterance !== storeUtterance || compareArrays(taskIntents, currentTaskSavedIntents);
           
           if (hasChanges) {
             doneBtn.disabled = false;
             doneBtn.style.opacity = '1';
             doneBtn.style.cursor = 'pointer';
           } else {
             doneBtn.disabled = true;
             doneBtn.style.opacity = '0.5';
             doneBtn.style.cursor = 'not-allowed';
           }
         };

         // Initial check to set correct button state
         if (doneBtn) {
           checkForChanges();
         }

         // Add input listener for description changes
         if (utteranceInput && !utteranceInput.changeListenerAdded) {
           utteranceInput.addEventListener('input', checkForChanges);
           utteranceInput.addEventListener('change', checkForChanges);
           utteranceInput.changeListenerAdded = true;
         }

         if (doneBtn && !doneBtn.eventListenerAdded) {
           doneBtn.addEventListener("click", (e) => {
             if (doneBtn.disabled) {
               e.preventDefault();
               return;
             }
             saveTask(index, task, item?.executionPipeline);
           });
           doneBtn.eventListenerAdded = true;
         }

         // Store reference to checkForChanges for intent modifications
         doneBtn.checkForChanges = checkForChanges;

         const addIntentBtn = document.getElementById(`addAgentLabel-${task?._id}`);
         if (addIntentBtn && !addIntentBtn.eventListenerAdded) {
           addIntentBtn.addEventListener("click", (e) => {
             e.preventDefault();
             e.stopPropagation();
             showAgentSelectionPopup(addIntentBtn, index, task, item?.reqId);
           });
           addIntentBtn.eventListenerAdded = true;
         }

         task?.intents?.forEach((intent, idx) => {
          const deleteIntentBtn = document.getElementById(`deleteIntent-${task?._id}-${intent?.agentMeta?.agentId}`);
          if(deleteIntentBtn && !deleteIntentBtn.eventListenerAdded){
            deleteIntentBtn.addEventListener("click", () => {
              deleteIntent(index, intent);
              // Trigger change check after deletion
              if (doneBtn && doneBtn.checkForChanges) {
                setTimeout(() => doneBtn.checkForChanges(), 50);
              }
            });
          }
         })
       }

     });

     // Setup drag and drop functionality
     setupDragAndDrop();

     return {
        runTask,
        runNextTask, 
        addNewTask,
        deleteExistingTask,
        saveTask,
        editTask,
        reorderExecutionPipeline
     }
}

export { multiIntentExecutionFunc };
