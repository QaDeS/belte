export default {
    root: "/Software/DefinitelyTyped/types",
    entries: [
        'three'
    ],
    templates: {
        Camera: await import('./Camera.svelte.handlebars') 
    }
}