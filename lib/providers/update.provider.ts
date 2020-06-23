import { ValueOrPromise, inject } from '@loopback/context';
import { ObjectId } from 'bson';
import NodeCache = require('node-cache');
import { CredentialAuthBindings } from '../binding';
import { UpdateFunction, CredentialCached } from '../type';
import { CredentialModel } from '../types/credential.type';

export class UpdateFunctionProvider {

    constructor(
        @inject(CredentialAuthBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache
    ) { }

    value(): ValueOrPromise<UpdateFunction> {
        return (id: string | ObjectId, credentials: Array<CredentialModel>) => this.action(id, credentials);
    }

    async action(
        id: string | ObjectId,
        credentials?: Array<CredentialModel>
    ): Promise<void> {
        this.nodeCache.set(
            `${id}`,
            {
                id: `${id}`,
                statusId: new Date().toISOString(),
                credentials: credentials
            } as CredentialCached
        );
    }

}