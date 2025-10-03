/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import VideoControls from "./VideoControls";

const Video = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance: VideoEngagerWidgetCore<any>;
}) => {
  if (!videoEngagerInstance) return null;
  return (
    <div id="videoContainer" style={{ width: "100%" }}>
      <div
        id="ve-container"
        style={{ width: "100%", height: "calc(100% - 125px)" }}
      >
      </div>
      <VideoControls videoEngagerInstance={videoEngagerInstance} />
    </div>
  );
};

export default Video;
