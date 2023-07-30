import './handlebarsPlugin'
import * as fs from 'node:fs';
import { dirname, join } from 'node:path';
import ts, { Type } from "typescript"
import { Project, SourceFile, Symbol as MSymbol, PropertySignature, VariableDeclaration, ClassDeclaration, ConstructorDeclaration, MethodDeclaration, FunctionDeclaration, TypeNode, ParameterDeclaration, Signature, InterfaceDeclaration, MethodSignature, PropertyDeclaration, SetAccessorDeclaration } from "ts-morph";
import { argv } from 'bun';
import { ClassMethod, ClassProperty, Constructor, Entries, Entry, Named, toDict } from './types';
import { Scope } from 'ts-morph';


const lib = argv[2]
const config = await import(`./${lib}/analyze.config.ts`)
const {root, entries} = config.default
console.log(lib, root, entries, config)

const project = new Project();
const entryFiles: Record<string, SourceFile> = {}
entries.forEach((entry) => {
  const mod = entry
  const filename = join(root, mod, `index.d.ts`)
  entryFiles[mod] = project.addSourceFilesAtPaths([filename])[0]
})

console.log(Object.keys(entryFiles))

function hasSceneAsLastArg(declaration : MethodDeclaration | ConstructorDeclaration | FunctionDeclaration) {
  const parameters = declaration?.getParameters();
  if (!parameters || parameters.length < 2) return false
  const lastParameterType = parameters[parameters.length - 1].getType();
  if (lastParameterType?.getSymbol()?.getName() === "Scene") return true;
  return false
}

function getClassChain(cls : ClassDeclaration | InterfaceDeclaration) {
  const result : (ClassDeclaration | InterfaceDeclaration | Type)[] = []
  let c : ClassDeclaration | InterfaceDeclaration | undefined = cls
  while( c ) {
    result.push(c)
    result.push(...(c?.getBaseTypes() ?? []))
    if(c.getBaseClass) {
      c = c.getBaseClass()
    } else {
      c = undefined
    }
  }
  return result.reverse() // make sure subclasses can overwrite superclass members
}

/**
 * 
 * @param p Returns the properly formatted TypeScript argument type
 * @returns 
 */
function toSymbol(t : TypeNode, p? : ParameterDeclaration) : string  {
  return t.getText(p, ts.TypeFormatFlags.NoTruncation )
}

function toLoc(m : any) : string {
  return `${m.getSourceFile().getFilePath()}:${m.getStartLineNumber()}`
}

function mapArguments(params : ParameterDeclaration[]) : ArgumentList {
  return params.map((p) => ({
    name: p.getName(),
    optional: p.hasQuestionToken(),
    type: toSymbol(p.getType(), p),
  }))
}

