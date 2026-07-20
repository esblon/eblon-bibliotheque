import { AsyncLocalStorage } from "node:async_hooks"
export const contexteBootstrapAdmin = new AsyncLocalStorage<string>()
