import { SingleExpectReport } from "../type";

export type CredentialAuthSpec = {
    [situation: string]:
    {
        credentials?: {
            [credential_model: string]: {
                [credential_point: string]: CredentialPointChecker;
            };
        }
        checker?: CredentialChecker;
    }
};

export type CredentialChecker =
    (report: SingleExpectReport, sequenceData?: any ) => boolean;

export type CredentialPointChecker =
    ((pointVal: any, sequenceData?: any) => boolean) |
    boolean;
