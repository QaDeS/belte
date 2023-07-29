# belte - BabylonJS for Svelte

This repo uses Bun to automatically generate Svelte components for BabylonJS.
It contains t PoC for a generic templating system for transforming node based libraries into glue code.
See scripts/babylon and scripts/tree for examples.

```bash
bun install
bun analyze babylon
bun generate babylon
```

Then you can run (and play with) the sample app with:

```bash
bun run dev
```
