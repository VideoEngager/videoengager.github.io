import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import { useEffect, useState } from "react";

export function useVeActivityState (videoEngagerInstance?: VideoEngagerWidgetCore<string>) {
    const [isChatActive, setIsChatActive] = useState(videoEngagerInstance?.contactCenterIntegrationInstance?.inActiveConversation || false);
    const [isCallActive, setIsCallActive] = useState(false);
    useEffect(() => {
        if (!videoEngagerInstance) return;
        const onSessionStarted = () => setIsChatActive(true);
        const onSessionEnded = () => setIsChatActive(false);
        const onVeInstanceChanged = (shouldHaveActiveInstance: boolean) => setIsCallActive(shouldHaveActiveInstance);
        videoEngagerInstance.on('integration:sessionStarted', onSessionStarted);
        videoEngagerInstance.on('integration:sessionEnded', onSessionEnded);
        videoEngagerInstance.on('videoEngager:active-ve-instance', onVeInstanceChanged);
        
        return () => {
            videoEngagerInstance.off('integration:sessionStarted', onSessionStarted);
            videoEngagerInstance.off('integration:sessionEnded', onSessionEnded);
            videoEngagerInstance.off('videoEngager:active-ve-instance', onVeInstanceChanged);
        };
    }, [videoEngagerInstance]);
    return {isChatActive, isCallActive};
}