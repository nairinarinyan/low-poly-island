import ResourceManager from './resource-manager';
import { matMul, vecMatMul, inverse, transpose, toMat3 } from './math/matrix';
import { traverseTree } from './utils';

function setupMatrices(gl, program, model, camera) {
    const modelViewMat = matMul(camera.viewMatrix, model.transform);
    const normalMatrix = toMat3(transpose(inverse(modelViewMat)));

    const mvMatLocation = program.uniforms.u_mv;
    const pMatLocation = program.uniforms.u_p;
    const nMatLocation = program.uniforms.u_normal_mat;

    gl.uniformMatrix4fv(mvMatLocation, false, modelViewMat);
    gl.uniformMatrix4fv(pMatLocation, false, camera.projectionMatrix);
    gl.uniformMatrix3fv(nMatLocation, false, normalMatrix);
}

function setupAttributes(gl, attribs) {
    Object.keys(attribs).forEach(key => {
        const attrib = attribs[key];
        const { location, size, vbo } = attrib;

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);
    });
}

// set material colors and coefficients
function setupMaterialProps(gl, program, material) {
    const { ambientColor, diffuseColor, ambientCoefficient, diffuseCoefficient, specularCoefficient, shininess } = material;

    const ambientColorLoc = program.uniforms.u_mat_color_a;
    const diffuseColorLoc = program.uniforms.u_mat_color_d;
    const ambientKLoc = program.uniforms.u_ka;
    const diffuseKLoc = program.uniforms.u_kd;
    const specularKLoc = program.uniforms.u_ks;
    const shininessLoc = program.uniforms.u_shininess;

    gl.uniform3fv(ambientColorLoc, ambientColor);
    gl.uniform3fv(diffuseColorLoc, diffuseColor);
    gl.uniform1f(ambientKLoc, ambientCoefficient);
    gl.uniform1f(diffuseKLoc, diffuseCoefficient);
    gl.uniform1f(specularKLoc, specularCoefficient);
    gl.uniform1f(shininessLoc, shininess);
}

// set light intensities and position
function setupLights(gl, program, light, viewMatrix) {
    let { ambientIntensity, diffuseIntensity, position } = light;
    
    // fix light in world space
    position = vecMatMul(viewMatrix, Float32Array.from([...position, 1])).subarray(0, 3);

    const ambientILoc = program.uniforms.u_ia;
    const diffuseILoc = program.uniforms.u_id;
    const positionLoc = program.uniforms.u_light_position;

    gl.uniform3fv(positionLoc, position);
    gl.uniform1f(ambientILoc, ambientIntensity);
    gl.uniform1f(diffuseILoc, diffuseIntensity);
}

export default function renderScene(gl, scene, cb) {
    const { models, camera, light } = scene;

    const modelList = traverseTree({ children: scene.models }).slice(1);
    modelList.sort((m1, m2) => m1.material.shader > m2.material.shader);

    gl.clearColor(0.827, 0.984, 0.960, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    function draw(timeStamp) {
        requestAnimationFrame(draw);
        gl.clear(gl.COLOR_BUFFER_BIT);

        cb(timeStamp);

        modelList.forEach(model => {
            const program = ResourceManager.getProgram(model.material.shader);

            gl.useProgram(program.program);

            setupMatrices(gl, program, model, camera);
            setupAttributes(gl, model.attributes);
            setupMaterialProps(gl, program, model.material);
            setupLights(gl, program, light, camera.viewMatrix);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices.buffer);
            gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
        });
    }

    draw(performance.now());
}

