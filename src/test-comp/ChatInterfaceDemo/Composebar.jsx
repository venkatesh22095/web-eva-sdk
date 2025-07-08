import React from "react";
import { NewChat } from "../../chat";

const Composebar = ({quickActions, chatInterface, input, setInput, messages}) => {

  const onChange = async (event) => {
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			const message = Object.values(messages);
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
        <sl-button onClick={() =>
            chatInterface.current.sendMessage(
              input,
              messages?.[messages?.length - 1]
            )
          }>Send</sl-button>
        <sl-button onClick={() => NewChat()}>
           <sl-icon slot="prefix" name="plus"></sl-icon>
          New
        </sl-button>
        <sl-button onClick={() => chatInterface.current.cancelMessageReqAction()}>Stop</sl-button>
      </div>
    </div>
  );
};

export default Composebar;
