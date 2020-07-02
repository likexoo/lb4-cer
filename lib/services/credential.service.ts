import { CredentialModel } from "../types/credential.type";
import { inject } from "@loopback/context";
import { CredentialAuthBindings } from "../binding";
import NodeCache from "node-cache";
import { CredentialCached, PropType, ExpectFunctionReport } from "../type";
import { CredentialAuthSpec } from "../types/credential-auth.type";
import _ from "lodash";

export class CredentialService {

    constructor(
        @inject(CredentialAuthBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache
    ) { }

    public async getCredentials(
        id: PropType<CredentialCached, 'id'>
    ): Promise<Array<CredentialModel>> {
        let credentials: Array<CredentialModel> = [];
        const cachedData = this.nodeCache.get<CredentialCached>(`${id}`);
        if (cachedData && Array.isArray(cachedData!.credentials)) credentials = cachedData.credentials;
        return credentials;
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
                ownedCredentials: []
            },
            details: {},
            isMetadataExists: false,
            isOptional: _.get(credentialAuthMetadata, 'options.optional', false)
        };
        ownedCredentials = Array.isArray(ownedCredentials) ? ownedCredentials : [];
        if (!credentialAuthMetadata) return report;
        report.isMetadataExists = true;
        // $ iterate over all situations
        let situations = credentialAuthMetadata.situations;
        Object.keys(situations).forEach((situation: string) => {
            // init
            const situationObject = situations[situation];
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
