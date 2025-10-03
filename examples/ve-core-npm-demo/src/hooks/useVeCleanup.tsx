import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { useEffect } from "react";


export function useVeCleanup(videoEngagerInstance?: VideoEngagerWidgetCore<string>) {

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
}