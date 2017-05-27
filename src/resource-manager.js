import { loadResource } from './utils';

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
        return this.programs.find(p => p.name === programName);
    }
};

export default ResourceManager;