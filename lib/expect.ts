import { Provider, ValueOrPromise, MetadataInspector, inject, Constructor } from '@loopback/context';
import { Request } from '@loopback/rest';
import NodeCache = require('node-cache');
import { CoreBindings } from '@loopback/core';
import { CerBindings } from './binding';
import { ExpectFunction, CerSpec, ExpectFunctionReport, CerPackageCached, CerTokenMetadata, CerEntity, CerDefinition } from './type';

export class ExpectFunctionProvider implements Provider<ExpectFunction> {

    constructor(
        @inject(CoreBindings.CONTROLLER_CLASS, { optional: true })
        private readonly controllerClass: Constructor<{}>,
        @inject(CoreBindings.CONTROLLER_METHOD_NAME, { optional: true })
        private readonly methodName: string,
        @inject(CerBindings.NODE_CACHE)
        private readonly nodeCache: NodeCache,
        @inject(CerBindings.DEFINITION)
        private readonly definition: CerDefinition
    ) {
        this.controllerClass = controllerClass;
        this.methodName = methodName;
    }

    value(): ValueOrPromise<ExpectFunction> {
        return (request: Request, tokenMetaData: CerTokenMetadata, sequenceMetaData: any) => this.action(request, tokenMetaData, sequenceMetaData);
    }

    async action(
        request: Request,
        tokenMetaData: CerTokenMetadata,
        sequenceMetaData?: any
    ): Promise<ExpectFunctionReport | undefined> {
        // $ init
        let report: ExpectFunctionReport = {
            overview: {
                passedSituations: [],
                unpassedSituations: [],
                tokenMetaData: tokenMetaData,
                cerSource: 'NONE',
                cers: []
            },
            details: {}
        };
        // $ check metadata
        // find metadata
        const metadata: CerSpec | undefined = MetadataInspector.getMethodMetadata(CerBindings.CER_METADATA, this.controllerClass.prototype, this.methodName);
        if (!metadata) return;
        // init metadata
        metadata.options = metadata.options || {};
        // if token metadata is invalid
        if (!tokenMetaData || !tokenMetaData.id)
            throw { message: 'Token metadata is invalid.', statusCode: 401 };
        // $ find cer source
        // find cer source in cache
        let cerPackageCached: CerPackageCached | null = null;
        if (this.definition.options.cerSource === 'CACHE' || this.definition.options.cerSource === 'CACHE_THEN_DB') {
            const cachedData = this.nodeCache.get<CerPackageCached>(`${tokenMetaData.id}`);
            // if cached cer exists, check timestamp
            if (cachedData && cachedData.timestamp === tokenMetaData.cerTimestamp) {
                cerPackageCached = cachedData;
                report.overview.cerSource = 'CACHE';
                report.overview.cers = cerPackageCached.cers || [];
            }
        }
        // find cer source in db
        let cersFound: Array<CerEntity> | null = null;
        if (this.definition.options.cerSource === 'DB' || (!cerPackageCached && this.definition.options.cerSource === 'CACHE_THEN_DB')) {
            // strategy is exists and .findCers() is valid function
            if (this.definition.strategy && typeof this.definition.strategy.findCers === 'function') {
                const findCersResult = await this.definition.strategy.findCers(request, tokenMetaData, sequenceMetaData);
                if (findCersResult && Array.isArray(findCersResult)) {
                    cersFound = findCersResult;
                    report.overview.cerSource = 'DB';
                    report.overview.cers = cersFound || [];
                    // store in cache
                    this.nodeCache.set(`${tokenMetaData.id}`, {
                        id: `${tokenMetaData.id}`,
                        timestamp: new Date().toISOString(),
                        cers: cersFound
                    })
                }
            }
        }
        // $ expect cers
        // get owned cers
        let cersOwned: Array<CerEntity> | null = cerPackageCached && Array.isArray(cerPackageCached.cers) ? cerPackageCached.cers : cersFound;
        cersOwned = Array.isArray(cersOwned) ? cersOwned : [];
        // iterate over all situations
        Object.keys(metadata).forEach((situation: string) => {
            // init
            const situationObject = metadata[situation];
            let relateds: any[] = [];
            // ingore non-cer properties
            if (situation === 'options') return;
            // update report
            report.details[situation] = { errors: [], passed: true, relateds: {} };
            // iterate over all expected packages
            Object.keys(metadata[situation]).forEach((packageName: string) => {
                // init
                const packageObject = situationObject[packageName] || {};
                cersOwned = cersOwned || [];
                // if package name defined in metadata is invalid
                if (!this.definition.cerExamples[packageName]) throw new Error(`Undefined certificate package name in metadata. (package: ${packageName})`);
                // try to find cer in owned cers
                const index = cersOwned.findIndex(t => t.package === packageName);
                // if cer not found
                if (index === -1) {
                    report.details[situation].passed = false;
                    report.details[situation].errors.push({
                        message: `Missing required certificate ${packageName}`,
                        details: {}
                    });
                    return;
                }
                // get target cer entity
                const targetOwnedCer: CerEntity = cersOwned[index];
                // iterate over all contains
                Object.keys(packageObject).forEach((containName: string) => {
                    // if contain name defined in metadata is invalid
                    if (!this.definition.cerExamples[packageName][containName]) throw new Error(`Undefined certificate contain name in metadata. (package: ${packageName}, contain: ${containName})`);
                    // if contain is required but not found
                    if (
                        packageObject[containName] === true &&
                        (!targetOwnedCer.contains || !targetOwnedCer.contains[containName])
                    ) {
                        report.details[situation].passed = false;
                        report.details[situation].errors.push({
                            message: `Missing required certificate contain ${packageName}.${containName}`,
                            details: {}
                        });
                        return;
                    }
                    // if contain is excluded but found
                    else if (
                        packageObject[containName] === false &&
                        (targetOwnedCer.contains && targetOwnedCer.contains[containName])
                    ) {
                        report.details[situation].passed = false;
                        report.details[situation].errors.push({
                            message: `Found excluded certificate contain ${packageName}.${containName}`,
                            details: {}
                        });
                        return;
                    }
                });
                // add related
                if (targetOwnedCer.relateds) relateds.push(targetOwnedCer.relateds);
            });
            // add relateds
            report.details[situation].relateds = relateds;
            // if passed
            if (report.details[situation].passed) {
                report.overview.passedSituations.push(situation);
            }
            // if not passed
            else {
                report.overview.unpassedSituations.push(situation);
            }
        });
        // $ return
        return report;
    }

}
