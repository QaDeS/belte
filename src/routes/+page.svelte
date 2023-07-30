<script lang="ts">
	import StandardMaterial from './../lib/gen/babylon/Material/StandardMaterial.svelte';
	import HemisphericLight from './../lib/gen/babylon/Light/HemisphericLight.svelte';
	import { Tools } from '$lib/babylon';
	import { Assets, Engine, Scene, ImportedMesh } from '$lib/index.ts';
    import {Vector3, Color3} from '@babylonjs/core'
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import ArcRotateCamera from '../lib/gen/babylon/Camera/ArcRotateCamera.svelte';
	import Ground from '../lib/gen/babylon/Mesh/Ground.svelte';
	import { writable } from 'svelte/store';
	import Texture from '../lib/gen/babylon/Texture/Texture.svelte';

    const textureUrl = Assets.textures.checkerboard_basecolor_png.rootUrl

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

    let texture = writable()
let scene
</script>

{camPos}
<Engine debug>
    <Scene bind:this={scene}>
        <ArcRotateCamera name="foo" bind:position={camPos} target={targetPos} alpha={Tools.ToRadians(90)} beta={Tools.ToRadians(65)} radius={10} attach setActiveOnSceneIfNoneActive/>
        <HemisphericLight name="bar" direction={new Vector3(0, 1, 0)} intensity={$intensity} />

        <Ground options={{width:6, height: 6}} material={material} />
        <StandardMaterial let:setters={{diffuseTexture}} bind:this={material} diffuseColor={Color3.Red()} diffuseTexture={$texture}>
            <Texture setter={diffuseTexture} url={textureUrl} />
        </StandardMaterial>
        <ImportedMesh rootUrl={Assets.meshes.Yeti.rootUrl} sceneFilename={Assets.meshes.Yeti.filename} scaling={$s}/>
    </Scene>
</Engine>