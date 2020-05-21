// @ts-ignore comment
import { BindingKey } from '@loopback/context';
// @ts-ignore comment
import NodeCache = require('node-cache');
import { ExpectFunction, CerSpec, CerDefinition } from './type';

export const CerBindings = {
    // external bindings
    DEFINITION: BindingKey.create<CerDefinition>('auth2.cer.definition'),
    // internal bindings
    EXPECT_FUNCTION: BindingKey.create<ExpectFunction>('auth2.cer.expectFunction'),
    CER_METADATA: BindingKey.create<CerSpec>('auth2.cer.cerMetadata'),
    NODE_CACHE: BindingKey.create<NodeCache>('auth2.cer.nodeCache')
};
