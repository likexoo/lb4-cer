import { BasicCredentialEntity } from "../../index";

export type CredentialModel = BasicCredentialEntity & {
    [k: string]: any;
};

export type CredentialCodeSpec = {
    val: string;
}

export type CredentialPointSpec = {
    val: string;
}

export type CredentialRelevanceSpec = {
}