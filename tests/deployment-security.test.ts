import { describe,expect,it } from "vitest"
import { assertDevSeedAllowed } from "@/lib/dev-seed"
describe("garde-fou du seed",()=>{
 it("refuse sans activation explicite",()=>expect(()=>assertDevSeedAllowed({NODE_ENV:"development"})).toThrow())
 it("refuse toujours en production",()=>expect(()=>assertDevSeedAllowed({NODE_ENV:"production",ALLOW_DEV_SEED:"true"})).toThrow())
 it("autorise uniquement le développement explicite",()=>expect(()=>assertDevSeedAllowed({NODE_ENV:"development",ALLOW_DEV_SEED:"true"})).not.toThrow())
})
