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
    strategy: <Your_Strategy_Class>,
    cerExamples: {
        'BOSS_PERMISSION': {
            CREATE_STAFF: true,
            READ_STAFF: true,
            UPDATE_STAFF: true,
            UPDATE_STAFF: true
        },
        'ADMIN_PERMISSION': {
            UPDATE_EVERYTHING: true
        }
        // ...
    }
};
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
        // ...
    }

}

```

Step 4: Using @cer In Your Controller

```ts
// xxx.controller.ts

export class TestController {

    constructor( ) { }

    @cer(
        {
            situation0: {
                'BOSS_PERMISSION': {
                    UPDATE_STAFF: true
                }
            },
            situation1: {
                'ADMIN_PERMISSION': {
                    UPDATE_EVERYTHING: true
                }
            }
        }
    )
    @patch('/v1/staff')
    async updateOneStaff() {
        // ...
    }

}

```
