import { PropertyDecoratorFactory } from "@loopback/metadata";
import { CredentialAuthBindings } from "../binding";
import { CredentialCodeSpec, CredentialPointSpec, CredentialRelevanceSpec } from "../types/credential.type";

export class credential {

    public static code(
        val: string
    ) {
        return PropertyDecoratorFactory.createDecorator<CredentialCodeSpec>(
            CredentialAuthBindings.CERDENTIALS_CODE_METADATA,
            { val }
        );
    }

    public static point(
        val: string,
        options: { message?: string } = {}
    ) {
        return PropertyDecoratorFactory.createDecorator<CredentialPointSpec>(
            CredentialAuthBindings.CERDENTIALS_POINT_METADATA,
            { val, options }
        );
    }

    public static relevance(
        type: string
    ) {
        return PropertyDecoratorFactory.createDecorator<CredentialRelevanceSpec>(
            CredentialAuthBindings.CERDENTIALS_RELEVANCE_METADATA,
            { val: type }
        );
    }

}


