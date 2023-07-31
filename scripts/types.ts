export interface Named {
    name: string;
}

export interface ExportedType extends Named {
    sourceLocation: string;
}

export interface Argument extends Named {
    type: string;
}
export type ArgumentList = Argument[];

export interface ExportedEnum extends ExportedType {
    values: string[];
}

export interface ExportedCallable extends ExportedType {
    arguments: ArgumentList;
    returnType?: string;
}
export type ExportedFunction = ExportedCallable
export type ClassMethod = ExportedCallable

export interface Constructor {
    arguments: ArgumentList;
    sourceLocation: string;
}

export interface ClassProperty extends ExportedType {
    type?: string;
}

export interface ExportedMember extends Named {
    isAbstract: boolean;
    classChain: (string | undefined)[];
    constructors: Constructor[];
    methods: Record<string, ClassMethod>;
    properties: Record<string, ClassProperty>;
}

export interface ExportedVariable extends Named {
    functions: Record<string, ExportedFunction>;
}

export interface Members {
    classes: Record<string, ExportedMember>;
    interfaces: Record<string, ExportedMember>;
    types: Record<string, ExportedType>;
    enums: Record<string, ExportedEnum>;
    functions: Record<string, ExportedFunction>;
    variables: Record<string, ExportedVariable>;
    namespaces: Record<string, Entry>
}

export type Entry = Named & Members
export type Entries = Record<string, Entry>

export function toDict<T extends Named>(arr: Array<T>): Record<string, T> {
    const result: Record<string, T> = {}

    for (const item of arr) {
        result[item.name] = item
    }

    return result;
}

