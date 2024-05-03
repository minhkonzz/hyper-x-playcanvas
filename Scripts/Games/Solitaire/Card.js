///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Card = pc.createScript('card')

Card.attributes.add('suit', { type: 'string', title: 'Suit' })
Card.attributes.add('rank', { type: 'number', title: 'Rank' })
Card.attributes.add('isRed', { type: 'boolean', title: 'Is red color', description: 'True if this is red color, blue in otherwise' })
Card.attributes.add('visible', { type: 'boolean', title: 'Visible' })
Card.attributes.add('draggable', { type: 'boolean', title: 'Draggable' })
Card.attributes.add('faceUp', { type: 'entity', title: 'Face up' })
Card.attributes.add('faceDown', { type: 'entity', title: 'Face down' })
Card.attributes.add('scoreText', { type: 'entity', title: 'Score text' })
Card.attributes.add('gameInstance', { type: 'entity', title: 'Game instance' })

Card.prototype.initialize = function() {
    this.faceUp.enabled = this.visible
    this.faceDown.enabled = !this.faceUp.enabled
    this.entity.element.on(AppUtils.event.tapStartEventType, this.onTapStart, this)

    this.on('destroy', () => {
        this.entity.element.off(AppUtils.event.tapStartEventType, this.onTapStart, this)
        if (this.timeoutId) clearTimeout(this.timeoutId)
    })
}

Card.prototype.onTapStart = function() {
    if (this.visible && this.draggable) {
        const gameInstanceScript = this.gameInstance.script.solitaireGame
        const parent = this.entity.parent
        const childrenOfParent = filterChildrenList(parent.children)

        const i = childrenOfParent.indexOf(this.entity)
        const cardsDragging = childrenOfParent.filter((e, _i) => _i >= i)

        gameInstanceScript.cardsDragging.setPosition(this.entity.getPosition())
        gameInstanceScript.currentCardDraggingParent = parent

        for (let i = 0; i < cardsDragging.length; i++) {
            EngineIssueUtils.changeParent(cardsDragging[i], gameInstanceScript.cardsDragging, new pc.Vec3(0, -i * 65, 0))
        }
    }
}

Card.prototype.showScore = function (score) {
    this.scoreText.element.text = `+${score}`
    const scaleScript = this.scoreText.script.scale     
    scaleScript.start(true)
    this.timeoutId = setTimeout(() => scaleScript.start(false), 1500)
}

Card.prototype.setVisible = function(isVisible) {
    this.visible = isVisible
    this.faceUp.enabled = this.visible
    this.faceDown.enabled = !this.faceUp.enabled
}

Card.prototype.setDraggable = function(isDraggable) {
    this.draggable = isDraggable
}

Card.prototype.update = function(dt) {}




