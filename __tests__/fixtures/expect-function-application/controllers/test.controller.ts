import { get } from "@loopback/rest";
import { cer } from "../../../../index";

export class ExpectFunctionController {
    constructor() { }

    @cer({ s: {} })
    @get('/test1')
    async test1(): Promise<void> { }

    @get('/test2')
    async test2(): Promise<void> { }

    @cer({
        situation0: {
            'BOSS_PERMISSION': {
                UPDATE_STAFF: true
            }
        },
        situation1: {
            'ADMIN_PERMISSION': {
                UPDATE_EVERYTHING: true
            }
        }
    })
    @get('/test3')
    async test3(): Promise<string> {
        return 'ok';
    }

}