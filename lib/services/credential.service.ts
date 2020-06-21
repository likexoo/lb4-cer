import { CredentialModel } from "../types/credential.type";
import { inject } from "@loopback/context";
import { CredentialAuthBindings } from "../binding";
import NodeCache from "node-cache";
import { Definition, CredentialCached, PropType, ExpectFunctionReport } from "../type";
import { v4 as uuidv4 } from 'uuid';
import { CredentialAuthSpec } from "../types/credential-auth.type";

export class CredentialService {

    constructor(
        @inject(CredentialAuthBindings.DEFINITION)
        private readonly definition: Definition,
        @inject(CredentialAuthBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache,
    ) { }

    public async getCredentials(
        id: PropType<CredentialCached, 'id'>,
        statusId: string,
        sequenceData?: any
    ): Promise<GetCredentialsResult> {
        // $ init
        let report: GetCredentialsResult = {
            credentials: [],
            source: 'UNDEFINED',
            statusId
        };
        // $ find credentials from cache
        if (
            this.definition.credentialSource === 'CACHE' ||
            this.definition.credentialSource === 'CACHE_THEN_DB'
        ) {
            const cachedData = this.nodeCache.get<CredentialCached>(`${id}`);
            if (cachedData && cachedData.statusId === statusId) {
                report.credentials = Array.isArray(cachedData.credentials) ? cachedData.credentials : [];
                report.source = 'CACHE';
            }
        }
        // $ find credentials from db
        if (
            this.definition.credentialSource === 'DB' ||
            (report.source === undefined && this.definition.credentialSource === 'CACHE_THEN_DB')
        ) {
            if (this.definition.strategy && typeof this.definition.strategy.findCredentials === 'function') {
                const findCredentialsResult = await this.definition.strategy.findCredentials(id, sequenceData);
                if (findCredentialsResult && Array.isArray(findCredentialsResult)) {
                    report.credentials = findCredentialsResult;
                    report.source = 'DB';
                    // store in cache
                    this.nodeCache.set(`${id}`, {
                        id: `${id}`,
                        statusId: uuidv4(),
                        cers: findCredentialsResult
                    })
                }
            }
        }
        // $ return
        return report;
    }

    public expect(
        ownedCredentials: Array<CredentialModel>,
        credentialAuthMetadata: CredentialAuthSpec
    ): ExpectFunctionReport {
        // $ init
        let report: ExpectFunctionReport = {
            overview: {
                passedSituations: [],
                unpassedSituations: [],
                ownedCredentials: [],
                credentialSource: 'UNDEFINED'
            },
            details: {},
            statusId: undefined
        };
        ownedCredentials = Array.isArray(ownedCredentials) ? ownedCredentials : [];
        if (!credentialAuthMetadata) return report;
        // $ iterate over all situations
        Object.keys(credentialAuthMetadata).forEach((situation: string) => {
            // init
            const situationObject = credentialAuthMetadata[situation];
            let relevances: any[] = [];
            report.details[situation] = { errors: [], passed: true, relevances: [] };
            // ingore non-cer properties
            if (situation === 'options') return;
            // iterate over all expected packages
            Object.keys(situationObject).forEach((credentialModelCode: string) => {
                // init
                const credentialModelObject = situationObject[credentialModelCode] || {};
                // try to find cer in owned cers
                const index = ownedCredentials.findIndex(t =>  t.getCode() === credentialModelCode);
                // if cer not found
                if (index === -1) {
                    report.details[situation].passed = false;
                    report.details[situation].errors.push({
                        message: `Missing required credential ${credentialModelCode}`,
                        details: {}
                    });
                    return;
                }
                // get target cer entity
                const targetOwnedCredential: CredentialModel = ownedCredentials[index];
                // iterate over all contains
                Object.keys(credentialModelObject).forEach((credentialPointCode: string) => {
                    // if checker is boolean
                    if (typeof credentialModelObject[credentialPointCode] === 'boolean') {
                        // init
                        const credentialPointValue = targetOwnedCredential.findPoint(credentialPointCode)
                        // check
                        if (credentialPointValue !== credentialModelObject[credentialPointCode]) {
                            report.details[situation].passed = false;
                            report.details[situation].errors.push({
                                message: `Credential point authentication failed`,
                                details: { credentialModelCode, credentialPointCode, credentialPointValue }
                            });
                        }
                        return;
                    }
                    // if checker is function
                    else if (typeof credentialModelObject[credentialPointCode] === 'function') {
                        // init
                        const credentialPointValue = targetOwnedCredential.findPoint(credentialPointCode)
                        // check
                        const result: boolean = (credentialModelObject[credentialPointCode] as any)(credentialPointValue);
                        if (result !== true) {
                            report.details[situation].passed = false;
                            report.details[situation].errors.push({
                                message: `Credential point authentication failed`,
                                details: { credentialModelCode, credentialPointCode, credentialPointValue }
                            });
                        }
                        return;
                    }
                });
                // add related
                relevances = targetOwnedCredential.getRelevances();
            });
            // add relateds
            report.details[situation].relevances = relevances;
            // if passed
            if (report.details[situation].passed) report.overview.passedSituations.push(situation);
            // if not passed
            else report.overview.unpassedSituations.push(situation);
        });
        // $ return
        return report;
    }

}

type GetCredentialsResult = {
    credentials: Array<CredentialModel>;
    source: 'DB' | 'CACHE' | 'UNDEFINED';
    statusId: string;
}
