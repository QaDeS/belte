<script lang="ts">
    import { getCurrent, getScene, Texture, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial } from '$lib/babylon'

    export let name = "material"
    export let diffuseColor = Color3.White()
    export let diffuseTexture = ""

    const {canvas} = getCurrent()
    const scene = getScene()

    let material = new StandardMaterial(name, scene);
    $: {
        material.diffuseColor = diffuseColor;
    }
    $: {
        console.log(diffuseTexture)
        material.diffuseTexture = new Texture(diffuseTexture, scene)
    }
    export function getMaterial() {
        return material
    }

</script>