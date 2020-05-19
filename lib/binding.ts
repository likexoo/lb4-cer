import { BindingKey } from '@loopback/context';
import { ExpectFunction, CerSpec, CerDefinition } from './type';
import NodeCache = require('node-cache');

export const CerBindings = {
    // external bindings
    DEFINITION: BindingKey.create<CerDefinition>('auth2.cer.definition'),
    // internal bindings
    EXPECT_FUNCTION: BindingKey.create<ExpectFunction>('auth2.cer.expectFunction'),
    CER_METADATA: BindingKey.create<CerSpec>('auth2.cer.cerMetadata'),
    NODE_CACHE: BindingKey.create<NodeCache>('auth2.cer.nodeCache')
};
