<script lang="ts">
    import { setSceneContext, getCurrent, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from './babylon'

    const {engine, canvas, setScene} = getCurrent()
    const scene = new Scene(engine)

    setSceneContext({
        getScene: () => scene,
    })

    // Enable render callbacks so reactive properties can be updated
    scene._origRender = scene.render
    scene.render = () => {
        const result = scene._origRender()
        for( let cam of scene.cameras) {
            const fn = cam?.onRender
            if( fn ) fn()
        }
        return result
    }

    setScene(scene) // TODO skip if current scene is already set
</script>

<slot/>
