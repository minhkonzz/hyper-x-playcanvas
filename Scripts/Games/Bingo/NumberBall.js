///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var NumberBall = pc.createScript('numberBall')

NumberBall.attributes.add('letter', { type: 'string', title: 'Letter' })
NumberBall.attributes.add('numberText', { type: 'entity', title: 'Number text' })
NumberBall.attributes.add('progressBoundary', { type: 'entity', title: 'Progress boundary' })
NumberBall.attributes.add('circleRadial', { type: 'entity', title: 'Circle radial' })
NumberBall.attributes.add('scoreText', { type: 'entity', title: 'Score text' })

NumberBall.prototype.initialize = function() {
    this.elapsedTime = 0
}

NumberBall.prototype.init = function(value) {
    this.value = value
    this.numberText.element.text = this.value
}

NumberBall.prototype.onTapStart = function () {
    const scaleScript = this.scoreText.script.scale     
    scaleScript.start(true)
    this.timeoutId = setTimeout(() => scaleScript.start(false), 2000)
}

NumberBall.prototype.setIsCurrentBall = function(isCurrentBall) {
    if (isCurrentBall) {
        this.entity.element.on(pc.EVENT_MOUSEDOWN, this.onTapStart, this)
        if (this.app.touch) 
            this.entity.element.on(pc.EVENT_TOUCHSTART, this.onTapStart, this)
        return
    }
    clearTimeout(this.timeoutId)
    this.entity.element.off(pc.EVENT_MOUSEDOWN, this.onTapStart, this)
    if (this.app.touch) 
        this.entity.element.off(pc.EVENT_TOUCHSTART, this.onTapStart, this)
}

NumberBall.prototype.move = function(dt, i, len) {
    const entity = this.entity
    entity.setLocalEulerAngles(entity.getLocalEulerAngles().add(new pc.Vec3(0, 0, dt * 360)))
    entity.setLocalPosition(entity.getLocalPosition().sub(new pc.Vec3(dt * 240, i === len - 1 ? dt * 140 : 0, 0)))
}

NumberBall.prototype.update = function(dt) {
    this.elapsedTime += dt
}