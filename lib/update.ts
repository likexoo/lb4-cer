import { Provider, ValueOrPromise, inject } from '@loopback/context';
import { ObjectId } from 'bson';
import NodeCache = require('node-cache');
import { CerBindings } from './binding';
import { UpdateFunction, CerEntity } from './type';

export class UpdateFunctionProvider implements Provider<UpdateFunction> {

    constructor(
        @inject(CerBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache
    ) { }

    value(): ValueOrPromise<UpdateFunction> {
        return (id: string | ObjectId, cers: Array<CerEntity>) => this.action(id, cers);
    }

    async action(
        id: string | ObjectId,
        cers?: Array<CerEntity>
    ): Promise<void> {
        this.nodeCache.set(`${id}`, {
            id: `${id}`,
            timestamp: new Date().toISOString(),
            cers: cers
        })
    }

}