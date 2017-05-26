let isFullscreen;

function initFullScreen() {
    const fullScreenButton = document.querySelector('#fullscreen');

    fullScreenButton.addEventListener('click', () => {
        if (!isFullscreen) {
            document.body.webkitRequestFullScreen && document.body.webkitRequestFullScreen() ||
            document.body.mozRequestFullScreen && document.body.mozRequestFullScreen();
        } else {
           document.webkitExitFullscreen && document.webkitExitFullscreen() ||
           document.mozCancelFullScreen && document.mozCancelFullScreen();
        }

        isFullscreen = !isFullscreen;
    });
}

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
    initFullScreen();

    return gl;
}

export function watchWindowResize(gl, cb) {
    window.addEventListener('resize', () => {
        setTimeout(() => setViewport(gl, cb), 200);
    });
}