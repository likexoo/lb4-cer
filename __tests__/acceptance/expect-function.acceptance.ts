import { Application } from '@loopback/core';
import { Request, RestServer } from '@loopback/rest';
import { getApp } from '../fixtures/applications/default.application';
import { CTController } from '../fixtures/controllers/default.controller';
import { CTSequence } from '../fixtures/sequences/default.sequence';
import { Client, createClientForHandler } from '@loopback/testlab';

describe('ExpectFunction', () => {

    let app: Application;
    let server: RestServer;

    it('return cer metadata of a controller method', async () => {

        await initApplication();
        initControllerForApplication();
        initSequenceForApplication();

        const client = whenIMakeRequestTo(server);
        const result = await client.get('/test');

        console.log(result.body)
    });

    async function initApplication() {
        app = getApp();
        server = await app.getServer(RestServer);
    }

    function initControllerForApplication() {
        app.controller(CTController);
    }

    function initSequenceForApplication() {
        server.sequence(CTSequence);
    }

    function initProviderForApplication() {
        // registerAuthenticationStrategy(server, BasicAuthenticationStrategy);

        // server
        //     .bind(BasicAuthenticationStrategyBindings.USER_SERVICE)
        //     .toClass(BasicAuthenticationUserService);

        // users = getUserRepository();
        // joeUser = users.list['joe888'];
        // server.bind(USER_REPO).to(users);
    }

    function whenIMakeRequestTo(restServer: RestServer): Client {
        return createClientForHandler(restServer.requestHandler);
    };

});