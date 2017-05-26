(function () {
'use strict';

function setViewport(gl, cb) {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    let { canvas } = gl;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    const { width, height } = canvas;
    
    gl.viewport(0, 0, width, height);
    cb && cb(width, height);
}

function initGL() {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    window.gl = gl;

    setViewport(gl);

    return gl;
}

function watchWindowResize(gl, cb) {
    window.addEventListener('resize', () => {
        setViewport(gl, cb);
    });
}

function loadResource(url, type) {
    return fetch(url)
        .then(res => res[type || 'json']());
}

function importFile(fileName) {
    return loadResource('./models/' + fileName + '.json')
        .catch(console.error);
}

function clampColor(hexColor) {
    const hex = hexColor.replace(/#/, '');
    const rgb = [];

    for(let i = 0; i < 6; i+=2) {
        rgb.push(parseInt(hex.slice(i, i+2), 16) / 255);
    }
    
    return rgb;
}

function traverseTree(tree) {
    const subtree = Object.assign({}, tree);
    let childList = [];

    const traverse = subtree => {
        const { children } = subtree;

        delete subtree.children;
        childList.push(subtree);

        return children && children.forEach(traverse); 
    };

    traverse(subtree);

    return childList;
}

function compileShader(gl, shaderSource, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Failed to compile shader', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function linkProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Failed to link shader program', gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function getUniforms(gl, program) {
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    return Array(numUniforms).fill(null)
        .map((_, i) => {
            const { name } = gl.getActiveUniform(program, i);
            const location = gl.getUniformLocation(program, name);

            return { [name]: location };
        })
        .reduce((prev, curr) => Object.assign(curr, prev));
}

const ResourceManager = {
    loadShaders(gl, shaderFileNames) {
        const shaderPromises = shaderFileNames.map(fileName =>
            Promise
                .all([
                    loadResource(`./shaders/${fileName}.vert`, 'text'),
                    loadResource(`./shaders/${fileName}.frag`, 'text')
                ])
                .then(([vertexShaderSource, fragmentShaderSource]) => {
                    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
                    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

                    const program = linkProgram(gl, vertexShader, fragmentShader);

                    return {
                        name: fileName,
                        program,
                        uniforms: getUniforms(gl, program)
                    };
                })
        );

        return Promise.all(shaderPromises).then(([...programs]) => this.programs = programs);
    },

    getProgram(programName) {
        return this.programs.find(p => p.name = programName);
    }
};

const subtract = (v1, v2) => new Float32Array([
    v1[0] - v2[0],
    v1[1] - v2[1],
    v1[2] - v2[2]
]);

const computeLength = v => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];

const cross = (v1, v2) => new Float32Array([
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
]);

const normalize = vec => {
    const ret = new Float32Array(3);
    const length = computeLength(vec);

    ret[0] = vec[0]/length;
    ret[1] = vec[1]/length;
    ret[2] = vec[2]/length;

    return ret;
};

const identity = () => {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
};

const matMul = (m1, m2) => {
    const ret = new Float32Array(16);

    ret[0]  = m1[0]*m2[0]  + m1[4]*m2[1]  + m1[8]*m2[2]  + m1[12]*m2[3];
    ret[4]  = m1[0]*m2[4]  + m1[4]*m2[5]  + m1[8]*m2[6]  + m1[12]*m2[7];
    ret[8]  = m1[0]*m2[8]  + m1[4]*m2[9]  + m1[8]*m2[10] + m1[12]*m2[11];
    ret[12] = m1[0]*m2[12] + m1[4]*m2[13] + m1[8]*m2[14] + m1[12]*m2[15];

    ret[1]  = m1[1]*m2[0]  + m1[5]*m2[1]  + m1[9]*m2[2]  + m1[13]*m2[3];
    ret[5]  = m1[1]*m2[4]  + m1[5]*m2[5]  + m1[9]*m2[6]  + m1[13]*m2[7];
    ret[9]  = m1[1]*m2[8]  + m1[5]*m2[9]  + m1[9]*m2[10] + m1[13]*m2[11];
    ret[13] = m1[1]*m2[12] + m1[5]*m2[13] + m1[9]*m2[14] + m1[13]*m2[15];

    ret[2]  = m1[2]*m2[0]  + m1[6]*m2[1]  + m1[10]*m2[2]  + m1[14]*m2[3];
    ret[6]  = m1[2]*m2[4]  + m1[6]*m2[5]  + m1[10]*m2[6]  + m1[14]*m2[7];
    ret[10] = m1[2]*m2[8]  + m1[6]*m2[9]  + m1[10]*m2[10] + m1[14]*m2[11];
    ret[14] = m1[2]*m2[12] + m1[6]*m2[13] + m1[10]*m2[14] + m1[14]*m2[15];

    ret[3]  = m1[3]*m2[0]  + m1[7]*m2[1]  + m1[11]*m2[2]  + m1[15]*m2[3];
    ret[7]  = m1[3]*m2[4]  + m1[7]*m2[5]  + m1[11]*m2[6]  + m1[15]*m2[7];
    ret[11] = m1[3]*m2[8]  + m1[7]*m2[9]  + m1[11]*m2[10] + m1[15]*m2[11];
    ret[15] = m1[3]*m2[12] + m1[7]*m2[13] + m1[11]*m2[14] + m1[15]*m2[15];

    return ret;
};

const lookAt = (eye, target, up = new Float32Array([0,1,0])) => {
    const zAxis = normalize(subtract(eye, target));
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = cross(zAxis, xAxis);

    return new Float32Array([
                xAxis[0],         yAxis[0],          zAxis[0], 0,
                xAxis[1],         yAxis[1],          zAxis[1], 0,
                xAxis[2],         yAxis[2],          zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot( zAxis, eye),  1
    ]);
};

const perspective = (fov, aspect, near, far) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ]);
};

