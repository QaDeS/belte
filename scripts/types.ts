interface ExportedType {
    name: string;
    sourceLocation: string;
}

interface Argument {
    name: string;
    type: string;
}
type ArgumentList = Argument[];

interface ExportedEnum {
    name: string;
    values: string[];
    sourceLocation: string;
}

interface ExportedFunction {
    name: string;
    arguments: ArgumentList;
    returnType?: string;
    sourceLocation: string;
}

interface IClassMethod {
    arguments: ArgumentList;
    returnType?: string;
    sourceLocation: string;
}
export type ClassMethod = IClassMethod & Named

interface IConstructor {
    arguments: ArgumentList;
    sourceLocation: string;
}
export type Constructor = IConstructor & Named

interface IClassProperty {
    type?: string;
    sourceLocation: string;
}
export type ClassProperty = IClassProperty & Named

interface ExportedMember {
    name: string;
    isAbstract: boolean;
    classChain: (string | undefined)[];
    constructors: Constructor[];
    methods: Record<string, ClassMethod>;
    properties: Record<string, ClassProperty>;
}

interface ExportedVariable {
    name: string;
    functions: Record<string, ExportedFunction>;
}

export interface Entry {
    name: string;
    classes: Record<string, ExportedMember>;
    interfaces: Record<string, ExportedMember>;
    types: Record<string, ExportedType>;
    enums: Record<string, ExportedEnum>;
    functions: Record<string, ExportedFunction>;
    variables: Record<string, ExportedVariable>;
    namespaces: Record<string, Entry>
}
export type Entries = Record<string, Entry>

export interface Named {
    name: string;
}

export function toDict<T extends Named>(arr : Array<T>): Record<string, T> {
    const result : Record<string, T> = {}
  
    for(const item of arr) {
      result[item.name] = item
    }
  
    return result;
  }
  
  