// your-file.d.ts
declare global {
  interface Window {
    ENV_CONFIG: any;
    __VideoEngagerConfigs?: ClientConfig;
    __VideoEngagerQueue?: Array<any>;
    VideoEngager: any;
    Genesys: (type: string, execute: stirng, options?: {}, succsessFn?: () => void, failedFn?: () => void) => void;
    
  }
}

export {};
