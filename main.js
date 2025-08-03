import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. SCENE
const scene = new THREE.Scene();

// Load background image as texture (horizontal landscape)
const textureLoader = new THREE.TextureLoader();
textureLoader.load('https://cdn.pixabay.com/photo/2022/06/25/13/33/landscape-7283516_1280.jpg', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping; // ensure correct projection
    scene.background = texture;
});

// 2. CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// 3. RENDERER
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 4. LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 5. CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// 6. MODEL LOADER
const loader = new GLTFLoader();
loader.load(
    'scene.glb', // Replace if needed
    function (gltf) {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        scene.add(model);
        console.log("Model loaded and added to the scene!");
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened while loading the model:', error);
    }
);

// 7. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 8. HANDLE WINDOW RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();


// --- ZOOM & ROTATE BUTTON EVENTS ---

document.getElementById('zoomIn').addEventListener('click', () => {
    camera.position.z -= 1;
});

document.getElementById('zoomOut').addEventListener('click', () => {
    camera.position.z += 1;
});

document.getElementById('rotateLeft').addEventListener('click', () => {
    controls.target.x -= 0.5;
    controls.update();
});

document.getElementById('rotateRight').addEventListener('click', () => {
    controls.target.x += 0.5;
    controls.update();
});
