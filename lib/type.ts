import { ObjectId } from 'bson';
import { AnyObject } from '@loopback/repository';
import { CredentialModel } from './types/credential.type';
import { BasicCredentialRepository } from './repositories/basic-credential.repository';

export type MetadataReport<T = AnyObject> = { key: any; value: any; metadata: T; };

export type Definition = {
    credentialSource: 'CACHE' | 'DB' | 'CACHE_THEN_DB';
    credentialRepository: BasicCredentialRepository;
};

export type UpdateFunction = (
    id: string | ObjectId,
    cers: Array<CredentialModel>
) => Promise<void>;

export type ExpectFunction = (
    id: string | ObjectId,
    statusId: string,
    sequenceMetaData?: any
) => Promise<ExpectFunctionReport | undefined>;

export type ExpectFunctionReport = {
    overview: {
        passedSituations: Array<string>;
        unpassedSituations: Array<string>;
        ownedCredentials: Array<CredentialModel>;
        credentialSource: 'CACHE' | "DB" | 'UNDEFINED';
    };
    details: {
        [situation: string]: {
            errors: Array<{ message: string; details: AnyObject; }>;
            passed: boolean;
            relevances: Array<AnyObject>;
        };
    }
    statusId: string | undefined;
};

export type CredentialCached = {
    id: string | ObjectId;
    statusId: string;
    credentials: Array<CredentialModel>;
};

export type PropType<T, P extends keyof T> = T[P];
