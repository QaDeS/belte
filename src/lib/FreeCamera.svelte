<script lang="ts">
    import { getCurrent, getScene, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '$lib/babylon'

    export let position = new Vector3(0, 0, -10)
    export let target = Vector3.Zero()

    const {canvas} = getCurrent()
    const scene = getScene()

    const camera = new FreeCamera("camera1", position, scene);
    camera.setTarget(target);
    camera.attachControl(canvas, true);

    camera.onRender = () => {
        target = camera.target
        position = camera.position
    }

</script>