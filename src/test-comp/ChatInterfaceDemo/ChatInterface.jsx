import React, { useEffect, useRef, useState } from "react";
import { TemplateRenderer } from "../../templateRenderer";
import { BotConversation, ChatInterface } from "../../chat";
import Composebar from "./Composebar";

import "./ChatInterface.scss"
import History from "../history";
import Agents from "../agents";
import Notifications from "../Notifications";

// function ShoelaceWrapper({ html }) {
//   const ref = useRef(null);

//   useEffect(() => {
//     if (!ref.current || !html) return;

//     ref.current.innerHTML = '';

//     const fragment = html instanceof Node ? html : document.createRange().createContextualFragment(html);
//     ref.current.appendChild(fragment);

//     // Ensure Shoelace components are defined before any upgrade
//     TemplateRenderer.upgradeCustomElements(ref.current);

//   }, [html]);

//   return <div ref={ref} />;
// }

const ChatInterfaceDemo = () => {
  const [messages, setMessages] = useState(null);
  const [quickActions, setQuickActions] = useState(null);
  const [input, setInput] = useState("");

  const chatInterface = useRef();

  useEffect(() => {
    chatInterface.current = ChatInterface();
    chatInterface.current.options({ contentStreaming: true });
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

    // Subscribe to updates
    const unsubscribe = chatInterface.current.subscribe(
      (question, searchResponse, moreAvailable, errorStates, quickActions) => {
        // Handle the API response data
       
        setMessages(question);
        setQuickActions(quickActions);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="chatInterfaceDemo">
      <div className="historySec">
        <History />
        <Notifications />
        <Agents />
      </div>
      <div className="chatInterfaceSec">
        <div className="chatSec">
          {messages &&
            Object.values(messages).map((item, index) => {
              if (item?.isTask) return;
              const assistantIconTemplate = () => {
                return <div className="logo-icon"><img src="/public/eva-black-svg.svg" alt="AiForWork" /></div>;
              };

              
              let html = TemplateRenderer.generateHTMLTemplate(item, {
                assistantIconTemplate,
                loadingText: "Analyzing",
              });

              return (
                <div
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: html.innerHTML,
                  }}
                />
              );

            })}
        </div>
        <Composebar 
          quickActions={quickActions} 
          chatInterface={chatInterface} 
          input={input} 
          setInput={setInput} 
          messages={messages} 
        />
      </div>
    </div>
  );
};

export default ChatInterfaceDemo;
