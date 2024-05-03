///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Cannon = pc.createScript('cannon')

Cannon.attributes.add('gameInstance', {
    type: 'entity',
    title: 'Game instance'
})

Cannon.attributes.add('cannonSprite', {
    type: 'entity',
    title: 'Cannon sprite',
    description: 'Sprite or Animated Sprite not working on 2D screen, this is sprite of cannon which is image element'
})

const LEFT = -1, RIGHT = 1, MID = 0

Cannon.prototype.initialize = function () {
    this.shootAnimatedSprite = this.cannonSprite.children[0]
    this.angle = this.entity.getEulerAngles().z
    this.direction = this.getDirection()
    this.readyBubble = this.app.root.findByName('readyBubble')
    this.nextBubble = null
    this.aiming = false
    this.elapsedDeltaTime = 0

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this)
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this)
    this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this)

    this.on('destroy', function () {
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this)
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this)
        this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this)
    }, this)
}

Cannon.prototype.onMouseDown = function (event) {
    this.aiming = true
    const { width, height } = this.app.graphicsDevice.clientRect
    const { x: cannonX, y: cannonY } = this.entity.getLocalPosition()
    const calculatedCannonX = width * cannonX / AppUtils.refSolution.width
    const calculatedCannonY = height * cannonY / AppUtils.refSolution.height
    const mouseX = event.x - width / 2
    const mouseY = height - event.y
    this.angle = Math.atan2(mouseY - calculatedCannonY, mouseX - calculatedCannonX) * pc.math.RAD_TO_DEG - 90
    const rotateAngle = new pc.Vec3(0, 0, this.angle)
    this.entity.setLocalEulerAngles(rotateAngle)
    this.cannonSprite.setLocalEulerAngles(rotateAngle)
}

Cannon.prototype.onMouseMove = function (event) {
    if (this.aiming) {
        this.angle += -event.dx / 3 || event.dy / 3
        const rotateAngle = new pc.Vec3(0, 0, this.angle)
        this.entity.setLocalEulerAngles(rotateAngle)
        this.cannonSprite.setLocalEulerAngles(rotateAngle)
    }
}

Cannon.prototype.onMouseUp = function () {
    if (this.aiming) {
        this.aiming = false
        this.shootAnimatedSprite.sprite.play('shoot_effect_clip')
        this.direction = this.getDirection()
        const bubblesArea = this.gameInstance.script.bubbleGame.bubblesArea
        this.gameInstance.script.bubbleGame.gameState = STATES.shootingBubble
        this.gameInstance.script.bubbleGame.currentColor = this.readyBubble.script.bubble.color
        const lastRowY = Math.min(...bubblesArea.children.map(bubble => bubble.getPosition().y))
        this.gameInstance.script.bubbleGame.lastRowY = lastRowY
    }
}

Cannon.prototype.shootBubble = function (dt) {
    const bubble = this.readyBubble
    const speed = bubble.script.bubble.speed
    const hitWallTimes = bubble.script.bubble.hitWallTimes

    if (!(hitWallTimes % 2))
        bubble.setLocalPosition(bubble.getLocalPosition().add(new pc.Vec3(0, dt * speed, 0)))
    else {
        bubble.setLocalPosition(bubble.getLocalPosition().add(new pc.Vec3(
            -dt * speed * Math.sin(this.angle * pc.math.DEG_TO_RAD),
            dt * speed * Math.cos(this.angle * pc.math.DEG_TO_RAD),
            0
        )))
    }

    if (this.elapsedDeltaTime >= .15 && bubble.script.bubble.isHitWall()) {
        this.elapsedDeltaTime = 0
        if (this.direction === LEFT) {
            this.angle = -this.angle * (this.angle < 0 && .5 || 2)
            return
        }
        this.angle = -this.angle * (this.angle < 0 && 2 || .5)
    }
}

Cannon.prototype.getDirection = function () {
    return this.angle > 0 && LEFT || this.angle < 0 && RIGHT || MID
}

Cannon.prototype.update = function (dt) {
    this.elapsedDeltaTime += dt
    if (this.gameInstance.script.bubbleGame.gameState === STATES.shootingBubble) {
        this.shootBubble(dt)
    }
}