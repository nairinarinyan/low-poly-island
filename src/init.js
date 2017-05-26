function setViewport(gl, cb) {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    let { canvas } = gl;

    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;

    const { width, height } = canvas
    
    gl.viewport(0, 0, width, height);
    cb && cb(width, height);
}

export default function initGL() {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    window.gl = gl;

    setViewport(gl);

    return gl;
}

export function watchWindowResize(gl, cb) {
    window.addEventListener('resize', () => {
        setViewport(gl, cb);
    });
}