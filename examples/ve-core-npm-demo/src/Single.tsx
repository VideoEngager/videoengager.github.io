import { useSearchParams } from "react-router-dom";
import ChatAndVideoContainer from "./components/ChatAndVideoContainer";
import { useState } from "react";
import VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { GenesysIntegrationPureSocket } from "@videoengager-widget/js/integrations";
import { useVeActivityState } from "./hooks/useVeActivityState";
import { useVeCleanup } from "./hooks/useVeCleanup";
import { getConfigsFromParams } from "./utils/get-configs-from-params";

const Single = () => {
  const [videoEngagerInstance, setVideoEngagerInstance] = useState<
    undefined | VideoEngagerWidgetCore<GenesysIntegrationPureSocket>
  >(undefined);
  useVeCleanup(videoEngagerInstance);

  return (
    <>
      <StartButton
        videoEngagerInstance={videoEngagerInstance}
        setVideoEngagerInstance={setVideoEngagerInstance}
      />

      <ChatAndVideoContainer videoEngagerInstance={videoEngagerInstance} />
    </>
  );
};

function StartButton({
  videoEngagerInstance,
  setVideoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>;
  setVideoEngagerInstance: (
    instance: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>
  ) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { isChatActive } = useVeActivityState(videoEngagerInstance);
  const [params] = useSearchParams();
  async function initialize() {
    try {
      if (isLoading) return;
      setIsLoading(true);

      const parsedConfig = getConfigsFromParams(params);
      let veWidget = videoEngagerInstance;
      if (!veWidget) {
        veWidget = new VideoEngagerWidgetCore({
          ...parsedConfig.loadedConfig.videoEngager,
          enableVeIframeCommands: true,
        });

        const genesysWidget = new GenesysIntegrationPureSocket(
          parsedConfig.loadedConfig.genesys
        );

        await veWidget.setContactCenterIntegration(genesysWidget);
        setVideoEngagerInstance(veWidget);

        if (!parsedConfig.loadedConfig.interactive) {
          veWidget?.on("videoEngager:videoSessionEnd", async () => {
            await veWidget?.endVideoChatSession();
          });
        }
      }

      const contextCustomAttributes: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        parsedConfig.customAttributes as Record<string, string>
      )) {
        contextCustomAttributes[`context.${key}`] = value;
      }

      await veWidget.startVideoChatSession(
        {
          autoAccept: true,
        },
        contextCustomAttributes
      );
    } catch (error: unknown) {
      alert((error as Error)?.message);
    }
    setIsLoading(false);
  }
  if (isChatActive) return null;
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <button disabled={isLoading} onClick={async () => await initialize()}>
        {isLoading ? "Starting..." : "Start Video Chat"}
      </button>
    </div>
  );
}

export default Single;
