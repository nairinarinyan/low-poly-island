const subtract = (v1, v2) => new Float32Array([
    v1[0] - v2[0],
    v1[1] - v2[1],
    v1[2] - v2[2]
]);

const computeLength = v => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];

const cross = (v1, v2) => new Float32Array([
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
]);

const normalize = vec => {
    const ret = new Float32Array(3);
    const length = computeLength(vec);

    ret[0] = vec[0]/length;
    ret[1] = vec[1]/length;
    ret[2] = vec[2]/length;

    return ret;
};

const vecMatMul = (m, v) => {
    return new Float32Array([
        m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12]*v[3],
        m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13]*v[3],
        m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
        m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3]
    ]);
}

const identity = () => {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

const matMul = (m1, m2) => {
    const ret = new Float32Array(16);

    ret[0]  = m1[0]*m2[0]  + m1[4]*m2[1]  + m1[8]*m2[2]  + m1[12]*m2[3];
    ret[4]  = m1[0]*m2[4]  + m1[4]*m2[5]  + m1[8]*m2[6]  + m1[12]*m2[7];
    ret[8]  = m1[0]*m2[8]  + m1[4]*m2[9]  + m1[8]*m2[10] + m1[12]*m2[11];
    ret[12] = m1[0]*m2[12] + m1[4]*m2[13] + m1[8]*m2[14] + m1[12]*m2[15];

    ret[1]  = m1[1]*m2[0]  + m1[5]*m2[1]  + m1[9]*m2[2]  + m1[13]*m2[3];
    ret[5]  = m1[1]*m2[4]  + m1[5]*m2[5]  + m1[9]*m2[6]  + m1[13]*m2[7];
    ret[9]  = m1[1]*m2[8]  + m1[5]*m2[9]  + m1[9]*m2[10] + m1[13]*m2[11];
    ret[13] = m1[1]*m2[12] + m1[5]*m2[13] + m1[9]*m2[14] + m1[13]*m2[15];

    ret[2]  = m1[2]*m2[0]  + m1[6]*m2[1]  + m1[10]*m2[2]  + m1[14]*m2[3];
    ret[6]  = m1[2]*m2[4]  + m1[6]*m2[5]  + m1[10]*m2[6]  + m1[14]*m2[7];
    ret[10] = m1[2]*m2[8]  + m1[6]*m2[9]  + m1[10]*m2[10] + m1[14]*m2[11];
    ret[14] = m1[2]*m2[12] + m1[6]*m2[13] + m1[10]*m2[14] + m1[14]*m2[15];

    ret[3]  = m1[3]*m2[0]  + m1[7]*m2[1]  + m1[11]*m2[2]  + m1[15]*m2[3];
    ret[7]  = m1[3]*m2[4]  + m1[7]*m2[5]  + m1[11]*m2[6]  + m1[15]*m2[7];
    ret[11] = m1[3]*m2[8]  + m1[7]*m2[9]  + m1[11]*m2[10] + m1[15]*m2[11];
    ret[15] = m1[3]*m2[12] + m1[7]*m2[13] + m1[11]*m2[14] + m1[15]*m2[15];

    return ret;
}

const lookAt = (eye, target, up) => {
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

//https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
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

const rotate = angle => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0, 
        0, 0, 0, 1
    ]);
};

export {
    subtract,
    computeLength,
    dot,
    cross,
    normalize,
    vecMatMul,
    identity,
    matMul,
    lookAt,
    perspective,
    rotate
};
