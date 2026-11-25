const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('nightShiftPlatform', Object.freeze({
  isDesktop: true,
}));
