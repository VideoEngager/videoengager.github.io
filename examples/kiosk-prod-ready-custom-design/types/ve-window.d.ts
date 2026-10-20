// your-file.d.ts
import { KioskApplication } from '../js/kiosk';

declare global {
  interface Window {
    ENV_CONFIG: any;
    VideoEngager: any;
    Genesys: (...args: any[]) => void;
    kioskApp: KioskApplication;
  }
}

interface VideoEngagerConfig {
  tenantId: string;
  veEnv: string;
  deploymentId?: string;
  isPopup?: boolean; // default: false
  veHttps?: boolean; // default: true
  debug?: boolean; // default: false
}

interface GenesysConfig {
  deploymentId: string;
  domain: string;
  hideGenesysLauncher?: boolean; // default: false
  debug?: boolean; // default: false
}

interface AuthConfig {
  enabled: boolean;
  mode?: 'perInteraction' | 'shared'; // default: 'perInteraction'
  authorizationEndpoint?: string; // required when enabled
  clientId?: string; // public OIDC client ID; required when enabled
  scopes?: string[]; // must include 'openid'
}

// interface MonitoringConfig {
//   enabled?: boolean; // default: true
//   level?: "debug" | "info" | "warn" | "error"; // default: 'info'
// }

interface TimeoutsConfig {
  call?: number;
  inactivity?: number;
  retry?: number;
}

interface ClientConfig {
  videoEngager: VideoEngagerConfig;
  genesys: GenesysConfig;
  auth?: AuthConfig;
  useGenesysMessengerChat?: boolean; // default: false
  logger?: boolean; // default: false
  debug?: boolean; // default: false
  timeouts?: TimeoutsConfig;
}

export { ClientConfig, VideoEngagerConfig, GenesysConfig, AuthConfig };
