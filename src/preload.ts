// preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: unknown) => ipcRenderer.send(channel, data),
  on: (channel: string, func: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  // 可以根据需要添加更多方法
});
