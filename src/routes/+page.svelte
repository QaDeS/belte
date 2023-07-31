<script lang="ts">
	import StandardMaterial from './../lib/gen/babylon/Material/StandardMaterial.svelte';
	import HemisphericLight from './../lib/gen/babylon/Light/HemisphericLight.svelte';
	import ArcRotateCamera from '../lib/gen/babylon/Camera/ArcRotateCamera.svelte';
	import Ground from '../lib/gen/babylon/Mesh/Ground.svelte';
	import Texture from '../lib/gen/babylon/Texture/Texture.svelte';

    import { Tools } from '$lib/babylon';
	import { Assets, Engine, Scene, ImportedMesh } from '$lib';
    import {Vector3, Color3} from '@babylonjs/core'
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { writable } from 'svelte/store';

    const textureUrl = Assets.textures.checkerboard_basecolor_png.rootUrl

    let camPos = new Vector3(0, 5, -10)
    let targetPos = Vector3.Zero()
    let intensity = tweened(Math.random(), {
        duration: 300,
        easing: cubicOut
    });

    setInterval(() => {
        $intensity = Math.random()
        $s = Math.random() * 0.3
    }, 1000);

    let s = tweened(0.1, {
        duration: 300,
        easing: cubicOut
    });

</script>

{camPos}
<Engine debug>
    <Scene>
        <ArcRotateCamera name="foo" bind:position={camPos} target={targetPos} alpha={Tools.ToRadians(90)} beta={Tools.ToRadians(65)} radius={10} attach setActiveOnSceneIfNoneActive/>
        <HemisphericLight name="bar" direction={new Vector3(0, 1, 0)} intensity={$intensity} />

        <Ground let:setters={{material}} options={{width:6, height: 6}}>
            <StandardMaterial setter={material} let:setters={{diffuseTexture, bumpTexture}} diffuseColor={Color3.Red()}>
                <Texture setter={diffuseTexture} url={textureUrl} />
                <Texture setter={bumpTexture} url={textureUrl} />
            </StandardMaterial>
        </Ground>
        <ImportedMesh rootUrl={Assets.meshes.Yeti.rootUrl} sceneFilename={Assets.meshes.Yeti.filename} scaling={$s}/>
    </Scene>
</Engine>