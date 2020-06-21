import { credential, BasicCredentialEntity } from "../../../../index";
import { model, property } from "@loopback/repository";
import { ObjectId } from "bson";

@model()
export class AdminCredential extends BasicCredentialEntity {

    @property({
        type: 'string',
        id: true,
        generated: true
    })
    _id?: ObjectId;

    @property({ type: 'string' })
    @credential.code('ADMIN')
    code: string;
    
    @property({ type: 'boolean' })
    @credential.point('UPDATE_EVERYTHING')
    updateEverything: boolean;

    constructor(data?: Partial<AdminCredential>) {
        super(data);
    }
}
