import { get, api } from "@loopback/rest";
import { anOpenApiSpec } from '@loopback/openapi-spec-builder';

const apispec = anOpenApiSpec()
    .withOperation('get', '/test', {
        'x-operation-name': 'test',
        responses: {
            '200': {
                description: '',
                schema: {}
            },
        }
    })
    .build();

@api({
    
})
export class CTController {

    constructor() { }

    @get('/test')
    async test(): Promise<void> {
        return;
    }

}