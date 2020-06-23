import { BasicCredentialEntity } from "../../index";

export type CredentialModel = BasicCredentialEntity & {
    [k: string]: any;
};

export type CredentialCodeSpec = {
    val: string;
}

export type CredentialPointSpec = {
    val: string;
    options?: {
        message?: string;
    }
}

export type CredentialRelevanceSpec = {
    val: string;
}