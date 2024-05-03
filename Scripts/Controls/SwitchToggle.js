///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var SwitchToggle = pc.createScript('switchToggle');

SwitchToggle.attributes.add('activeBackground', { type: 'entity', title: 'Active background' })
SwitchToggle.attributes.add('inactiveBackground', { type: 'entity', title: 'Inactive background' })
SwitchToggle.attributes.add('stateTitle', { type: 'entity', title: 'State title' })
SwitchToggle.attributes.add('switchSquare', { type: 'entity', title: 'Switch button' })

SwitchToggle.prototype.initialize = function() {
    this.active = false
    const element = this.entity.element
    const tapStartEventType = AppUtils.event.tapStartEventType
    element.on(tapStartEventType, this.onSwitch, this)

    this.on('destroy', function() {
        element.off(tapStartEventType, this.onSwitch, this)
    }, this)
};

SwitchToggle.prototype.onSwitch = function(e) {
    this.active = !this.active
    const { x: stateTitleX, y: stateTitleY, z: stateTitleZ } = this.stateTitle.getLocalPosition()
    const { x: switchButtonX, y: switchButtonY, z: switchButtonZ } = this.switchSquare.getLocalPosition()
    this.stateTitle.setLocalPosition(-stateTitleX, stateTitleY, stateTitleZ)
    this.switchSquare.setLocalPosition(-switchButtonX, switchButtonY, switchButtonZ)
    this.activeBackground.enabled = this.active
    this.inactiveBackground.enabled = !this.activeBackground.enabled
    this.stateTitle.element.text = this.active ? 'ON' : 'OFF'
}

SwitchToggle.prototype.update = function(dt) {};