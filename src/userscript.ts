import { bootTakeover } from './takeover'

// 脚本在 @run-at document-start 执行：路由门与逃生舱必须先于任何 DOM 操作。
bootTakeover()
