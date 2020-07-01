import { Provider, ValueOrPromise, MetadataInspector, inject, Constructor } from '@loopback/context';
import { CoreBindings } from '@loopback/core';
import { CredentialAuthBindings } from '../binding';
import { ExpectFunction, ExpectFunctionReport } from '../type';
import { CredentialAuthSpec } from '../types/credential-auth.type';
import { ObjectId } from 'bson';
import { CredentialService } from '../services/credential.service';

export class ExpectFunctionProvider implements Provider<ExpectFunction> {

    constructor(
        @inject(CoreBindings.CONTROLLER_CLASS, { optional: true })
        private readonly controllerClass: Constructor<{}>,
        @inject(CoreBindings.CONTROLLER_METHOD_NAME, { optional: true })
        private readonly methodName: string,
        @inject(CredentialAuthBindings.SERVICE)
        private readonly credentialService: CredentialService
    ) {
        this.controllerClass = controllerClass;
        this.methodName = methodName;
    }

    value(): ValueOrPromise<ExpectFunction> {
        return (id: string | ObjectId, statusId: string, sequenceData?: any) => this.action(id, statusId, sequenceData);
    }

    async action(
        id: string | ObjectId,
        statusId: string,
        sequenceData?: any
    ): Promise<ExpectFunctionReport> {
        const metadata: CredentialAuthSpec | undefined = MetadataInspector.getMethodMetadata(CredentialAuthBindings.CREDENTIAL_AUTH_METADATA, this.controllerClass.prototype, this.methodName);
        const result = await this.credentialService.getCredentials(id, statusId, sequenceData);
        let report: ExpectFunctionReport = this.credentialService.expect(result.credentials, metadata!, sequenceData);
        report.statusId = statusId;
        report.overview.credentialSource = result.source;
        return report;
    }

}
