<script lang="ts">
	import HemisphericLight from '$lib/gen/babylon/Light/HemisphericLight.svelte';
	import { Tools } from '$lib/babylon';
	import { Assets, Engine, Scene, ImportedMesh, Ground, StandardMaterial } from '$lib/index.ts';
    import {Vector3, Color3} from '@babylonjs/core'
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import ArcRotateCamera from '../lib/gen/babylon/Camera/ArcRotateCamera.svelte';

    let camPos = new Vector3(0, 5, -10)
    let targetPos = Vector3.Zero()
    let material : StandardMaterial
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

        <Ground width={6} height={6} material={material} />new Vector3(0, 0, -10)
        <StandardMaterial bind:this={material} diffuseColor={Color3.Red()} diffuseTexture={Assets.textures.checkerboard_basecolor_png.rootUrl}/>
        <ImportedMesh rootUrl={Assets.meshes.Yeti.rootUrl} sceneFilename={Assets.meshes.Yeti.filename} scaling={$s}/>
    </Scene>
</Engine>