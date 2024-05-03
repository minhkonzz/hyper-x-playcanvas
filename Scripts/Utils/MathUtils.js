///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
const MathUtils = {
    pythagorean: (a, b) => Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)),
    randInRange: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
}