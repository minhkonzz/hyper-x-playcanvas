///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Preloader = pc.createScript('preloader')

Preloader.attributes.add("loadingBar", { type: 'entity', title: 'Loading Bar' })
Preloader.attributes.add('progressText', { type: 'entity', 'title': 'Progress text' })

Preloader.prototype.loadAssets = function(assets, onAssetsLoaded) {
    const self = this
    const assetsAmount = assets.length
    if (!assetsAmount) onAssetsLoaded()
    this.assets = [...assets]
    this.totalAssets = assetsAmount
    this.assetsLoadedAmount = 0
    this.assetIndex = 0
    this.loadingAssets = true
    this.onAssetReady = function() {
        ++self.assetIndex
        self.assetsLoadedAmount += 1
        self.setLoadingBarProgress(self.assetsLoadedAmount / self.totalAssets)
        if (self.assetsLoadedAmount === self.totalAssets) {
            self.loadingAssets = false 
            onAssetsLoaded()
        }
    }
}

Preloader.prototype.setLoadingBarProgress = function(progress) {
    this.progressText.element.text = `Loading... ${Math.floor(progress * 100)}%`
    const localScale = this.loadingBar.getLocalScale()
    localScale.x = pc.math.clamp(progress, 0, 1)
    this.loadingBar.setLocalScale(localScale)
}

Preloader.prototype.update = function(dt) {
    if (this.loadingAssets) {
        const asset = this.assets[this.assetIndex]
        asset.ready(this.onAssetReady)
        this.app.assets.load(asset)
    }
}
