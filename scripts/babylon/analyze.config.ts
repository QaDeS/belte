const Node = await import('./Node.svelte.handlebars')

export default {
    out: "src/lib/gen",
    root: "./node_modules",
    entries: 'core materials gui loaders post-processes procedural-textures serializers'.split(" ")
        .map((m) => `@babylonjs/${m}`),
    
    createAugmenter(types) {
        const scene = types.classes.Scene
        const removeMethods = Object.values(scene.methods).filter((m) => m.name.startsWith('remove'))
        const nodeTypes = removeMethods.map((m) => m.arguments[0].type)

        return function augment(ctx) {
            ctx.nodeType = ctx.classChain.find((c) => nodeTypes.includes(c))
            if( ctx.factory ) {
                ctx.tplName = ctx.factory.name.split('Create').pop()
            }
            if( ctx.methods ) {
                const attach = ctx.methods.attachControl
                if( attach ) {
                    ctx.attachFn = {
                        params: attach.arguments.filter((a) => a.name !== 'ignored'),
                        hasCanvas: attach.arguments.map((a) => a.name).includes('ignored'),
                    }
                }    
            }
            if( ctx.properties ) {
                Object.values(ctx.properties).forEach((p) => {
                    const t = types.classes[p.type];
                    if( !t ) return
                    p.nodeType = t.classChain.find((c) => nodeTypes.includes(c))
                })
            }
        }
    },
    getTemplates(types) {
        const templates = {}
        "Camera Light Material Texture Mesh".split(' ').forEach((t) => {
            templates[t] = {
                ...Node,
                supportsClass(c) {
                    return c.classChain.includes(t)
                },
                supportsFunction(f) {
                    return f.name.startsWith('Create') && types.classes[f.returnType].classChain.includes(t) && f.returnType.endsWith('Mesh')
                }
            }
        })
        return templates
    },
    partials: [
        await import('./_update.handlebars'),
        await import('./_params.handlebars'),
        await import('./_attach.handlebars'),
    ],
    excludeProps: ["Scene"],   
}