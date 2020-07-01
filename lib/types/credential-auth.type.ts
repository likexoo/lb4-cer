import { SingleExpectReport } from "../type";

export type CredentialAuthSpec = {
    situations: {
        [situation: string]: {
            credentials?: {
                [credential_model: string]: {
                    [credential_point: string]: CredentialPointChecker;
                };
            }
            checker?: CredentialChecker;
        };
    }
    options?: CredentialAuthOptions;
};

export type CredentialAuthOptions = {
    optional: boolean;
}

export type CredentialChecker =
    (report: SingleExpectReport, sequenceData?: any) => boolean;

export type CredentialPointChecker =
    ((pointVal: any, sequenceData?: any) => boolean) |
    boolean;
