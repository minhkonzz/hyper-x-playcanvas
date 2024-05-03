///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var BubbleGameRm = pc.createScript('bubbleGameRm')

BubbleGameRm.attributes.add('bubblesGrid', { type: 'entity', title: 'Bubbles grid' })
BubbleGameRm.attributes.add('bubbleInstances', { type: 'entity', title: 'Bubble instances', array: true })
BubbleGameRm.attributes.add('cannon', { type: 'entity', title: 'Cannon' })

const BUBBLE_STATES = {
    ...STATES, 
    shootingBubble: 100, 
    droppingBubbles: 101
}

BubbleGameRm.prototype.initialize = function () {
    this.rowsAmount = 6
    this.bubblesPerRow = 11
    this.managerScript = this.entity.script.gameManager
    this.elapsedTime = 0
    this.bubbleDrops = []
    this.bubblesBinaryMat = Array.from({ length: this.rowsAmount }, () => Array(this.bubblesPerRow).fill(1))
}

BubbleGameRm.prototype.initBubble = function () {
    const i = Math.floor(Math.random() * (this.bubbleInstances.length - 1))
    const bubble = this.bubbleInstances[i].clone()
    if (!bubble) return null
    bubble.enabled = true
    bubble.script.scale.start(true)
    return bubble
}

BubbleGameRm.prototype.initBubbleOnGrid = function (row, col) {
    const bubble = this.initBubble()
    bubble.row = row
    bubble.col = col
    const pos = new pc.Vec3(row % 2 && col + .5 || col, -row, 0)
    bubble.setPosition(pos)
    this.bubblesGrid.addChild(bubble)
}

BubbleGameRm.prototype.createBubbles = function () {
    let i = 0, j = 0
    while (i < this.rowsAmount) {
        this.initBubbleOnGrid(i, j)
        if (j === this.bubblesPerRow - 1) {
            j = 0
            i++
            continue
        }
        j++
    }
}

BubbleGameRm.prototype.isTwoBubblesClose = function (b1, b2) {
    const { x: x1, y: y1 } = b1.getPosition()
    const { x: x2, y: y2 } = b2.getPosition()
    return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1
}

BubbleGameRm.prototype.attachGrid = function (collided) {
    const bubble = this.cannon.script.cannonRm.shootingBubble
    const color = bubble.script.bubbleRm.color
    const { x: shootingBubbleX, y: shootingBubbleY } = bubble.getPosition()
    const { x: collidedBubbleX, y: collidedBubbleY } = collided.getPosition()
    const targetY = collidedBubbleY > shootingBubbleY && collidedBubbleY - 1 || collidedBubbleY
    const targetX = collidedBubbleX < shootingBubbleX && collidedBubbleX + (collidedBubbleY !== targetY && .5 || 1) || collidedBubbleX - (collidedBubbleY !== targetY && .5 || 1)
    bubble.row = collidedBubbleY > targetY && collided.row + 1 || collided.row
    bubble.col = bubble.row === collided.row && (targetX < collidedBubbleX && collided.col - 1 || collided.col + 1) || collided.row % 2 && (targetX < collidedBubbleX && collided.col - 1 || collided.col) || (targetX < collidedBubbleX && collided.col || collided.col + 1)
    if (bubble.row > this.bubblesBinaryMat.length - 1) this.bubblesBinaryMat.push(Array(this.bubblesPerRow).fill(0))
    this.bubblesBinaryMat[bubble.row][bubble.col] = 1
    const sameColorCollided = this.bubblesGrid.children.find(_b => this.isTwoBubblesClose(_b, bubble) && color === _b.script.bubbleRm.color)
    bubble.reparent(this.bubblesGrid)
    bubble.setPosition(targetX, targetY, 0)
    if (sameColorCollided) this.destroyCluster(sameColorCollided)
}

