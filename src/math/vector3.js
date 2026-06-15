/**
 * @typedef {[x: number, y: number, z: number]} Vector3
 */

/**
 * calculates the magnitude of a given vector
 * @param {Vector3} param0 vector to calculate the magnitude of
 * @returns {number} the magnitude of the vector
 */
const magnitude = ([x, y, z]) => Math.sqrt(x * x + y * y + z * z);


export default {
    /**
     * 
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Vector3}
     */
    create: (x, y, z) => [x, y, z],

    /**
     * 
     * @param {Vector3} param0 
     * @returns {Vector3}
     */
    clone: ([x, y, z]) => [x, y, z],

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {Vector3}
     */
    add: ([x0, y0, z0], [x1, y1, z1]) => [x0 + x1, y0 + y1, z0 + z1],

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {Vector3}
     */
    mult: ([x0, y0, z0], [x1, y1, z1]) => [x0 * x1, y0 * y1, z0 * z1],

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {Vector3}
     */
    sub: ([x0, y0, z0], [x1, y1, z1]) => [x0 - x1, y0 - y1, z0 - z1],

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {Vector3}
     */
    div: ([x0, y0, z0], [x1, y1, z1]) => [x0 / x1, y0 / y1, z0 / z1],

    /**
     * 
     * @param {Vector3} param0 
     * @param {number} s 
     * @returns {Vector3}
     */
    scale: ([x, y, z], s) => [s * x, s * y, s * z],

    /**
     * 
     * @param {Vector3} param0 
     * @returns {Vector3}
     */
    floor: ([x, y, z]) => [Math.floor(x), Math.floor(y), Math.floor(z)],

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {number}
     */
    dot: ([x0, y0, z0], [x1, y1, z1]) => x0 * x1 + y0 * y1 + z0 * z1,

    /**
     * 
     * @param {Vector3} param0 
     * @param {Vector3} param1 
     * @returns {Vector3}
     */
    cross: ([x0, y0, z0], [x1, y1, z1]) => [y0 * z1 - z0 * y1, z0 * x1 - x0 * z1, x0 * y1 - y0 * x1],

    /**
     * 
     * @param {Vector3} vec 
     * @returns {Vector3}
     */
    normalize: (vec) => {
        const length = magnitude(vec);
        if(length > 0) {
            return [
                vec[0] / length,
                vec[1] / length,
                vec[2] / length
            ]
        }
        return [0, 0, 0]
    },

    magnitude,
};