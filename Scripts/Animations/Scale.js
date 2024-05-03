///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Scale = pc.createScript('scale')

const SCALE_UP = 1
const SCALE_DOWN = 0

Scale.attributes.add('duration', {
    type: 'number',
    default: .5,
    title: 'Duration (s)'
})

Scale.attributes.add('applyTween', {
    type: 'boolean',
    default: false,
    title: 'Apply tween'
})

Scale.prototype.start = function (scaleType) {
    if (typeof scaleType !== 'boolean') return
    const initScale = !scaleType ? 1 : 0
    this.entity.setLocalScale(new pc.Vec3(initScale, initScale, initScale))
    scaleType = scaleType ? 1 : 0
    if (this.applyTween) {
        this.startTween(scaleType)
        return
    }
}

Scale.prototype.startTween = function (scaleType) {
    const entity = this.entity
    const tween = entity.tween(entity.getLocalScale()).to(new pc.Vec3(scaleType, scaleType, scaleType), this.duration, pc.QuarticOut)
    tween.start()
}

Scale.prototype.update = function (dt) {}