import React, { useEffect, useRef, useState } from 'react'
import ChatInterface from '../chat/ChatInterface'
import NewChat from '../chat/NewChat'
import AgentWelcomeTemplate from './WelcomeTemplate'
import History from './history'
import DemoComp from './selectedContextDemoComp'
import AskFollowup from '../Attachments/askFollowup'
import MultiResponseTestComp from './MultiResponseTestComp'
import BotConversation from '../chat/botAgent/getBotConversation'
import CustomTemplateComponentManager from "../chat/botAgent/customTemplatesFolder/CustomTemplateComponentManager"
import HoldConversationTemplateManager from '../chat/botAgent/customTemplatesFolder/HoldConversationTemplateManager'
import Notifications from './Notifications'
import { FileUpload } from '../Attachments'
import { cloneDeep } from 'lodash'
import BotAgentTestComponent from './BotAgentTestComponent'
// import { submitUserFeedback } from '../Feedback'



const ChatTestComp = (props) => {
    const [questions, setQuestions] = useState(null)
    const [input, setInput] = useState('')
    const [selectedItem, setSelectedItem] = useState(null)
    const [showDislikeMenu, setShowDislikeMenu] = useState(null)
    const [errorStates, setErrorStates] = useState([])
    const chatInterface = useRef()
    const followupInstance = useRef()
    useEffect(() => {
        // Create an instance of ChatInterface
        followupInstance.current = FileUpload()
        chatInterface.current = ChatInterface();        
        chatInterface.current.options({contentStreaming: true})
        // Show the input bar in a specific DOM element
        // chatInterface.current.showComposeBar('composeBar');

        // Subscribe to updates
        const unsubscribe = chatInterface.current.subscribe((question, searchResponse, moreAvailable, errorStates) => {
            // Handle the API response data
            console.log('Received data from chat API:', question, searchResponse, moreAvailable, errorStates);
            setQuestions(question)
            setErrorStates(errorStates)
        });

        chatInterface.current.enableCustomTemplate({gpt_form_template: true})

        // Installing custom templates for BOT Agent
        let botInstance = BotConversation()
        botInstance.initializeBotSDK({
            "name": "ProcureBot",
            "streamId": "st-b6012ef2-810d-5240-b33e-5404d68b680e",
            "webhook": {
                "clientId": "cs-79a89a6f-b0ab-5e2f-b912-8dd1e2f95da0",
                "clientSecret": "VJNwkfbPcMZl4bOa1Qn3XtYRz6rqigwtTgOlaYX25Xs="
            }
        })
        botInstance.enableEVABotSdk(true)
        botInstance.installOwnTemplate(CustomTemplateComponentManager())
        botInstance.installOwnTemplate(HoldConversationTemplateManager())

        // chatInterface.current.storeCustomData({"test" : "yes"})

        // Cleanup on component unmount
        return () => {
            // Unsubscribe from store updates
            unsubscribe();
        };
    }, []);

    const onChange = async (event) => {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault()
            await chatInterface.current.sendMessageAction(input)
            console.log('working.....')
            setInput('')
        }
    }

    const handleClick = (label) => {
        setSelectedItem(label)
    }

    return (
        <div id="chatTestComp">
            <div>
                <div>
                    {questions && Object.values(questions).map(item => {
                        if (item?.templateType === 'agent_welcome_template') {
                            return <AgentWelcomeTemplate item={item} />
                        }
                        if (item?.templateType === 'gpt_form_template') {
                            return (
                                item.status === 'terminated' ? (
                                    <div>{item?.answer}</div>
                                ) : (
                                    <MultiResponseTestComp item={item} />
                                    // <div dangerouslySetInnerHTML={{ __html: item.template_html }}></div>
                                )
                            );
                        }
                        if (item?.templateType === 'search_answer' && item?.viewType !== "threadView") {
                            return (
                                <>
                                    <div>{item?.answer}</div>
                                    <div dangerouslySetInnerHTML={{ __html: item.answerFrom_html }}></div>
                                    {item?.answerFrom_html && <div onClick={() => AskFollowup(item)}>Ask followup</div>}
                                    {!item?.disableFeedback && <div>
                                        <button onClick={() => submitUserFeedback({type:"like", cId:item?.cId, payload:null})}>Like</button>
                                        <div>
                                            <label htmlFor="rating">Rating:</label>
                                            <input
                                                id="rating"
                                                type="number"
                                                min="1"
                                                max="5"
                                                placeholder="Enter rating (1-5)"
                                            />
                                        </div>
                                        
                                        <button onClick={() => 
                                            setShowDislikeMenu(true)
                                            }>Dislike</button>
                                        <input id={`comment-${item?.messageId}`}></input>
                                        {showDislikeMenu &&
                                        <div className='feedBackDislikeGroup'>
                                            <ul className="radio-group">
                                            {[
                                                { id: 1, name: "cat1" },
                                                { id: 2, name: "cat2" },
                                                { id: 3, name: "cat3" },
                                            ].map(item => {
                                                return(
                                                    <li key={item?.id}>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="categories"
                                                                value={item.name}
                                                                checked={selectedItem === item.name}
                                                                onChange={() => handleClick(item.name)}
                                                            />
                                                            {item.name}
                                                        </label>
                                                    </li>
                                                )
                                            })}
                                        </ul>                                                
                                        </div>                                                                                    
                                        }
                                        <div>
                                            <button
                                                onClick={() => {
                                                    submitUserFeedback({type:"dislike", cId:item?.cId,payload: null}),
                                                        setShowDislikeMenu(false)
                                                }}>
                                                Submit
                                            </button>
                                        </div>

                                    </div>}
                                </>
                            )
                        }
                        if(item?.templateType === "multi_responses"){
                            return (
                                <>
                                {item?.responses?.map((response, index) => {
                                    return (
                                        <>
                                            <div>{`Response ${index + 1}`}</div>
                                            <div>{response?.answer}</div>
                                        </>
                                    )
                                })}
                                </>
                            )
                        }
                        if (item?.viewType === "threadView"){
                            return(
                                <div className="bot-agent-container">
                                    <BotAgentTestComponent question={item} />
                                    {item?.status === "completed" && (<>
                                        <button onClick={() => {
                                            followupInstance.current.askFollowup(item)
                                        }}>set context</button>
                                        <button onClick={() => {
                                            followupInstance.current.clearContext({})
                                        }}>clear context</button>
                                    </>)
                                    
                                    }
                                </div>
                                
                            )
                        }
                        return null;
                    })}
                </div>
                <div>
                    <textarea
                        id="composeBar"
                        onKeyDown={onChange}
                        onInput={(event) => setInput(event.target.value)}
                        value={input}
                        placeholder='Ask question...'
                    />
                </div>
                <button onClick={() => chatInterface.current.sendMessageAction(input)}>Send</button>
                <button onClick={() => NewChat()}>+New</button>
                <button onClick={() => chatInterface.current.cancelMessageReqAction()}>Stop</button>
            </div>
            <div>
                <History />
                {/* <DemoComp/> */}
                <Notifications />
            </div>
            <div>
                    {errorStates.length > 0 && errorStates?.map(item => {
                        return (
                            <div>{`${item?.failedCall} Call Failed with Error ${item?.error?.code} and Message ${item?.error?.msg}`}</div>
                        )
                    })}
            </div>
        </div>
    )
}

export default ChatTestComp