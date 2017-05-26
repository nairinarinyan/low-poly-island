import { lookAt, perspective, orthographic } from './math';

class Camera {
    constructor(location, target) {
        this.viewMatrix = lookAt(new Float32Array(location), new Float32Array(target));
    }
}

export class PerspectiveCamera extends Camera {
    constructor(location, target, aspectRatio, near, far) {
        super(location, target);
        this.projectionMatrix = perspective(Math.PI / 4, aspectRatio, near, far);
    }
}

export class OrthographicCamera extends Camera {
    constructor(location, target, width, height, depth) {
        super(location, target);
        this.projectionMatrix = orthographic(width, height, depth);
    }
}