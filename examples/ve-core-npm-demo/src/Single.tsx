/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSearchParams } from "react-router-dom";
import ChatAndVideoContainer from "./components/ChatAndVideoContainer";
import { useEffect, useState } from "react";
import VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { GenesysIntegrationPureSocket } from "@videoengager-widget/js/integrations";

const Single = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [params] = useSearchParams();
  const [videoEngagerInstance, setVideoEngagerInstance] = useState<
    undefined | VideoEngagerWidgetCore<any>
  >(undefined);
  const [, setGenesysInstance] = useState<
    undefined | GenesysIntegrationPureSocket
  >(undefined);

  async function initialize() {
    try {
      const config = params.get("config");
      if (!config) {
        throw new Error();
      }
      setIsStarted(true);
      const parsedConfig = JSON.parse(atob(config));
      const veWidget = new VideoEngagerWidgetCore({
        ...parsedConfig.loadedConfig.videoEngager,
        enableVeIframeCommands: true,
      });

      const genesysWidget = new GenesysIntegrationPureSocket(
        parsedConfig.loadedConfig.genesys
      );

      await veWidget.setContactCenterIntegration(genesysWidget);
      
      veWidget.on("videoEngager:videoSessionEnd", async () => {
        console.log('[videoSessionEnd]',veWidget.contactCenterIntegrationInstance?.inActiveConversation);
        if (veWidget.contactCenterIntegrationInstance?.inActiveConversation) {
          await veWidget.contactCenterIntegrationInstance?.endConversation()
        }
      });

      veWidget.on("integration:sessionEnded", () => {
        console.log('[conversationEnded]');
        setIsStarted(false);
      })

      veWidget.on("error", (error) => {
        console.error(error);
        setIsStarted(false);
      });

      veWidget.setUiCallbacks({
        createIframe: (src) => {
          const iframe = document.createElement("iframe");
          iframe.src = src;
          iframe.id = "videoengager-iframe";
          iframe.allow =
            "microphone; camera; autoplay; display-capture; fullscreen";
          iframe.style.border = "none";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          const container = document.getElementById("ve-container");
          if (container) {
            container.innerHTML = "";
            container.appendChild(iframe);
            return Promise.resolve();
          }
          return Promise.reject("Container not found");
        },
        getIframeInstance: () => {
          const iframe = document.getElementById("videoengager-iframe");
          return iframe as HTMLIFrameElement;
        },
        destroyIframe: () =>
          document.getElementById("videoengager-iframe")?.remove(),
        setIframeVisibility: (visible) => {
          const iframe = document.getElementById("videoengager-iframe");
          if (iframe) iframe.style.display = visible ? "block" : "none";
        },
      });

      setVideoEngagerInstance(veWidget);
      setGenesysInstance(genesysWidget);
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
      setIsStarted(false);
    }
  }

  useEffect(() => {
    async function cleanup() {
      if (videoEngagerInstance?.isCallOngoing) {
        await videoEngagerInstance?.endVideoChatSession();
      }
    }

    // Handle both events for better coverage
    window.addEventListener("beforeunload", cleanup);
    window.addEventListener("pagehide", cleanup);

    return () => {
      window.removeEventListener("beforeunload", cleanup);
      window.removeEventListener("pagehide", cleanup);
    };
  }, [videoEngagerInstance]);

  if (!isStarted) {
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
        <button onClick={async () => await initialize()}>Start</button>
      </div>
    );
  }

  return (
    <>
      {videoEngagerInstance && (
        <ChatAndVideoContainer videoEngagerInstance={videoEngagerInstance} />
      )}
    </>
  );
};

export default Single;