BubbleGameRm.prototype.searchCluster = function (collided) {
    const shootingBubble = this.cannon.script.cannonRm.shootingBubble
    const color = collided.script.bubbleRm.color
    const sameColorBubbles = this.bubblesGrid.children.filter(_b => _b.script.bubbleRm.color === color && _b !== collided && _b !== shootingBubble)
    if (sameColorBubbles.length === 0) return null
    const sorted = sameColorBubbles.sort((b1, b2) => b2.row - b1.row)
    const nearest = sorted.find(_b => this.isTwoBubblesClose(_b, collided))
    if (!nearest) return 
    let cluster = [collided]
    let queue = [...sorted]
    while (queue.length > 0) {
        let hasChange = false
        const newQueue = []
        cluster = queue.reduce((cluster, _b) => {
            let isClose = false
            for (const visited of cluster) {
                if (this.isTwoBubblesClose(visited, _b)) {
                    cluster.push(_b);
                    isClose = true
                    hasChange = true
                    break
                }
            }
            if (!isClose) newQueue.push(_b)
            return cluster
        }, cluster)
        if (!hasChange) break
        queue = ArrayUtils.removeDuplicates(newQueue)
    }
    return [ shootingBubble, ...cluster ]
}

BubbleGameRm.prototype.dropBubbles = function (dt, drops) {
    if (this.elapsedTime >= 2) {
        this.elapsedTime = 0
        this.managerScript.setNewState(BUBBLE_STATES.waitOnUser)
        return 
    }
    this.elapsedTime += dt
    for (let _b of drops) 
        _b.setPosition(_b.getPosition().sub(new pc.Vec3(0, dt * (16 + this.elapsedTime * 2), 0)))
}

BubbleGameRm.prototype.destroyCluster = function (collided) {
    const cluster = this.searchCluster(collided)
    if (!ArrayUtils.isArray(cluster)) return
    const { lmIndex, rmIndex } = cluster.reduce((acc, _b) => {
        this.bubblesBinaryMat[_b.row][_b.col] = 0
        acc = {
            lmIndex: _b.col < acc.lmIndex ? _b.col : acc.lmIndex,
            rmIndex: _b.col > acc.rmIndex ? _b.col : acc.rmIndex
        }
        const explosionEffect = _b.script.bubbleRm.explosionEffect
        explosionEffect.sprite.play(Object.keys(explosionEffect.sprite.clips)[0])
        return acc
    }, { lmIndex: this.bubblesPerRow, rmIndex: 0 })

    const maxY = this.bubblesBinaryMat.findIndex(bubblesRow => bubblesRow.includes(0))
    if (maxY === this.rowsAmount - 1) return
    let dropBubbles = []
    let connects = []
    const leftMostIndex = lmIndex > 0 ? lmIndex - 1 : lmIndex 
    const rightMostIndex = rmIndex < this.bubblesPerRow - 1 && rmIndex + 1 || rmIndex 
    for (let i = maxY; i < this.rowsAmount; i++) {
        let queue = []
        for (let j = leftMostIndex; j <= rightMostIndex; j++) {
            const bubble = this.bubblesGrid.children.find(_b => _b.row === i && _b.col === j)
            if (i === maxY && this.bubblesBinaryMat[i][j] === 1) {
                connects.push(bubble)
                continue
            }
            if (this.bubblesBinaryMat[i][j] === 1) {
                const isNearConnects = connects.filter(_b => this.isTwoBubblesClose(_b, bubble))
                if (isNearConnects.length > 0) {
                    queue = queue.filter(dropBubble => !this.isTwoBubblesClose(dropBubble, bubble)) 
                    connects.push(bubble)
                    continue
                }
                queue.push(bubble)
                this.bubblesBinaryMat[i][j] = 0
            }
            if ((this.bubblesBinaryMat[i][j] === 0 || j === this.bubblesPerRow - 1) && queue.length > 0) {
                dropBubbles = [...dropBubbles, ...queue]
                queue = []            
            }
        }
    }
    if (this.elapsedTime) this.elapsedTime = 0
    this.bubbleDrops = dropBubbles
}

BubbleGameRm.prototype.update = function (dt) {
    if (this.managerScript.gameState === BUBBLE_STATES.start) {
        this.createBubbles()
        this.cannon.enabled = true
        this.managerScript.setNewState(BUBBLE_STATES.waitOnUser)
    }

    if (this.managerScript.gameState === BUBBLE_STATES.droppingBubbles) {
        this.dropBubbles(dt, this.bubbleDrops)
    }
}