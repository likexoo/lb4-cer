// @ts-ignore comment
import { Provider, ValueOrPromise, MetadataInspector, inject, Constructor } from '@loopback/context';
// @ts-ignore comment
import { Request } from '@loopback/rest';
// @ts-ignore comment
import NodeCache = require('node-cache');
// @ts-ignore comment
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
        tokenMetaData?: CerTokenMetadata,
        sequenceMetaData?: any
    ): Promise<ExpectFunctionReport | undefined> {
        // $ check metadata
        // find metadata
        const metdata: CerSpec | undefined = MetadataInspector.getMethodMetadata(CerBindings.CER_METADATA, this.controllerClass.prototype, this.methodName);
        if (!metdata) return;
        // init metdata
        metdata.options = metdata.options || {};
        // if token metadata is invalid
        if (metdata.options.requiredTokenMetadata && (!tokenMetaData || !tokenMetaData._id))
            throw new Error('Token metadata is invalid.');
        // $ find cer source
        // find cer source in cache
        let cerPackageCached: CerPackageCached | null = null;
        if (
            tokenMetaData &&
            (this.definition.options.cerSource === 'CACHE' || this.definition.options.cerSource === 'CACHE_THEN_DB')
        ) {
            const cachedData = this.nodeCache.get<CerPackageCached>(`${tokenMetaData._id}`);
            // if cached cer exists, check timestamp
            if (cachedData && cachedData.timestamp === tokenMetaData.cerTimestamp) cerPackageCached = cachedData;
        }
        // find cer source in db
        let cersFound: Array<CerEntity> | null = null;
        if (this.definition.options.cerSource === 'DB' || (!cerPackageCached && this.definition.options.cerSource === 'CACHE_THEN_DB')) {
            const findCersResult = await this.definition.strategy.findCers(request, tokenMetaData, sequenceMetaData);
            if (findCersResult && Array.isArray(findCersResult)) {
                cersFound = findCersResult;
                // store in cache
                this.nodeCache.set(`${tokenMetaData._id}`, {
                    _id: `${tokenMetaData._id}`,
                    timestamp: new Date().toISOString(),
                    cers: cersFound
                })
            }
        }
        // $ expect cers
        // init
        let report: ExpectFunctionReport = {};
        // get owned cers
        let cersOwned: Array<CerEntity> | null = cerPackageCached && Array.isArray(cerPackageCached.cers) ? cerPackageCached.cers : cersFound;
        if (!Array.isArray(cersOwned)) throw { message: 'Owned certificates not found or is invalid.', status: 401 };
        // iterate over all situations
        Object.keys(metdata).forEach((situation: string) => {
            // init
            const situationObject = metdata[situation];
            // ingore non-cer properties
            if (situation === 'options') return;
            // update report
            report[situation] = { errors: [], passed: true, relateds: {} };
            // iterate over all expected packages
            Object.keys(metdata[situation]).forEach((packageName: string) => {
                // init
                const packageObject = situationObject[packageName] || {};
                cersOwned = cersOwned || [];
                // if package name defined in metadata is invalid
                if (!this.definition.cerExamples[packageName]) throw new Error(`Undefined certificate package name in metadata. (package: ${packageName})`);
                // try to find cer in owned cers
                const index = cersOwned.findIndex(t => t.package === packageName);
                // if cer not found
                if (index === -1) {
                    report[situation].passed = false;
                    report[situation].errors.push({
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
                        report[situation].passed = false;
                        report[situation].errors.push({
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
                        report[situation].passed = false;
                        report[situation].errors.push({
                            message: `Found excluded certificate contain ${packageName}.${containName}`,
                            details: {}
                        });
                        return;
                    }
                });
                // add relateds if passed
                if (report[situation].passed) Object.assign(report[situation].relateds, targetOwnedCer.relateds || {});
            });
        });
        // $ return
        return report;
    }

}
