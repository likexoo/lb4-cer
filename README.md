# LB4 Credential Auth

A LoopBack4 component for credential authentication support.

This module is NOT ready for widespread use, and is currently only used by the developer's company.

[![Build Status](https://travis-ci.org/likexoo/lb4-credential-auth.svg?branch=master)](https://travis-ci.org/likexoo/lb4-credential-auth)
[![npm version](https://badge.fury.io/js/lb4-credential-auth.svg)](https://www.npmjs.com/package/lb4-credential-auth)

## Quick Introduction

Step 1: Build Definition & Repository & Models

```ts
// xxx.definition.ts
export const Definition: Definition = {
    credentialSource: 'CACHE_THEN_DB'
    credentialRepository: new CredentialRepository()
};

// xxx.repository.ts
export class CredentialRepository implements BasicCredentialRepository {

    public async findCredentials(
        id: string | ObjectId,
        sequenceData?: any
    ): Promise<Array<CredentialModel>> {
        // Find credentials by id and helpeful data from sequence in your database.
        // For example, you can get the user's credentials based on the user id.
    }

}

// xxx.model.ts
@model()
export class ManagerCredential extends BasicCredentialEntity {

    @property({
        type: 'string',
        id: true,
        generated: true
    })
    _id?: ObjectId;

    // The credential code
    @property({ type: 'string' })
    @credential.code('MANAGER')
    code: string;

    /*
     * The credential point, here we use this property to decide whether 
     * credential owner can update `staff` resource.
     */
    @property({ type: 'boolean' })
    @credential.point('UPDATE_STAFF')
    updateStaff: boolean;

    /*
     * The credential point, here we use this property to indicate the 
     * credential owner's permission level.
     */
    @property({ type: 'number' })
    @credential.point('LEVEL')
    level: number;

    constructor(data?: Partial<ManagerCredential>) {
        super(data);
    }
}
```

Step 2: Install Component

```ts
// application.ts
this.bind(CredentialAuthBindings.DEFINITION).to(Definition);
this.component(CerComponent);
```

Step 3: Using In Your Sequence

```ts
// sequence.ts
export class DefaultSequence implements SequenceHandler {

    constructor(
        @inject.getter(CredentialAuthBindings.EXPECT_FUNCTION) public expectFunction: Getter<ExpectFunction>
    ) { }

    async handle(context: RequestContext) {

        // do credential authentication here
        const report: ExpectFunctionReport | undefined = await (await this.expectFunction())(id, statusId, sequenceMetaData);

        // Now you can do somthing with `report` ...
        // Example 1: Check the report, throw an exception if the authentication fails
        if (cerReport.overview.passedSituations.length === 0) throw { statusCode: 401, message: '...' };
        // Example 2: Bind the report to controller, use it in the corresponding method
        context.bind('cauth.report').to(report).inScope(BindingScope.TRANSIENT);
    }

}
```

Step 4: Using @cauth In Your Controller

```ts
// xxx.controller.ts

export class TestController {

    constructor(
        // if you are already bound `report` in the sequence
        @inject('cauth.report') private report: ExpectFunctionReport | undefined
    ) { }

    /**
     * Declare that to call this method, you need meet at least one situations (situation0 and situation1), 
     * each of which requires the necessary certificate.
     */
    @cauth({
        /*
         * Situation 0 Credential Requirements:
         * 1. require `MANAGER` credential.
         * 2. require `MANAGER.UPDATE_STAFF` is true.
         */
        situation0: {
            'MANAGER': {
                UPDATE_STAFF: true
            }
        },
        /*
         * Situation 1 Credential Requirements:
         * 1. require `MANAGER` credential.
         * 2. require `MANAGER.UPDATE_STAFF` is true.
         * 3. require `MANAGER.LEVEL` greater than 10.
         */
        situation1: {
            'MANAGER': {
                UPDATE_STAFF: true,
                LEVEL: (val: number) => val >= 10
            }
        }
    })
    @patch('/v1/staff')
    async updateOneStaff() {
        // So write different service logic according to different situations.
        // ...
    }

}

```
