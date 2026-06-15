import Vec2 from './math/vector2.js';
import Vec3 from './math/vector3.js';

import MathUtil from './math/util.js';

import GLUtil from './graphics/glUtil.js';

import RayCaster from './raycast.js';

const level_3d = {
    size: [5, 5, 5],
    data: [
        1, 1, 1, 1, 1,
        1, 1, 1, 1, 1,
        1, 1, 1, 1, 1,
        1, 1, 1, 1, 1,
        1, 1, 1, 1, 1,

        0, 0, 0, 0, 0,
        0, 1, 1, 1, 0,
        0, 1, 1, 1, 0,
        0, 1, 1, 1, 0,
        0, 0, 0, 0, 0,

        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,

        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,

        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
    ]
};

const shader_source = {
    vertex: `#version 300 es
        layout (location = 0) in vec2 in_Position;

        layout (location = 1) in vec2 in_Offset;
        layout (location = 2) in vec3 in_WorldPosition;
        layout (location = 3) in vec2 in_UV;
        layout (location = 4) in vec3 in_Normal;

        out vec3 vf_Position;
        out vec2 vf_UV;
        out vec3 vf_Normal;

        void main() {
            vf_UV = in_UV;
            vf_Normal = in_Normal;
            vf_Position = in_WorldPosition;
            gl_Position = vec4(in_Position + in_Offset, 0.0, 1.0);
        }`,

    fragment: `#version 300 es
        precision highp float;

        in vec2 vf_UV;
        in vec3 vf_Normal;
        in vec3 vf_Position;

        out vec4 out_Color;

        uniform sampler2D u_Texture;
        uniform vec3 u_CameraPosition;
        uniform vec3 u_LightPosition;

        void main() {

            float distance = length(vf_Position - u_CameraPosition);

            vec3 toLight = u_LightPosition - vf_Position;
            float diff = max(0., dot(normalize(toLight), vf_Normal));

            float brightness = 0.2 + 0.8 * diff;

            vec3 texSample = texture(u_Texture, vec2(vf_UV.x, vf_UV.y)).rgb;
            vec3 normalColor = (vf_Normal + 1.) * 0.5;
            vec3 color = brightness * texSample * normalColor;
            color *= (1. - smoothstep(9., 13., distance));
            out_Color = vec4(color, 1.0);
        }`
};

const camera = {
    near: 0.1,
    far: 15.0,
    fov: MathUtil.deg2rad(70),
    aspect: 16. / 9.,
    yaw: MathUtil.deg2rad(45),
    pitch: MathUtil.deg2rad(-35),
    position: [-4, 8, -4],
    resolution: [160, 90]
};

const generateCheckerTexture = (width, height, cw, ch) => {

    const imgData = new Uint8Array(4 * width * height);

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            const pixelOffset = 4 * (x + y * width);
            const cx = Math.floor(x / cw);
            const cy = Math.floor(y / ch);
            const checker = (cx + cy) % 2 == 0 ? 255 : 0;

            imgData[pixelOffset] = checker;
            imgData[pixelOffset + 1] = checker;
            imgData[pixelOffset + 2] = checker;
            imgData[pixelOffset + 3] = 255;
        }
    }

    return imgData;
}

const RAY_COUNT = camera.resolution[0] * camera.resolution[1];
const rays_3d = new Array(RAY_COUNT).fill({ start: [0, 0, 0], end: [0, 0, 0] });
const quad_size = [2 / camera.resolution[0], 2 / camera.resolution[1]];
const quads = {
    buffers: [
        {
            data: new Float32Array([
                0.0,            0.0,
                quad_size[0],   0.0,
                quad_size[0],   quad_size[1],
                0.0,            quad_size[1]
            ]),
            attributes: [
                { index: 0, size: 2, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 8, offset: 0 }
            ],
            usage: WebGL2RenderingContext.STATIC_DRAW
        },
        {
            data: new Float32Array(new Array(rays_3d.length).fill(0).map((current, idx) => {
                const x = idx % camera.resolution[0];
                const y = Math.floor(idx / camera.resolution[0]);

                const min = [
                    -1 + x * quad_size[0],
                    1 - (y + 1) * quad_size[1]
                ];

                return [min[0], min[1]];
            }).flat()),
            attributes: [
                { index: 1, size: 2, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 8, offset: 0 }
            ],
            usage: WebGL2RenderingContext.STATIC_DRAW,
            instanced: { divisor: 1 }
        },
        {
            data: new Float32Array(new Array(rays_3d.length).fill(0).map(() => [0, 0, 0,    0, 0,   0, 0, 0]).flat()),
            attributes: [
                { index: 2, size: 3, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 32, offset: 0 },
                { index: 3, size: 2, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 32, offset: 12 },
                { index: 4, size: 3, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 32, offset: 20 },
            ],
            usage: WebGL2RenderingContext.DYNAMIC_DRAW,
            instanced: { divisor: 1 }
        }
    ],
    indices: new Uint32Array([0, 1, 2, 2, 3, 0]),
};
const quad_model = {
    vao: null,
    vbo: null,
    ebo: null,
};

