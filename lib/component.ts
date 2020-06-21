import { Component, Binding, BindingScope } from '@loopback/core';
import NodeCache = require('node-cache');
import { CredentialAuthBindings } from './binding';
import { ExpectFunctionProvider } from '../index';
import { CredentialService } from './services/credential.service';

export class CredentialAuthComponent implements Component {

    constructor( ) { }

    public bindings = [
        new Binding(CredentialAuthBindings.EXPECT_FUNCTION).toProvider(ExpectFunctionProvider),
        new Binding(CredentialAuthBindings.SERVICE).toClass(CredentialService),
        // new Binding(CredentialAuthBindings.UPDATE_FUNCTION).toProvider(UpdateFunctionProvider),
        new Binding(CredentialAuthBindings.NODE_CACHE).to(new NodeCache()).inScope(BindingScope.SINGLETON)
    ];

}
