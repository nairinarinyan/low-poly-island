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
        .then(meshData => {
            return meshData.data;
        })
        .catch(console.error);
}

function draw(gl, program) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    importModel('suzanne')
        .then(modelPositionData => {
            const {
                attributes: { position },
                index
            } = modelPositionData;

            const { array, itemSize } = position;

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, 'a_vertex_position');
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, itemSize, gl.FLOAT, false, 0, 0);


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index.array), gl.STATIC_DRAW);

            gl.drawElements(gl.TRIANGLES, index.array.length, gl.UNSIGNED_SHORT, 0);
            gl.drawElements(gl.LINES, index.array.length, gl.UNSIGNED_SHORT, 0);
        });
}

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');

initViewport(gl);
window.addEventListener('resize', () => initViewport(gl));

loadShaders(gl).then(program => draw(gl, program));

}());
