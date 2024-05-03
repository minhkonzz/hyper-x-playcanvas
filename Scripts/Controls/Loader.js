///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Loader = pc.createScript('loader')

Loader.attributes.add("activeBar", { type: 'entity', title: 'Active bar' })
Loader.attributes.add('progressText', { type: 'entity', title: 'Progress text' })

Loader.prototype.initialize = function() {
   this.elapsedTime = 0
   this.speed = 0
   this.progress = 0
   this.loading = true
}

Loader.prototype.setProgress = function (progress) {
   const localScale = this.activeBar.getLocalScale()
   localScale.x = pc.math.clamp(progress, 0, 1)
   this.activeBar.setLocalScale(localScale)
   this.progressText.element.text = `Loading... ${Math.floor(progress * 100)}%`
   if (localScale.x === 1) this.loading = false
}

Loader.prototype.update = function(dt) {
   this.elapsedTime += dt
   if (this.elapsedTime >= .02) this.speed += .008
   if (this.loading) this.setProgress(this.speed)
}