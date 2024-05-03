///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var BingoGame = pc.createScript('bingoGame')

BingoGame.attributes.add('cells', { type: 'entity', title: 'Cells' })
BingoGame.attributes.add('numberCell', { type: 'entity', title: 'Number cell' });
BingoGame.attributes.add('pack', { type: 'entity', title: 'Pack', array: true })
BingoGame.attributes.add('randomZone', { type: 'entity', title: 'Random zone' })
BingoGame.attributes.add('randomStartZone', { type: 'entity', title: 'Random start zone' })

const BINGO_STATES = {
    ...STATES,
    newNumber: 100
}

BingoGame.prototype.initialize = function () {
    this.managerScript = this.entity.script.gameManager
    this.elapsedDeltaTime = 0
    this.rowIndex = 0
    this.colIndex = 0
    this.rowsAmount = 5
    this.colsAmount = 5
    this.gridGap = 7
    this.cellSz = 173
    this.initNumberDuration = this.numberCell?.script?.scale.duration
    this.initializingNumber = false
    this.currentRandomNumberBalls = []
    this.selectedNumbers = []

    this.letterRanges = [
        { letter: 'B', min: 1, max: 15 },
        { letter: 'I', min: 16, max: 30 },
        { letter: 'N', min: 31, max: 45 },
        { letter: 'G', min: 46, max: 60 },
        { letter: 'O', min: 61, max: 75 }
    ]
}

BingoGame.prototype.initNumberCell = function (dt) {
    if (this.rowIndex === this.rowsAmount) {
        this.pendingDone()
        return
    }
    if (this.elapsedDeltaTime !== 0) {
        if (this.elapsedDeltaTime >= this.initNumberDuration) {
            this.elapsedDeltaTime = 0
            this.initializingNumber = false
            if (this.colIndex === this.colsAmount - 1) {
                ++this.rowIndex
                this.colIndex = 0
                return
            }
            ++this.colIndex
            return
        }
        this.elapsedDeltaTime += dt
        return
    }
    if (!this.initializingNumber) {
        this.initializingNumber = true

        const numberCell = this.numberCell.clone()
        const numberText = numberCell.findByName('NumberText')
        if (!numberCell || !numberText) return

        const cellDist = this.cellSz + this.gridGap
        const { min, max } = this.letterRanges[this.colIndex]
        const value = this.rowIndex === 2 && this.colIndex === 2 ? -1 : MathUtils.randInRange(min, max) 
        numberText.element.text = value
        if (value === -1) numberCell.script.numberCell.starBg.setLocalScale(1, 1, 1)
        numberCell.value = value

        const cellPos = new pc.Vec3(this.colIndex === 0 && this.colIndex * this.cellSz || this.colIndex * cellDist, this.rowIndex === 0 && this.rowIndex * this.cellSz || -this.rowIndex * cellDist, 0)
        numberCell.setLocalPosition(cellPos)
        this.cells.addChild(numberCell)
        numberCell.script.scale.start(true)
    }
    this.elapsedDeltaTime += dt
}

BingoGame.prototype.initNumberBall = function() {
    const i = Math.floor(Math.random() * this.pack.length)
    this.newNumberBall = this.pack[i].clone() || null
    if (!this.newNumberBall) return
    const numberBallScript = this.newNumberBall.script.numberBall
    numberBallScript.init(26)
    numberBallScript.setIsCurrentBall(true)
    this.pendingCircleScript = numberBallScript.circleRadial.script.progressRadial
    this.pendingCircleScript.onCompleted(this.pendingDone.bind(this))
    this.randomZone.addChild(this.newNumberBall)
    this.newNumberBall.setLocalPosition(this.randomStartZone.getLocalPosition())
    this.currentRandomNumberBalls.push(this.newNumberBall)
}

BingoGame.prototype.rollNewNumber = function(dt) {
    const cnb = this.currentRandomNumberBalls
    const len = cnb.length
    if (this.elapsedDeltaTime >= .99) {
        this.elapsedDeltaTime = 0
        this.managerScript.setNewState(BINGO_STATES.waitOnUser)
        this.newNumberBall.script.numberBall.progressBoundary.element.mask = false
        this.pendingCircleScript.start()
        if (len === 5) cnb.shift()
        return
    }
    this.elapsedDeltaTime += dt
    for (let i = 0; i < len; i++) {
        cnb[i].script.numberBall.move(dt, i, len)
    }
}

BingoGame.prototype.pendingDone = function() {
    if (this.newNumberBall) {
        const newBallScript = this.newNumberBall.script.numberBall
        newBallScript.progressBoundary.element.mask = true
        newBallScript.setIsCurrentBall(false)
    }
    this.initNumberBall()
    if (!this.newNumberBall) return
    this.elapsedDeltaTime = 0
    this.managerScript.setNewState(BINGO_STATES.newNumber)
}


BingoGame.prototype.update = function (dt) {
    if (this.managerScript.gameState === BINGO_STATES.start) {
        this.initNumberCell(dt)
    }

    if (this.managerScript.gameState === BINGO_STATES.newNumber) {
        this.rollNewNumber(dt)
    }
}