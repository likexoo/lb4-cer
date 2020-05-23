// @ts-ignore comment
import { Provider, ValueOrPromise, inject } from '@loopback/context';
// @ts-ignore comment
import { ObjectId } from 'bson';
// @ts-ignore comment
import NodeCache = require('node-cache');
import { CerBindings } from './binding';
import { UpdateFunction, CerEntity } from './type';

export class UpdateFunctionProvider implements Provider<UpdateFunction> {

    constructor(
        @inject(CerBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache
    ) { }

    value(): ValueOrPromise<UpdateFunction> {
        return (_id: string | ObjectId, cers: Array<CerEntity>) => this.action(_id, cers);
    }

    async action(
        _id: string | ObjectId,
        cers?: Array<CerEntity>
    ): Promise<void> {
        this.nodeCache.set(`${_id}`, {
            _id: `${_id}`,
            timestamp: new Date().toISOString(),
            cers: cers
        })
    }

}