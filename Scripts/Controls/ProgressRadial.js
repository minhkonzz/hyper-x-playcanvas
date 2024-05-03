///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var ProgressRadial = pc.createScript('progressRadial')

ProgressRadial.prototype.initialize = function () {
    this.isProcess = false
    this._element = this.entity.element
    this._element.material = this._element.material.clone()
    this.progress = 0
}

ProgressRadial.prototype.start = function() {
    this.isProcess = true
}

ProgressRadial.prototype.onCompleted = function(_cb) {
    this.cb = _cb
}

ProgressRadial.prototype.setProgress = function (value) {
    value = pc.math.clamp(value, 0.0, 1)
    this.progress = value
    this._element.material.alphaTest = value + .001
}

ProgressRadial.prototype.update = function (dt) {
    if (!this.isProcess) return
    this.setProgress(this.progress + (dt * .3))
    if (this.progress >= 1) {
        this.progress = 0
        this.isProcess = false
        this.cb()
    }
}