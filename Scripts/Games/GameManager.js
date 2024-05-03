///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var GameManager = pc.createScript('gameManager')

GameManager.attributes.add('loader', { type: 'entity', title: 'Loader' })
GameManager.attributes.add('countDown', { type: 'entity', title: 'Loading count down' })
GameManager.attributes.add('countDownNumber', { type: 'entity', title: 'Number count down' })
GameManager.attributes.add('mainGamePlay', { type: 'entity', title: 'Main gameplay' })
GameManager.attributes.add('timeText', { type: 'entity', title: 'Time text' })
GameManager.attributes.add('scoreText', { type: 'entity', title: 'Score text' })
GameManager.attributes.add('min', { type: 'number', title: 'Countdown minutes' })
GameManager.attributes.add('sec', { type: 'number', title: 'Countdown seconds' })

const STATES = {
    startCountdown: 1,
    start: 2, 
    waitOnUser: 3, 
    overtime: 4
}

GameManager.prototype.initialize = function() {
    this.loadingCountDown = 3
    this.elapsedTime = 0
    this.gameState = STATES.startCountdown
    this.userScore = this.setUserScore(0)
}

GameManager.prototype.setNewState = function (newState) {
    this.gameState = newState
}

GameManager.prototype.setTime = function () {
    if (this.elapsedTime < 1) return 
    this.elapsedTime = 0
    if (this.min === 0 && this.sec === 0) {
        this.gameState = STATES.overtime
        return
    }
    if (this.sec === 0 && this.min > 0) {
        this.sec = 59
        this.min -= 1
    }
    else this.sec -= 1
    this.timeText.element.text = `${this.min < 10 && '0' + this.min || this.min}:${this.sec < 10 && '0' + this.sec || this.sec}`
}

GameManager.prototype.countDownToStart = function (i) {
    if (this.loadingCountDown === 0) {
        this.elapsedTime = 0
        this.mainGamePlay.enabled = true
        this.gameState = STATES.start
        return
    }
    if (i === this.loadingCountDown) return
    this.loadingCountDown = i
    this.countDownNumber.element.text = this.loadingCountDown
    const scaleScript = this.countDownNumber.script.scale
    scaleScript.start(true)
    if (this.elapsedTime <= .5) return
    scaleScript.start(false) 
}

GameManager.prototype.setUserScore = function(score) {
    this.userScore = typeof score === 'number' && score > 0 ? score : 0 // avoid negative value
    this.scoreText.element.text = this.userScore
} 

GameManager.prototype.update = function(dt) {
    if (this.loader.script.loader.loading) return
    this.elapsedTime += dt
    if (this.gameState === STATES.startCountdown) {
        if (!this.countDown.enabled) {
            this.countDown.enabled = true
            this.loader.enabled = false
        }
        let newCountDown = this.loadingCountDown
        if (this.elapsedTime >= 1) {
            this.elapsedTime = 0
            --newCountDown
        }
        this.countDownToStart(newCountDown)
        return
    }
    this.setTime()
}