import { Context } from "@loopback/context";

export class SpyHelper extends Context {

    private spyFns: Array<{ flag: string; fn: (...args: any[]) => Promise<any>; }> = [];

    constructor() {
        super();
    }

    public async runSpyFunction(flag: string, ...args: any[]): Promise<any> {
        try {
            let index = this.spyFns.findIndex(t => t.flag === flag);
            return await this.spyFns[index].fn.call(this, ...args);
        } catch (error) {
            return;
        }
    }

    public insertSpyFunction(
        flag: string,
        fn: (...args: any[]) => Promise<any>
    ): void {
        this.spyFns.push({ flag, fn });
    }

    public upsertSpyFunction(
        flag: string,
        fn: (...args: any[]) => Promise<any>
    ): void {
        let index = this.spyFns.findIndex(t => t.flag === flag);
        if (index === -1) this.insertSpyFunction(flag, fn);
        else this.spyFns[index].fn = fn;
    }

}
