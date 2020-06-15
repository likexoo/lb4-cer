import NodeCache from "node-cache";
import { Context } from "@loopback/context";
import { CerBindings } from "../../index";
import _ from "lodash";
import { Application } from "@loopback/core";
import { v4 as uuidv4 } from 'uuid';

export class CerHelper extends Context {

    private app: Application;

    private insertObjects: Array<{ id: string; key: string; }> = [];

    constructor(app: Application) {
        super();
        this.app = app;
    }

    public async getNodeCache(): Promise<NodeCache> {
        return await this.get(CerBindings.NODE_CACHE);
    }

    public async updateCerDefintion(path: string, val: any): Promise<void> {
        let definition = await this.app.get(CerBindings.DEFINITION);
        _.set(definition, path, val)
        this.app.bind(CerBindings.DEFINITION)
            .to(definition);
    }

    public async insertFromNodeCache(key: string, val: any): Promise<string> {
        let insertId = uuidv4();
        let nodeCacheObject = await this.app.get(CerBindings.NODE_CACHE);
        nodeCacheObject.set(key, val);
        this.insertObjects.push({ id: insertId, key });
        return insertId;
    }

    public async rollbackFromNodeCache(insertId: string): Promise<void> {
        let index = this.insertObjects.findIndex(t => t.id === insertId);
        if (index !== -1) {
            let insertObject = this.insertObjects[index];
            let nodeCacheObject = await this.app.get(CerBindings.NODE_CACHE);
            nodeCacheObject.del(insertObject.key);
            this.insertObjects.splice(index, 1);
        }
    }

}
