const Node = await import('./Node.svelte.handlebars')

export default {
    out: "src/lib/gen",
    root: "./node_modules",
    entries: 'core materials gui loaders post-processes procedural-textures serializers'.split(" ")
        .map((m) => `@babylonjs/${m}`),

    getTemplates(types) {
        const nodeTypes = Object.assign({}, ...Object.values(types.classes.Scene.methods).map((m) => {
            if(!m.name.startsWith('remove')) return
            const nodeType = m.name.split('remove').pop()

            const removeType = m.arguments[0].type
            if(!types.classNames.includes(removeType)) return

            return {[removeType]: nodeType}
        }).filter(Boolean))

        const templates = {}
        for(const nodeClass in nodeTypes) {
            const nodeType = nodeTypes[nodeClass]
            templates[nodeType] = {
                ...Node,
                supportsClass(c) {
                    return c.classChain.includes(nodeClass)
                },
                supportsFunction(f) {
                    return f.name.startsWith('Create') && types.classes[f.returnType].classChain.includes(nodeClass)
                },
                preprocess(ctx) {
                    ctx.nodeType = nodeType
                    if (ctx.factory) {
                        ctx.tplName = nodeClass
                        ctx.nodeClass = nodeClass
                    } else {
                        ctx.nodeClass = ctx.name
                    }
                    if (ctx.methods) {
                        const attach = ctx.methods.attachControl
                        if (attach) {
                            ctx.attachFn = {
                                params: attach.arguments.filter((a) => a.name !== 'ignored'),
                                hasCanvas: attach.arguments.map((a) => a.name).includes('ignored'),
                            }
                        }
                    }
                    if (ctx.properties) {
                        Object.values(ctx.properties).forEach((p) => {
                            const t = types.classes[p.type] ?? types.interfaces[p.type];
                            if (!t) return
                            p.nodeType = t.classChain.map((c) => nodeTypes[c]).filter(Boolean)[0]
                        })
                    }
                }

            }
        }
        console.log(templates)
        return templates
    },
    partials: [
        await import('./_update.handlebars'),
        await import('./_params.handlebars'),
    ],
    excludeProps: ["Scene", "IAccessibilityTag"],
}