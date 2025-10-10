import VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import type {
  MessageTypeVideoEngagerUrl,
  NormalizedMessages,
} from "@videoengager-widget/js/core";
import { useEffect, useRef, useState } from "react";
import { useVeActivityState } from "../hooks/useVeActivityState";
import { getConfigsFromParams } from "../utils/get-configs-from-params";
import type { GenesysIntegrationPureSocket } from "@videoengager-widget/js/integrations";

const Chat = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>;
}) => {
  const [inputText, setInputText] = useState("");
  const { isChatActive } = useVeActivityState(videoEngagerInstance);
  const configs = getConfigsFromParams();
  const [nameIndex, setNameIndex] = useState(0);
  const names = ["John Smith", "Gracelyn Li", "Johan Holt", "Freyja Flynn"];

  const handleSendMessage = () => {
    if (inputText.trim()) {
      videoEngagerInstance?.sendMessageToAgent(inputText.trim());
      setInputText("");
    }
  };
  if (!videoEngagerInstance) {
    return null;
  }
  return (
    <>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="chat-avatar">AI</div>
            <div className="chat-header-info">
              <div className="chat-header-title">Assistant</div>
              <div className="chat-header-status">Online</div>
            </div>
          </div>
          <div>
            <button
                onClick={async (e) => {
                  e.preventDefault();
                  const target = e.currentTarget || e.target;
                  target.disabled = true;
                  const newName = names[nameIndex];
                  alert(`Your new name is ${newName}`);
                  await videoEngagerInstance.updateCustomAttributes({ "context.firstName": newName });
                  const nextIndex = (nameIndex + 1) % names.length;
                  setNameIndex(nextIndex);
                  target.disabled = false;
                }}
              >
                Update Context
              </button>
            {configs.loadedConfig.interactive && (
              <button
                onClick={async (e) => {
                  const target = e.currentTarget || e.target;
                  target.disabled = true;
                  try {
                    await videoEngagerInstance?.endVideoChatSession();
                  } catch {
                    alert("Failed to end the session. Please try again.");
                  }
                  target.disabled = false;
                }}
              >
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        {isChatActive && (
          <MessagesContainer videoEngagerInstance={videoEngagerInstance} />
        )}

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
function MessagesContainer({
  videoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>;
}) {
  const [messages, setMessages] = useState<NormalizedMessages[]>(
    videoEngagerInstance?.contactCenterIntegrationInstance?.messages || []
  );
  const messageContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!videoEngagerInstance) return;
    const handler = () => {
      setMessages([
        ...(videoEngagerInstance.contactCenterIntegrationInstance?.messages ||
          []),
      ]);
      setTimeout(() => {
        messageContainerRef.current?.scrollTo({
          top: messageContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
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
  return (
    <div className="messages-container" ref={messageContainerRef}>
      {messages
        .filter((x) => x.content.type !== "NotificationPresence")
        .map((message) => (
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
              <RenderSingleMessage
                videoEngagerInstance={videoEngagerInstance}
                message={message}
              />
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
function RenderSingleMessage({
  message,
  videoEngagerInstance,
}: {
  message: NormalizedMessages;
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>;
}) {
  switch (message.content.type) {
    case "Text":
      return <div className="message-text">{message.content.text}</div>;
    case "videoEngagerUrl":
      return (
        <div className="message-text">
          Agent requests you to join a video chat session.{" "}
          <button
            style={{ marginTop: "10px", marginLeft: 0 }}
            onClick={async (e) => {
              const target = e.currentTarget || e.target;
              target.disabled = true;
              await videoEngagerInstance
                ?.startVideoChatSession(
                  {
                    autoAccept: true,
                    shortUrl: (message.content as MessageTypeVideoEngagerUrl)
                      .url,
                  },
                  undefined,
                  undefined,
                  false
                )
                .catch(() => {
                  alert("Failed to join the video chat session.");
                });
              target.disabled = false;
            }}
          >
            Join Video Chat
          </button>
        </div>
      );
    default:
      return <div className="message-text">Unsupported message type</div>;
  }
}

export default Chat;
