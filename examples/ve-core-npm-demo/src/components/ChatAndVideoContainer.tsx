/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import Chat from "./Chat";
import Video from "./Video";
import { useVeActivityState } from "../hooks/useVeActivityState";
import type { GenesysIntegrationPureSocket } from "@videoengager-widget/js/integrations";

const ChatAndVideoContainer = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>;
}) => {
  return (
    <ChatVideoWrapper videoEngagerInstance={videoEngagerInstance}>
      <Video videoEngagerInstance={videoEngagerInstance} />
      <Chat videoEngagerInstance={videoEngagerInstance} />
    </ChatVideoWrapper>
  );
};

function ChatVideoWrapper({ videoEngagerInstance, children }: { videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>, children: React.ReactNode }) {
  const { isChatActive } = useVeActivityState(videoEngagerInstance);
  return (
    <div className="video-chat-container" style={{
      display: isChatActive ? '' : 'none',
    }}>
      {children}
    </div>

  )
}

export default ChatAndVideoContainer;
