import { lookAt, perspective } from './math/view';
import { identity, matMul, vecMatMul, rotate } from './math/matrix';

export default class Camera {
    constructor(location, target, aspectRatio, near, far) {
        this.location = new Float32Array(location);
        this.target = new Float32Array(target);
        this.viewMatrix = lookAt(this.location, this.target);
        this.near = near;
        this.far = far;
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }

    update(aspectRatio) {
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }

    rotate(angle) {
        this.location = vecMatMul(
            rotate('y', angle),
            Float32Array.from([...this.location, 0])
        ).subarray(0, 3);

        this.viewMatrix = lookAt(this.location, this.target);
    }
}
