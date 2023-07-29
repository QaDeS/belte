import './handlebarsPlugin'
import { Handlebars } from './handlebarsPlugin'
import { argv } from 'bun';
import { join } from 'path';
import { Entries, Entry, Named, toDict } from './types';
import { nodeAnimationData } from '@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation';
import { mkdirSync } from 'fs';

const lib = argv[2]
const config = await import(`./${lib}/analyze.config.ts`)
const { out, templates, excludeProps, createAugmenter } = config.default
const types = (await import(join(process.cwd(), `types.${lib}.json`))).default as Entry[]

console.log(config)

const allMembers : any = {}
types.forEach((t) => {
    "classes interfaces types enums".split(' ').forEach((k) => {
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

Object.entries(templates).forEach(([t, tpl]) => {
    for( const mod of types) {
        Object.entries(mod.classes).forEach(([name, c]) => {
            if(tpl.supportsClass(c) && c.constructors[0]) {
                const args = c.constructors[0].arguments
                const argNames = args.map(a => a.name)
                const params = [
                    ...args.map((a) => ({name: a.name, type: a.type})),
                    ...Object.values(c.properties)
                ].filter((p) => !(excludeProps ?? []).includes(p.type) && !p.name.startsWith('_') && !p.type?.includes("=>") )
                const updates = params.filter(p => !argNames.includes(p.name)) //.filter((p) => classNames.includes(p.type))
                const ts = params.map((a) => a?.type?.split(/[<>=()[\];|\s+]+/)).flat()
                const imports = new Set(ts.filter((t) => t && classNames.includes(t)))
                const ctx = {
                    entry: mod.name,
                    name: c.name,
                    classChain: c.classChain,
                    methods: c.methods,
                    imports,
                    params: toDict(params),
                    args,
                    updates,
                }
                augmenter(ctx)
                const src = tpl.render(ctx)
                const outPath = join(out ?? "out", lib, t)
                mkdirSync(outPath, {recursive: true})
                Bun.write(join(outPath, c.name + "." + tpl.ext), src)
            }
        })
    }
})