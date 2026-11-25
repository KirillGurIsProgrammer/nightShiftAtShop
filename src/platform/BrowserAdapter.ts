export interface BrowserCapabilities {
  webgl: boolean;
  webgpu: boolean;
  indexedDb: boolean;
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  const canvas = document.createElement('canvas');
  const webgl = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  const webgpu = 'gpu' in navigator;
  const indexedDb = 'indexedDB' in window;
  return { webgl, webgpu, indexedDb };
}
