import GLUtil from './graphics/glUtil.js';

import Scene3D from './scene3D.js';

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById('output_canvas');

/**
 * @type {WebGL2RenderingContext}
 */
const gl = GLUtil.getGLContext(canvas);


const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

let thisFrame = 0;
let lastFrame = 0;
let delta = 0;

const init = () => {
    lastFrame = Date.now();

    console.log(`${gl.getParameter(WebGL2RenderingContext.MAX_UNIFORM_BLOCK_SIZE)}`);

    Scene3D.init(gl);

    console.log(`init took: ${Date.now() - lastFrame}ms`);
};


const update = (delta) => {

    Scene3D.update(delta, keys);
};

const render = () => {

    Scene3D.prepareRendering(gl);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

    Scene3D.render(gl);
};

const loop = () => {

    thisFrame = Date.now();
    delta = (thisFrame - lastFrame) * 0.001;
    lastFrame = thisFrame;

    update(delta);
    render();

    requestAnimationFrame(loop);
};

window.addEventListener('load', () => {

    init();
    loop();
});