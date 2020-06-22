import { ApplicationConfig } from '@loopback/core';
import { ExpectFunctionApplication } from './application';

export async function DefaultMain(options: ApplicationConfig = {
    shutdown: { signals: ['SIGINT'] },
    rest: {
        port: +(process.env.PORT || 6006),
        host: process.env.HOST,
        openApiSpec: {
            setServersFromRequest: false,
        }
    },
    websocket: {
        port: +(process.env.PORT || 6016),
        host: process.env.HOST
    }
}) {

    const app = new ExpectFunctionApplication(options);

    await app.boot();
    await app.start();

    return app;
}