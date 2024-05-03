///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var CannonRm = pc.createScript('cannonRm')

CannonRm.attributes.add('gameInstance', { type: 'entity', 'title': 'Game instance' })
CannonRm.attributes.add('readyBubble', { type: 'entity', title: 'Ready bubble' })
CannonRm.attributes.add('nextBubble', { type: 'entity', title: 'Next bubble' })
CannonRm.attributes.add('aimLine', { type: 'entity', title: 'Aim line' })
CannonRm.attributes.add('shootEffect', { type: 'entity', title: 'Shoot Effect' })
CannonRm.attributes.add('mainCamera', { type: 'entity', title: 'Camera' })
CannonRm.attributes.add('startLineEntity', { type: 'entity', title: 'Start Line' })
CannonRm.attributes.add('endLineEntity', { type: 'entity', title: 'End Line' })
CannonRm.attributes.add('wall', { type: 'entity', title: 'Wall' })

const BUBBLE_SPEED = 16

CannonRm.prototype.initialize = function() {
    this.gameScript = this.gameInstance.script.bubbleGameRm
    this.managerScript = this.gameScript.managerScript
    this.mousePos = new pc.Vec2(0, 0)
    this.aiming = false
    this.prepareBubbles()
    this.registerEvents()
}

CannonRm.prototype.registerEvents = function() {
    if (this.app.touch) {
        this.app.mouse.on(pc.EVENT_TOUCHSTART, this.onMouseDown, this)
        this.app.mouse.on(pc.EVENT_TOUCHMOVE, this.onMouseMove, this)
        this.app.mouse.on(pc.EVENT_TOUCHEND, this.onMouseUp, this)
    }
    else {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this)
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this)
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this)
    }

    this.on('destroy', function () {
        if (this.app.touch) {
            this.app.mouse.off(pc.EVENT_TOUCHSTART, this.onMouseDown, this)
            this.app.mouse.off(pc.EVENT_TOUCHMOVE, this.onMouseMove, this)
            this.app.mouse.off(pc.EVENT_TOUCHEND, this.onMouseUp, this)
        }
        else {
            this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this)
            this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this)
            this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this)
        }
    }, this)
}

CannonRm.prototype.testRaycast = function () {
    var from = this.startLineEntity.getPosition()
    var to = this.endLineEntity.getPosition()
    var result = this.app.systems.rigidbody.raycastFirst(from, to)
    if (result) {
        var hitEntity = result.entity
    }
}

CannonRm.prototype.prepareBubbles = function () {
    let readyBubble = this.nextBubble.children[0]
    if (readyBubble) {
        readyBubble.collision.enabled = true
        readyBubble.script.scale.start(false)
        readyBubble.reparent(this.readyBubble)
        readyBubble.script.scale.start(true)
    } else {
        readyBubble = this.gameScript.initBubble()
        this.readyBubble.addChild(readyBubble)
    }
    const nextBubble = this.gameScript.initBubble()
    if (!nextBubble) return 
    nextBubble.collision.enabled = false
    this.nextBubble.addChild(nextBubble)
}

CannonRm.prototype.onMouseDown = function (mouseEvent) {
    const convertedMousePoint = this.mainCamera.camera.screenToWorld(mouseEvent.x, mouseEvent.y, 0)
    const { x: cannonX, y: cannonY } = this.entity.getPosition()
    this.angle = Math.atan2(convertedMousePoint.y - cannonY, convertedMousePoint.x - cannonX) * pc.math.RAD_TO_DEG - 90
    const rotateAngle = new pc.Vec3(0, 0, this.angle)
    this.entity.setLocalEulerAngles(rotateAngle)
    this.aiming = true
}

CannonRm.prototype.onMouseMove = function (mouseEvent) {
    this.mousePos = new pc.Vec2(mouseEvent.x, mouseEvent.y)
    if (this.aiming) {
        this.testRaycast()
        this.angle += -mouseEvent.dx / 3 || mouseEvent.dy / 3
        this.entity.setLocalEulerAngles(new pc.Vec3(0, 0, this.angle))
    }
}

CannonRm.prototype.onMouseUp = function () {
    this.aiming = false
    this.shootEffect.sprite.play('CannonEffectClip')
    this.shootingBubble = this.readyBubble.children[0]
    this.managerScript.gameState = BUBBLE_STATES.shootingBubble
}

CannonRm.prototype.shootBubble = function (dt) {
    const bubble = this.shootingBubble
    const bubbleScript = bubble.script.bubbleRm
    bubble.setPosition(bubble.getPosition().add(new pc.Vec3(
       -dt * BUBBLE_SPEED * Math.sin(this.angle * pc.math.DEG_TO_RAD),
        dt * BUBBLE_SPEED * Math.cos(this.angle * pc.math.DEG_TO_RAD),
        0
    )))

    let targetHitted = bubbleScript.targetHitted  // this is just copy instance of targetHitted
    // if bubble hit wall
    if (targetHitted && targetHitted.tags.has('wall')) {
        this.elapsedDeltaTime = 0
        this.angle += -this.angle * 2
        bubbleScript.targetHitted = null
        return
    }

    // if bubble hit another bubble on grid, attach to the grid
    if (targetHitted && targetHitted.tags.has('bubble')) {
        this.gameScript.attachGrid(targetHitted)
        this.managerScript.gameState = this.gameScript.bubbleDrops.length > 0 ? BUBBLE_STATES.droppingBubbles : BUBBLE_STATES.waitOnUser
        this.prepareBubbles()
        bubbleScript.targetHitted = null
    }
}

CannonRm.prototype.update = function(dt) {
    if (this.managerScript.gameState === BUBBLE_STATES.shootingBubble) {
        this.shootBubble(dt)
    }
}