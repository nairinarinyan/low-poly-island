import { importModel } from './models';

export default function draw(gl, program) {
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