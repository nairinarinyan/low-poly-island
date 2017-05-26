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

const orthographic = (width, height, depth) => {
    return new Float32Array([
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 2 / depth, 0,
        -1, 1, 0, 1,
    ]);
};

const rotate = (axis, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    let mat;

    switch(axis) {
        case 'x':
            mat = [
                1, 0, 0, 0,
                0, c, s, 0,
                0, -s, c, 0, 
                0, 0, 0, 1
            ]; break;
        case 'y':
            mat = [
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0, 
                0, 0, 0, 1
            ]; break;
        case 'z':
            mat = [
                c, s, 0, 0,
                -s, c, 0, 0,
                0, 0, 1, 0, 
                0, 0, 0, 1
            ]; break;
    }

    return new Float32Array(mat);
};

const inverse = m => {
    const ret = new Float32Array(16);

    let m00 = m[0 * 4 + 0];
    let m01 = m[0 * 4 + 1];
    let m02 = m[0 * 4 + 2];
    let m03 = m[0 * 4 + 3];
    let m10 = m[1 * 4 + 0];
    let m11 = m[1 * 4 + 1];
    let m12 = m[1 * 4 + 2];
    let m13 = m[1 * 4 + 3];
    let m20 = m[2 * 4 + 0];
    let m21 = m[2 * 4 + 1];
    let m22 = m[2 * 4 + 2];
    let m23 = m[2 * 4 + 3];
    let m30 = m[3 * 4 + 0];
    let m31 = m[3 * 4 + 1];
    let m32 = m[3 * 4 + 2];
    let m33 = m[3 * 4 + 3];
    let tmp_0  = m22 * m33;
    let tmp_1  = m32 * m23;
    let tmp_2  = m12 * m33;
    let tmp_3  = m32 * m13;
    let tmp_4  = m12 * m23;
    let tmp_5  = m22 * m13;
    let tmp_6  = m02 * m33;
    let tmp_7  = m32 * m03;
    let tmp_8  = m02 * m23;
    let tmp_9  = m22 * m03;
    let tmp_10 = m02 * m13;
    let tmp_11 = m12 * m03;
    let tmp_12 = m20 * m31;
    let tmp_13 = m30 * m21;
    let tmp_14 = m10 * m31;
    let tmp_15 = m30 * m11;
    let tmp_16 = m10 * m21;
    let tmp_17 = m20 * m11;
    let tmp_18 = m00 * m31;
    let tmp_19 = m30 * m01;
    let tmp_20 = m00 * m21;
    let tmp_21 = m20 * m01;
    let tmp_22 = m00 * m11;
    let tmp_23 = m10 * m01;

    let t0 = (tmp_0*m11 + tmp_3*m21 + tmp_4*m31) - (tmp_1*m11 + tmp_2*m21 + tmp_5*m31);
    let t1 = (tmp_1*m01 + tmp_6*m21 + tmp_9*m31) - (tmp_0*m01 + tmp_7*m21 + tmp_8*m31);
    let t2 = (tmp_2*m01 + tmp_7*m11 + tmp_10*m31) - (tmp_3*m01 + tmp_6*m11 + tmp_11*m31);
    let t3 = (tmp_5*m01 + tmp_8*m11 + tmp_11*m21) - (tmp_4*m01 + tmp_9*m11 + tmp_10*m21);

    let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    ret[0]  = d * t0;
    ret[1]  = d * t1;
    ret[2]  = d * t2;
    ret[3]  = d * t3;
    ret[4]  = d * ((tmp_1*m10 + tmp_2*m20 + tmp_5*m30) - (tmp_0*m10 + tmp_3*m20 + tmp_4*m30));
    ret[5]  = d * ((tmp_0*m00 + tmp_7*m20 + tmp_8*m30) - (tmp_1*m00 + tmp_6*m20 + tmp_9*m30));
    ret[6]  = d * ((tmp_3*m00 + tmp_6*m10 + tmp_11*m30) - (tmp_2*m00 + tmp_7*m10 + tmp_10*m30));
    ret[7]  = d * ((tmp_4*m00 + tmp_9*m10 + tmp_10*m20) - (tmp_5*m00 + tmp_8*m10 + tmp_11*m20));
    ret[8]  = d * ((tmp_12*m13 + tmp_15*m23 + tmp_16*m33) - (tmp_13*m13 + tmp_14*m23 + tmp_17*m33));
    ret[9]  = d * ((tmp_13*m03 + tmp_18*m23 + tmp_21*m33) - (tmp_12*m03 + tmp_19*m23 + tmp_20*m33));
    ret[10] = d * ((tmp_14*m03 + tmp_19*m13 + tmp_22*m33) - (tmp_15*m03 + tmp_18*m13 + tmp_23*m33));
    ret[11] = d * ((tmp_17*m03 + tmp_20*m13 + tmp_23*m23) - (tmp_16*m03 + tmp_21*m13 + tmp_22*m23));
    ret[12] = d * ((tmp_14*m22 + tmp_17*m32 + tmp_13*m12) - (tmp_16*m32 + tmp_12*m12 + tmp_15*m22));
    ret[13] = d * ((tmp_20*m32 + tmp_12*m02 + tmp_19*m22) - (tmp_18*m22 + tmp_21*m32 + tmp_13*m02));
    ret[14] = d * ((tmp_18*m12 + tmp_23*m32 + tmp_15*m02) - (tmp_22*m32 + tmp_14*m02 + tmp_19*m12));
    ret[15] = d * ((tmp_22*m22 + tmp_16*m02 + tmp_21*m12) - (tmp_20*m12 + tmp_23*m22 + tmp_17*m02));

    return ret;
};

const transpose = m => {
    let t;

    t = m[1];
    m[1] = m[4];
    m[4] = t;

    t = m[2];
    m[2] = m[8];
    m[8] = t;

    t = m[3];
    m[3] = m[12];
    m[12] = t;

    t = m[6];
    m[6] = m[9];
    m[9] = t;

    t = m[7];
    m[7] = m[13];
    m[13] = t;

    t = m[11];
    m[11] = m[14];
    m[14] = t;

    return m;
};

const transposeMat3 = m => {
    let a01 = m[1], a02 = m[2];
    let a12 = m[5];
                
    m[1] = m[3];
    m[2] = m[6];
    m[3] = a01;
    m[5] = m[7];
    m[6] = a02;
    m[7] = a12;

    return m;
};

const inverseMat3 = m => {
    const ret = new Float32Array(9);

    let a00 = m[0], a01 = m[1], a02 = m[2];
    let a10 = m[4], a11 = m[5], a12 = m[6];
    let a20 = m[8], a21 = m[9], a22 = m[10];
    
    let b01 = a22*a11-a12*a21;
    let b11 = -a22*a10+a12*a20;
    let b21 = a21*a10-a11*a20;
            
    let d = a00*b01 + a01*b11 + a02*b21;
    let id = 1/d;
    
    ret[0] = b01*id;
    ret[1] = (-a22*a01 + a02*a21)*id;
    ret[2] = (a12*a01 - a02*a11)*id;
    ret[3] = b11*id;
    ret[4] = (a22*a00 - a02*a20)*id;
    ret[5] = (-a12*a00 + a02*a10)*id;
    ret[6] = b21*id;
    ret[7] = (-a21*a00 + a01*a20)*id;
    ret[8] = (a11*a00 - a01*a10)*id;
    
    return ret;
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
    orthographic,
    rotate,
    inverse,
    inverseMat3,
    transpose,
    transposeMat3
};
