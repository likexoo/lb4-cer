# lb4-cer

A LoopBack component for permission authentication support.

This module is NOT ready for widespread use, and is currently only used by the developer's company.

## Basic concepts

- `Certificate` - Carrier of authority, stored in database.
- `Strategy Class` - Class has function that return certificates according to the request and metadata in sequence.

## How to use

Step 1: Create Definition

```ts
// xxx.definition.ts
export const Definition: CerDefinition = {
    options: {
        cerSource: 'CACHE'
    },
    strategy: new TestStrategy(),
    cerExamples: {
        'BOSS_PERMISSION': {
            CREATE_STAFF: true,
            READ_STAFF: true,
            UPDATE_STAFF: true
        },
        'ADMIN_PERMISSION': {
            UPDATE_EVERYTHING: true
        }
        // ...
    }
};

class TestStrategy implements CerStrategy {

    public async findCers(
        request: Request,
        tokenMetaData: CerTokenMetadata | undefined,
        sequenceData: any | undefined
    ): Promise<Array<CerEntity>> {
        // get and return cers from database
    }

    // ...

}
```

Step 2: Install Component

```ts
// application.ts

this.bind(CerBindings.DEFINITION).to(CerDefinition);
this.component(CerComponent);

```

Step 3: Using In Your Sequence

```ts
// sequence.ts

export class DefaultSequence implements SequenceHandler {

    constructor(
        @inject.getter(CerBindings.EXPECT_FUNCTION) public expectFunction: Getter<ExpectFunction>
        // ...
    ) { }

    async handle(context: RequestContext) {
        const cerReport: ExpectFunctionReport | undefined = await (await this.expectFunction())(request);
        // do somthing with `cerReport` ...
        // example 1: Check the report, throw an exception if the authentication fails
        if (cerReport.overview.passedSituations.length === 0) throw { statusCode: 401, message: '...' };
        // example 2: Bind the report to controller, use it in the corresponding method
        context.bind('cer.report').to(cerReport).inScope(BindingScope.TRANSIENT);
    }

}

```

Step 4: Using @cer In Your Controller

```ts
// xxx.controller.ts

export class TestController {

    constructor(
        // if you are already bound `cerReport` in the sequence
        @inject('cer.report') private cerReport: ExpectFunctionReport | undefined
    ) { }

    /**
     * Declare that to call this method, you need meet at least one situations (situation0 and situation1), 
     * each of which requires the necessary certificate.
     */
    @cer({
        // require `BOSS_PERMISSION.UPDATE_STAFF`
        situation0: {
            'BOSS_PERMISSION': {
                UPDATE_STAFF: true
            }
        },
        // require `ADMIN_PERMISSION.UPDATE_EVERYTHING`
        situation1: {
            'ADMIN_PERMISSION': {
                UPDATE_EVERYTHING: true
            }
        }
    })
    @patch('/v1/staff')
    async updateOneStaff() {
        // ...
    }

}

```
