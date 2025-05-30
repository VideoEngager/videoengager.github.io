// your-file.d.ts
import { KioskApplication } from '../js/kiosk';

declare global {
  interface Window {
    ENV_CONFIG: any;
    __VideoEngagerConfigs?: ClientConfig;
    __VideoEngagerQueue?: Array<any>;
    VideoEngager: any;
    kioskApp: KioskApplication;
  }
}

interface VideoEngagerConfig {
  tenantId: string;
  veEnv: string;
  deploymentId: string;
  isPopup?: boolean; // default: false
  veHttps?: boolean; // default: true
}

interface GenesysConfig {
  deploymentId: string;
  domain: string;
  hideGenesysLauncher?: boolean; // default: false
}

interface MonitoringConfig {
  enabled?: boolean; // default: true
  level?: "debug" | "info" | "warn" | "error"; // default: 'info'
}

interface ClientConfig {
  videoEngager: VideoEngagerConfig;
  genesys: GenesysConfig;
  useGenesysMessengerChat?: boolean; // default: false
  monitoring?: MonitoringConfig;
}

export {};
