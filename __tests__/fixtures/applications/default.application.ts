import { Application } from '@loopback/core';
import { RestComponent } from '@loopback/rest';
import { CerBindings, CerComponent } from '../../..';

export function getApp(): Application {
    const app = new Application();
    app.component(RestComponent);
    app.bind(CerBindings.DEFINITION).to({} as any);
    app.component(CerComponent);
    return app;
}