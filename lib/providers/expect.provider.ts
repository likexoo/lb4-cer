import { Provider, ValueOrPromise, MetadataInspector, inject, Constructor } from '@loopback/context';
import { CoreBindings } from '@loopback/core';
import { CredentialAuthBindings } from '../binding';
import { ExpectFunction, ExpectFunctionReport } from '../type';
import { CredentialAuthSpec } from '../types/credential-auth.type';
import { ObjectId } from 'bson';
import { CredentialService } from '../services/credential.service';
import _ from 'lodash';

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
        return (id: string | ObjectId, sequenceData?: any) => this.action(id, sequenceData);
    }

    async action(
        id: string | ObjectId,
        sequenceData?: any,
        metadata?: CredentialAuthSpec
    ): Promise<ExpectFunctionReport> {
        if (!metadata) {
            try {
                metadata = MetadataInspector.getMethodMetadata(
                    CredentialAuthBindings.CREDENTIAL_AUTH_METADATA,
                    this.controllerClass.prototype,
                    this.methodName
                );
            } catch (error) { }
        }
        const cachedCredentials = await this.credentialService.getCredentials(id);
        let report: ExpectFunctionReport = this.credentialService.expect(cachedCredentials, metadata!, sequenceData);
        return report;
    }

}