const transposeMat3 = m => {
    let a01 = m[1], a02 = m[2];
    let a12 = m[5];
                
    m[1] = m[3];
    m[2] = m[6];
    m[3] = a01;
    m[5] = m[7];
    m[6] = a02;
    m[7] = a12;

    return m;
};

const inverseMat3 = m => {
    const ret = new Float32Array(9);

    let a00 = m[0], a01 = m[1], a02 = m[2];
    let a10 = m[4], a11 = m[5], a12 = m[6];
    let a20 = m[8], a21 = m[9], a22 = m[10];
    
    let b01 = a22*a11-a12*a21;
    let b11 = -a22*a10+a12*a20;
    let b21 = a21*a10-a11*a20;
            
    let d = a00*b01 + a01*b11 + a02*b21;
    let id = 1/d;
    
    ret[0] = b01*id;
    ret[1] = (-a22*a01 + a02*a21)*id;
    ret[2] = (a12*a01 - a02*a11)*id;
    ret[3] = b11*id;
    ret[4] = (a22*a00 - a02*a20)*id;
    ret[5] = (-a12*a00 + a02*a10)*id;
    ret[6] = b21*id;
    ret[7] = (-a21*a00 + a01*a20)*id;
    ret[8] = (a11*a00 - a01*a10)*id;
    
    return ret;
};

const Scene = {
    camera: null,
    light: null,
    models: [],

    addModel(model, parent = null) {
        const parentModel = this.models.find(model => model === parent);

        if (parentModel) {
            model.transform = matMul(parentModel.transform, model.transform);
            parentModel.children.push(model);
            model.parent = parentModel;
        } else {
            this.models.push(model);
        }
    }
};

function createAttribute(gl, program, attribArray, attribName, size = 3) {
    const location = gl.getAttribLocation(program, attribName);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribArray), gl.STATIC_DRAW);

    return { location, size, vbo };
}

function uploadIndexData(gl, indexArray) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);

    return buffer;
}

class Model {
    constructor(gl, meshData, modelName, material) {
        const { vertices, normals, faces } = meshData;
        const { shader } = material;
        const indices = [].concat.apply([], faces);
        const attribNames = ['a_position', 'a_normal'];

        const { program } = ResourceManager.getProgram(shader);

        this.name = modelName;

        this.children = [];
        this.parent = null;
        this.transform = identity();
        this.material = material;

        this.indices = {
            length: indices.length, 
            buffer: uploadIndexData(gl, indices)
        };

        this.attributes = {
            a_position: createAttribute(gl, program, vertices, 'a_position'),
            a_normal: createAttribute(gl, program, normals, 'a_normal')
        };
    }
}

