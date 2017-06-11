import { initGL, loadShaders } from './common.js';
import { lookAt, perspective } from '../src/math/view.js';

const gl = initGL();
const shaderProgram = loadShaders(gl);

gl.useProgram(shaderProgram);
gl.viewport(0, 0, innerWidth, innerHeight);

gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
gl.enable(gl.BLEND);

const vertices = [
    // Front face
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
];

const vertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
]


const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

const elementBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW)

const mvMatrix = lookAt([-5, 5, -8], [0, 0, 0]);
const projMatrix = perspective(Math.PI/4, innerWidth/innerHeight, 0.5, 50);

const mvMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_mv_mat');
const projMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_p_mat');
gl.uniformMatrix4fv(mvMatrixLocation, false, new Float32Array(mvMatrix));
gl.uniformMatrix4fv(projMatrixLocation, false, new Float32Array(projMatrix));

gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
gl.drawElements(gl.LINE_STRIP, 36, gl.UNSIGNED_SHORT, 0);
