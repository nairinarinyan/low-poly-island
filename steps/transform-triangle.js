import { initGL, loadShaders } from './common.js';

// get gl context etc.
const gl = initGL();

// get shader sources, compile and link
const shaderProgram = loadShaders(gl);

gl.useProgram(shaderProgram);

const triangleVertexData = [
    // coords   //colors
     0,  .6,    1, 0, 0,
   -.5, -.3,    0, 1, 0,
    .5, -.3,    0, 0, 1   
];

const angle = Math.PI / 8;

const transformMatrix = [
    Math.cos(angle), Math.sin(angle), 0,
    -Math.sin(angle), Math.cos(angle), 0,
    0, 0, 1
];

const coordAttribSize = 2;
const colorAttribSize = 3;

const stride = Float32Array.BYTES_PER_ELEMENT * (coordAttribSize + colorAttribSize);
const colorOffset = Float32Array.BYTES_PER_ELEMENT * coordAttribSize;

const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
const colorLocation = gl.getAttribLocation(shaderProgram, 'a_color');

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertexData), gl.STATIC_DRAW);

gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, stride, colorOffset);

gl.enableVertexAttribArray(positionLocation);
gl.enableVertexAttribArray(colorLocation);

const transformLocation = gl.getUniformLocation(shaderProgram, 'u_transform');
gl.uniformMatrix3fv(transformLocation, false, new Float32Array(transformMatrix));

gl.drawArrays(gl.TRIANGLES, 0, 3);
