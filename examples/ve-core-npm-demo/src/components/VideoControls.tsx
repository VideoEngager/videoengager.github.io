/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCameraRotate,
  faDesktop,
  faMicrophone,
  faMicrophoneSlash,
  faPhoneSlash,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";

interface VideoControlsStateInterface {
  isVideoOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
}

const VideoControls = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance: VideoEngagerWidgetCore<any>;
}) => {
  const [videoControls, setVideoControls] =
    useState<VideoControlsStateInterface>({
      isVideoOn: false,
      isMicOn: false,
      isScreenSharing: false,
    });

  const videoControlHandlers = {
    onToggleCamera: async () => {
      await videoEngagerInstance.executeVideoCallFn("triggerShowHideVideo");
    },
    onToggleMute: async () => {
      await videoEngagerInstance.executeVideoCallFn("triggerMuteUnmute");
    },
    onSwitchCamera: async () => {
      await videoEngagerInstance.executeVideoCallFn("triggerCameraSwitch");
    },
    onToggleScreen: async () => {
      await videoEngagerInstance.executeVideoCallFn("triggerScreenShare");
    },
    onEndCall: async () => {
      if (videoEngagerInstance.isCallOngoing) {
        await videoEngagerInstance.endVideoChatSession();
      }
    },
  };

  videoEngagerInstance.on("videoEngager:iframe-connected", (state) => {
    setVideoControls(state as VideoControlsStateInterface);
  });

  videoEngagerInstance.on(
    "videoEngager:iframe-video-state-changed",
    (state) => {
      setVideoControls(state as VideoControlsStateInterface);
    }
  );

  return (
    <div className="video-controls">
      <button
        className={`video-control-btn ${
          videoControls.isVideoOn ? "active" : ""
        }`}
        title="Toggle Camera"
        onClick={videoControlHandlers?.onToggleCamera}
      >
        <FontAwesomeIcon
          icon={videoControls.isVideoOn ? faVideo : faVideoSlash}
        />
      </button>
      <button
        className={`video-control-btn ${videoControls.isMicOn ? "active" : ""}`}
        title="Toggle Microphone"
        onClick={videoControlHandlers?.onToggleMute}
      >
        <FontAwesomeIcon
          icon={videoControls.isMicOn ? faMicrophone : faMicrophoneSlash}
        />
      </button>
      <button
        className="video-control-btn"
        id="switchCamera"
        title="Switch Camera"
        onClick={videoControlHandlers?.onSwitchCamera}
      >
        <FontAwesomeIcon icon={faCameraRotate} />
      </button>
      <button
        className={`video-control-btn ${
          videoControls.isScreenSharing ? "active" : ""
        }`}
        title="Share Screen"
        onClick={videoControlHandlers?.onToggleScreen}
      >
        <FontAwesomeIcon icon={faDesktop} />
      </button>
      <button
        className="video-control-btn end-call"
        id="endCall"
        title="End Call"
        onClick={videoControlHandlers?.onEndCall}
      >
        <FontAwesomeIcon icon={faPhoneSlash} />
      </button>
    </div>
  );
};

export default VideoControls;
