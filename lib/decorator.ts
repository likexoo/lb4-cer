import { MethodDecoratorFactory } from '@loopback/metadata';
import { CerSpec } from './type';
import { CerBindings } from './binding';

export function cer(
    spec: CerSpec,
    options?: { }
): MethodDecorator {
    // add options to spec
    (spec as any || {})['options'] = options || {};
    // create decorator
    return MethodDecoratorFactory.createDecorator<CerSpec>(
        CerBindings.CER_METADATA,
        spec,
        { decoratorName: '@cer' }
    );
}
