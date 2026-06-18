/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite-plugin-svgr/client" />

declare var Heti: any;

// Side-effect CSS import shipped by remark-block-containers (no bundled types).
declare module 'remark-block-containers/css';
