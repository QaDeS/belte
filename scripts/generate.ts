import './handlebarsPlugin'
import { Handlebars } from './handlebarsPlugin'
import { argv } from 'bun';
import { join } from 'path';
import { Entries, Entry, Named, toDict } from './types';
import { nodeAnimationData } from '@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation';
import { mkdirSync } from 'fs';

const lib = argv[2]
const config = await import(`./${lib}/analyze.config.ts`)
const { out, templates, excludeProps } = config.default
const types = (await import(join(process.cwd(), `types.${lib}.json`))).default as Entry[]

console.log(config)

const classNames = [...new Set([
    ...types.map((mod) => [
        ...Object.keys(mod.classes),
        ...Object.keys(mod.interfaces),
        ...Object.keys(mod.types),
        ...Object.keys(mod.enums)    
    ])
].flat())].sort()
console.log(classNames)
Object.entries(templates).forEach(([t, tpl]) => {
    for( const mod of types) {
        Object.entries(mod.classes).forEach(([name, c]) => {
            if(name.endsWith(t) && c.constructors[0]) {
                const args = c.constructors[0].arguments
                const argNames = args.map(a => a.name)
                const params = [
                    ...args.map((a) => ({name: a.name, type: a.type})),
                    ...Object.values(c.properties)
                ].filter((p) => !(excludeProps ?? []).includes(p.type) && !p.name.startsWith('_') && !p.name.startsWith('on') )
                const updates = params.filter(p => !argNames.includes(p.name)) //.filter((p) => classNames.includes(p.type))
                const ts = params.map((a) => a?.type?.split(/[<>=()[\]|\s+]+/)).flat()
                const imports = new Set(ts.filter((t) => t && classNames.includes(t)))
                const ctx = {
                    entry: mod.name,
                    name: c.name,
                    imports,
                    params: toDict(params),
                    args,
                    updates,
                }
                const src = tpl.render(ctx)
                const outPath = join(out ?? "out", lib, t)
                mkdirSync(outPath, {recursive: true})
                Bun.write(join(outPath, c.name + "." + tpl.ext), src)
            }
        })
    }
})