let shaderProgram3D;

let texture;

const lightParams = {
    angle: 0,
    speed: 1,
    radius: 5.,
    center: [2.5, 4., 2.5]
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const init = (gl) => {
    shaderProgram3D = GLUtil.createProgram(
        GLUtil.createShader(shader_source.vertex, WebGL2RenderingContext.VERTEX_SHADER), 
        GLUtil.createShader(shader_source.fragment, WebGL2RenderingContext.FRAGMENT_SHADER)
    );

    quad_model.vao = gl.createVertexArray();
    gl.bindVertexArray(quad_model.vao);

    quad_model.vbo = quads.buffers.map(buffer => {
        const vbo = GLUtil.createArrayBuffer(buffer.data, buffer.attributes, buffer.usage);
        if(buffer.instanced) {
            buffer.attributes.forEach(attrib => gl.vertexAttribDivisor(attrib.index, buffer.instanced.divisor));
        } 
        return vbo;
    });
    quad_model.ebo = gl.createBuffer();
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, quad_model.ebo);
    gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, quads.indices, WebGL2RenderingContext.STATIC_DRAW);

    texture = gl.createTexture();
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);
    gl.texImage2D(
        WebGL2RenderingContext.TEXTURE_2D,
        0,
        WebGL2RenderingContext.RGBA,
        128, 128,
        0,
        WebGL2RenderingContext.RGBA,
        WebGL2RenderingContext.UNSIGNED_BYTE,
        generateCheckerTexture(128, 128, 64, 64)
    );

    gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.CLAMP_TO_EDGE);
    gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.CLAMP_TO_EDGE);
    gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.NEAREST);
    gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext.NEAREST);
};

const update = (delta, keys) => {

    lightParams.angle += lightParams.speed * delta;

    if(keys['ArrowLeft']) {
        camera.yaw += 1 * delta;
    }  
    if(keys['ArrowRight']) {
        camera.yaw -= 1 * delta;
    }

    if(keys['ArrowUp']) {
        camera.pitch += 1 * delta;
    }  
    if(keys['ArrowDown']) {
        camera.pitch -= 1 * delta;
    }

    camera.pitch = MathUtil.clamp(camera.pitch, -MathUtil.deg2rad(89.9), MathUtil.deg2rad(89.9));

    const move = [0, 0];
    if(keys['w']) {
        move[1] += 1;
    };
    if(keys['s']) {
        move[1] -= 1;
    };

    if(keys['d']) {
        move[0] += 1;
    };
    if(keys['a']) {
        move[0] -= 1;
    };

    const front = [
        Math.sin(camera.yaw) * Math.cos(camera.pitch),
        Math.sin(camera.pitch),
        Math.cos(camera.yaw) * Math.cos(camera.pitch)
    ];
    const right = Vec3.normalize(Vec3.cross(front, [0, 1, 0]));
    const up = Vec3.normalize(Vec3.cross(right, front));

    const mag = Vec2.magnitude(move);
    if(mag > 0){
        move[0] /= mag;
        move[1] /= mag;

        move[0] *= 1 * delta;
        move[1] *= 1 * delta;

        camera.position[0] += move[0] * right[0] + move[1] * front[0];
        camera.position[1] += move[0] * right[1] + move[1] * front[1];
        camera.position[2] += move[0] * right[2] + move[1] * front[2];
    }

    const w = Math.tan(camera.fov * 0.5) * camera.near;
    const h = w / camera.aspect;
    
    const center = Vec3.add(Vec3.clone(camera.position), Vec3.scale(front, camera.near));

    for(let y = 0; y < camera.resolution[1]; y++) {
        for(let x = 0; x < camera.resolution[0]; x++) {
            const index = x + y * camera.resolution[0];
            const p = Vec2.create(
                (2 * x / (camera.resolution[0] - 1) - 1) * w, 
                -(2 * y / (camera.resolution[1] - 1) - 1) * h
            );
            const start = Vec3.add(center, Vec3.add(Vec3.scale(right, p[0]), Vec3.scale(up, p[1])));
            const direction = Vec3.normalize(Vec3.sub(start, camera.position));

            rays_3d[index] = RayCaster.cast3D(start, direction, level_3d);
        }
    }
};

