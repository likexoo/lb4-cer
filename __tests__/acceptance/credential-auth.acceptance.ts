import { createRestAppClient, supertest, expect } from '@loopback/testlab';
import { DefaultMain } from '../fixtures/default-application';
import { ExpectFunctionApplication } from '../fixtures/default-application/application';
import { CredentialCached } from '../../lib/type';
import { CredentialHelper } from '../helpers/credential.helper';
import _ from 'lodash';
import { SpyHelper } from '../helpers/spy.helper';
import { ManagerCredential } from '../fixtures/default-application/models/manager.credential';
import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';

describe('@cauth', () => {

    let app: ExpectFunctionApplication;
    let client: supertest.SuperTest<supertest.Test>;

    let credentialHelper: CredentialHelper;
    let spyHelper: SpyHelper;

    before(async () => {
        app = await DefaultMain();
        client = createRestAppClient(app);
        credentialHelper = await app.get('helper.cer');
        spyHelper = await app.get('helper.spy');
    });

    it(`controller method with / without @cauth`, async () => {

        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    statusId: uuidv4(),
                    sequenceMetaData: {}
                }
            }
        );

        const result1 = await client.get('/test1');
        expect(result1).propertyByPath('status').eql(200);
        expect(result1).propertyByPath('body', 'report').Object();

        const result2 = await client.get('/test2');
        expect(result2).propertyByPath('status').eql(200);

    });

    it(`@cauth with options.credentialSource = 'CACHE'`, async () => {

        const statusId = uuidv4();
        const belongedCompanyId = new ObjectId();
        const ownedRestaurants1 = new ObjectId();
        const ownedRestaurants2 = new ObjectId();
        await credentialHelper.updateCerDefintion('options.credentialSource', 'CACHE');

        // having the required credentials

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                statusId,
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedRestaurants: [ownedRestaurants1, ownedRestaurants2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    statusId: statusId,
                    sequenceData: {}
                }
            }
        );

        const result1 = await client.get('/test3');

        expect(result1).propertyByPath('status').eql(200);
        expect(result1).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('CACHE');
        expect(result1).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(1);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(true);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '0', 'value').eql(`${belongedCompanyId}`);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '0').eql(`${ownedRestaurants1}`);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '1').eql(`${ownedRestaurants2}`);

        // having the required credentials (but points invalid)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                statusId,
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: false,
                        level: 1,
                        belongedCompanyId,
                        ownedRestaurants: [ownedRestaurants1, ownedRestaurants2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    statusId: statusId,
                    sequenceData: {}
                }
            }
        );

        const result2 = await client.get('/test3');
        expect(result2).propertyByPath('status').eql(200);
        expect(result2).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('CACHE');
        expect(result2).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result2).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result2).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // having the required credentials (but `statusId` not match)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                statusId: 'AAAA',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedRestaurants: [ownedRestaurants1, ownedRestaurants2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    statusId: statusId,
                    sequenceData: {}
                }
            }
        );

        const result3 = await client.get('/test3');
        expect(result3).propertyByPath('status').eql(200);
        expect(result3).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('UNDEFINED');
        expect(result3).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result3).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result3).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // having the required credentials (but `id` not exist in cache)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                statusId,
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedRestaurants: [ownedRestaurants1, ownedRestaurants2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'ANOTHER_USER_ID',
                    statusId: statusId,
                    sequenceData: {}
                }
            }
        );

        const result4 = await client.get('/test3');
        expect(result4).propertyByPath('status').eql(200);
        expect(result4).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('UNDEFINED');
        expect(result4).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result4).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result4).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // not having the required credentials

            await credentialHelper.insertFromNodeCache(
                'TEST_USER_ID',
                {
                    id: 'TEST_USER_ID',
                    statusId,
                    credentials: [ ]
                } as CredentialCached
            );
            spyHelper.upsertSpyFunction(
                'sequence.beforeInvoke',
                async () => {
                    return {
                        id: 'TEST_USER_ID',
                        statusId: statusId,
                        sequenceData: {}
                    }
                }
            );

            const result5 = await client.get('/test3');
            expect(result5).propertyByPath('status').eql(200);
            expect(result5).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('CACHE');
            expect(result5).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
            expect(result5).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
            expect(result5).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

    });

    // it(`@cauth with options.credentialSource = 'DB'`, async () => {

    //     const statusId = `${new Date().toISOString()}`;
    //     await credentialHelper.updateCerDefintion('options.credentialSource', 'DB');

    //     // having the required cers

    //     class TestStrategy1 {

    //         public async findCers(
    //             request: Request,
    //             tokenMetaData: CerTokenMetadata | undefined,
    //             sequenceData: any | undefined
    //         ): Promise<Array<CerEntity>> {
    //             return [
    //                 {
    //                     id: '1000',
    //                     package: 'BOSS_PERMISSION',
    //                     contains: {
    //                         UPDATE_STAFF: true
    //                     }
    //                 }
    //             ];
    //         }

    //     }
    //     await credentialHelper.updateCerDefintion('strategy', new TestStrategy1());
    //     spyHelper.upsertSpyFunction(
    //         'sequence.beforeInvoke',
    //         async () => {
    //             return {
    //                 id: 'TEST_USER_ID',
    //                 cerstatusId: statusId
    //             } as CerTokenMetadata
    //         }
    //     );

    //     const result1 = await client.get('/test3');
    //     expect(result1).propertyByPath('status').eql(200);
    //     expect(result1).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('DB');
    //     expect(result1).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(1);
    //     expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(true);
    //     expect(result1).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

    //     // not having the required cers (contains not match)

    //     class TestStrategy2 {

    //         public async findCers(
    //             request: Request,
    //             tokenMetaData: CerTokenMetadata | undefined,
    //             sequenceData: any | undefined
    //         ): Promise<Array<CerEntity>> {
    //             return [
    //                 {
    //                     id: '1000',
    //                     package: 'BOSS_PERMISSION',
    //                     contains: {
    //                         OTHERS: true
    //                     }
    //                 }
    //             ];
    //         }

    //     }
    //     await credentialHelper.updateCerDefintion('strategy', new TestStrategy2());
    //     spyHelper.upsertSpyFunction(
    //         'sequence.beforeInvoke',
    //         async () => {
    //             return {
    //                 id: 'TEST_USER_ID',
    //                 cerstatusId: statusId
    //             } as CerTokenMetadata
    //         }
    //     );

    //     const result2 = await client.get('/test3');
    //     expect(result2).propertyByPath('status').eql(200);
    //     expect(result2).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('DB');
    //     expect(result2).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
    //     expect(result2).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
    //     expect(result2).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

    //     // not having the required cers (package not match)

    //     class TestStrategy5 {

    //         public async findCers(
    //             request: Request,
    //             tokenMetaData: CerTokenMetadata | undefined,
    //             sequenceData: any | undefined
    //         ): Promise<Array<CerEntity>> {
    //             return [
    //                 {
    //                     id: '1000',
    //                     package: 'OTHERS',
    //                     contains: {
    //                         UPDATE_STAFF: true
    //                     }
    //                 }
    //             ];
    //         }

    //     }
    //     await credentialHelper.updateCerDefintion('strategy', new TestStrategy5());
    //     spyHelper.upsertSpyFunction(
    //         'sequence.beforeInvoke',
    //         async () => {
    //             return {
    //                 id: 'TEST_USER_ID',
    //                 cerstatusId: statusId
    //             } as CerTokenMetadata
    //         }
    //     );

    //     const result5 = await client.get('/test3');
    //     expect(result5).propertyByPath('status').eql(200);
    //     expect(result5).propertyByPath('body', 'report', 'overview', 'credentialSource').eql('DB');
    //     expect(result5).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
    //     expect(result5).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
    //     expect(result5).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

    // });

});