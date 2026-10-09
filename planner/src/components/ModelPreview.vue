<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref,watch} from 'vue';
import {AmbientLight,Box3,DirectionalLight,Group,PerspectiveCamera,Scene,Vector3,WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {disposeGroup} from '../render/model';
const props=defineProps<{blob:Blob}>(),host=ref<HTMLDivElement>(),error=ref('');let renderer:WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined,group:Group|undefined,generation=0;
const scene=new Scene(),camera=new PerspectiveCamera(40,1,.001,100000);const draw=()=>renderer?.render(scene,camera);
async function load(){const token=++generation;error.value='';try{const gltf=await new GLTFLoader().parseAsync(await props.blob.arrayBuffer(),'');if(token!==generation){disposeGroup(gltf.scene);return;}if(group)disposeGroup(group);group=gltf.scene;scene.add(group);const box=new Box3().setFromObject(group),center=box.getCenter(new Vector3()),size=box.getSize(new Vector3()),span=Math.max(size.x,size.y,size.z,.1);camera.position.copy(center).add(new Vector3(span*1.5,span,span*1.5));controls?.target.copy(center);controls?.update();draw();}catch(e){if(token===generation)error.value='Предпросмотр недоступен: '+(e as Error).message;}}
onMounted(()=>{try{renderer=new WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#edf0e8');host.value!.append(renderer.domElement);scene.add(new AmbientLight('#ffffff',2));const sun=new DirectionalLight('#ffffff',3);sun.position.set(4,8,5);scene.add(sun);controls=new OrbitControls(camera,renderer.domElement);controls.addEventListener('change',draw);observer=new ResizeObserver(()=>{const w=host.value!.clientWidth,h=host.value!.clientHeight;renderer!.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});observer.observe(host.value!);void load();}catch(e){error.value='Предпросмотр недоступен: '+(e as Error).message;}});
watch(()=>props.blob,()=>void load());onBeforeUnmount(()=>{generation++;observer?.disconnect();controls?.dispose();disposeGroup(scene);renderer?.dispose();renderer?.forceContextLoss();});
</script>
<template><div class="model-preview" ref="host" aria-label="Предпросмотр модели"><p v-if="error" role="alert">{{error}}</p></div></template>
