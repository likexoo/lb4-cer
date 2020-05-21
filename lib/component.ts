// @ts-ignore comment
import { Component, Binding, inject, BindingScope } from '@loopback/core';
// @ts-ignore comment
import NodeCache = require('node-cache');
import { CerBindings } from './binding';
import { ExpectFunctionProvider } from './expect';
import { CerDefinition } from './type';

export class CerComponent implements Component {

    constructor(
        @inject(CerBindings.DEFINITION, { optional: true })
        private readonly definition: CerDefinition
    ) { }

    public bindings = [
        new Binding(CerBindings.EXPECT_FUNCTION).toProvider(ExpectFunctionProvider),
        new Binding(CerBindings.NODE_CACHE).to(new NodeCache()).inScope(BindingScope.SINGLETON)
    ];

}
