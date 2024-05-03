///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
const ArrayUtils = {
    isArray: (arr) => {
        return Array.isArray(arr) && arr.length > 0
    },

    removeDuplicates: (arr) => Array.from(new Set(arr))
}








