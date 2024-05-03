///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var BottomNavigation = pc.createScript('bottomNavigation')

BottomNavigation.attributes.add('bottomTabs', { type: 'entity', title: 'Bottom tabs', array: true })

BottomNavigation.prototype.initialize = function() {
    const tabWidth = this.entity.children[0].element._calculatedWidth
    const horizontalGap = this.entity.layoutgroup.spacing.x
    this.maxTranslateDist = tabWidth + horizontalGap
    this.prevTabIndex = -1 

    for (let i = 0; i < this.bottomTabs.length; i++) 
        this.bottomTabs[i].element.on(AppUtils.event.tapStartEventType, () => this.navigate(i), this)
}

BottomNavigation.prototype.navigate = function(tabIndex) {
    if (this.prevTabIndex === tabIndex) return
    this.bottomTabs[tabIndex].findByName('BgActive').enabled = true
    if (this.prevTabIndex !== -1) this.bottomTabs[this.prevTabIndex].findByName('BgActive').enabled = false
    this.prevTabIndex = tabIndex

    const { y, z } = this.entity.getLocalPosition()
    AppUtils.moveEntityFixed({
        entity: this.entity, 
        targetPos: new pc.Vec3(-tabIndex * this.maxTranslateDist, y, z),
        startTime: Date.now(), 
        duration: 350, 
        isLocal: true
    })
}

BottomNavigation.prototype.update = function(dt) {};