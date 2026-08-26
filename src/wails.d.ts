declare global {
  interface Window {
    go?: {
      main: {
        App: {
          LoadConfig: () => Promise<string>;
        };
      };
    };
  }
}

export {};
