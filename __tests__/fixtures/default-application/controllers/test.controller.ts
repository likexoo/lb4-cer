import { get, requestBody } from "@loopback/rest";
import { cauth, SingleExpectReport } from "../../../../index";

export class ExpectFunctionController {
    constructor() { }

    @cauth({
        situations: {
            s: {}
        }
    })
    @get('/test1')
    async test1(): Promise<string> {
        return 'ok';
    }

    @get('/test2')
    async test2(): Promise<string> {
        return 'ok';
    }

    @cauth({
        situations: {
            situation0: {
                credentials: {
                    'MANAGER': {
                        UPDATE_STAFF: true,
                        LEVEL: (val: number) => val >= 2
                    }
                }
            },
            situation1: {
                credentials: {
                    'ADMIN': {
                        UPDATE_EVERYTHING: true
                    }
                }
            }
        }
    })
    @get('/test3')
    async test3(): Promise<string> {
        return 'ok';
    }

    @cauth({
        situations: {
            situation0: {
                credentials: {
                    'MANAGER': {
                        UPDATE_STAFF: true,
                        LEVEL: (val: number) => val >= 2
                    },
                },
                checker: (report: SingleExpectReport, sequenceData?: any): boolean => sequenceData.sequenceDataLevel >= 20
            },
            situation1: {
                credentials: {
                    'ADMIN': {
                        UPDATE_EVERYTHING: true
                    }
                }
            }
        }
    })
    @get('/test4')
    async test4(
        @requestBody() data: { p1: any }
    ): Promise<string> {
        return 'ok';
    }

    @cauth({
        situations: {
            situation0: {
                credentials: {
                    'MANAGER': {}
                }
            },
            situation1: {
                credentials: {
                    'ADMIN': {
                        UPDATE_EVERYTHING: true
                    }
                }
            }
        }
    })
    @get('/test5')
    async test5(): Promise<string> {
        return 'ok';
    }

}