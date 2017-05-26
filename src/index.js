import initGL, { watchWindowResize } from './init';
import ResourceManager from './resource-manager';
import Scene from './scene';
import Model from './model';
import Material from './material';
import Light from './light';
import { PerspectiveCamera } from './camera';
import { importFile } from './utils';
import renderScene from './renderer';

const gl = initGL();
let camera;
let angle = 0;

function importModels() {
    const modelNames = ['ico', 'cube'];

    const importPromises = modelNames.map(modelName => importFile(modelName));

    return Promise.all(importPromises).then(([icoFileData, cubeFileData]) => {
        const { meshes: [icoMeshData] } = icoFileData;
        const { meshes: [cubeMeshData] } = cubeFileData;

        const icoMaterial = new Material({
            shader: 'lambertian',
            ambientCoefficient: .9,
            diffuseCoefficient: .9,
            ambientColor: '#232020',
            diffuseColor: '#553739',
            shininess: 32
        });

        const cubeMaterial = new Material({
            shader: 'lambertian',
            ambientCoefficient: .2,
            diffuseCoefficient: .4,
            ambientColor: '#1340a0',
            diffuseColor: '#583739',
            shininess: 50
        });

        const ico = new Model(gl, icoMeshData, 'ico', icoMaterial);
        const cube = new Model(gl, cubeMeshData, 'cube', cubeMaterial);

        return [ico, cube];
    });
}

function setupView() {
    const cameraLocation = [0, 10, -12];
    const cameraTarget = [0, 0, 0];
    const { width, height } = gl.canvas;

    camera = new PerspectiveCamera(cameraLocation, cameraTarget, width / height, .5, 100);
    Scene.camera = camera;
}

function setupLights() {
    const light = new Light({
        position: [3, 3, 2],
        ambientIntensity: .1,
        diffuseIntensity: .8,
        specularIntensity: 1
    });

    Scene.light = light;
}

function render() {
}

ResourceManager
    .loadShaders(gl, ['lambertian'])
    .then(importModels)
    .then(models => {
        setupView();
        watchWindowResize(gl, (width, height) => camera.update(width / height));
        setupLights();

        const [ico, cube] = models;

        Scene.addModel(ico);
        Scene.addModel(cube);

        renderScene(gl, Scene, render);
    });
