/**
 * @type {WebGL2RenderingContext}
 */
let gl;

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
const getGLContext = (canvas) => {
    gl = canvas.getContext('webgl2');
    return gl;
};

/**
 * 
 * @param {string} src 
 * @param {GLenum} type 
 * @returns {WebGLShader}
 */
const createShader = (src, type) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
        throw Error(`failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
};

/**
 * 
 * @param {WebGLShader} vs 
 * @param {WebGLShader} fs 
 * @returns {WebGLProgram}
 */
const createProgram = (vs, fs) => {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
        throw Error(`failed to link shader program: ${gl.getProgramInfoLog(program)}`);
    }

    return program;
};

const createArrayBuffer = (data, attributes, usage = WebGL2RenderingContext.STATIC_DRAW) => {
    const vbo = gl.createBuffer();
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vbo);
    gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, usage);
    attributes.forEach(attrib => {
        gl.vertexAttribPointer(attrib.index, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
    });
    return vbo;
};

const createElementBuffer = (data, usage = WebGL2RenderingContext.STATIC_DRAW) => {
    const ebo = gl.createBuffer();
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, data, usage);
    return ebo;
};


export default {
    getGLContext,
    createShader,
    createProgram,
    createArrayBuffer,
    createElementBuffer,
};