const prepareRendering = (gl) => {

    for(let y = 0; y < camera.resolution[1]; y++) {
        for(let x = 0; x < camera.resolution[0]; x++) {
            const idx = x + y * camera.resolution[0];
            const s = idx * 8;
            const ray = rays_3d[idx];
            const depth = ray.distance / (camera.far - camera.near);
            let u, v = 0;

            switch(ray.normalIndex){
                case RayCaster.NORMAL_INDICES.X_NEGATIVE:   u = ray.end[2] - ray.voxel[2];
                                                            v = ray.end[1] - ray.voxel[1];
                                                            break;
                case RayCaster.NORMAL_INDICES.X_POSITIVE:   u = ray.voxel[2] + 1 - ray.end[2];
                                                            v = ray.end[1] - ray.voxel[1];
                                                            break;
                case RayCaster.NORMAL_INDICES.Y_NEGATIVE:   u = ray.voxel[2] + 1 - ray.end[2];
                                                            v = ray.end[0] - ray.voxel[0];
                                                            break;
                case RayCaster.NORMAL_INDICES.Y_POSITIVE:   u = ray.end[2] - ray.voxel[2];
                                                            v = ray.end[0] - ray.voxel[0];
                                                            break;
                case RayCaster.NORMAL_INDICES.Z_NEGATIVE:   u = ray.voxel[0] + 1 - ray.end[0];
                                                            v = ray.end[1] - ray.voxel[1];
                                                            break;
                case RayCaster.NORMAL_INDICES.Z_POSITIVE:   u = ray.end[0] - ray.voxel[0];
                                                            v = ray.end[1] - ray.voxel[1];
                                                            break;
            }

            quads.buffers[2].data.set([
                ray.end[0], ray.end[1], ray.end[2],
                u, v,
                ray.normal[0], ray.normal[1], ray.normal[2]
            ], s);
        }
    }
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, quad_model.vbo[2]);
    gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, quads.buffers[2].data);
};

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const render = (gl) => {

    gl.useProgram(shaderProgram3D);

    const offset = Vec2.scale([
        Math.cos(lightParams.angle),
        Math.sin(lightParams.angle)
    ], lightParams.radius);

    const lightPos = gl.getUniformLocation(shaderProgram3D, 'u_LightPosition');
    gl.uniform3f(lightPos, lightParams.center[0] + offset[0], lightParams.center[1], lightParams.center[2] + offset[1]);

    const cameraPos = gl.getUniformLocation(shaderProgram3D, 'u_CameraPosition');
    gl.uniform3f(cameraPos, ...camera.position);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);

    gl.bindVertexArray(quad_model.vao);
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, quad_model.ebo);
    quads.buffers.forEach(buffer => buffer.attributes.forEach(attrib => gl.enableVertexAttribArray(attrib.index)));
    gl.drawElements(WebGL2RenderingContext.TRIANGLES, quads.indices.length, WebGL2RenderingContext.UNSIGNED_INT, 0);
    gl.drawElementsInstanced(
        WebGL2RenderingContext.TRIANGLES, 
        quads.indices.length, 
        WebGL2RenderingContext.UNSIGNED_INT, 
        0, 
        RAY_COUNT
    );
};

export default {
    init,
    update,
    prepareRendering,
    render,
};