class Material {
    constructor(options) {
        const {
            shader,
            ambientCoefficient, diffuseCoefficient,
            ambientColor, diffuseColor,
            shininess
        } = options;

        this.shader = shader;
        this.ambientColor = new Float32Array(clampColor(ambientColor));
        this.diffuseColor = new Float32Array(clampColor(diffuseColor));
        this.ambientCoefficient = ambientCoefficient;
        this.diffuseCoefficient = diffuseCoefficient;
        this.shininess = shininess;
    }
}

class Light {
    constructor(options) {
        const { position, ambientIntensity, diffuseIntensity, specularIntensity } = options;

        this.position = new Float32Array(position);
        this.ambientIntensity = ambientIntensity;
        this.diffuseIntensity = diffuseIntensity;
        this.specularIntensity = specularIntensity;
    }
}

class Camera {
    constructor(location, target) {
        this.location = new Float32Array(location);
        this.target = new Float32Array(target);
        this.viewMatrix = lookAt(this.location, this.target);
    }
}

class PerspectiveCamera extends Camera {
    constructor(location, target, aspectRatio, near, far) {
        super(location, target);
        this.near = near;
        this.far = far;
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }

    update(aspectRatio) {
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }
}

function setupMatrices(gl, program, model, camera) {
    const modelViewMat = matMul(camera.viewMatrix, model.transform);
    const normalMatrix = transposeMat3(inverseMat3(modelViewMat));

    const mvMatLocation = program.uniforms.u_mv;
    const pMatLocation = program.uniforms.u_p;
    const nMatLocation = program.uniforms.u_normal_mat;

    gl.uniformMatrix4fv(mvMatLocation, false, modelViewMat);
    gl.uniformMatrix4fv(pMatLocation, false, camera.projectionMatrix);
    gl.uniformMatrix3fv(nMatLocation, false, normalMatrix);
}

function setupAttributes(gl, attribs) {
    Object.keys(attribs).forEach(key => {
        const attrib = attribs[key];
        const { location, size, vbo } = attrib;

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);
    });
}

// set material colors and coefficients
function setupMaterialProps(gl, program, material) {
    const { ambientColor, diffuseColor, ambientCoefficient, diffuseCoefficient } = material;

    const ambientColorLoc = program.uniforms.u_mat_color_a;
    const diffuseColorLoc = program.uniforms.u_mat_color_d;
    const ambientKLoc = program.uniforms.u_ka;
    const diffuseKLoc = program.uniforms.u_kd;

    gl.uniform3fv(ambientColorLoc, ambientColor);
    gl.uniform3fv(diffuseColorLoc, diffuseColor);
    gl.uniform1f(ambientKLoc, ambientCoefficient);
    gl.uniform1f(diffuseKLoc, diffuseCoefficient);
}

// set light intensities and position
function setupLights$1(gl, program, light) {
    const { ambientIntensity, diffuseIntensity, position } = light;

    const ambientILoc = program.uniforms.u_ia;
    const diffuseILoc = program.uniforms.u_id;
    const positionLoc = program.uniforms.u_light_position;

    gl.uniform3fv(positionLoc, position);
    gl.uniform1f(ambientILoc, ambientIntensity);
    gl.uniform1f(diffuseILoc, diffuseIntensity);
}

function renderScene(gl, scene, cb) {
    const { models, camera, light } = scene;

    const modelList = traverseTree({ children: scene.models }).slice(1);
    modelList.sort((m1, m2) => m1.material.shader > m2.material.shader);

    gl.clearColor(0.827, 0.984, 0.960, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    function draw() {
        requestAnimationFrame(draw);
        gl.clear(gl.COLOR_BUFFER_BIT);

        cb();

        modelList.forEach(model => {
            const program = ResourceManager.getProgram(model.material.shader);
            gl.useProgram(program.program);

            setupMatrices(gl, program, model, camera);
            setupAttributes(gl, model.attributes);
            setupMaterialProps(gl, program, model.material);
            setupLights$1(gl, program, light);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices.buffer);
            gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        });
    }

    draw();
}

const gl = initGL();
let camera;
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

}());
