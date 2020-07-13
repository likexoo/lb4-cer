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

    const belongedCompanyId = new ObjectId();
    const ownedCompanies1 = new ObjectId();
    const ownedCompanies2 = new ObjectId();

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
                    sequenceMetaData: {}
                }
            }
        );

        const result1 = await client.get('/test1');
        expect(result1).propertyByPath('status').eql(200);
        expect(result1).propertyByPath('body', 'report').Object();
        expect(result1).propertyByPath('body', 'report', 'isMetadataExists').True();

        const result2 = await client.get('/test2');
        expect(result2).propertyByPath('status').eql(200);

    });

    it(`@cauth`, async () => {

        // having the required credentials

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    sequenceData: {}
                }
            }
        );

        const result1 = await client.get('/test3');

        expect(result1).propertyByPath('status').eql(200);
        expect(result1).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(1);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(true);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '0', 'value').eql(`${belongedCompanyId}`);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '0').eql(`${ownedCompanies1}`);
        expect(result1).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '1').eql(`${ownedCompanies2}`);

        // having the required credentials (but points invalid)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: false,
                        level: 1,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    sequenceData: {}
                }
            }
        );

        const result2 = await client.get('/test3');
        expect(result2).propertyByPath('status').eql(200);
        expect(result2).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result2).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result2).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // having the required credentials (but `id` not match)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'AAAA',
                    sequenceData: {}
                }
            }
        );

        const result3 = await client.get('/test3');
        expect(result3).propertyByPath('status').eql(200);
        expect(result3).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result3).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result3).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // having the required credentials (but `id` not exist in cache)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'ANOTHER_USER_ID',
                    sequenceData: {}
                }
            }
        );

        const result4 = await client.get('/test3');
        expect(result4).propertyByPath('status').eql(200);
        expect(result4).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result4).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result4).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // not having the required credentials

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: []
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    sequenceData: {}
                }
            }
        );

        const result5 = await client.get('/test3');
        expect(result5).propertyByPath('status').eql(200);
        expect(result5).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result5).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result5).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);

        // having the required credentials with checker

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    })
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    sequenceData: {
                        sequenceDataLevel: 10
                    }
                }
            }
        );

        const result6 = await client.get('/test4');

        expect(result6).propertyByPath('status').eql(200);
        expect(result6).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(0);
        expect(result6).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(false);
        expect(result6).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);
        expect(result6).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '0', 'value').eql(`${belongedCompanyId}`);
        expect(result6).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '0').eql(`${ownedCompanies1}`);
        expect(result6).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '1').eql(`${ownedCompanies2}`);

        // having two required credentials (one matched, one not matched)

        await credentialHelper.insertFromNodeCache(
            'TEST_USER_ID',
            {
                id: 'TEST_USER_ID',
                credentials: [
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: false,
                        level: 0,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    }),
                    new ManagerCredential({
                        _id: new ObjectId(),
                        updateStaff: true,
                        level: 4,
                        belongedCompanyId,
                        ownedCompanies: [ownedCompanies1, ownedCompanies2]
                    }),
                ]
            } as CredentialCached
        );
        spyHelper.upsertSpyFunction(
            'sequence.beforeInvoke',
            async () => {
                return {
                    id: 'TEST_USER_ID',
                    sequenceData: {}
                }
            }
        );

        const result7 = await client.get('/test3');

        expect(result7).propertyByPath('status').eql(200);
        expect(result7).propertyByPath('body', 'report', 'overview', 'passedSituations', 'length').eql(1);
        expect(result7).propertyByPath('body', 'report', 'details', 'situation0', 'passed').eql(true);
        expect(result7).propertyByPath('body', 'report', 'details', 'situation1', 'passed').eql(false);
        expect(result7).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '0', 'value').eql(`${belongedCompanyId}`);
        expect(result7).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '0').eql(`${ownedCompanies1}`);
        expect(result7).propertyByPath('body', 'report', 'details', 'situation0', 'relevances', '1', 'value', '1').eql(`${ownedCompanies2}`);

    });

});