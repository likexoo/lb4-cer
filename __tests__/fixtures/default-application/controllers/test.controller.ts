import { get } from "@loopback/rest";
import { cauth } from "../../../../index";

export class ExpectFunctionController {
    constructor() { }

    @cauth({ s: {} })
    @get('/test1')
    async test1(): Promise<string> {
        return 'ok';
    }

    @get('/test2')
    async test2(): Promise<string> {
        return 'ok';
    }

    @cauth({
        situation0: {
            'MANAGER': {
                UPDATE_STAFF: true,
                LEVEL: (val: number) => val >= 2
            }
        },
        situation1: {
            'ADMIN': {
                UPDATE_EVERYTHING: true
            }
        }
    })
    @get('/test3')
    async test3(): Promise<string> {
        return 'ok';
    }

}