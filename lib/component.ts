// @ts-ignore comment
import { Component, Binding, BindingScope } from '@loopback/core';
// @ts-ignore comment
import NodeCache = require('node-cache');
import { CerBindings } from './binding';
import { ExpectFunctionProvider } from './expect';
import { UpdateFunctionProvider } from './update';

export class CerComponent implements Component {

    constructor( ) { }

    public bindings = [
        new Binding(CerBindings.EXPECT_FUNCTION).toProvider(ExpectFunctionProvider),
        new Binding(CerBindings.UPDATE_FUNCTION).toProvider(UpdateFunctionProvider),
        new Binding(CerBindings.NODE_CACHE).to(new NodeCache()).inScope(BindingScope.SINGLETON)
    ];

}
