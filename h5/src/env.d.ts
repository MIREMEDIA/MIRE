/// <reference types="vite/client" />
declare module '*.vue' { import type { DefineComponent } from 'vue'; const c: DefineComponent<{}, {}, any>; export default c }
// FE-M1: global display-string translator (src/i18n/fem1.ts)
declare module 'vue' { interface ComponentCustomProperties { $st: (s: any) => string } }
export {}
