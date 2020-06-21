// import { Provider, ValueOrPromise, inject } from '@loopback/context';
// import { ObjectId } from 'bson';
// import NodeCache = require('node-cache');
// import { CredentialAuthBindings } from '../binding';
// import { UpdateFunction, CerEntity } from '../type';

export class UpdateFunctionProvider {

    // constructor(
    //     @inject(CredentialAuthBindings.NODE_CACHE)
    //     private readonly nodeCache: NodeCache
    // ) { }

    // value(): ValueOrPromise<UpdateFunction> {
    //     return (id: string | ObjectId, cers: Array<CerEntity>) => this.action(id, cers);
    // }

    // async action(
    //     id: string | ObjectId,
    //     cers?: Array<CerEntity>
    // ): Promise<void> {
    //     this.nodeCache.set(`${id}`, {
    //         id: `${id}`,
    //         statusId: new Date().toISOString(),
    //         cers: cers
    //     })
    // }

}