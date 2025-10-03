/* eslint-disable @typescript-eslint/no-explicit-any */
import type VideoEngagerWidgetCore from "@videoengager-widget/js/core";
import VideoControls from "./VideoControls";
import { useEffect, useRef, useState } from "react";
import { getConfigsFromParams } from "../utils/get-configs-from-params";

const Video = ({
  videoEngagerInstance,
}: {
  videoEngagerInstance?: VideoEngagerWidgetCore<any>;
}) => {
  return (
    <div id="videoContainer" style={{ width: "100%" }}>
      <div
        id="ve-container"
        style={{ width: "100%", height: "calc(100% - 125px)" }}
      >
        <VeIframeLoader videoEngagerInstance={videoEngagerInstance} />
      </div>
      
      <VideoControls videoEngagerInstance={videoEngagerInstance} />
    </div>
  );
};

function VeIframeLoader({ videoEngagerInstance }: { videoEngagerInstance?: VideoEngagerWidgetCore<any> }) {
    const { iframeSrc, ref } = useVeIframeInstance(videoEngagerInstance);

    return (
        iframeSrc ? (
            <iframe
                ref={ref}
                src={iframeSrc}
                className="w-full h-full rounded-2xl border-0"
                style={{
                   width: '100%',
                    height: '100%',
                    border: 'none',
                    // borderRadius: '1rem',
                }}
                allow="camera; microphone; autoplay; fullscreen; display-capture"
                title="VideoEngager Video Chat"
            />
        ) : (
            <div className="relative w-full h-full bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1c1c1c 0%, #2c2c2c 100%)',
              width: '100%',
              height: '100%',
              // borderRadius: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif',
              fontSize: '1.25rem',
              color: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            >
                <div className="text-gray-400 text-lg">No Active call, Please click on Call button to start a video call</div>
            </div>
        )
    )
}







function useVeIframeInstance(videoEngagerInstance?: VideoEngagerWidgetCore<any>) {
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const ref = useRef<HTMLIFrameElement>(null);
    // Set up the UI callbacks
    useEffect(() => {
        videoEngagerInstance?.setUiCallbacks({
            createIframe: (src) => {
                console.log(`Creating iframe with src: ${src}`);
                const configs = getConfigsFromParams();
                
                const url = new URL(src, `https://${configs.loadedConfig.videoEngager.veEnv}`);
                setIframeSrc(url.toString());
                return new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (ref.current) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 50);
                });
            },
            getIframeInstance: () => ref.current,
            destroyIframe: () => {
                console.log("Destroying iframe");
                setIframeSrc(null);
            },
            setIframeVisibility: (visible) => {
                console.log(`Setting iframe visibility: ${visible}`);
                if (ref.current) {
                    ref.current.style.display = visible ? "block" : "none";
                }
            }
        });
    }, [videoEngagerInstance]);
    return { iframeSrc, ref };
}
export default Video;
