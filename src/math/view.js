import { subtract, normalize, dot, cross } from './vector';

const lookAt = (eye, target, up = new Float32Array([0,1,0])) => {
    const zAxis = normalize(subtract(eye, target));
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = cross(zAxis, xAxis);

    return new Float32Array([
                xAxis[0],         yAxis[0],          zAxis[0], 0,
                xAxis[1],         yAxis[1],          zAxis[1], 0,
                xAxis[2],         yAxis[2],          zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot( zAxis, eye),  1
    ]);
};

const perspective = (fov, aspect, near, far) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ]);
};

const orthographic = (width, height, depth) => new Float32Array([
    2 / width, 0, 0, 0,
    0, -2 / height, 0, 0,
    0, 0, 2 / depth, 0,
    -1, 1, 0, 1,
]);

export {
    lookAt,
    perspective,
    orthographic
};