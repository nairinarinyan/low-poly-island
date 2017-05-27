export function initGL() {
    const canvas = document.querySelector('#canvas');
    const { innerWidth, innerHeight, devicePixelRatio } = window;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    const gl = canvas.getContext('webgl');

    gl.viewport(0, 0, canvas.width, canvas.height);

    return gl;
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

export function loadShaders(gl) {
    const vertexShaderSource = document.querySelector('#shader-vs').innerText;
    const fragmentShaderSource = document.querySelector('#shader-fs').innerText;

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = linkProgram(gl, vertexShader, fragmentShader);

    return program;
}