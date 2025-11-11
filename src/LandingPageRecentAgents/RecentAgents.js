import { RecentAgents } from "../agents";
import { InvokeAgent } from "../chat";
import { getIconsList } from "../utils/helpers";

let isRecentAgentsLoading = false;
let currentRecentAgents = [];

const RecentAgentsFunc = () => {
const constructRecentAgentsList = (recentAgents = []) => {    
    if(isRecentAgentsLoading) {
        return `<div class="recent-agents-loading">
            <div class="recent-agents-container">
                <div class="recent-agent skeleton-agent">
                    <sl-skeleton effect="pulse"></sl-skeleton>
                </div>
                <div class="recent-agent skeleton-agent">
                    <sl-skeleton effect="pulse"></sl-skeleton>
                </div>
                <div class="recent-agent skeleton-agent">
                    <sl-skeleton effect="pulse"></sl-skeleton>
                </div>
                <div class="recent-agent skeleton-agent">
                    <sl-skeleton effect="pulse"></sl-skeleton>
                </div>
                <div class="recent-agent skeleton-agent">
                    <sl-skeleton effect="pulse"></sl-skeleton>
                </div>
            </div>
        </div>`;
    } else {
        if(recentAgents?.length > 0) {
            return `<div class="recent-agents-container">
                ${recentAgents.slice(0, 6).map((agent, index) => {
                    return `<div class="recent-agent ${agent?.type === "agenticApp" ? "agenticApp" : ""}" data-agent-index="${index}" title="${agent?.name || 'Unnamed Agent'}">
                        <span class="recent-agent-icon">${agent?.type === "agenticApp" ? `${getIconsList(agent, [])}` : `<img src="${agent?.icon || ''}" alt="${agent?.name || 'Agent'}" />`}</span>
                        <span class="recent-agent-name">${agent?.name || 'Unnamed Agent'}</span>
                    </div>`;
                }).join('')}
            </div>`;
        } else {
            return `<div class="recent-agents-empty">No recent agents found</div>`;
        }
    }
};


const setupClickHandlers = (divId) => {
    const container = document.getElementById(divId);
    if (!container) return;

    // Add click handlers to recent agent items
    const agentElements = container.querySelectorAll('.recent-agent[data-agent-index]');
    agentElements.forEach(agentEl => {
        agentEl.addEventListener('click', (e) => {
            e.preventDefault();
            const agentIndex = parseInt(agentEl.getAttribute('data-agent-index'));
            const agent = currentRecentAgents[agentIndex];
            
            if (agent) {
                try {                    
                    InvokeAgent(agent);                    
                    container.style.display = 'none';
                } catch (error) {
                    console.error('Error invoking agent:', error);
                }
            }
        });

        // Add hover effects
        agentEl.addEventListener('mouseenter', () => {
            agentEl.style.backgroundColor = '#f8f9fa';
            agentEl.style.transform = 'translateY(-1px)';
            agentEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        agentEl.addEventListener('mouseleave', () => {
            agentEl.style.backgroundColor = '';
            agentEl.style.transform = '';
            agentEl.style.boxShadow = '';
        });
    });
};

const renderRecentAgents = (divId) => {    
    const targetElement = document.getElementById(divId);
    if (!targetElement) {
        console.error(`Element with ID "${divId}" not found`);
        return;
    }

    // Show loading state
    isRecentAgentsLoading = true;
    currentRecentAgents = [];
    targetElement.innerHTML = constructRecentAgentsList();
    
    // Fetch and render recent agents
    RecentAgents()
        .then(result => {
            isRecentAgentsLoading = false;            
            currentRecentAgents = result?.data || [];
            targetElement.innerHTML = constructRecentAgentsList(currentRecentAgents);
            
            // Setup click handlers after DOM is updated
            setupClickHandlers(divId);
        })
        .catch(error => {
            console.error('Error fetching recent agents:', error);
            isRecentAgentsLoading = false;
            targetElement.innerHTML = `<div class="recent-agents-error">Error loading recent agents</div>`;
        });
};

const hideRecentAgentsDiv = (divId) => {
    const recentAgentsDiv = document.getElementById(divId);
    if(recentAgentsDiv){
        recentAgentsDiv.style.display = 'none';
    }else{
        console.error(`Element with ID "${divId}" not found`);
    }
}

const unHideRecentAgentsDiv = (divId) => {
    const recentAgentsDiv = document.getElementById(divId);
    if(recentAgentsDiv){
        recentAgentsDiv.style.display = 'flex';
    } else {
        console.error(`Element with ID "${divId}" not found`);
    }
}

return {
    hideRecentAgentsDiv,
    unHideRecentAgentsDiv,
    renderRecentAgents
}
}





export default RecentAgentsFunc;
