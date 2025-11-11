import React from "react";
import { NewChat } from "../../chat";

const Composebar = ({
  quickActions,
  chatInterface,
  input,
  setInput,
  messages,
}) => {
  const onChange = async (event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const message = Object.values(messages);
      chatInterface.current.setAgentContext({
        custom: true,
        capabilities: [],
        isFallback: false,
        enablement: "mandatory",
        id: "ag-f57272ec-459e-5ab7-a35c-6f3fe92e8123",
        name: "Investment AI",
        description: "App for (In) Alpha Chat assistant.",
        purpose: "Investment",
        sampleQuery: [],
        type: "aAAgent",
        createdBy: "u-76cf77dd-8d19-591b-869d-e081d30077e1",
        accountId: "ac-a16b8603-4c4d-57b7-a6e2-ddf53fee4efb",
        wsId: "ws-23d3b1ec-5359-58be-bbf4-a404608ea55c",
        lMod: "2025-07-08T10:41:37.000Z",
        ownerId: "u-76cf77dd-8d19-591b-869d-e081d30077e1",
        agentChatExpiry: {
          enable: false,
          duration: 1,
        },
        enabled: true,
        icon: "https://staticqa-kora.kore.ai/kora/icons/lib/32/money_bag.png",
        workspaceInfo: {
          name: "Enterprise workspace",
          logo: {
            type: "emoji",
            val: {
              category: "symbols",
              unicode: "2734",
            },
          },
        },
      });

      chatInterface.current.storeCustomData({
        skipNudges: true,
        webSearchEnabled: false,
        dealId: "686cdb4f3e25cccdea0bb62e",
        dealName: "pack1_july8_2:17 PM_QA",
      });

      await chatInterface.current.sendMessage(
        input,
        message?.[message?.length - 1]
      );
      setInput("");
    }
  };

  return (
    <div className="composebar-parent">
      <div className="composebar-area">
        <div className="guick-reply-container">
          {quickActions?.map((item) => {
            return (
              <div
                className="quick-reply-chip"
                key={item?.id}
                onClick={() => {
                  chatInterface.current.askQuickActions(item);
                }}
              >
                {item?.label}
              </div>
            );
          })}
        </div>
        <textarea
          id="composeBar"
          onKeyDown={onChange}
          onInput={(event) => setInput(event.target.value)}
          value={input}
          placeholder="Ask question..."
        />
      </div>

      <div className="composebar-buttons">
        <sl-button class="primary-button-black" onClick={() =>
            chatInterface.current.sendMessage(
              input,
              messages?.[messages?.length - 1]
            )
          }>Send</sl-button>
        <sl-button class="secondary-button" onClick={() => NewChat()}>
           <sl-icon slot="prefix" name="plus"></sl-icon>
          New
        </sl-button>
        <sl-button class="secondary-button" onClick={() => chatInterface.current.cancelMessageReqAction()}>Stop</sl-button>
      </div>
    </div>
  );
};

export default Composebar;
