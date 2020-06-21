import { Entity } from "@loopback/repository";
import { MetadataInspector } from "@loopback/metadata";
import { CredentialPointSpec } from "../types/credential.type";
import _ from "lodash";

export class BasicCredentialEntity extends Entity {

    constructor(...args: any[]) {
        super(...args);
    }

    private getMetadataKeysByRegularExpression(reg: RegExp): any[] {
        try {
            const keys = MetadataInspector.Reflector.getMetadataKeys(this);
            return _.filter(keys, element => reg.test(element));
        } catch (error) {
            return [];
        }
    };

    private getMetadataByRegularExpression(reg: RegExp): Array<{ metadata: any; target: any; }> {
        try {
            const keys = MetadataInspector.Reflector.getMetadataKeys(this);
            const targetKeys = _.filter(keys, element => reg.test(element));
            let metadatas: Array<{ metadata: any; target: any; }> = [];
            for (let k of targetKeys) {
                let m = MetadataInspector.Reflector.getMetadata(k, this) || {};
                let mKeys = Object.keys(m);
                if (mKeys.length > 0)
                    metadatas.push(...(mKeys.map(mk => ({ metadata: _.get(m, mk), target: mk }))))
            }
            return metadatas;
        } catch (error) {
            return [];
        }
    };

    public getCode(): string | undefined {
        const metadatas = this.getMetadataByRegularExpression(/^(module.credentialAuth.codeMetadata)$/i);
        return _.get(metadatas, '[0].metadata.val');
    }

    public findPoint(code: string): any {
        let val: any = undefined;
        const metadatas = this.getMetadataByRegularExpression(/^(module.credentialAuth.pointMetadata)$/i);
        for (let m of metadatas) {
            if (_.get(m, 'metadata.val') === code) {
                val = _.get(this, m.target);
                break;
            }
        }
        return val;
    }

    public getRelevances(): Array<{ key: string; value: any, metadata: CredentialPointSpec; }> {
        const metadatas = this.getMetadataByRegularExpression(/^(module.credentialAuth.relevanceMetadata)$/i);
        return metadatas.map(m => ({ key: m.target, value: _.get(this, m.target), metadata: m.metadata }));
    }

}