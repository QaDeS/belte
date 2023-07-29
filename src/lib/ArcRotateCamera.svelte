<script lang="ts">
    import { getCurrent, getScene, Scene, ArcRotateCamera, Tools, Vector3, HemisphericLight, MeshBuilder } from '$lib/babylon'

    export let position = new Vector3(0, 0, -10)
    export let target = Vector3.Zero()

    const {canvas} = getCurrent()
    const scene = getScene()

    const camera = new ArcRotateCamera("camera1", Tools.ToRadians(90), Tools.ToRadians(65), 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    camera.onRender = () => {
        target = camera.target
        position = camera.position
    }

</script>