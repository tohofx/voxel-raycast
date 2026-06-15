import Vec2 from './math/vector2.js';
import Vec3 from './math/vector3.js'


const NORMALS = Object.freeze({
    X_NEGATIVE: 0,
    X_POSITIVE: 1,
    Y_NEGATIVE: 2,
    Y_POSITIVE: 3,
    Z_NEGATIVE: 4,
    Z_POSITIVE: 5,
});

const NORMAL_LUT = [
    [-1,  0,  0],
    [ 1,  0,  0],
    [ 0, -1,  0],
    [ 0,  1,  0],
    [ 0,  0, -1],
    [ 0,  0,  1]
];

/**
 * @param {Vector2} start 
 * @param {Vector2} direction 
 * @param {{ size: Vector2, data: number[] }} map
 */
const cast2D = (start, direction, map) => {

    const scalar = Vec2.create(1. / direction[0], 1. / direction[1]);

    const step = [
        Vec2.magnitude(Vec2.scale(direction, scalar[0])),
        Vec2.magnitude(Vec2.scale(direction, scalar[1])),
    ];

    const tile = Vec2.floor(start);
    
    const initial   = [
        direction[0] < 0 ? start[0] - tile[0] : tile[0] + 1 - start[0],
        direction[1] < 0 ? start[1] - tile[1] : tile[1] + 1 - start[1],
    ];

    const distance = Vec2.mult(step, initial);

    let dist = 0;
    let steps = 0;
    let normal = [0, 0]
    const MAX_STEPS = 25;
    while(steps < MAX_STEPS) {

        if(tile[0] < 0 || tile[1] < 0 || tile[0] >= map.size[0] || tile[1] >= map.size[1]) {
            break;
        }
        else {
            const tileIndex = tile[0] + tile[1] * map.size[0];
            const tileValue = map.data[tileIndex];

            if(tileValue > 0) {
                break;
            }
        }

        if (distance[0] < distance[1]) {
            dist = distance[0];
            distance[0] += step[0];
            tile[0] += direction[0] < 0 ? -1 : 1;
            normal = direction[0] < 0 ? [1, 0] : [-1, 0];
        }
        else {
            dist = distance[1];
            distance[1] += step[1];
            tile[1] += direction[1] < 0 ? -1 : 1;
            normal = direction[1] < 0 ? [0, 1] : [0, -1];
        }

        steps++;
    }

    return {
        start,
        end: [start[0] + dist * direction[0], start[1] + dist * direction[1]],
        distance: dist,
        normal
    }  
};

/**
 * 
 * @param {Vector3} start 
 * @param {Vector3} direction 
 * @param {{ size: Vector3, data: number[]}} map 
 */
const cast3D = (start, direction, map) => {
    const scalar = Vec3.create(
        1. / direction[0],
        1. / direction[1],
        1. / direction[2]
    );

    const step = Vec3.create(
        Vec3.magnitude(Vec3.scale(direction, scalar[0])),
        Vec3.magnitude(Vec3.scale(direction, scalar[1])),
        Vec3.magnitude(Vec3.scale(direction, scalar[2]))
    );

    const voxel = Vec3.floor(start);
    const voxelStep = Vec3.create(
        direction[0] < 0 ? -1 : 1,
        direction[1] < 0 ? -1 : 1,
        direction[2] < 0 ? -1 : 1
    );

    const normalIndices = [
        direction[0] < 0 ? NORMALS.X_POSITIVE : NORMALS.X_NEGATIVE,
        direction[1] < 0 ? NORMALS.Y_POSITIVE : NORMALS.Y_NEGATIVE,
        direction[2] < 0 ? NORMALS.Z_POSITIVE : NORMALS.Z_NEGATIVE
    ];

    const initial   = [
        direction[0] < 0 ? start[0] - voxel[0] : voxel[0] + 1 - start[0],
        direction[1] < 0 ? start[1] - voxel[1] : voxel[1] + 1 - start[1],
        direction[2] < 0 ? start[2] - voxel[2] : voxel[2] + 1 - start[2],
    ];

    const distance = Vec3.mult(step, initial);

    let dist = 0;
    let steps = 0;
    let normal = -1;
    const MAX_STEPS = 50;
    while(steps < MAX_STEPS) {

        if( voxel[0] < 0 ||             voxel[1] < 0 ||             voxel[2] < 0 || 
            voxel[0] >= map.size[0] ||  voxel[1] >= map.size[1] ||  voxel[2] >= map.size[2]) {
            //break;
        }
        else {
            const voxelIndex = voxel[0] + voxel[2] * map.size[0] + voxel[1] * map.size[0] * map.size[1];
            const voxelValue = map.data[voxelIndex];

            if(voxelValue > 0) {
                break;
            }
        }

        if (distance[0] < distance[1]) {
            if(distance[0] < distance[2]) {
                dist = distance[0];
                distance[0] += step[0];
                voxel[0] += voxelStep[0];
                normal = normalIndices[0];
            }
            else {
                dist = distance[2];
                distance[2] += step[2];
                voxel[2] += voxelStep[2];
                normal = normalIndices[2];
            }
        }
        else {
            if(distance[1] < distance[2]) {
                dist = distance[1];
                distance[1] += step[1];
                voxel[1] += voxelStep[1];
                normal = normalIndices[1];
            }
            else {
                dist = distance[2];
                distance[2] += step[2];
                voxel[2] += voxelStep[2];
                normal = normalIndices[2];
            }
        }

        steps++;
    }

    return {
        start,
        end: [
            start[0] + dist * direction[0],
            start[1] + dist * direction[1],
            start[2] + dist * direction[2],
        ],
        voxel,
        distance: dist,
        normal: normal < 0 ? [0, 0, 0] : NORMAL_LUT[normal],
        normalIndex: normal
    }
}

export default {
    cast2D,
    cast3D,
    NORMAL_INDICES: NORMALS
};