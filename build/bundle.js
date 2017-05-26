(function () {
'use strict';

let isFullscreen;

function initFullScreen() {
    const fullScreenButton = document.querySelector('#fullscreen');

    fullScreenButton.addEventListener('click', () => {
        if (!isFullscreen) {
            document.body.webkitRequestFullScreen && document.body.webkitRequestFullScreen() ||
            document.body.mozRequestFullScreen && document.body.mozRequestFullScreen();
        } else {
           document.webkitExitFullscreen && document.webkitExitFullscreen() ||
           document.mozCancelFullScreen && document.mozCancelFullScreen();
        }

        isFullscreen = !isFullscreen;
    });
}

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
    initFullScreen();

    return gl;
}

function watchWindowResize(gl, cb) {
    window.addEventListener('resize', () => {
        setTimeout(() => setViewport(gl, cb), 200);
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

const identity = () => new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

const vecMatMul = (m, v) => new Float32Array([
    m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12]*v[3],
    m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13]*v[3],
    m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
    m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3]
]);

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

const toMat3 = m => new Float32Array([
    m[0], m[1], m[2],
    m[4], m[5], m[6],
    m[8], m[9], m[10]
]);

const inverse = m => {
    const ret = new Float32Array(16);

    let m00 = m[0 * 4 + 0];
    let m01 = m[0 * 4 + 1];
    let m02 = m[0 * 4 + 2];
    let m03 = m[0 * 4 + 3];
    let m10 = m[1 * 4 + 0];
    let m11 = m[1 * 4 + 1];
    let m12 = m[1 * 4 + 2];
    let m13 = m[1 * 4 + 3];
    let m20 = m[2 * 4 + 0];
    let m21 = m[2 * 4 + 1];
    let m22 = m[2 * 4 + 2];
    let m23 = m[2 * 4 + 3];
    let m30 = m[3 * 4 + 0];
    let m31 = m[3 * 4 + 1];
    let m32 = m[3 * 4 + 2];
    let m33 = m[3 * 4 + 3];
    let tmp_0  = m22 * m33;
    let tmp_1  = m32 * m23;
    let tmp_2  = m12 * m33;
    let tmp_3  = m32 * m13;
    let tmp_4  = m12 * m23;
    let tmp_5  = m22 * m13;
    let tmp_6  = m02 * m33;
    let tmp_7  = m32 * m03;
    let tmp_8  = m02 * m23;
    let tmp_9  = m22 * m03;
    let tmp_10 = m02 * m13;
    let tmp_11 = m12 * m03;
    let tmp_12 = m20 * m31;
    let tmp_13 = m30 * m21;
    let tmp_14 = m10 * m31;
    let tmp_15 = m30 * m11;
    let tmp_16 = m10 * m21;
    let tmp_17 = m20 * m11;
    let tmp_18 = m00 * m31;
    let tmp_19 = m30 * m01;
    let tmp_20 = m00 * m21;
    let tmp_21 = m20 * m01;
    let tmp_22 = m00 * m11;
    let tmp_23 = m10 * m01;

    let t0 = (tmp_0*m11 + tmp_3*m21 + tmp_4*m31) - (tmp_1*m11 + tmp_2*m21 + tmp_5*m31);
    let t1 = (tmp_1*m01 + tmp_6*m21 + tmp_9*m31) - (tmp_0*m01 + tmp_7*m21 + tmp_8*m31);
    let t2 = (tmp_2*m01 + tmp_7*m11 + tmp_10*m31) - (tmp_3*m01 + tmp_6*m11 + tmp_11*m31);
    let t3 = (tmp_5*m01 + tmp_8*m11 + tmp_11*m21) - (tmp_4*m01 + tmp_9*m11 + tmp_10*m21);

    let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    ret[0]  = d * t0;
    ret[1]  = d * t1;
    ret[2]  = d * t2;
    ret[3]  = d * t3;
    ret[4]  = d * ((tmp_1*m10 + tmp_2*m20 + tmp_5*m30) - (tmp_0*m10 + tmp_3*m20 + tmp_4*m30));
    ret[5]  = d * ((tmp_0*m00 + tmp_7*m20 + tmp_8*m30) - (tmp_1*m00 + tmp_6*m20 + tmp_9*m30));
    ret[6]  = d * ((tmp_3*m00 + tmp_6*m10 + tmp_11*m30) - (tmp_2*m00 + tmp_7*m10 + tmp_10*m30));
    ret[7]  = d * ((tmp_4*m00 + tmp_9*m10 + tmp_10*m20) - (tmp_5*m00 + tmp_8*m10 + tmp_11*m20));
    ret[8]  = d * ((tmp_12*m13 + tmp_15*m23 + tmp_16*m33) - (tmp_13*m13 + tmp_14*m23 + tmp_17*m33));
    ret[9]  = d * ((tmp_13*m03 + tmp_18*m23 + tmp_21*m33) - (tmp_12*m03 + tmp_19*m23 + tmp_20*m33));
    ret[10] = d * ((tmp_14*m03 + tmp_19*m13 + tmp_22*m33) - (tmp_15*m03 + tmp_18*m13 + tmp_23*m33));
    ret[11] = d * ((tmp_17*m03 + tmp_20*m13 + tmp_23*m23) - (tmp_16*m03 + tmp_21*m13 + tmp_22*m23));
    ret[12] = d * ((tmp_14*m22 + tmp_17*m32 + tmp_13*m12) - (tmp_16*m32 + tmp_12*m12 + tmp_15*m22));
    ret[13] = d * ((tmp_20*m32 + tmp_12*m02 + tmp_19*m22) - (tmp_18*m22 + tmp_21*m32 + tmp_13*m02));
    ret[14] = d * ((tmp_18*m12 + tmp_23*m32 + tmp_15*m02) - (tmp_22*m32 + tmp_14*m02 + tmp_19*m12));
    ret[15] = d * ((tmp_22*m22 + tmp_16*m02 + tmp_21*m12) - (tmp_20*m12 + tmp_23*m22 + tmp_17*m02));

    return ret;
};

const transpose = m => {
    let t;

    t = m[1];
    m[1] = m[4];
    m[4] = t;

    t = m[2];
    m[2] = m[8];
    m[8] = t;

    t = m[3];
    m[3] = m[12];
    m[12] = t;

    t = m[6];
    m[6] = m[9];
    m[9] = t;

    t = m[7];
    m[7] = m[13];
    m[13] = t;

    t = m[11];
    m[11] = m[14];
    m[14] = t;

    return m;
};

const rotate = (axis, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    let mat;

    switch(axis) {
        case 'x':
            mat = [
                1, 0, 0, 0,
                0, c, s, 0,
                0, -s, c, 0, 
                0, 0, 0, 1
            ]; break;
        case 'y':
            mat = [
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0, 
                0, 0, 0, 1
            ]; break;
        case 'z':
            mat = [
                c, s, 0, 0,
                -s, c, 0, 0,
                0, 0, 1, 0, 
                0, 0, 0, 1
            ]; break;
    }

    return new Float32Array(mat);
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

    rotate(angle) {
        const location = vecMatMul(rotate('y', angle), Float32Array.from([...this.location, 0]));
        this.location = location.subarray(0, 3);
        this.viewMatrix = lookAt(this.location, this.target);
    }
}

function setupMatrices(gl, program, model, camera) {
    const modelViewMat = matMul(camera.viewMatrix, model.transform);
    const normalMatrix = toMat3(transpose(inverse(modelViewMat)));

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
    const modelNames = ['lighthouse', 'house', 'island'];

    const importPromises = modelNames.map(modelName => importFile(modelName));

    return Promise.all(importPromises).then(([lighthouseFileData, houseFileData, islandFileData]) => {
        const { meshes: [lighthouseMeshData] } = lighthouseFileData;
        const { meshes: [houseMeshData] } = houseFileData;
        const { meshes: [islandMeshData] } = islandFileData;

        const lighthouseMaterial = new Material({
            shader: 'lambertian',
            ambientCoefficient: .4,
            diffuseCoefficient: .8,
            ambientColor: '#70608E',
            diffuseColor: '#E0859C',
            shininess: 32
        });

        const houseMaterial = new Material({
            shader: 'lambertian',
            ambientCoefficient: .2,
            diffuseCoefficient: .7,
            ambientColor: '#2D3047',
            diffuseColor: '#558C8C',
            shininess: 50
        });

        const islandMaterial = new Material({
            shader: 'lambertian',
            ambientCoefficient: .7,
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

    camera = new PerspectiveCamera(cameraLocation, cameraTarget, width / height, .5, 100);
    Scene.camera = camera;
}

function setupLights() {
    const light = new Light({
        position: [10, 0, -5],
        ambientIntensity: 1,
        diffuseIntensity: .6,
        specularIntensity: 1
    });

    Scene.light = light;
}

function render() {
    camera.rotate(-0.008);
}

ResourceManager
    .loadShaders(gl, ['lambertian'])
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

}());
