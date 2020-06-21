import { ObjectId } from "bson";
import { CredentialModel } from "../../index";

export interface BasicCredentialRepository {

    findCredentials(
        id: string | ObjectId,
        sequenceData?: any
    ): Promise<Array<CredentialModel>>;

}