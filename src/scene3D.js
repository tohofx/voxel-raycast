import Vec2 from './math/vector2.js';
import Vec3 from './math/vector3.js';

import MathUtil from './math/util.js';

import GLUtil from './graphics/glUtil.js';

import RayCaster from './raycast.js';

const camera = {
    near: 0.1,
    far: 15.0,
    fov: MathUtil.deg2rad(70),
    aspect: 16. / 9.,
    yaw: MathUtil.deg2rad(225),
    pitch: MathUtil.deg2rad(-30),
    position: [10, 8, 10],
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

const quad_model = {
    vao: null,
    vbo: null,
    ebo: null,
    indices: new Uint32Array([0, 1, 2, 2, 3, 0]),
};

let elementShader;
let texture;

const lightParams = {
    angle: 0,
    speed: 0.25,
    radius: 6.,
    center: [2.5, 6., 2.5]
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const init = (gl) => {

    elementShader = GLUtil.createProgram(
        GLUtil.createShader(`#version 300 es
            vec2 position[4] = vec2[](
                vec2(-1.0, -1.0),
                vec2( 1.0, -1.0),
                vec2( 1.0,  1.0),
                vec2(-1.0,  1.0)
            );
            layout (location = 0) in vec3 in_ScreenPosition;

            out vec3 vf_ScreenPosition;

            void main() {
                vf_ScreenPosition = in_ScreenPosition;
                gl_Position = vec4(position[gl_VertexID], 0.0, 1.0);
            }`, WebGL2RenderingContext.VERTEX_SHADER),
        GLUtil.createShader(`#version 300 es
            precision highp float;
            
            ivec3 mapSize = ivec3(5, 5, 5);
            int map[125] = int[](
                1, 1, 1, 1, 1,
                1, 1, 1, 1, 1,
                1, 1, 1, 1, 1,
                1, 1, 1, 1, 1,
                1, 1, 1, 1, 1,

                1, 1, 1, 1, 1,
                1, 0, 0, 0, 0,
                1, 0, 1, 1, 1,
                1, 0, 1, 0, 1,
                0, 0, 0, 0, 0,

                1, 1, 1, 1, 1,
                1, 0, 1, 1, 1,
                1, 0, 1, 1, 1,
                1, 0, 1, 0, 0,
                0, 0, 0, 0, 0,

                1, 1, 1, 1, 1,
                1, 1, 1, 0, 0,
                1, 1, 1, 0, 0,
                1, 1, 1, 0, 0,
                0, 0, 0, 0, 0,

                1, 1, 1, 1, 1,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            );

            vec3 NORMAL[6] = vec3[](
                vec3(-1.,  0.,  0.),
                vec3( 1.,  0.,  0.),
                vec3( 0., -1.,  0.),
                vec3( 0.,  1.,  0.),
                vec3( 0.,  0., -1.),
                vec3( 0.,  0.,  1.)
            );

            in vec3 vf_Direction;
            in vec3 vf_ScreenPosition;
            
            out vec4 out_Color;
            
            struct CastResult {
                vec3 position;
                vec3 normal;
                vec2 uv;
            };

            vec2 calcUV(int normalIndex, vec3 position, vec3 voxel) {
                switch(normalIndex) {
                    case 0:   return vec2(position.z - voxel.z,         position.y - voxel.y);
                    case 1:   return vec2(voxel.z + 1. - position.z,    position.y - voxel.y);
                    case 2:   return vec2(voxel.z + 1. - position.z,    position.x - voxel.x);
                    case 3:   return vec2(position.z - voxel.z,         position.x - voxel.x);
                    case 4:   return vec2(voxel.x + 1. - position.x,    position.y - voxel.y);
                    case 5:   return vec2(position.x - voxel.x,         position.y - voxel.y);
                }
                return vec2(0.0, 0.0);
            }

            CastResult castRay(vec3 start, vec3 direction) {

                vec3 scalar = 1. / direction;
            
                vec3 step = vec3(
                    length(direction * scalar.x),
                    length(direction * scalar.y),
                    length(direction * scalar.z)
                );
            
                ivec3 voxel = ivec3(start);
                ivec3 voxelStep = ivec3(
                    direction.x < 0. ? -1 : 1,
                    direction.y < 0. ? -1 : 1,
                    direction.z < 0. ? -1 : 1
                );
            
                ivec3 normalIndices = ivec3(
                    direction.x < 0. ? 1 : 0,
                    direction.y < 0. ? 3 : 2,
                    direction.z < 0. ? 5 : 4
                );
            
                vec3 initial = vec3(
                    direction.x < 0. ? start.x - float(voxel.x) : float(voxel.x) + 1. - start.x,
                    direction.y < 0. ? start.y - float(voxel.y) : float(voxel.y) + 1. - start.y,
                    direction.z < 0. ? start.z - float(voxel.z) : float(voxel.z) + 1. - start.z
                );
            
                vec3 distance = step * initial;
            
                float dist = 0.;
                int normalIndex = -1;
                for(float f = 0.; f < 1.; f += (1. / 30.)) {
            
                    if( voxel.x < 0     ||  voxel.y < 0     ||  voxel.z < 0     || 
                        voxel.x >= mapSize.x    ||  voxel.y >= mapSize.y    ||  voxel.z >= mapSize.z    ) {
                        //break;
                    }
                    else {
                        int voxelIndex = voxel.x + voxel.z * mapSize.x + voxel.y * mapSize.x * mapSize.z;
                        int voxelValue = map[voxelIndex];
            
                        if(voxelValue > 0) {
                            break;
                        }
                    }
            
                    if (distance.x < distance.y) {
                        if (distance.x < distance.z) {
                            dist = distance.x;
                            distance.x += step.x;
                            voxel.x += voxelStep.x;
                            normalIndex = normalIndices.x;
                        }
                        else {
                            dist = distance.z;
                            distance.z += step.z;
                            voxel.z += voxelStep.z;
                            normalIndex = normalIndices.z;
                        }
                    }
                    else {
                        if (distance.y < distance.z) {
                            dist = distance.y;
                            distance.y += step.y;
                            voxel.y += voxelStep.y;
                            normalIndex = normalIndices.y;
                        }
                        else {
                            dist = distance.z;
                            distance.z += step.z;
                            voxel.z += voxelStep.z;
                            normalIndex = normalIndices.z;
                        }
                    }
                }
            
                vec3 position = start + dist * direction;
                vec3 normal = normalIndex < 0 ? vec3(0.) : NORMAL[normalIndex];
                vec2 uv = calcUV(normalIndex, position, vec3(voxel));

                return CastResult(position, normal, uv);
            }

            uniform vec3 u_CameraPosition;
            uniform vec3 u_LightPosition;
            uniform sampler2D u_Texture;

            void main() {
                vec3 start = vf_ScreenPosition;
                vec3 direction = normalize(vf_ScreenPosition - u_CameraPosition);
                CastResult result = castRay(start, direction);
                vec3 textureSample = texture(u_Texture, result.uv).rgb;

                vec3 toEye = u_CameraPosition - result.position;
                float eyeDistance = length(toEye);

                vec3 lightSamplePoint = result.position + result.normal * 0.001;

                vec3 ambient = vec3(0.2);
                vec3 toLight = u_LightPosition - lightSamplePoint;
                vec3 lightDir = normalize(toLight);
                float lightDistance = length(toLight);

                CastResult shadowCastResult = castRay(lightSamplePoint, lightDir);
                float shadowCastDistance = length(shadowCastResult.position - lightSamplePoint); 

                float diff = shadowCastDistance < lightDistance ? 0. : max(0., 5. * dot(result.normal, lightDir)) / lightDistance;


                vec3 color = (ambient + (1. - ambient) * diff) * textureSample * (result.normal + 1.) * 0.5;

                out_Color = vec4(color * (1. - smoothstep(12., 15., eyeDistance)), 1.0);
            }`, WebGL2RenderingContext.FRAGMENT_SHADER)
    );

    quad_model.vao = gl.createVertexArray();
    gl.bindVertexArray(quad_model.vao);
    quad_model.vbo = GLUtil.createArrayBuffer(new Float32Array([
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 1.0, 0.0,
        0.0, 1.0, 0.0
    ]), [
        { index: 0, size: 3, type: WebGL2RenderingContext.FLOAT, normalized: false, stride: 12, offset: 0 }
    ], WebGL2RenderingContext.DYNAMIC_DRAW);
    quad_model.ebo = GLUtil.createElementBuffer(quad_model.indices);

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

        camera.position[0] = MathUtil.clamp(camera.position[0], 0., 10.);
        camera.position[1] = MathUtil.clamp(camera.position[1], 0., 10.);
        camera.position[2] = MathUtil.clamp(camera.position[2], 0., 10.);
    }
};

const prepareRendering = (gl) => {
/*
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
    }*/

    const front = [
        Math.sin(camera.yaw) * Math.cos(camera.pitch),
        Math.sin(camera.pitch),
        Math.cos(camera.yaw) * Math.cos(camera.pitch)
    ];
    const right = Vec3.normalize(Vec3.cross(front, [0, 1, 0]));
    const up = Vec3.normalize(Vec3.cross(right, front));

    const w = Math.tan(camera.fov * 0.5) * camera.near;
    const h = w / camera.aspect;
    
    const center = Vec3.add(Vec3.clone(camera.position), Vec3.scale(front, camera.near));

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, quad_model.vbo);
    gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, new Float32Array([
        center[0] - right[0] * w - up[0] * h, center[1] - right[1] * w - up[1] * h, center[2] - right[2] * w - up[2] * h,
        center[0] + right[0] * w - up[0] * h, center[1] + right[1] * w - up[1] * h, center[2] + right[2] * w - up[2] * h,
        center[0] + right[0] * w + up[0] * h, center[1] + right[1] * w + up[1] * h, center[2] + right[2] * w + up[2] * h,
        center[0] - right[0] * w + up[0] * h, center[1] - right[1] * w + up[1] * h, center[2] - right[2] * w + up[2] * h,
    ]));
};

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 */
const render = (gl) => {

    const offset = Vec2.scale([
        Math.cos(lightParams.angle),
        Math.sin(lightParams.angle)
    ], lightParams.radius);

    gl.useProgram(elementShader);

    const cameraPos = gl.getUniformLocation(elementShader, 'u_CameraPosition');
    gl.uniform3f(cameraPos, ...camera.position);

    const lightPos = gl.getUniformLocation(elementShader, 'u_LightPosition');
    gl.uniform3f(lightPos, lightParams.center[0] + offset[0], lightParams.center[1], lightParams.center[2] + offset[1]);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);

    gl.bindVertexArray(quad_model.vao);
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, quad_model.ebo);
    gl.enableVertexAttribArray(0);
    gl.drawElements(WebGL2RenderingContext.TRIANGLES, quad_model.indices.length, WebGL2RenderingContext.UNSIGNED_INT, 0);
};

export default {
    init,
    update,
    prepareRendering,
    render,
};