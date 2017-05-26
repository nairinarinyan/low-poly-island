export default function initGL() {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    window.gl = gl;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    const setViewport = () => gl.viewport(0, 0, canvas.width, canvas.height);
    setViewport();
    window.addEventListener('resize', setViewport);

    return gl;
}
