import { initViewport } from './init';
import { loadShaders } from './shaders';
import draw from './draw';

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl');

initViewport(gl);
window.addEventListener('resize', () => initViewport(gl));

loadShaders(gl).then(program => draw(gl, program));