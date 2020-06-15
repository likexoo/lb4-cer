import { ApplicationConfig } from '@loopback/core';
import { ExpectFunctionApplication } from './application';

export async function ExpectFunctionMain(options: ApplicationConfig = {
    shutdown: { signals: ['SIGINT'] }
}) {

    const app = new ExpectFunctionApplication(options);

    await app.boot();
    await app.start();

    return app;
}