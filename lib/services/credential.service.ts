import { CredentialModel } from "../types/credential.type";
import { inject } from "@loopback/context";
import { CredentialAuthBindings } from "../binding";
import NodeCache from "node-cache";
import { Definition, CredentialCached, PropType, ExpectFunctionReport } from "../type";
import { v4 as uuidv4 } from 'uuid';
import { CredentialAuthSpec } from "../types/credential-auth.type";
import _ from "lodash";
import { BasicCredentialRepository } from "../repositories/basic-credential.repository";

export class CredentialService {

    constructor(
        @inject(CredentialAuthBindings.DEFINITION)
        private readonly definition: Definition,
        @inject(CredentialAuthBindings.CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: BasicCredentialRepository,
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
            if (this.credentialRepository && typeof this.credentialRepository.findCredentials === 'function') {
                const findCredentialsResult = await this.credentialRepository.findCredentials(id, sequenceData);
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
        credentialAuthMetadata: CredentialAuthSpec,
        sequenceData?: any
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
            // iterate over all expected packages
            if (situationObject.credentials) {
                Object.keys(situationObject.credentials).forEach((credentialModelCode: string) => {
                    // init
                    const credentialModelObject = _.get(situationObject, `credentials.${credentialModelCode}`) || {};
                    // try to find cer in owned cers
                    const index = ownedCredentials.findIndex(t => _.get(t.getCode(), 'metadata.val') === credentialModelCode);
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
                            const credentialPointMetadataReport = targetOwnedCredential.findPoint(credentialPointCode);
                            // potint not found
                            if (!credentialPointMetadataReport) {
                                report.details[situation].passed = false;
                                report.details[situation].errors.push({
                                    message: `Credential point not found`,
                                    details: { credentialModelCode, credentialPointCode }
                                });
                            }
                            // potint found but authentication failed
                            else if (credentialPointMetadataReport.value !== credentialModelObject[credentialPointCode]) {
                                report.details[situation].passed = false;
                                report.details[situation].errors.push({
                                    message: _.get(credentialPointMetadataReport, 'metadata.options.message') || `Credential point authentication failed`,
                                    details: {
                                        credentialModelCode, credentialPointCode,
                                        credentialPointKey: credentialPointMetadataReport.key,
                                        credentialPointValue: credentialPointMetadataReport.value
                                    }
                                });
                            }
                            return;
                        }
                        // if checker is function
                        else if (typeof credentialModelObject[credentialPointCode] === 'function') {
                            // init
                            const credentialPointMetadataReport = targetOwnedCredential.findPoint(credentialPointCode)
                            // potint not found
                            if (!credentialPointMetadataReport) {
                                report.details[situation].passed = false;
                                report.details[situation].errors.push({
                                    message: `Credential point not found`,
                                    details: { credentialModelCode, credentialPointCode }
                                });
                            }
                            // potint found
                            else {
                                const result: boolean = (credentialModelObject[credentialPointCode] as any)(credentialPointMetadataReport.value, sequenceData);
                                if (result !== true) {
                                    report.details[situation].passed = false;
                                    report.details[situation].errors.push({
                                        message: _.get(credentialPointMetadataReport, 'metadata.options.message') || `Credential point authentication failed`,
                                        details: {
                                            credentialModelCode, credentialPointCode,
                                            credentialPointKey: credentialPointMetadataReport.key,
                                            credentialPointValue: credentialPointMetadataReport.value
                                        }
                                    });
                                }
                            }
                            return;
                        }
                    });
                    // add related
                    relevances.push(...(targetOwnedCredential.getRelevances() || []));
                });
            }
            // add relateds
            report.details[situation].relevances = relevances;
            // run checker function
            if (situationObject.checker && typeof situationObject.checker === 'function') {
                const result = situationObject.checker(report.details[situation], sequenceData);
                if (result === false) report.details[situation].passed = false;
            }
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
