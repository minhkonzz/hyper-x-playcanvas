///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var NumberCell = pc.createScript('numberCell')

NumberCell.attributes.add('selectedBg', { type: 'entity', title: 'Selected background' })
NumberCell.attributes.add('starBg', { type: 'entity', title: 'Star background' })

NumberCell.prototype.initialize = function() {
    this.entity.element.on(pc.EVENT_MOUSEDOWN, this.onTapStart, this)

    if (this.app.touch) {
        this.entity.element.on(pc.EVENT_TOUCHSTART, this.onTapStart, this)
    }
}

NumberCell.prototype.onTapStart = function () {
    this.selectedBg.script.scale.start(true)
}

NumberCell.prototype.update = function(dt) {}
