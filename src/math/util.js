export default {
    /**
     * converts the given angle from degrees to radians
     * @param {number} angle angle in degrees 
     * @returns {number} angle in radians
     */
    deg2rad: (angle) => angle * Math.PI / 180.,

    /**
     * converts the given angle from radians to degrees
     * @param {number} angle angle in radians
     * @returns {number} angle in degress
     */
    rad2deg: (angle) => angle * 180. / Math.PI,

    /**
     * checks if `value` is within the interval specified by `min` and `max`.
     * If it is, `value` is returned.
     * If not, the `min` or the `max` is returned depending on whether `value` is less or greater respectively
     * @param {number} value value to test 
     * @param {number} min the lower bound
     * @param {number} max the upper bound
     * @returns {number} the clamped value
     */
    clamp: (value, min, max) => value < min ? min : value > max ? max : value,
};