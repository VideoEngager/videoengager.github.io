import { useState } from "react";
import type { ConfigurationInterface } from "./utils/ConfigManager";
import ContextMenu from "./components/ContextMenu";
import CommandButtons from "./components/CommandButtons";

const Index = () => {
  const [contextAttributes, setContextAttributes] = useState<
    Record<string, string>
  >({});
  const [configuration, setConfiguration] = useState<
    ConfigurationInterface | undefined
  >(undefined);
  
  return (
    <div className="command-center">
      <h2>Command Center</h2>
      <CommandButtons
        configuration={configuration}
        setConfiguration={setConfiguration}
        customAttributes={contextAttributes}
      />

      <ContextMenu
        disabled={!!configuration}
        contextAttributes={contextAttributes}
        setContextAttributes={setContextAttributes}
      />
    </div>
  );
};

export default Index;
