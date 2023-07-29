<script lang="ts">
    import { getCurrent, getScene, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '$lib/babylon'
	import { onMount } from 'svelte';

    export let id = "ground"
    export let width = 6
    export let height = 6
    export let material = null
    
    const {canvas} = getCurrent()
    const scene = getScene()

    var ground = MeshBuilder.CreateGround(id, {width, height}, scene);
    $: {
        if( material?.getMaterial ) {
            ground.material = material.getMaterial()
        } else {
            ground.material = material
        }
    }
</script>