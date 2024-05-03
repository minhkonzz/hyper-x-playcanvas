///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
var Welcome = pc.createScript('welcome')

Welcome.attributes.add('preloader', { type: 'entity', title: 'Preloader' })
Welcome.attributes.add('loginScreen',  { type: 'entity', title: 'Login screen' })
Welcome.attributes.add('loadingScreen', { type: 'entity', title: 'Loading screen' })

Welcome.prototype.initialize = function() {
    const assets = Array.from(this.app.assets._assets)
    const self = this

    const showLoginScreen = function() {
        self.loginScreen.enabled = true
        self.loadingScreen.enabled = false
    }

    this.preloader.script.preloader.loadAssets(assets, showLoginScreen)
}