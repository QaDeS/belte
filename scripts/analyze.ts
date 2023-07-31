import './handlebarsPlugin'
import * as fs from 'node:fs';
import { join } from 'node:path';
import ts from "typescript"
import { Project, SourceFile, Symbol as MSymbol, PropertySignature, VariableDeclaration, ClassDeclaration, MethodDeclaration, FunctionDeclaration, TypeNode, ParameterDeclaration, InterfaceDeclaration, MethodSignature, PropertyDeclaration, SetAccessorDeclaration, Type, EnumDeclaration, ModuleDeclaration } from "ts-morph";
import { argv } from 'bun';
import { ArgumentList, ClassMethod, ClassProperty, Constructor, Entry, toDict } from './types';
import { Scope } from 'ts-morph';
import { Node } from 'ts-morph';


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

// console.log(Object.keys(entryFiles))

function getClassChain(cls : ClassDeclaration | InterfaceDeclaration) : string[] {
  const result : (string | undefined)[] = []
  const todo : Array<ClassDeclaration | InterfaceDeclaration | undefined> = [cls]
  while( todo.length ) {
    const c = todo.shift()
    if( !c ) continue

    result.push(toName(c))

    result.push(...(c?.getBaseTypes() ?? []).map(toName))

    const heritages = c.getHeritageClauses()
    const typeNodes = heritages.map((h) => h.getTypeNodes()).flat()
    const typeArgs = typeNodes.map((n) => n.getText())
    result.push(...typeArgs)
    result.push(...([].flat().map(e => e?.getTypeNodes() ?? []).flat().map(e => e?.getTypeArguments()).flat()).map(toName))
    
    if( !c['getBaseClass'] ) continue;
    todo.push((c as ClassDeclaration).getBaseClass())
  }
  return [...new Set(result)].reverse().filter(Boolean) // make sure subclasses can overwrite superclass members
}

function toName(c : any /* TODO specify */) {
  return c?.getSymbol()?.getName()
}

/**
 * 
 * @param p Returns the properly formatted TypeScript argument type
 * @returns 
 */
function toSymbol(t : Type, p? : ParameterDeclaration) : string  {
  return t.getText(p, ts.TypeFormatFlags.NoTruncation )
}

function toLoc(m : Node) : string {
  return `${m.getSourceFile().getFilePath()}:${m.getStartLineNumber()}`
}

function mapArguments(params : ParameterDeclaration[]) : ArgumentList {
  return params.map((p) => ({
    name: p.getName(),
    optional: p.hasQuestionToken(),
    type: toSymbol(p.getType(), p),
  }))
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
  
  console.log("Processing", mod, toLoc(file))
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
          // name: cname,
          arguments: mapArguments(c.getParameters()),
          sourceLocation: toLoc(c),
        }))

        const methods = cd.getMethods().filter(p => p.getScope() === Scope.Public && !p.isStatic()).map(toMethod)

        const properties = [
          ...cd.getSetAccessors().filter(p => p.getScope() === Scope.Public && !p.isStatic())
          , ...cd.getProperties().filter(p => p.getScope() === Scope.Public && !p.isReadonly() && !p.isStatic())
        ].map(toProperty)

        e.classes[key] = {
          name: cname,
          isAbstract: cd.isAbstract(),
          classChain: getClassChain(cd),
          constructors,
          methods: toDict(methods),
          properties: toDict(properties),
        }

        break;
      }
      case ts.SyntaxKind.InterfaceDeclaration: {
        // console.log("Intf", decl.getName())
        const id = decl as InterfaceDeclaration
        e.interfaces[key] = {
          name: key,
          isAbstract: true,
          classChain: getClassChain(id),
          constructors: [],
          methods: toDict(id.getMethods().map(toMethod)),
          properties: {} //toDict(id.getProperties().map(toProperty)),
        }
        break;
      }
      case ts.SyntaxKind.VariableDeclaration: {
        /* FIXME
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
        */
        break;
      }
      case ts.SyntaxKind.FunctionDeclaration: {
        // console.log("Func", key, decl.getName(), toLoc(decl))
        const fdecl = decl as FunctionDeclaration
        const fname = fdecl.getName()
        if( !fname ) break;

        e.functions[key] = {
          name: fname,
          arguments: mapArguments(fdecl.getParameters()),
          returnType: toSymbol(fdecl.getReturnType()),
          sourceLocation: toLoc(fdecl),
        }
        break;
      }
      case ts.SyntaxKind.EnumDeclaration: {
        // console.log("Enum", decl.getName())
        const edecl = decl as EnumDeclaration
        e.enums[key] = {
          name: edecl.getName(),
          values: edecl.getMembers().map((m) => m.getName()),
          sourceLocation: toLoc(edecl),
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
        const mdecl = (decl as ModuleDeclaration)
        e.namespaces[key] = toEntry(mdecl.getName(), mdecl) // FIXME
        break;
      }
      case ts.SyntaxKind.SourceFile: {
        e.namespaces[key] = toEntry(key, decl as SourceFile)
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
