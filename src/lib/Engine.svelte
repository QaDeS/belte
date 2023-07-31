<script lang="ts">
    import { setEngineContext, Engine, Scene, Vector3 } from "$lib/babylon";
	import { onMount } from "svelte";

    export let debug = false
    
    let canvas : HTMLCanvasElement
    let engine : Engine
    let currentScene : Scene

    let fps = 0.0

    setEngineContext({
        getEngine: () => engine,
        getCanvas: () => canvas,
        setScene: (scene: Scene) => currentScene = scene
    })
    
    $: {
        if( canvas && !engine ) {
            engine = new Engine(canvas)
            engine.runRenderLoop(() => {
                if( currentScene ) {
                    fps = engine.getFps().toFixed()
                    currentScene.render()
                }
            })
        }
    }

</script>

{#if debug}
    <div>{fps} fps</div>
{/if}

<canvas bind:this={canvas} touch-action="none"></canvas>
{#if engine}
    <slot/>
{/if}

<style>
    canvas {
        width: 100%;
        height: 100%;
    }
</style>