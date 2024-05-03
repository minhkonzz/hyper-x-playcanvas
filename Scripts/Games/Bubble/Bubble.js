///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Bubble = pc.createScript('bubble')

Bubble.attributes.add('color', {
    type: 'string', 
    title: 'Color'
})

Bubble.prototype.initialize = function() {
    this.speed = 3000
    this.hitWallTimes = 0
    this.angle = 0  // angle of cannon, not angle of bubble
}

Bubble.prototype.getSize = function() {
    const { width, height } = this.entity.element
    return { width, height }
}

Bubble.prototype.isHitWall = function() {
    const x = this.entity.getPosition().x
    return (x <= -1 || x >= .85) && (this.hitWallTimes += 1)
}

Bubble.prototype.update = function(dt) {}