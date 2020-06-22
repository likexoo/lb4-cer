import { ApplicationConfig } from '@loopback/core';
import { ExpectFunctionApplication } from './application';

export async function DefaultMain(options: ApplicationConfig = {
    shutdown: { signals: ['SIGINT'] },
    rest: {
        port: +(process.env.PORT || 6006),
        host: '0.0.0.0',
        openApiSpec: {
            setServersFromRequest: false,
        }
    },
    websocket: {
        port: +(process.env.PORT || 6016),
        host: '0.0.0.0'
    }
}) {

    const app = new ExpectFunctionApplication(options);

    await app.boot();
    await app.start();

    return app;
}