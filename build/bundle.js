(function () {
'use strict';

function initViewport(gl) {
    const { canvas } = gl;
    const { innerWidth, innerHeight, devicePixelRatio } = window;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function loadResource(url, type) {
    return fetch(url)
        .then(res => res[type || 'json']());
}

function loadShaders(gl) {
    return Promise.all([
        loadResource('./shaders/vertex_shader.glsl', 'text'),
        loadResource('./shaders/fragment_shader.glsl', 'text'),
    ])
    .then(([vertexShaderSource, fragmentShaderSource]) => {
        const vertexShader = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = getShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

        return getProgram(gl, vertexShader, fragmentShader);
    });
}

function getShader(gl, shaderSource, type) {
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

function getProgram(gl, vertexShader, fragmentShader) {
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

function importModel(modelName) {
    return loadResource('./models/' + modelName + '.json')
        .catch(console.error);
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

const lookAt = (eye, target, up) => {
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

//https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
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

let angle = 0;

function composeMVPMatrix(gl) {
    const { width, height } = gl.canvas;

    const cameraLocation = new Float32Array([0, 13, -18]);
    const cameraTarget = new Float32Array([0, 5, 0]);
    const up = new Float32Array([0, 1, 0]);

    angle += .01;

    const mMatrix = matMul(rotate('y', angle), identity());
    const vMatrix = lookAt(cameraLocation, cameraTarget, up);
    const pMatrix = perspective(Math.PI / 4, width / height, .5, 500);

    const mv = matMul(vMatrix, mMatrix);
    const mvp = matMul(pMatrix, mv);

    return { mv, mvp };
}

function handlePositions(gl, posArray, program) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posArray), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    
}

function handleNormals(gl, normalArray, program) {
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray), gl.STATIC_DRAW);
    const normalLocation = gl.getAttribLocation(program, 'a_normal');
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);
}


function draw(gl, program) {
    gl.clearColor(0, 0, 0, 0);
    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);

    importModel('tree')
        .then(data => {
            const { meshes: [meshData] } = data;
            const { vertices, normals, faces } = meshData;

            const indices = [].concat.apply([], faces);

            handlePositions(gl, vertices, program);
            handleNormals(gl, normals, program);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            const mvpLocation = gl.getUniformLocation(program, 'u_mvp');
            const normalMatrixLocation = gl.getUniformLocation(program, 'u_normal_mat');

            console.log(mvpLocation, normalMatrixLocation);

            const ambientColorLocation = gl.getUniformLocation(program, 'u_ambient_color');
            const diffuseColorLocation = gl.getUniformLocation(program, 'u_diffuse_color');
            const lightPositionLocation = gl.getUniformLocation(program, 'u_light_position');

            render();

            function render() {
                gl.clear(gl.COLOR_BUFFER_BIT);
                requestAnimationFrame(render);

                const { mv, mvp } = composeMVPMatrix(gl);
                const normalMatrix = transposeMat3(inverseMat3(mv));

                gl.uniformMatrix4fv(mvpLocation, false, mvp);
                gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

                gl.uniform3fv(ambientColorLocation, new Float32Array([.1, .8, .9]));
                gl.uniform3fv(diffuseColorLocation, new Float32Array([.1, .7, .2]));
                gl.uniform3fv(lightPositionLocation, new Float32Array([3, 3, 0]));

                gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            }
        });
}

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');

initViewport(gl);
window.addEventListener('resize', () => initViewport(gl));

loadShaders(gl).then(program => draw(gl, program));

}());
