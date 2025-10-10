import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import type { GenesysIntegrationPureSocket } from "@videoengager-widget/js/integrations";
import { useEffect } from "react";

export function useVeCleanup(
  videoEngagerInstance?: VideoEngagerWidgetCore<GenesysIntegrationPureSocket>
) {
  useEffect(() => {
    async function cleanup() {
      await videoEngagerInstance?.endVideoChatSession();
    }

    // Handle both events for better coverage
    window.addEventListener("beforeunload", cleanup);
    window.addEventListener("pagehide", cleanup);

    return () => {
      window.removeEventListener("beforeunload", cleanup);
      window.removeEventListener("pagehide", cleanup);
    };
  }, [videoEngagerInstance]);
}
