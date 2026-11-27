/// <reference types="vite/client" />

interface Window {
  nightShiftPlatform?: Readonly<{ isDesktop: true }>;
}

declare module '*.vue' {
  import type { Component } from 'vue';
  const component: Component;
  export default component;
}
