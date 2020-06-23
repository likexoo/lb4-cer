import { BindingKey } from '@loopback/context';
import NodeCache = require('node-cache');
import { ExpectFunction, Definition, UpdateFunction } from './type';
import { CredentialCodeSpec, CredentialPointSpec, CredentialRelevanceSpec } from './types/credential.type';
import { CredentialAuthSpec } from './types/credential-auth.type';
import { CredentialService } from './services/credential.service';

export const CredentialAuthBindings = {
    // metadatas
    CERDENTIALS_CODE_METADATA: BindingKey.create<CredentialCodeSpec>('module.credentialAuth.codeMetadata'),
    CERDENTIALS_POINT_METADATA: BindingKey.create<CredentialPointSpec>('module.credentialAuth.pointMetadata'),
    CERDENTIALS_RELEVANCE_METADATA: BindingKey.create<CredentialRelevanceSpec>('module.credentialAuth.relevanceMetadata'),
    CREDENTIAL_AUTH_METADATA: BindingKey.create<CredentialAuthSpec>('module.credentialAuth.credentialAuthMetadata'),
    // services
    SERVICE: BindingKey.create<CredentialService>('module.credentialAuth.service'),
    // functions
    EXPECT_FUNCTION: BindingKey.create<ExpectFunction>('module.credentialAuth.expectFunction'),
    UPDATE_FUNCTION: BindingKey.create<UpdateFunction>('module.credentialAuth.updateFunction'),
    // objects
    DEFINITION: BindingKey.create<Definition>('module.credentialAuth.definition'),
    NODE_CACHE: BindingKey.create<NodeCache>('module.credentialAuth.nodeCache')
};
