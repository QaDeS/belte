import './handlebarsPlugin'
import { Handlebars } from './handlebarsPlugin'
import { argv } from 'bun';
import { join } from 'path';
import { Entries, Entry, Named, toDict } from './types';
import { nodeAnimationData } from '@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation';
import { mkdirSync } from 'fs';

const lib = argv[2]
const config = await import(`./${lib}/analyze.config.ts`)
const { out, getTemplates, excludeProps, createAugmenter } = config.default
const types = (await import(join(process.cwd(), `types.${lib}.json`))).default as Entry[]

console.log(config)

const allMembers : any = {}
types.forEach((t) => {
    "classes interfaces types enums functions".split(' ').forEach((k) => {
        allMembers[k] = Object.assign({}, allMembers[k], t[k])
    })
})

const classNames = [...new Set([
    ...Object.keys(allMembers.classes),
    ...Object.keys(allMembers.interfaces),
    ...Object.keys(allMembers.types),
    ...Object.keys(allMembers.enums)    
].flat())].sort()
const augmenter = createAugmenter ? createAugmenter(allMembers) : (ctx) => {/* do nothing */}
const templates = getTemplates(allMembers)

Object.entries(templates).forEach(([t, tpl]) => {
    for( const mod of types) {
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

        const factories = Object.entries(mod.functions)
            .filter(([name, f]) => (classNames.includes(f.returnType) && tpl.supportsFunction(f)))
            .map(([name, f]) => {
                const c = allMembers.classes[f.returnType]
                return {
                    tplName: c.name,
                    factory: name,
                    type: c,
                    entry: mod.name,
                    name: c.name,
                    classChain: c.classChain,
                    methods: c.methods,
                    args: f.arguments,
                    properties: c.properties
                }
        })

        const contexts = [...constructors, ...factories]
        contexts.forEach((ctx) => {
            augmenter(ctx)

            const argNames = ctx.args.map(a => a.name)
            const params = [
                ...ctx.args.map((a) => ({name: a.name, type: a.type})),
                ...Object.values(ctx.properties)
            ].filter((p) => !(excludeProps ?? []).includes(p.type) && !p.name.startsWith('_') && !p.type?.includes("=>") )
            const updates = params.filter(p => !argNames.includes(p.name)) //.filter((p) => classNames.includes(p.type))
            const ts = params.map((a) => a?.type?.split(/[<>=()[\];|\s+]+/)).flat()
            const symbols = [...ts, ctx.factory, ctx.type.name]
            const imports = new Set(symbols.filter((t) => t && classNames.includes(t)))

            ctx.params = toDict(params)
            ctx.updates = updates
            ctx.imports = imports // TODO order by entry

            const src = tpl.render(ctx)
            const outPath = join(out ?? "out", lib, t)
            mkdirSync(outPath, {recursive: true})
            Bun.write(join(outPath, ctx.tplName + "." + tpl.ext), src)
        })
    }
})