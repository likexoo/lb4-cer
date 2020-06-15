import { RestBindings, SequenceHandler, FindRoute, ParseParams, InvokeMethod, Send, Reject, RequestContext } from "@loopback/rest"; import { inject, Getter } from "@loopback/core";
import { CerBindings, ExpectFunction, ExpectFunctionReport, CerTokenMetadata } from "../../../index";
import { SpyHelper } from "../../helpers/spy.helper";

const SequenceActions = RestBindings.SequenceActions;

export class ExpectFunctionSequence implements SequenceHandler {
    constructor(
        @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
        @inject(SequenceActions.PARSE_PARAMS)
        protected parseParams: ParseParams,
        @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
        @inject(SequenceActions.SEND) protected send: Send,
        @inject(SequenceActions.REJECT) protected reject: Reject,
        @inject.getter(CerBindings.EXPECT_FUNCTION) public expectFunction: Getter<ExpectFunction>,
        @inject('helper.spy') public spyHelper: SpyHelper
    ) { }
    async handle(context: RequestContext) {
        try {
            const { request, response } = context;
            const route = this.findRoute(request);
            const args = await this.parseParams(request, route);

            let tokenMetaData: CerTokenMetadata = await this.spyHelper.runSpyFunction('sequence.beforeInvoke');
            const cerReport: ExpectFunctionReport | undefined = await (await this.expectFunction())(
                request,
                tokenMetaData
            );
            
            const result = await this.invoke(route, args);
            this.send(response, { result, cerReport });
        } catch (error) {
            this.reject(context, error);
            return;
        }
    }
}