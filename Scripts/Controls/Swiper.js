///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Swiper = pc.createScript('swiper');

Swiper.attributes.add('bannersContainer', { type: 'entity', title: 'Banners container' })
Swiper.attributes.add('inactiveSliderDots', { type: 'entity', title: 'Inactive slider dots' })
Swiper.attributes.add('activeSliderDot', { type: 'entity', title: 'Active slider dot' })

Swiper.prototype.initialize = function() {
    const bannersCount = this.bannersContainer.children.length
    this.lastBannerIndex = bannersCount - 1
    this.bannerWidth = this.bannersContainer.children[0].element._calculatedWidth
    this.horizontalGap = this.bannersContainer.layoutgroup.spacing.x
    this.maxTranslateDist = this.bannerWidth + this.horizontalGap 
    this.currentBannerIndex = 0

    this.swipping = false
    this.startBannersContainer_X = 0

    const { tapStartEventType, tapMoveEventType, tapEndEventType } = AppUtils.event
    const element = this.entity.element
    element.on(tapStartEventType, this.onSwipeStart, this)
    element.on(tapMoveEventType, this.onSwipping, this)
    element.on(tapEndEventType, this.onSwipeEnd, this)

    this.on('destroy', function() {
        element.off(tapStartEventType, this.onSwipeStart, this)
        element.off(tapMoveEventType, this.onSwipping, this)
        element.off(tapEndEventType, this.onSwipeEnd, this)
    }, this)
}

Swiper.prototype.onSwipeStart = function() {
    this.swipping = true
    const { x } = this.bannersContainer.getLocalPosition()
    this.startBannersContainer_X = x
}

Swiper.prototype.onSwipping = function(event) {
    if (this.swipping) {
        const swipeSpeed = 1.5
        this.bannersContainer.setLocalPosition(this.bannersContainer.getLocalPosition().add(new pc.Vec3(event.dx * swipeSpeed, 0, 0)))
    }
}

Swiper.prototype.onSwipeEnd = function() {
    this.swipping = false
    const { lastBannerIndex, startBannersContainer_X, maxTranslateDist } = this
    const { x: bannersContainer_X, y: bannersContainer_Y, z: bannersContainer_Z } = this.bannersContainer.getLocalPosition()

    this.currentBannerIndex = 
    bannersContainer_X < -lastBannerIndex * maxTranslateDist ? lastBannerIndex :
    bannersContainer_X > 0 ? 0 : 
    this.currentBannerIndex + (
        startBannersContainer_X - bannersContainer_X > maxTranslateDist / 2 ? 1 : 
        bannersContainer_X - startBannersContainer_X > maxTranslateDist / 2 ? -1 : 0 
    )

    AppUtils.moveEntityFixed({
        entity: this.bannersContainer, 
        targetPos: new pc.Vec3(-this.currentBannerIndex * this.maxTranslateDist, bannersContainer_Y, bannersContainer_Z),
        startTime: Date.now(), 
        duration: 500, 
        isLocal: true
    })

    // Maybe swiper have dots or not
    if (this.inactiveSliderDots && this.activeSliderDot) {
        const { w, gap } = { w: this.inactiveSliderDots.children[0].element._calculatedWidth, gap: this.inactiveSliderDots.layoutgroup.spacing.x }
        const { y: activeDot_Y, z: activeDot_Z } = this.activeSliderDot.getLocalPosition()
        AppUtils.moveEntityFixed({
            entity: this.activeSliderDot, 
            targetPos: new pc.Vec3(this.currentBannerIndex * (w + gap), activeDot_Y, activeDot_Z),
            startTime: Date.now(), 
            duration: 500, 
            isLocal: true
        })
    }
}
    
Swiper.prototype.update = function(dt) {};
