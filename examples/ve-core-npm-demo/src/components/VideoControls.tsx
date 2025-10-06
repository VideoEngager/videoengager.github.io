/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCameraRotate,
  faDesktop,
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faPhoneSlash,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { getConfigsFromParams } from "../utils/get-configs-from-params";
import { useVeActivityState } from "../hooks/useVeActivityState";

interface VideoControlsStateInterface extends Record<string, any> {
  isVideoOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  availableCameras?: Record<string, string>[];
  currentCameraIndex?: number;
}

const VideoControls = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<any>;
}) => {
  const configs = getConfigsFromParams();

  const [videoControls, setVideoControls] =
    useState<VideoControlsStateInterface>({
      isVideoOn: false,
      isMicOn: false,
      isScreenSharing: false,
    });
  const { isCallActive } = useVeActivityState(videoEngagerInstance);
  const videoControlHandlers = {
    onToggleCamera: async () => {
      await videoEngagerInstance?.executeVideoCallFn("triggerShowHideVideo");
    },
    onToggleMute: async () => {
      await videoEngagerInstance?.executeVideoCallFn("triggerMuteUnmute");
    },
    onSwitchCamera: async () => {
      await videoEngagerInstance?.executeVideoCallFn("triggerCameraSwitch");
    },
    onToggleScreen: async () => {
      await videoEngagerInstance?.executeVideoCallFn("triggerScreenShare");
    },
    onEndCall: async () => {
      if (videoEngagerInstance?.isCallOngoing) {
        await (configs.loadedConfig.interactive
          ? videoEngagerInstance.executeVideoCallFn("triggerHangup")
          : videoEngagerInstance.endVideoChatSession());
      } else if (!configs.loadedConfig.interactive) {
        await videoEngagerInstance?.contactCenterIntegrationInstance?.endConversation();
      }
    },
  };
  const switchCameraAvailable = useMemo(() => {
    return (
      videoControls.availableCameras?.length &&
      videoControls.availableCameras.length > 1 &&
      videoControls.isVideoOn
    );
  }, [videoControls]);
  useEffect(() => {
    if (!videoEngagerInstance) return;
    const stVideoControl = (state: Record<string, any>) => {
      setVideoControls((prev) => ({ ...prev, ...state }));
    };
    videoEngagerInstance.on("videoEngager:iframe-connected", stVideoControl);

    videoEngagerInstance.on(
      "videoEngager:iframe-video-state-changed",
      stVideoControl
    );
    return () => {
      videoEngagerInstance.off("videoEngager:iframe-connected", stVideoControl);
      videoEngagerInstance.off(
        "videoEngager:iframe-video-state-changed",
        stVideoControl
      );
    };
  }, [videoEngagerInstance]);
  if (!videoEngagerInstance) {
    return null;
  }

  return (
    <div className="video-controls">
      {!isCallActive && (
        <button
          onClick={async (e) => {
            const target = e.currentTarget || e.target;
            target.disabled = true;
            try {
              const configs = getConfigsFromParams();
              await videoEngagerInstance?.startVideoChatSession(
                {
                  autoAccept: true,
                },
                configs.customAttributes
              );
            } catch (err) {
              alert(
                (err as Error)?.message ||
                  "Failed to start the video chat session."
              );
            }
            target.disabled = false;
          }}
          className="video-control-btn info"
          id="startVideoX"
        >
          <FontAwesomeIcon icon={faPhone} />
        </button>
      )}
      {isCallActive && (
        <>
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
            className={`video-control-btn ${
              videoControls.isMicOn ? "active" : ""
            }`}
            title="Toggle Microphone"
            onClick={videoControlHandlers?.onToggleMute}
          >
            <FontAwesomeIcon
              icon={videoControls.isMicOn ? faMicrophone : faMicrophoneSlash}
            />
          </button>
          {switchCameraAvailable && (
            <button
              className="video-control-btn"
              id="switchCamera"
              title="Switch Camera"
              onClick={videoControlHandlers?.onSwitchCamera}
            >
              <FontAwesomeIcon icon={faCameraRotate} />
            </button>
          )}
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
        </>
      )}
    </div>
  );
};

export default VideoControls;
