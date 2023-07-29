<script lang="ts">
    import { getCurrent, getScene, SceneLoader, Texture, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial } from '$lib/babylon'

    export let meshNames = ""
    export let rootUrl = ""
    export let sceneFilename= ""
    export let scaling = 1.0

    const scene = getScene()
    let meshes = []
    $: {
        if(meshes.length > 0) meshes[0].scaling.set(scaling, scaling, scaling);
    }
    SceneLoader.ImportMesh(meshNames, rootUrl, sceneFilename, scene, function(newMeshes){
        meshes = newMeshes
    });

</script>