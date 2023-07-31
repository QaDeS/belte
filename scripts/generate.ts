import './handlebarsPlugin'
import { argv } from 'bun';
import { join } from 'path';
import { Members, Entry, toDict } from './types';
import { mkdirSync } from 'fs';

const lib = argv[2]
const config = await import(`./${lib}/analyze.config.ts`)
const { out, getTemplates, excludeProps, createAugmenter } = config.default
const types = (await import(join(process.cwd(), `types.${lib}.json`))).default as Entry[]

console.log(config)

const allMembers : Members = {}
types.forEach((t) => {
    "classes interfaces types enums functions".split(' ').forEach((k) => {
        allMembers[k] = Object.assign({}, allMembers[k], t[k])
    })
})

const classNames = [...new Set([
    ...Object.keys(allMembers.classes),
    ...Object.keys(allMembers.interfaces),
    ...Object.keys(allMembers.types),
    ...Object.keys(allMembers.enums),
    ...Object.keys(allMembers.functions),
].flat())].sort()
allMembers.classNames = classNames

const augmenter = createAugmenter ? createAugmenter(allMembers) : (ctx) => {/* do nothing */ }
const templates = getTemplates(allMembers)

Object.entries(templates).forEach(([t, tpl]) => {
    for (const mod of types) {
        const constructors = Object.entries(mod.classes)
            .filter(([name, c]) => (tpl.supportsClass(c) && c.constructors[0]))
            .map(([name, c]) => ({
                tplName: name,
                type: c,
                entry: mod.name,
                name: c.name,
                classChain: c.classChain,
                methods: c.methods,
                args: c.constructors[0].arguments,
                properties: c.properties
            }))

        const factories = {}
        Object.entries(mod.functions)
            .filter(([name, f]) => (classNames.includes(f.returnType) && tpl.supportsFunction(f)))
            .forEach(([name, f]) => factories[f.returnType] = [...(factories[f.returnType] ?? []), f])

        const factoryContexts = Object.entries(factories).map(([name, fs]) => {
            const c = allMembers.classes[name]
            return fs.map((f) => ({
                tplName: f.name, // TODO remove Create
                factory: f,
                type: c,
                entry: mod.name,
                name: f.name,
                classChain: c.classChain,
                methods: c.methods,
                args: f.arguments,
                properties: c.properties
            }))
        }).flat()

        const contexts = [...constructors, ...factoryContexts]
        // augment properties and methods from the classChain
        contexts.forEach((ctx) => {
            const superClasses = ctx.classChain
            .map((scn) => allMembers.classes[scn])
            ctx.properties = Object.assign({}, ...(superClasses.map((sc) => sc.properties)))
            ctx.methods = Object.assign({}, ...(superClasses.map((sc) => sc.methods)))
        })
        contexts.forEach((ctx) => {
            augmenter(ctx)

            const argNames = ctx.args.map(a => a.name)
            const props = Object.values(ctx.properties).filter((p) => !(excludeProps ?? []).includes(p.type) && !p.name.startsWith('_') && !p.name.startsWith('on') && (!p.type?.includes("=>") | p.type.endsWith('}')))
            const params = [
                ...ctx.args.filter((p) => !(excludeProps ?? []).includes(p.type)).map((a) => ({ name: a.name, type: a.type })),
                ...props,
            ]
            const updates = props //.filter(p => !argNames.includes(p.name)) //.filter((p) => classNames.includes(p.type))
            const ts = params.map((a) => a?.type?.split(/[<>=()[\];|\s+]+/)).flat()
            const symbols = [ctx.nodeType, ctx.name, ctx.factory?.name, ...ts]
            const imported = [...new Set(symbols.filter((t) => t && classNames.includes(t)))]
            const typeImports = imported.filter((i) => allMembers.interfaces[i] || (allMembers.classes[i] && allMembers.classes[i].isAbstract))
            const imports = imported.filter((i) => !typeImports.includes(i))

            ctx.params = toDict(params)
            ctx.updates = updates
            ctx.imports = imports // TODO order by entry
            ctx.typeImports = typeImports

            const src = tpl.render(ctx)
            const outPath = join(out ?? "out", lib, t)
            mkdirSync(outPath, { recursive: true })
            Bun.write(join(outPath, ctx.tplName + "." + tpl.ext), src)
        })
    }
})