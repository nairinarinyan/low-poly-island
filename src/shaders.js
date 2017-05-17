import { loadResource } from './utils';

export function loadShaders(gl) {
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
