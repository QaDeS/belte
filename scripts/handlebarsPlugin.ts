import { plugin } from "bun";
import Handlebars from "handlebars";

plugin({
    name: "Handlebars",
    async setup(build) {
        const { readFileSync } = await import("fs");
        const { basename } = await import("path");

        // when a .yaml file is imported...
        build.onLoad({ filter: /\.handlebars$/ }, (args) => {
            // read and parse the file
            const filePath = args.path
            const text = readFileSync(filePath, "utf8");
            const template = Handlebars.compile(text);

            const [target, ext, _] = basename(filePath).split('.')
            if( target.startsWith('_') ) {
                Handlebars.partials[target.substring(1)] = template
            }
            // and returns it as a module
            return {
                exports: {
                    target,
                    ext,
                    render: template
                },
                loader: "object", // special loader for JS objects
            };
        });
    },
});

export {
    Handlebars
}