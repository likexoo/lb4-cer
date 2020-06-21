import { credential, BasicCredentialEntity } from "../../../../index";
import { model, property } from "@loopback/repository";
import { ObjectId } from "bson";

@model()
export class ManagerCredential extends BasicCredentialEntity {

    @property({
        type: 'string',
        id: true,
        generated: true
    })
    _id?: ObjectId;

    @property({ type: 'string' })
    @credential.code('MANAGER')
    code: string;

    @property({ type: 'boolean' })
    @credential.point('UPDATE_STAFF')
    updateStaff: boolean;

    @property({ type: 'number' })
    @credential.point('LEVEL')
    level: number;

    @property({ type: 'object' })
    @credential.relevance()
    belongedCompanyId: ObjectId;

    @property.array(ObjectId)
    @credential.relevance()
    ownedRestaurants: Array<ObjectId>;

    constructor(data?: Partial<ManagerCredential>) {
        super(data);
    }
}
