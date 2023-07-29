import {setContext, getContext} from 'svelte';
export type * from "@babylonjs/core"
export * from "@babylonjs/core"
export type * from "@babylonjs/materials"
export * from "@babylonjs/materials"
export type * from "@babylonjs/loaders"
export * from "@babylonjs/loaders"

export const key = Symbol();
export const sceneKey = Symbol();

export function setEngineContext(context : any) {
    setContext(key, context)
}

export function setSceneContext(context : any) {
    setContext(sceneKey, context)
}

export function getCurrent() {
    const context = getContext(key);
    if( !context ) return {}

    const {getEngine, getCanvas, setScene, onRender} = context as any;
    return {
        engine: getEngine(),
        canvas: getCanvas(),
        setScene,
        onRender
    }
}

export function getScene() {
    const context = getContext(sceneKey)
    if( !context ) return

    const {getScene} = context as any
    return getScene()
}
