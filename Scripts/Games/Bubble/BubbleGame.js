///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var BubbleGame = pc.createScript('bubbleGame')

BubbleGame.attributes.add('scoreText', { type: 'entity', title: 'Score text' })
BubbleGame.attributes.add('bubblesArea', { type: 'entity', title: 'Bubbles area' })
BubbleGame.attributes.add('bubblesManager', { type: 'entity', title: 'Bubbles manager', array: true })
BubbleGame.attributes.add('cannon', { type: 'entity', title: 'Cannon' })
BubbleGame.attributes.add('destroyBubbleSprites', { type: 'entity', title: 'Destroy bubbles' })
BubbleGame.attributes.add('mainCamera', { type: 'entity', title: 'Camera' })

const B_STATES = {
    start: 1,
    waiting: 2,
    shootingBubble: 3,
    droppingBubbles: 4,
    overtime: 5
}

const { width: refWidth, height: refHeight } = AppUtils.refSolution

BubbleGame.prototype.initialize = function () {
    this.rowsAmount = 8
    this.bubblesPerRow = 11
    this.currentColor = null
    this.elapsedTime = 0
    this.bubbleSz = 90
    this.halfBubbleSz = this.bubbleSz / 2
    this.bubbleWorldSz = this.bubbleSz * 2 / refWidth
    this.bubbleDrops = []
    this.userScore = 0
    this.gameState = STATES.start
    this.createBubbles()
    this.lastRowY = 0
    this.bubblesBinaryMat = Array.from({ length: this.rowsAmount }, () => Array(this.bubblesPerRow).fill(1))
}

BubbleGame.prototype.isTwoBubblesClose = function (b1, b2) {
    return AppUtils.getDistance(b1, b2) <= Math.sqrt(Math.pow(this.bubbleWorldSz / 2, 2) + Math.pow(this.bubbleWorldSz, 2))
}

BubbleGame.prototype.isTwoBubblesHit = function (current, target) {
    return this.isTwoBubblesClose(current, target) && current.getPosition().y <= target.getPosition().y
}

BubbleGame.prototype.initBubble = function (rowIndex, colIndex) {
    const i = Math.floor(Math.random() * (this.bubblesManager.length - 2))
    const bubble = this.bubblesManager[i].clone()
    bubble.rowIndex = rowIndex
    bubble.colIndex = colIndex
    if (!bubble) return
    const localPos = new pc.Vec3(rowIndex % 2 && colIndex * this.bubbleSz - this.halfBubbleSz || colIndex * this.bubbleSz, -rowIndex * this.bubbleSz, 0)
    bubble.setLocalPosition(localPos)
    this.bubblesArea.addChild(bubble)
}

BubbleGame.prototype.createBubbles = function () {
    let i = 0, j = 0
    while (i < this.rowsAmount) {
        this.initBubble(i, j)
        if (j === this.bubblesPerRow - 1) {
            j = 0
            i++
            continue
        }
        j++
    }
}

BubbleGame.prototype.isAttachGrid = function () {
    const bubble = this.cannon.script?.cannon?.readyBubble
    const { x: shootingBubbleX, y: shootingBubbleY } = bubble.getPosition()
    if (shootingBubbleY > this.lastRowY - this.bubbleWorldSz) {
        const collidedBubbles = this.bubblesArea.children.filter(_bubble => this.isTwoBubblesHit(bubble, _bubble))
        if (collidedBubbles.length > 0) {
            bubble.reparent(this.bubblesArea)
            let collided = collidedBubbles.find(collided => collided.script.bubble.color === this.currentColor) || collidedBubbles[0]
            const { x: collidedBubbleX, y: collidedBubbleY } = collided.getPosition()
            const targetY = collidedBubbleY > shootingBubbleY && collidedBubbleY - this.bubbleSz * 2 / refHeight || collidedBubbleY
            const targetX = collidedBubbleX < shootingBubbleX && collidedBubbleX + (collidedBubbleY !== shootingBubbleY && this.bubbleWorldSz / 2 || this.bubbleWorldSz) || collidedBubbleX - (collidedBubbleY !== shootingBubbleY && this.bubbleWorldSz / 2 || this.bubbleWorldSz)
            const row = collidedBubbleY > targetY && collided.rowIndex + 1 || collided.rowIndex
            const col = row === collided.rowIndex && (targetX < collidedBubbleX && collided.colIndex - 1 || collided.colIndex + 1) || collided.rowIndex % 2 && (targetX < collidedBubbleX && collided.colIndex - 1 || collided.colIndex) || (targetX < collidedBubbleX && collided.colIndex || collided.colIndex + 1)
            bubble.setPosition(targetX, targetY, 0)
            bubble.rowIndex = row
            bubble.colIndex = col
            if (collided.script.bubble.color !== this.currentColor) {
                const sameColorCollided = this.bubblesArea.children.find(_bubble => _bubble.rowIndex <= bubble.rowIndex + 1 && _bubble.rowIndex >= bubble.rowIndex - 1 && _bubble.script.bubble.color === this.currentColor && this.isTwoBubblesClose(_bubble, bubble))
                if (sameColorCollided) collided = sameColorCollided
            }
            if (collided.script.bubble.color === this.currentColor) this.destroyCluster(collided)
            return true
        }
    }
    return false
}

