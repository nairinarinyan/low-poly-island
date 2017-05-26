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

export {
    subtract,
    computeLength,
    dot,
    cross,
    normalize
};
