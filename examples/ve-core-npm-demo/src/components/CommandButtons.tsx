import { useState } from "react";
import {
  createConfigManager,
  type ConfigurationInterface,
} from "../utils/ConfigManager";

const PRESETS: Record<string, ConfigurationInterface> = {
  inlineWithChat: {
    videoEngager: {
      tenantId: "0FphTk091nt7G1W7",
      veEnv: "videome.leadsecure.com",
      isPopup: false,
    },
    genesys: {
      deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
      domain: "mypurecloud.com",
    },
    interactive: false,
  },
  popupWithChat: {
    videoEngager: {
      tenantId: "0FphTk091nt7G1W7",
      veEnv: "videome.leadsecure.com",
      isPopup: true,
    },
    genesys: {
      deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
      domain: "mypurecloud.com",
    },
    interactive: true,
  },
  inlineNoChat: {
    videoEngager: {
      tenantId: "0FphTk091nt7G1W7",
      veEnv: "videome.leadsecure.com",
      isPopup: false,
    },
    genesys: {
      deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
      domain: "mypurecloud.com",
    },
    interactive: false,
  },
  popupNoChat: {
    videoEngager: {
      tenantId: "0FphTk091nt7G1W7",
      veEnv: "videome.leadsecure.com",
      isPopup: true,
    },
    genesys: {
      deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
      domain: "mypurecloud.com",
    },
    interactive: false,
  },
  inlineWithChat_usaw: {
    videoEngager: {
      tenantId: "yRunQK8mL7HsJidu",
      veEnv: "videome.leadsecure.com",
      isPopup: false,
    },
    genesys: {
      deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
      domain: "usw2.pure.cloud",
    },
    interactive: true,
  },
  popupWithChat_usaw: {
    videoEngager: {
      tenantId: "yRunQK8mL7HsJidu",
      veEnv: "videome.leadsecure.com",
      isPopup: true,
    },
    genesys: {
      deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
      domain: "usw2.pure.cloud",
    },
    interactive: true,
  },
  inlineNoChat_usaw: {
    videoEngager: {
      tenantId: "yRunQK8mL7HsJidu",
      veEnv: "videome.leadsecure.com",
      isPopup: false,
    },
    genesys: {
      deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
      domain: "usw2.pure.cloud",
    },
    interactive: false,
  },
  popupNoChat_usaw: {
    videoEngager: {
      tenantId: "yRunQK8mL7HsJidu",
      veEnv: "videome.leadsecure.com",
      isPopup: true,
    },
    genesys: {
      deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
      domain: "usw2.pure.cloud",
    },
    interactive: false,
  },
};

const CommandButtons = ({
  configuration,
  customAttributes,
  setConfiguration,
}: {
  configuration: ConfigurationInterface | undefined;
  customAttributes: Record<string, string>;
  setConfiguration: (config: ConfigurationInterface) => void;
}) => {
  const [presetKey, setPresetKey] =
    useState<keyof typeof PRESETS>("inlineWithChat");
  const [videoEngagerUrl, setVideoEngagerUrl] = useState("");
  const handlePresetChange = (key: keyof typeof PRESETS) => {
    setPresetKey(key);
  };
  const [iframeSource, setIframeSource] = useState<string | undefined>(
    undefined
  );

  const handleConfirmConfig = async () => {
    // Create config manager with selected preset
    const manager = createConfigManager(PRESETS[presetKey]);

    // Load configuration with URL overrides and external config
    const loadedConfig = await manager.load();

    // Apply the configuration
    setConfiguration(loadedConfig);

    const config = {
      loadedConfig,
      customAttributes,
    };

    setVideoEngagerUrl(`/#single?config=${btoa(JSON.stringify(config))}`);
  };

  const launchInIframe = () => {
    setIframeSource(videoEngagerUrl);
  };

  const launchInPopup = () => {
    const popup = window.open(
      videoEngagerUrl,
      "_blank",
      `width=${window.screen.width * 0.6},height=${
        window.screen.height * 0.6
      },resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,center=yes,cache=no,title=VideoEngager Video Chat`
    );
    if (!popup) {
      throw new Error("Popup blocked");
    }
  };

  return (
    <div className="button-container">
      <button
        id="confirmConfig"
        disabled={!presetKey || !!configuration}
        onClick={handleConfirmConfig}
      >
        Confirm Config
      </button>
      <button id="reloadDemo" onClick={() => window.location.reload()}>
        Reload Demo
      </button>
      <button
        id="launchInIframe"
        onClick={launchInIframe}
        disabled={!configuration}
      >
        Launch iFrame
      </button>
      <button
        id="launchInPopup"
        onClick={launchInPopup}
        disabled={!configuration}
      >
        Launch Popup
      </button>
      <select
        id="presetSelect"
        value={presetKey}
        onChange={(e) =>
          handlePresetChange(e.target.value as keyof typeof PRESETS)
        }
      >
        {Object.keys(PRESETS).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {iframeSource && (
        <iframe
          src={iframeSource}
          style={{
            width: "100%",
            height: "100vh",
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: "9999",
          }}
        />
      )}
    </div>
  );
};

export default CommandButtons;
