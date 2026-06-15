/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById('output_canvas');

/**
 * @type {WebGL2RenderingContext}
 */
const gl = canvas.getContext('webgl2');

const render = () => {

    gl.clearColor(0.0, 0.5, 0.75, 1.0);
    gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
};

window.onload = () => {
    render();
};