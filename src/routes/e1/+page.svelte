<script>
	import Engine from '../../lib/Engine.svelte';
	import Scene from '../../lib/Scene.svelte';
	import { Vector3 } from '../../lib/babylon';
	import ArcRotateCamera from '../../lib/gen/babylon/Camera/ArcRotateCamera.svelte';
	import DirectionalLight from '../../lib/gen/babylon/Light/DirectionalLight.svelte';
	import HemisphericLight from '../../lib/gen/babylon/Light/HemisphericLight.svelte';
	import Box from '../../lib/gen/babylon/Mesh/Box.svelte';

</script>
<Engine>
    <Scene>
        <ArcRotateCamera alpha={-Math.PI / 2} beta={Math.PI / 4} radius={10} target={Vector3.Zero()} />
        <DirectionalLight direction={new Vector3(0, -1, 1)} intensity={0.75} />
        <HemisphericLight direction={new Vector3(0, 1, 0)} intensity={0.5} />

        <Box position={new Vector3(2, 0, 0)} />
    </Scene>
</Engine>