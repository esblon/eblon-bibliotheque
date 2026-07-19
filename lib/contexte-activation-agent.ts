import { AsyncLocalStorage } from "node:async_hooks"
export const contexteActivationAgent=new AsyncLocalStorage<string>()
