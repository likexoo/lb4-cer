import { inject, Getter } from '@loopback/context';
import {
    FindRoute,
    InvokeMethod,
    ParseParams,
    Reject,
    RequestContext,
    RestBindings,
    Send,
    SequenceHandler,
} from '@loopback/rest';
import { CerBindings, ExpectFunction, ExpectFunctionReport } from '../../..';

const SequenceActions = RestBindings.SequenceActions;

export class CTSequence implements SequenceHandler {

    // define a spy function to do some verification in test
    public spyFunction: ((cerReport: ExpectFunctionReport | undefined) => void) | null = null;

    constructor(
        @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
        @inject(SequenceActions.PARSE_PARAMS)
        protected parseParams: ParseParams,
        @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
        @inject(SequenceActions.SEND) protected send: Send,
        @inject(SequenceActions.REJECT) protected reject: Reject,
        @inject.getter(CerBindings.EXPECT_FUNCTION) public expectFunction: Getter<ExpectFunction>,
    ) { }

    async handle(context: RequestContext) {
        try {
            const { request, response } = context;
            const route = this.findRoute(request);

            // call expect function
            const cerReport: ExpectFunctionReport | undefined = await (await this.expectFunction())(request);

            // call spy function
            if(this.spyFunction) this.spyFunction(cerReport);

            const args = await this.parseParams(request, route);
            const result = await this.invoke(route, args);
            this.send(response, result);
        } catch (error) {
            this.reject(context, error);
            return;
        }
    }

}
