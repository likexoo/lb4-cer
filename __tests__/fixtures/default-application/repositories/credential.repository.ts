import { BasicCredentialRepository, CredentialModel } from "../../../../index";
import { ObjectId } from "bson";

export class CredentialRepository implements BasicCredentialRepository {

    public async findCredentials(
        id: string | ObjectId,
        sequenceData?: any
    ): Promise<Array<CredentialModel>> {
        return [];
    }

}