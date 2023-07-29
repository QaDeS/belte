export default {
    out: "src/lib/gen",
    root: "./node_modules",
    entries: 'core materials gui loaders post-processes procedural-textures serializers'.split(" ")
        .map((m) => `@babylonjs/${m}`),
    templates: {
        Camera: await import('./Camera.svelte.handlebars'),
        Light: await import('./Node.svelte.handlebars'),
    },
    partials: [
        await import('./_update.handlebars'),
        await import('./_params.handlebars'),
        await import('./_attach.handlebars'),
    ],
    excludeProps: ["Scene"],   
}