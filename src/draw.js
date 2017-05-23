import { importModel } from './models';
import { identity, perspective, lookAt, matMul, vecMatMul, rotate } from './math';

let angle = 0;

function composeMVPMatrix(gl) {
    const { width, height } = gl.canvas;

    const cameraLocation = new Float32Array([0, 10, -15, 1]);
    const cameraTarget = new Float32Array([0, 0, 15]);
    const up = new Float32Array([0, 1, 0])

    angle += .01;

    const mMatrix = matMul(rotate('y', angle), identity());
    const vMatrix = lookAt(cameraLocation, cameraTarget, up);
    const pMatrix = perspective(Math.PI / 4, width / height, .5, 500);

    const mv = matMul(vMatrix, mMatrix);
    const mvp = matMul(pMatrix, mv);

    return mvp;
}

export default function draw(gl, program) {
    gl.clearColor(0, 0, 0, 0);
    gl.useProgram(program);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    importModel('tree')
        .then(data => {
            const { meshes: [meshData] } = data;
            const { vertices, normals, faces } = meshData;

            const indices = [].concat.apply([], faces);

            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            const mvpLocation = gl.getUniformLocation(program, 'u_mvp');

            render();

            function render() {
                gl.clear(gl.COLOR_BUFFER_BIT);
                requestAnimationFrame(render);
                gl.uniformMatrix4fv(mvpLocation, false, composeMVPMatrix(gl));

                gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
                gl.drawElements(gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT, 0);
            }
        });
}