BubbleGame.prototype.searchCluster = function (bubble) {
    const sameColorBubbles = this.bubblesArea.children.filter(_bubble => _bubble.script.bubble.color === this.currentColor && _bubble !== bubble && _bubble !== this.cannon.script.cannon.readyBubble)
    if (sameColorBubbles.length === 0) return null
    const sorted = sameColorBubbles.sort((b1, b2) => AppUtils.getDistance(b1, bubble, true) - AppUtils.getDistance(b2, bubble, true))
    const { x: x1, y: y1 } = sorted[0].getLocalPosition()
    const { x: x2, y: y2 } = bubble.getLocalPosition()
    if (Math.abs(x1 - x2) > this.bubbleSz || Math.abs(y1 - y2) > this.bubbleSz) return null
    let queue = []
    let cluster = sorted.reduce((cluster, currentBubble) => {
        for (const visited of cluster) {
            if (!this.isTwoBubblesClose(visited, currentBubble)) {
                queue.push(currentBubble)
                continue
            }
            cluster.push(currentBubble)
            break
        }
        return cluster
    }, [bubble])

    if (queue === 0) return cluster
    queue = ArrayUtils.removeDuplicates(queue)
    cluster = queue.reduce((cluster, currentBubble) => {
        for (let visited of cluster) {
            if (!this.isTwoBubblesClose(visited, currentBubble)) continue
            cluster.push(currentBubble)
            break
        }
        return cluster
    }, cluster)
    return ArrayUtils.removeDuplicates(cluster)
}

BubbleGame.prototype.dropBubbles = function (dt, bubbles) {
    console.log('call drop bubbles:', bubbles)
    if (this.elapsedTime >= 4) {
        this.elapsedTime = 0
        this.gameState = STATES.waiting
        return 
    }
    this.elapsedTime += dt
    for (let _b of bubbles) {
        _b.setLocalPosition(_b.getLocalPosition().sub(new pc.Vec3(0, dt * (2000 + this.elapsedTime), 0)))
    }
}

BubbleGame.prototype.destroyCluster = function (collidedBubble) {
    const cluster = this.searchCluster(collidedBubble)
    if (!ArrayUtils.isArray(cluster)) return
    const { lmIndex, rmIndex } = cluster.reduce((acc, cur) => {
        cur.element.opacity = .2
        this.bubblesBinaryMat[cur.rowIndex][cur.colIndex] = 0
        return {
            lmIndex: cur.colIndex < acc.lmIndex ? cur.colIndex : acc.lmIndex,
            rmIndex: cur.colIndex > acc.rmIndex ? cur.colIndex : acc.rmIndex
        }
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
            const bubble = this.bubblesArea.children.find(bubble => bubble.rowIndex === i && bubble.colIndex === j)
            if (i === maxY && this.bubblesBinaryMat[i][j] === 1) {
                connects.push(bubble)
                continue
            }
            if (this.bubblesBinaryMat[i][j] === 1) {
                const limitDist = MathUtils.pythagorean(this.bubbleSz / 2, this.bubbleSz)
                const isNearConnects = connects.filter(_bubble => AppUtils.getDistance(_bubble, bubble, true) <= limitDist)
                if (isNearConnects.length > 0) {
                    queue = queue.filter(dropBubble => AppUtils.getDistance(dropBubble, bubble, true) > limitDist) 
                    connects.push(bubble)
                    continue
                }
                queue.push(bubble)
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

BubbleGame.prototype.addNewBubblesRow = function () { }

BubbleGame.prototype.update = function (dt) {
    if (this.gameState === STATES.shootingBubble) {
        if (this.isAttachGrid()) {
            this.gameState = this.bubbleDrops.length > 0 ? STATES.droppingBubbles : STATES.waiting
        }
    }
    if (this.gameState === STATES.droppingBubbles) {
        this.dropBubbles(dt, this.bubbleDrops)
    }
}