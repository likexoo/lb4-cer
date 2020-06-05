import { BindingKey } from '@loopback/context';
import NodeCache = require('node-cache');
import { ExpectFunction, CerSpec, CerDefinition, UpdateFunction } from './type';

export const CerBindings = {
    // external bindings
    DEFINITION: BindingKey.create<CerDefinition>('module.cer.definition'),
    // internal bindings
    EXPECT_FUNCTION: BindingKey.create<ExpectFunction>('module.cer.expectFunction'),
    UPDATE_FUNCTION: BindingKey.create<UpdateFunction>('module.cer.updateFunction'),
    CER_METADATA: BindingKey.create<CerSpec>('module.cer.cerMetadata'),
    NODE_CACHE: BindingKey.create<NodeCache>('module.cer.nodeCache')
};
