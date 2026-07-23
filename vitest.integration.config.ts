import { existsSync } from "node:fs";import { fileURLToPath } from "node:url";import{loadEnvFile}from"node:process";import{defineConfig}from"vitest/config"
if(existsSync(".env"))loadEnvFile(".env")
export default defineConfig({resolve:{alias:{"@":fileURLToPath(new URL(".",import.meta.url))}},test:{include:["tests/business-api.integration.test.ts"],fileParallelism:false,testTimeout:30000,hookTimeout:60000}})
