/**
 * @typedef {[x: number, y: number]} Vector2
 */

/**
 * 
 * @param {Vector2} param0 
 * @returns {number}
 */
const magnitude = ([x, y]) => Math.sqrt(x * x + y * y);


export default {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Vector2}
     */
    create: (x, y) => [x, y],

    /**
     * 
     * @param {Vector2} param0 
     * @param {Vector2} param1 
     * @returns {Vector2}
     */
    add: ([x0, y0], [x1, y1]) => [x0 + x1, y0 + y1],

    /**
     * 
     * @param {Vector2} param0 
     * @param {Vector2} param1 
     * @returns {Vector2}
     */
    mult: ([x0, y0], [x1, y1]) => [x0 * x1, y0 * y1],

    /**
     * 
     * @param {Vector2} param0 
     * @param {Vector2} param1 
     * @returns {Vector2}
     */
    sub: ([x0, y0], [x1, y1]) => [x0 - x1, y0 - y1],

    /**
     * 
     * @param {Vector2} param0 
     * @param {Vector2} param1 
     * @returns {Vector2}
     */
    div: ([x0, y0], [x1, y1]) => [x0 / x1, y0 / y1],

    /**
     * 
     * @param {Vector2} param0 
     * @param {number} s 
     * @returns {Vector2}
     */
    scale: ([x, y], s) => [s * x, s * y],

    /**
     * 
     * @param {Vector2} param0 
     * @returns {Vector2}
     */
    floor: ([x, y]) => [Math.floor(x), Math.floor(y)],

    /**
     * 
     * @param {Vector2} param0 
     * @param {Vector2} param1 
     * @returns {number}
     */
    dot: ([x0, y0], [x1, y1]) => x0 * x1 + y0 * y1,

    /**
     * 
     * @param {Vector2} vec 
     * @returns {Vector2}
     */
    normalize: (vec) => {
        const length = magnitude(vec);
        if(length > 0) {
            return [
                vec[0] / length,
                vec[1] / length,
            ]
        }
        return [0, 0]
    },

    magnitude
};