export default {
    root: "/Software/DefinitelyTyped/types",
    entries: [
        'three'
    ],
    async getTemplates(types) {
        return {
            Camera: await import('./Camera.svelte.handlebars'),
        }
    }
}