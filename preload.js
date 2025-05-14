const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAndOpenPDF: (data, fileName) => {
    ipcRenderer.send('save-and-open-pdf', data, fileName);
  },
});
