<<<<<<< HEAD
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SCENE, CAMERAS, RENDERER ---
const scene = new THREE.Scene();
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
perspectiveCamera.position.z = 10;
const frustumSize = 10;
const aspect = window.innerWidth / window.innerHeight;
const orthographicCamera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 1000);
let activeCamera = perspectiveCamera;
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- CONTROLS ---
const controls = new OrbitControls(activeCamera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// --- TEXTURES & MODELS ---
const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();
let currentModel = null;
const loaderOverlay = document.getElementById('loader-overlay');
const progressText = document.getElementById('progress-text');

function setEquirectangularBackground(url) {
    textureLoader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
}

function loadModel(url) {
    loaderOverlay.classList.remove('hidden');
    progressText.textContent = '0% loaded';
    loader.load(url, (gltf) => {
        if (currentModel) scene.remove(currentModel);
        currentModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        scene.add(currentModel);
        loaderOverlay.classList.add('hidden');
    }, (xhr) => {
        if (xhr.lengthComputable) {
            progressText.textContent = `${Math.floor(xhr.loaded / xhr.total * 100)}% loaded`;
        }
    }, (error) => {
        console.error("Model loading error:", error);
        loaderOverlay.classList.add('hidden');
    });
}

// --- ANIMATION & RESIZE ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, activeCamera);
}
window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();
    orthographicCamera.left = frustumSize * aspect / -2;
    orthographicCamera.right = frustumSize * aspect / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- UI EVENT LISTENERS ---
// Main Controls
document.getElementById('zoomIn').addEventListener('click', () => {
    if (activeCamera.isPerspectiveCamera) activeCamera.position.z -= 1;
    else { activeCamera.zoom = Math.min(5, activeCamera.zoom + 0.2); activeCamera.updateProjectionMatrix(); }
});
document.getElementById('zoomOut').addEventListener('click', () => {
    if (activeCamera.isPerspectiveCamera) activeCamera.position.z += 1;
    else { activeCamera.zoom = Math.max(0.2, activeCamera.zoom - 0.2); activeCamera.updateProjectionMatrix(); }
});
document.getElementById('rotateLeft').addEventListener('click', () => controls.target.x -= 0.5);
document.getElementById('rotateRight').addEventListener('click', () => controls.target.x += 0.5);

// Viewport Controls
const axisState = { x: 1, y: 1, z: 1 };
const axisButtons = {
    x: document.getElementById('viewX'),
    y: document.getElementById('viewY'),
    z: document.getElementById('viewZ')
};

function setOrthographicView(position, upVector) {
    activeCamera = orthographicCamera;
    controls.object = orthographicCamera;
    controls.enableRotate = false;
    activeCamera.position.copy(position);
    activeCamera.up.copy(upVector);
    controls.target.set(0, 0, 0);
    controls.update();
}

document.getElementById('viewPersp').addEventListener('click', () => {
    activeCamera = perspectiveCamera;
    controls.object = perspectiveCamera;
    controls.enableRotate = true;
    controls.reset();
    Object.values(axisButtons).forEach(btn => btn.textContent = btn.id.slice(-1).toUpperCase());
    Object.keys(axisState).forEach(key => axisState[key] = 1);
});

function createAxisListener(axis) {
    axisButtons[axis].addEventListener('click', () => {
        const positions = {
            x: new THREE.Vector3(10 * axisState.x, 0, 0),
            y: new THREE.Vector3(0, 10 * axisState.y, 0),
            z: new THREE.Vector3(0, 0, 10 * axisState.z)
        };
        const upVectors = {
            x: new THREE.Vector3(0, 1, 0),
            y: new THREE.Vector3(0, 0, -axisState.y),
            z: new THREE.Vector3(0, 1, 0)
        };
        setOrthographicView(positions[axis], upVectors[axis]);
        axisButtons[axis].textContent = axisState[axis] > 0 ? `-${axis.toUpperCase()}` : axis.toUpperCase();
        axisState[axis] *= -1;
    });
}
createAxisListener('x');
createAxisListener('y');
createAxisListener('z');

// Model Switcher
const modelButtons = document.querySelectorAll('#model-switcher button');
modelButtons.forEach(button => {
    button.addEventListener('click', () => {
        modelButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadModel(button.dataset.model);
    });
});

// Side Panel
const menuToggle = document.getElementById('menu-toggle');
const closePanel = document.getElementById('close-panel');
const sidePanel = document.getElementById('side-panel');
menuToggle.addEventListener('click', () => sidePanel.classList.toggle('open'));
closePanel.addEventListener('click', () => sidePanel.classList.remove('open'));
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        scene.background = new THREE.Color(option.dataset.color);
        scene.environment = null;
    });
});
document.querySelectorAll('.image-option').forEach(option => {
    option.addEventListener('click', () => setEquirectangularBackground(option.dataset.image));
});

// Lighting Controls
document.getElementById('ambientIntensity').addEventListener('input', (e) => ambientLight.intensity = parseFloat(e.target.value));
document.getElementById('directionalIntensity').addEventListener('input', (e) => directionalLight.intensity = parseFloat(e.target.value));
document.getElementById('lightColor').addEventListener('input', (e) => directionalLight.color.set(e.target.value));
document.getElementById('lightAngle').addEventListener('input', (e) => {
    const angle = parseFloat(e.target.value);
    const radians = (angle * Math.PI) / 180;
    const radius = 10;
    directionalLight.position.set(radius * Math.cos(radians), 10, radius * Math.sin(radians));
});

// --- INITIALIZATION ---
animate();
setEquirectangularBackground('https://cdn.pixabay.com/photo/2022/06/25/13/33/landscape-7283516_1280.jpg');
const initialModelButton = document.querySelector('#model-switcher button.active');
if (initialModelButton) loadModel(initialModelButton.dataset.model);
=======
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
>>>>>>> 0becaf2f1b7f79eb717aebfda61514b794b78536
