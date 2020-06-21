import { MethodDecoratorFactory } from '@loopback/metadata';
import { CredentialAuthBindings } from '../binding';
import { CredentialAuthSpec } from '../types/credential-auth.type';

export function cauth(
    spec: CredentialAuthSpec
): MethodDecorator {
    return MethodDecoratorFactory.createDecorator<CredentialAuthSpec>(
        CredentialAuthBindings.CREDENTIAL_AUTH_METADATA,
        spec
    );
}
