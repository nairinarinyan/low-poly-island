export function initViewport(gl) {
    const { canvas } = gl;
    const { innerWidth, innerHeight, devicePixelRatio } = window;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    gl.viewport(0, 0, canvas.width, canvas.height);
}
