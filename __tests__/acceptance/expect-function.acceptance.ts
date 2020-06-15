import { createRestAppClient, supertest, expect } from '@loopback/testlab';
import { ExpectFunctionMain } from '../fixtures/expect-function-application';
import { ExpectFunctionApplication } from '../fixtures/expect-function-application/application';
import { CerPackageCached, CerTokenMetadata } from '../../lib/type';
import { CerHelper } from '../helpers/cer.helper';
import _ from 'lodash';
import { SpyHelper } from '../helpers/spy.helper';

describe('ExpectFunction', () => {

    let app: ExpectFunctionApplication;
    let client: supertest.SuperTest<supertest.Test>;

    let cerHelper: CerHelper;
    let spyHelper: SpyHelper;

    before(async () => {
        app = await ExpectFunctionMain();
        client = createRestAppClient(app);
        cerHelper = await app.get('helper.cer');
        spyHelper = await app.get('helper.spy');
    });

    it(`controller method with / without @cer`, async () => {

        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    timestamp: `${new Date().toISOString()}`
                }
            }
        );

        const result1 = await client.get('/test1');
        expect(result1).propertyByPath('status').eql(200);

        const result2 = await client.get('/test2');
        expect(result2).propertyByPath('status').eql(200);

    });

    it(`expect multiple situations with options.cerSource = 'CACHE'`, async () => {

        const timestamp = `${new Date().toISOString()}`;
        await cerHelper.updateCerDefintion('options.cerSource', 'CACHE');

        // having the required cers

        await cerHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                timestamp,
                cers: [
                    {
                        id: '1000',
                        package: 'BOSS_PERMISSION',
                        contains: {
                            UPDATE_STAFF: true
                        }
                    }
                ]
            } as CerPackageCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    cerTimestamp: timestamp
                } as CerTokenMetadata
            }
        );

        const result1 = await client.get('/test3');
        expect(result1).propertyByPath('status').eql(200);
        expect(result1).propertyByPath('body', 'cerReport', 'overview', 'cerSource').eql('CACHE');
        expect(result1).propertyByPath('body', 'cerReport', 'overview', 'passedSituations', 'length').eql(1);
        expect(result1).propertyByPath('body', 'cerReport', 'details', 'situation0', 'passed').eql(true);
        expect(result1).propertyByPath('body', 'cerReport', 'details', 'situation1', 'passed').eql(false);

        // not having the required cers (contains not match)

        await cerHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                timestamp,
                cers: [
                    {
                        id: '1000',
                        package: 'BOSS_PERMISSION',
                        contains: {
                            OTHERS: true
                        }
                    }
                ]
            } as CerPackageCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    cerTimestamp: timestamp
                } as CerTokenMetadata
            }
        );

        const result2 = await client.get('/test3');
        expect(result2).propertyByPath('status').eql(200);
        expect(result2).propertyByPath('body', 'cerReport', 'overview', 'cerSource').eql('CACHE');
        expect(result2).propertyByPath('body', 'cerReport', 'overview', 'passedSituations', 'length').eql(0);
        expect(result2).propertyByPath('body', 'cerReport', 'details', 'situation0', 'passed').eql(false);
        expect(result2).propertyByPath('body', 'cerReport', 'details', 'situation1', 'passed').eql(false);

        // having the required cers but timestamp not match

        await cerHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                timestamp: 'AAAA',
                cers: [
                    {
                        id: '1000',
                        package: 'BOSS_PERMISSION',
                        contains: {
                            UPDATE_STAFF: true
                        }
                    }
                ]
            } as CerPackageCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    cerTimestamp: 'BBBB'
                } as CerTokenMetadata
            }
        );

        const result3 = await client.get('/test3');
        expect(result3).propertyByPath('status').eql(200);
        expect(result3).propertyByPath('body', 'cerReport', 'overview', 'cerSource').eql('NONE');
        expect(result3).propertyByPath('body', 'cerReport', 'overview', 'passedSituations', 'length').eql(0);
        expect(result3).propertyByPath('body', 'cerReport', 'details', 'situation0', 'passed').eql(false);
        expect(result3).propertyByPath('body', 'cerReport', 'details', 'situation1', 'passed').eql(false);

        // having the required cers but the `CerTokenMetadata.id` not match

        await cerHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                timestamp,
                cers: [
                    {
                        id: '1000',
                        package: 'BOSS_PERMISSION',
                        contains: {
                            UPDATE_STAFF: true
                        }
                    }
                ]
            } as CerPackageCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'ANOTHER_USER_ID',
                    cerTimestamp: timestamp
                } as CerTokenMetadata
            }
        );

        const result4 = await client.get('/test3');
        expect(result4).propertyByPath('status').eql(200);
        expect(result4).propertyByPath('body', 'cerReport', 'overview', 'cerSource').eql('NONE');
        expect(result4).propertyByPath('body', 'cerReport', 'overview', 'passedSituations', 'length').eql(0);
        expect(result4).propertyByPath('body', 'cerReport', 'details', 'situation0', 'passed').eql(false);
        expect(result4).propertyByPath('body', 'cerReport', 'details', 'situation1', 'passed').eql(false);

        // not having the required cers (package not match)

        await cerHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                timestamp,
                cers: [
                    {
                        id: '1000',
                        package: 'OTHERS',
                        contains: {
                            UPDATE_STAFF: true
                        }
                    }
                ]
            } as CerPackageCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    cerTimestamp: timestamp
                } as CerTokenMetadata
            }
        );

        const result5 = await client.get('/test3');
        expect(result5).propertyByPath('status').eql(200);
        expect(result5).propertyByPath('body', 'cerReport', 'overview', 'cerSource').eql('CACHE');
        expect(result5).propertyByPath('body', 'cerReport', 'overview', 'passedSituations', 'length').eql(0);
        expect(result5).propertyByPath('body', 'cerReport', 'details', 'situation0', 'passed').eql(false);
        expect(result5).propertyByPath('body', 'cerReport', 'details', 'situation1', 'passed').eql(false);

    });

});