function getCircularReplacer(depth = 5) {
  const ancestors = [];
  return function (key, value) {
    if( ancestors.length > depth ) return "ignored"

    if (typeof value !== "object" || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    ancestors.push(value);
    return value;
  };
}

function toMethod(m : MethodDeclaration | MethodSignature) : ClassMethod {
  return {
    name: m.getName(),
    arguments: mapArguments(m.getParameters()),
    returnType: toSymbol(m.getReturnType()),
    sourceLocation: toLoc(m),
  }
}

function toProperty(p : PropertyDeclaration | PropertySignature | SetAccessorDeclaration) : ClassProperty {
  return {
    name: p.getName(),
    type: toSymbol(p.getType()),
    sourceLocation: toLoc(p),
  }
}

function toEntry(mod: string, file : SourceFile) : Entry {
  const e : Entry = {
    name: mod,
    classes: {},
    interfaces: {},
    types: {},
    enums: {},
    functions: {},
    variables: {},
    namespaces: {},
  }
  
  console.log(mod, toLoc(file))
  for( const [key, [decl]] of file.getExportedDeclarations() ) {
    // console.log(key, decl.getKindName())
    switch(decl.getKind()) {
      case ts.SyntaxKind.ClassDeclaration: {
        //console.log("  Class", decl.getName(), decl.getConstructors().length)
        const cd = decl as ClassDeclaration

        const cname = decl.getSymbol()?.getName()
        if (!cname) continue
        // console.log(cname, toLoc(cd))

        const constructors = cd.getConstructors().map((c) : Constructor => ({
          name: cname,
          arguments: mapArguments(c.getParameters()),
          sourceLocation: toLoc(c),
        }))

        const classChain = getClassChain(cd)

        const methods = cd.getMethods().filter(p => p.getScope() === Scope.Public && !p.isStatic()).map(toMethod)

        const properties = [
          ...cd.getSetAccessors().filter(p => p.getScope() === Scope.Public && !p.isStatic())
          , ...cd.getProperties().filter(p => p.getScope() === Scope.Public && !p.isReadonly() && !p.isStatic())
        ].map(toProperty)

        e.classes[key] = {
          name: cname,
          isAbstract: cd.isAbstract(),
          classChain: classChain.map((c) => c.getSymbol()?.getName()),
          constructors,
          methods: toDict(methods),
          properties: toDict(properties),
        }

        break;
      }
      case ts.SyntaxKind.InterfaceDeclaration: {
        // console.log("Intf", decl.getName())
        const id = decl as InterfaceDeclaration
        const classChain = getClassChain(id)
        e.interfaces[key] = {
          name: key,
          isAbstract: true,
          classChain: classChain.map((c) => c.getSymbol()?.getName()),
          constructors: [],
          methods: toDict(id.getMethods().map(toMethod)),
          properties: toDict(id.getProperties().map(toProperty)),
        }
        break;
      }
      case ts.SyntaxKind.VariableDeclaration: {
        break;
        const vd = decl as VariableDeclaration
        const stmt = vd.getVariableStatement()
        if (!stmt) continue

        stmt.getDeclarations().forEach((d : VariableDeclaration) => {
          const vname = d.getName()
          if( !vname || vname != "MeshBuilder" ) return
          // console.log("Var", vd.getName(), vd.getType().getText())
          console.log(toLoc(vd))
  
          const type = d.getType()
          if (!type) return

          type.getProperties().forEach((p : MSymbol) => {
            const name = p.getName()
            if (!name) return
            const s = d.getLocal(name)
            console.log("  ", name, toLoc(s?.getDeclarations()[0]))
            p.getDeclaredType().getCallSignatures().forEach((s) => {
              console.log("    ", s.getParameters().map((p) => p.getName()).join(", "))
            })
            const dec = p.getValueDeclaration()
            if(!dec) console.log("no value")
            console.log(toLoc(project.getLanguageService().getImplementations(dec)[1].getNode()))
            p.getDeclarations().forEach((d) => {
              console.log("    ", d.getText())
            })
          })

          const functions = stmt.getFunctions().map((f) => ({
            name: f.getName(),
            arguments: mapArguments(f.getParameters()),
            returnType: toSymbol(f.getReturnType()),
            sourceLocation: toLoc(f),
          }))
          e.variables[vd.getName()] = {
            name: vd.getName(),
            functions: toDict(functions),
          }
        })

        // console.log("Var", vd.getName(), vd.getType().getText())
        break;
      }
      case ts.SyntaxKind.FunctionDeclaration: {
        // console.log("Func", key, decl.getName(), toLoc(decl))
        e.functions[key] = {
          name: decl.getName(),
          arguments: mapArguments(decl.getParameters()),
          returnType: toSymbol(decl.getReturnType()),
          sourceLocation: toLoc(decl),
        }
        break;
      }
      case ts.SyntaxKind.EnumDeclaration: {
        // console.log("Enum", decl.getName())
        e.enums[key] = {
          name: decl.getName(),
          members: decl.getMembers().map((m) => m.getName()),
          sourceLocation: toLoc(decl),
        }
        break;
      }
      case ts.SyntaxKind.TypeAliasDeclaration: {
        e.types[key] = {
          name: key,
          sourceLocation: toLoc(decl),
        }
        break;
      }
      case ts.SyntaxKind.ModuleDeclaration: {
        e.namespaces[key] = toEntry(decl.getName(), decl)
        break;
      }
      case ts.SyntaxKind.SourceFile: {
        e.namespaces[key] = toEntry(key, decl)
        break;
      }
      default:
        console.log("--- unknown", key, decl.getKindName(), toLoc(decl))
        break;
    
    }
  }
  return e
}

const es : Entry[] = []
for(const [mod, file] of Object.entries(entryFiles)) {
  console.log("\n", file.getFilePath())
  es.push(toEntry(mod, file))
}

// write es to results.json
fs.writeFileSync(`types.${lib}.json`, JSON.stringify(es, null, 2))
