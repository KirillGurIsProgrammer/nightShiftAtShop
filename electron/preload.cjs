const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nightShift", {
  platform: process.platform
});
