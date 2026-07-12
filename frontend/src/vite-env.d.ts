/// <reference types="vite/client" />

// Univer preset 语言包以 .js 形式分发，没有配套 .d.ts
declare module '@univerjs/preset-sheets-core/lib/locales/zh-CN' {
  const locale: Record<string, any>
  export default locale
}

// Element Plus locale 以 .mjs 分发，没有配套 .d.ts
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const locale: import('element-plus').Language
  export default locale
}

