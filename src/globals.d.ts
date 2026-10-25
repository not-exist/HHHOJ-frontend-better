declare module '*.css' {
  const css: string
  export default css
}

declare const __VERSION__: string

type GmGetter = (key: string, defaultValue?: unknown) => unknown
type GmSetter = (key: string, value: unknown) => void
type GmValueChangeListener = (key: string, oldValue: unknown, newValue: unknown, remote: boolean) => void

declare const unsafeWindow: Window | undefined
declare const GM_getValue: GmGetter | undefined
declare const GM_setValue: GmSetter | undefined
declare const GM_deleteValue: ((key: string) => void) | undefined
declare const GM_addValueChangeListener: ((key: string, cb: GmValueChangeListener) => number) | undefined
declare const GM_removeValueChangeListener: ((id: number) => void) | undefined
declare const GM_registerMenuCommand: ((name: string, fn: () => void) => void) | undefined
declare const GM_setClipboard: ((data: string) => void) | undefined
