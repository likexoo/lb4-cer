# lb4-cer

A LoopBack component for permission authentication support.

This module is NOT ready for widespread use, and is currently only used by the developer's company.

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
        '00': {
            a: true
        },
        '01': {
            a: true,
            b: true
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