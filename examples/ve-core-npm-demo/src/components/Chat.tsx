/* eslint-disable @typescript-eslint/no-explicit-any */
import VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import type { NormalizedMessages } from "@videoengager-widget/js/core";
import { useEffect, useState } from "react";

const Chat = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance: VideoEngagerWidgetCore<any>;
}) => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<NormalizedMessages[]>(
    videoEngagerInstance.contactCenterIntegrationInstance?.messages || []
  );

  useEffect(() => {
    const handler = () => {
      setMessages([
        ...(videoEngagerInstance.contactCenterIntegrationInstance?.messages ||
          []),
      ]);
    };
    videoEngagerInstance.on("integration:message", handler);
    return () => {
      videoEngagerInstance.off("integration:message", handler);
    };
  }, [videoEngagerInstance]);

  const formatTime = (dateAsString: string) => {
    const date = new Date(dateAsString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      videoEngagerInstance.sendMessageToAgent(inputText.trim());
      setInputText("");
    }
  };

  return (
    <>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-avatar">AI</div>
          <div className="chat-header-info">
            <div className="chat-header-title">Assistant</div>
            <div className="chat-header-status">Online</div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="messages-container">
          {messages.filter(x => x.content.type !== "NotificationPresence").map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${
                message.direction === "Inbound" ? "bot" : "user"
              }`}
            >
              <div
                className={`message-bubble ${
                  message.direction === "Inbound" ? "bot" : "user"
                }`}
              >
                <RenderSingleMessage message={message} />
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="input-field"
          />
          <button
            type="button"
            disabled={!inputText.trim()}
            onClick={handleSendMessage}
            className="send-button"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
};

function RenderSingleMessage({ message }: { message: NormalizedMessages }) {
  switch (message.content.type) {
    case "Text":
      return <div className="message-text">{message.content.text}</div>;
    default:
      return <div className="message-text">Unsupported message type</div>;
  }
}

export default Chat;
