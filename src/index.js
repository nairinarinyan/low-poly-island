import initGL, { watchWindowResize } from './init';
import ResourceManager from './resource-manager';
import Scene from './scene';
import Model from './model';
import Material from './material';
import Light from './light';
import Camera from './camera';
import { importFile } from './utils';
import renderScene from './renderer';

const gl = initGL();
let camera;

function importModels() {
    const modelNames = ['lighthouse', 'house', 'island'];

    const importPromises = modelNames.map(modelName => importFile(modelName));

    return Promise.all(importPromises).then(([lighthouseFileData, houseFileData, islandFileData]) => {
        const { meshes: [lighthouseMeshData] } = lighthouseFileData;
        const { meshes: [houseMeshData] } = houseFileData;
        const { meshes: [islandMeshData] } = islandFileData;

        const lighthouseMaterial = new Material({
            shader: 'gourad',
            ambientCoefficient: .4,
            diffuseCoefficient: .8,
            ambientColor: '#70608E',
            diffuseColor: '#E0859C',
            shininess: 32
        });

        const houseMaterial = new Material({
            shader: 'gourad',
            ambientCoefficient: .2,
            diffuseCoefficient: .7,
            ambientColor: '#2D3047',
            diffuseColor: '#558C8C',
            shininess: 50
        });

        const islandMaterial = new Material({
            shader: 'gourad',
            ambientCoefficient: .9,
            diffuseCoefficient: .9,
            ambientColor: '#419D78',
            diffuseColor: '#A6C971',
            shininess: 50
        });

        const lighthouse = new Model(gl, lighthouseMeshData, 'lighthouse', lighthouseMaterial);
        const house = new Model(gl, houseMeshData, 'house', houseMaterial);
        const island = new Model(gl, islandMeshData, 'island', islandMaterial);

        return [lighthouse, house, island];
    });
}

function setupView() {
    const cameraLocation = [0, 12, -18];
    const cameraTarget = [0, 2, 0];
    const { width, height } = gl.canvas;

    camera = new Camera(cameraLocation, cameraTarget, width / height, .5, 100);
    Scene.camera = camera;
}

function setupLights() {
    const light = new Light({
        position: [2, 12, 3],
        ambientIntensity: .6,
        diffuseIntensity: .6,
        specularIntensity: 1
    });

    Scene.light = light;
}

function render() {
    camera.rotate(-0.008);
}

ResourceManager
    .loadShaders(gl, ['gourad'])
    .then(importModels)
    .then(models => {
        setupView();
        watchWindowResize(gl, (width, height) => camera.update(width / height));
        setupLights();

        const [ico, cube, island] = models;

        Scene.addModel(ico);
        Scene.addModel(cube);
        Scene.addModel(island);

        renderScene(gl, Scene, render);
    });
