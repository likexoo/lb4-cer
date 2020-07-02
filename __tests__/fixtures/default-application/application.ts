import { CredentialAuthComponent } from '../../../index';
import { BootMixin } from '@loopback/boot';
import { ServiceMixin } from '@loopback/service-proxy';
import { RepositoryMixin } from '@loopback/repository';
import { ApplicationConfig, BindingScope } from '@loopback/core';
import { RestApplication } from '@loopback/rest';
import { ExpectFunctionSequence } from './sequence';
import { CredentialHelper } from '../../helpers/credential.helper';
import { SpyHelper } from '../../helpers/spy.helper';

export class ExpectFunctionApplication extends
    BootMixin(
        ServiceMixin(
            RepositoryMixin(
                RestApplication
            )
        )
    )
{
    constructor(options: ApplicationConfig = {}) {
        super(options);

        this.sequence(ExpectFunctionSequence);

        this.projectRoot = __dirname;

        this.bootOptions = {
            controllers: {
                dirs: ['controllers'],
                extensions: ['.controller.js'],
                nested: true
            }
        };

        this.bind('helper.cer').to(new CredentialHelper(this)).inScope(BindingScope.SINGLETON);
        this.bind('helper.spy').to(new SpyHelper()).inScope(BindingScope.SINGLETON);

        this.component(CredentialAuthComponent);
    }
}