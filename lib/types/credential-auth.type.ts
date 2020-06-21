
export type CredentialAuthSpec = {
    [situation: string]: {
        [credential_model: string]: {
            [credential_point: string]: CredentialPointChecker;
        };
    }
};

export type CredentialPointChecker =
    ((pointVal: any) => boolean) |
    boolean;