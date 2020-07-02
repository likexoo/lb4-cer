import { ValueOrPromise, inject } from '@loopback/context';
import { ObjectId } from 'bson';
import NodeCache = require('node-cache');
import { CredentialAuthBindings } from '../binding';
import { UpdateFunction, CredentialCached } from '../type';
import { CredentialModel } from '../types/credential.type';
import { v4 as uuidv4 } from 'uuid';

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
    ): Promise<string> {
        const statusId = uuidv4();
        this.nodeCache.set(
            `${id}`,
            {
                id: `${id}`,
                statusId: statusId,
                credentials: credentials
            } as CredentialCached
        );
        return statusId;
    }

}