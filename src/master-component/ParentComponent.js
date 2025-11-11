import { isEmpty } from "lodash";
import { ChatInterface } from "../chat";
import RenderComposeBar from "../composebar/RenderComposeBar";
import RecentAgentsFunc from "../LandingPageRecentAgents/RecentAgents";
import { TemplateRenderer } from "../templateRenderer";
const {renderRecentAgents} = RecentAgentsFunc();

let questions = {}
let quickActions = []
let errorStates = []
let searchResponse = null
let moreAvailable = false
let currentDivId = null  // Store the div ID for re-rendering

const unsubscribe = ChatInterface().subscribe((questionsData, searchResponse, moreAvailable, errorStates, quickActions) => {
    questions = questionsData
    console.log(questions, searchResponse, moreAvailable, errorStates, quickActions)
        
    // Only re-render the questions container, not the entire component
    renderQuestionsOnly()
})


const scrollToBottom = () => {
    const questionsContainer = document.getElementById('questions-container')
    if (questionsContainer) {
        setTimeout(() => {
            questionsContainer.scrollTop = questionsContainer.scrollHeight
        }, 100) 
    }
}

const renderQuestionsOnly = () => {
    const questionsContainer = document.getElementById('questions-container')
    if (questionsContainer) {
        // Generate questions HTML like ChatInterface does
        let questionsHTML = '';
        const hasQuestions = questions && !isEmpty(questions);
        
        if (hasQuestions) {
            questionsHTML = Object.values(questions).map((item, index) => {
                if (item?.isTask) return '';
                
                const assistantIconTemplate = () => {
                    return `<div class="logo-icon"><img src="/images/eva-black-svg.svg" alt="AiForWork" /></div>`;
                };

                let html = TemplateRenderer.generateHTMLTemplate(item, {
                    // assistantIconTemplate,
                    loadingText: "Analyzing",
                });

                return html.outerHTML;
            }).join('');
        }
        
        // Add or remove class based on questions existence
        const landingPageContainer = document.querySelector('.landing-page-container');
        if (hasQuestions) {
            /*append  results-page-container to the class of landing-page-container*/
            landingPageContainer.classList.add('results-page-container');
        } else {
            landingPageContainer.classList.remove('results-page-container');
        }
        
        questionsContainer.innerHTML = questionsHTML
        
        // Auto-scroll to bottom 
        scrollToBottom()
    }
}

const constructParentComponent = () => {
    return `
    <div id='parent-home-container' class='parent-home-container'>        
        <div class="landing-page-container">
            <div class="landing-page-content">
                <div class="landing-page-content-container">
                    <div id='questions-container' class='questions-container'>
                        <!-- Questions will be rendered here -->
                    </div>                    
                    <div id='compose-bar-container' class='compose-bar-container'>
                        <div class="ComposeBarContainer">
                            <div class="eva-composebar-parent">
                                <div class="eva-quick-reply-container"></div>
                                <div class="eva-composebar-area">
                                    <div class="eva-input-container skeleton-compose-bar">
                                        <div class="eva-attachments-container"></div>
                                        <div class="eva-compose-textarea-container">
                                            <sl-skeleton effect="pulse"></sl-skeleton>
                                        </div>
                                        <div class="eva-compose-textarea-actions">
                                            <div class="left-actions">
                                                <div class="common-agents-container">
                                                    <sl-skeleton effect="pulse"></sl-skeleton>
                                                    <sl-skeleton effect="pulse"></sl-skeleton>
                                                    <sl-skeleton effect="pulse"></sl-skeleton>
                                                </div>
                                            </div>
                                            <div class="right-actions">
                                                <sl-skeleton effect="pulse"></sl-skeleton>
                                                <sl-skeleton effect="pulse"></sl-skeleton>
                                                <sl-skeleton effect="pulse"></sl-skeleton>
                                            </div>
                                        </div>                                        
                                    </div>
                                </div>
                            </div>
                        </div>                        
                    </div>
                    <div id='recent-agents-container' class='recent-agents-parent-container'>
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
                    </div>
                </div>
            </div>
        </div>    
    </div>    
    `
}

export const renderParentComponent = (divId) => {
    const parentComponentDiv = document.getElementById(divId)
    if(!parentComponentDiv){
        console.error(`Element with ID "${divId}" not found`)
        return
    }
    // Store the div ID for re-rendering
    currentDivId = divId    
    parentComponentDiv.innerHTML = constructParentComponent()    
    
    // Initialize ComposeBar and RecentAgents
    RenderComposeBar(document.getElementById('compose-bar-container'))
    setTimeout(() => {
        renderRecentAgents('recent-agents-container')
        // Also render any existing questions after initialization
        renderQuestionsOnly()
    }, 1000)
}
