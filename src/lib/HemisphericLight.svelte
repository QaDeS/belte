<script context="module">
    let counter = 0
</script>
<script lang="ts">
    import { getCurrent, getScene, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from './babylon'

    export let id = "light" + counter++
    export let position
    export let intensity = 1.0

    const {canvas} = getCurrent()
    const scene = getScene()

    var light = new HemisphericLight(id, position, scene);
    $: {
        light.intensity = intensity;
    }

</script>