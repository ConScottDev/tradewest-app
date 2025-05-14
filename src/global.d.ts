export {};

declare global {
  interface Window {
    electronAPI?: {
      saveAndOpenPDF: (buffer: Uint8Array, filename: string) => Promise<void>;
    };
  }
}
