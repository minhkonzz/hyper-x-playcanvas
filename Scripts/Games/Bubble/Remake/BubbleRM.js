///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var BubbleRm = pc.createScript('bubbleRm')

BubbleRm.attributes.add('gameInstance', { type: 'entity', title: 'Game instance' })
BubbleRm.attributes.add('color', { type: 'string', title: 'Color' })
BubbleRm.attributes.add('explosionEffect', { type: 'entity', title: 'Explosion effect' })

BubbleRm.prototype.initialize = function() {
   this.managerScript = this.gameInstance.script.bubbleGameRm.managerScript
   this.targetHitted = null
   this.entity.collision.on('collisionstart', this.onCollided, this)
   this.explosionEffect.sprite.on('end', this.onExplosionEffectEnded, this)
}

BubbleRm.prototype.onExplosionEffectEnded = function () {
   this.entity.destroy()
}

BubbleRm.prototype.onCollided = function (result) {
   if (result && this.managerScript.gameState === BUBBLE_STATES.shootingBubble) {
      this.targetHitted = result.other
   }
}

BubbleRm.prototype.update = function(dt) {}

