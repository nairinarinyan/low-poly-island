import { importModel } from './models';
import { identity, perspective, lookAt, matMul, vecMatMul, rotate, inverseMat3, transposeMat3 } from './math';

let angle = 0;

function composeMVPMatrix(gl) {
    const { width, height } = gl.canvas;

    const cameraLocation = new Float32Array([0, 13, -18]);
    const cameraTarget = new Float32Array([0, 5, 0]);
    const up = new Float32Array([0, 1, 0])

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


export default function draw(gl, program) {
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
