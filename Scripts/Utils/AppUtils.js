///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
const AppUtils = {
    refSolution: {
        width: 1080, 
        height: 1920
    },

    event: {
        tapStartEventType: pc.platform.desktop && pc.EVENT_MOUSEDOWN || pc.platform.touch && pc.EVENT_TOUCHSTART || 'Not support',
        tapMoveEventType: pc.platform.desktop && pc.EVENT_MOUSEMOVE || pc.platform.touch && pc.EVENT_TOUCHMOVE || 'Not support',
        tapEndEventType: pc.platform.desktop && pc.EVENT_MOUSEUP || pc.platform.touch && pc.EVENT_TOUCHEND || 'Not support'
    },

    moveEntityFixed: function ({ entity, targetPos, startTime, duration, timeoutId, callback, isLocal }) {
        if (!startTime || startTime < 0) startTime = Date.now()
        if (duration <= 0) duration = 1
        const elapsedTime = Date.now() - startTime
        const progress = Math.min(elapsedTime / duration, 1) 
        let newPos = new pc.Vec3() 
        if (isLocal) {
            newPos = newPos.lerp(entity.getLocalPosition(), targetPos, progress)
            entity.setLocalPosition(newPos)
        } else {
            newPos = newPos.lerp(entity.getPosition(), targetPos, duration)
            entity.setPosition(newPos.x, newPos.y, newPos.z)
        }
        if (progress === 1) {
            clearTimeout(timeoutId)
            if (callback) callback()
            return
        }
        timeoutId = setTimeout(() => this.moveEntityFixed({ entity, targetPos, startTime, duration, timeoutId, callback, isLocal }), 2)
    },  

    moveEntity: function({ entity, targetPos, elapsedTime, duration, callback, isLocal }) {
        const progress = Math.min(elapsedTime / duration, 1)
        if (progress === 1 && callback) {
            callback()
            return
        }
        let nextPos = new pc.Vec3()
        if (isLocal) {
            nextPos = nextPos.lerp(entity.getLocalPosition(), targetPos, progress)
            entity.setLocalPosition(nextPos)
        }
        else {
            nextPos = nextPos.lerp(entity.getPosition(), targetPos, progress)
            entity.setPosition(nextPos.x, nextPos.y, nextPos.z)
        }
    },

    clearChilds: (entity) => {
        entity._children = []
        return entity
    },

    destroyAllChilds: (entity) => {
        const allChilds = entity.children
        for (let i = allChilds.length - 1; i >= 0; i--) {
            const child = allChilds[i];
            if (child) child.destroy();
        }
    },

    isTwoEntityClose: function(entity, anotherEntity) {
        const distanceThreshold = 0.16
        const distance = entity.getPosition().distance(anotherEntity.getPosition())
        return distance <= distanceThreshold
    },

    getDistance: function(e1, e2, local = false) {
        return local && e1.getLocalPosition().distance(e2.getLocalPosition()) || e1.getPosition().distance(e2.getPosition())
    },

    isDragEndOnOther: function(current, target) {
        const offset = 0.1
        const { x: x1, y: y1 } = target.getPosition() 
        const { x: x2, y: y2 } = current.getPosition()
        const c1 = x1 - offset <= x2
        const c2 = x2 <= x1 + target.element._calculatedWidth * 2 / this.refSolution.width
        const c3 = ((y1 - target.element._calculatedHeight * 2 / this.refSolution.height)) <= y2
        const c4 = y2 <= y1 + offset
        return c1 && c2 && c3 && c4
    }
}