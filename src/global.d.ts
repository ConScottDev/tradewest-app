export {};

declare global {
  interface Window {
    electronAPI?: {
      saveAndOpenPDF: (buffer: Buffer, filename: string) => Promise<void>;
    };
  }
}
