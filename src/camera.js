import { lookAt, perspective, orthographic } from './math/view';
import { identity, matMul } from './math/matrix';

class Camera {
    constructor(location, target) {
        this.location = new Float32Array(location);
        this.target = new Float32Array(target);
        this.viewMatrix = lookAt(this.location, this.target);
    }
}

export class PerspectiveCamera extends Camera {
    constructor(location, target, aspectRatio, near, far) {
        super(location, target);
        this.near = near;
        this.far = far;
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }

    update(aspectRatio) {
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, this.near, this.far);
    }
}

export class OrthographicCamera extends Camera {
    constructor(location, target, width, height, depth) {
        super(location, target);
        this.projectionMatrix = orthographic(width, height, depth);
    }
}