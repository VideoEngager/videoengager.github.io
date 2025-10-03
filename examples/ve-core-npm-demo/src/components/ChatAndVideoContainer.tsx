/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import Chat from "./Chat";
import Video from "./Video";

const ChatAndVideoContainer = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance: VideoEngagerWidgetCore<any>;
}) => {
  return (
    <div className="video-chat-container">
      <Video  videoEngagerInstance={videoEngagerInstance} />
      <Chat videoEngagerInstance={videoEngagerInstance} />
    </div>
  );
};

export default ChatAndVideoContainer;
