Math.random = (function() {
    let seed;
    Math.getRandomSeed = function () {
    	return seed;
    };
    const setRandomSeed = Math.setRandomSeed = function (newSeed) {
        if (typeof newSeed === 'undefined') {
            const uArr = new Uint32Array(1);
            window.crypto.getRandomValues(uArr);
            seed = uArr[0];
        } else {
        	seed = newSeed;
        }
    };
    setRandomSeed();

	return function() {
		// Robert Jenkins’ 32 bit integer hash function
		seed = ((seed + 0x7ED55D16) + (seed << 12))  & 0xFFFFFFFF;
		seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
		seed = ((seed + 0x165667B1) + (seed << 5))   & 0xFFFFFFFF;
		seed = ((seed + 0xD3A2646C) ^ (seed << 9))   & 0xFFFFFFFF;
		seed = ((seed + 0xFD7046C5) + (seed << 3))   & 0xFFFFFFFF;
		seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
		return (seed & 0xFFFFFFF) / 0x10000000;
	};
}());

// Add stable merge sort to Array and jQuery prototypes
// Note: We wrap it in a closure so it doesn't pollute the global
//       namespace, but we don't put it in $(document).ready, since it's
//       not dependent on the DOM
(function() {
    // expose to Array and jQuery
    Array.mergeSort = jQuery.fn.mergeSort = mergeSort;

    function mergeSort(compare) {

        var length = this.length,
            middle = Math.floor(length / 2);

        if (!compare) {
            compare = function(left, right) {
                if (left < right)
                    return -1;
                if (left == right)
                    return 0;
                else
                    return 1;
            };
        }

        if (length < 2)
            return this;

        return merge(
            mergeSort.call(this.slice(0, middle), compare),
            mergeSort.call(this.slice(middle, length), compare),
            compare
        );
    }

    function merge(left, right, compare) {

        var result = [];

        while (left.length > 0 || right.length > 0) {
            if (left.length > 0 && right.length > 0) {
                if (compare(left[0], right[0]) <= 0) {
                    result.push(left[0]);
                    left = left.slice(1);
                }
                else {
                    result.push(right[0]);
                    right = right.slice(1);
                }
            }
            else if (left.length > 0) {
                result.push(left[0]);
                left = left.slice(1);
            }
            else if (right.length > 0) {
                result.push(right[0]);
                right = right.slice(1);
            }
        }
        return result;
    }
})();
