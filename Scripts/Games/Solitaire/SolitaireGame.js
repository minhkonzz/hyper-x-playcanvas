///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
const { 
    fixArrayIncorrect, 
    filterChildrenList 
} = EngineIssueUtils

const SOLITAIRE_STATES = {
    ...STATES
}

var SolitaireGame = pc.createScript('solitaireGame')

SolitaireGame.attributes.add('cards', { type: 'entity', description: 'Store UI of all 52 cards', title: 'Cards', array: true })
SolitaireGame.attributes.add('columns', { type: 'entity', title: 'Columns', array: true })
SolitaireGame.attributes.add('foundation', { type: 'entity', title: 'Foundation', array: true })
SolitaireGame.attributes.add('rollTap', { type: 'entity',  title: 'Roll cards' })
SolitaireGame.attributes.add('reShuffleTap', { type: 'entity', title: 'Reshuffle cards' })
SolitaireGame.attributes.add('blankSuit', { type: 'entity', title: 'Blank suit' })
SolitaireGame.attributes.add('cardsDragging', { type: 'entity', title: 'Cards dragging container', description: 'English: This entity will contain the card entities being dragged, it should be placed at the last render position in the hierarchy, this ensures that the card entities being dragged will not be hidden by another entity, and it will be much easier to handle when dragging multiple card entities at the same time.\n    Korean: 이 엔터티는 드래그되는 카드 엔터티를 포함하며, 계층 구조의 마지막 렌더링 위치에 배치되어야 합니다. 이렇게 하면 드래그되는 카드 엔터티가 다른 엔터티에 의해 숨겨지지 않고 동시에 여러 카드 엔터티를 드래그할 때 훨씬 쉽게 처리할 수 있습니다.' })

SolitaireGame.prototype.initialize = function() {
    this.gameManagerScript = this.entity.script.gameManager
    this.cardsContainer = this.cards[0].parent
    this.foundationContainer = this.foundation[0].parent
    this.columnsContainer = this.columns[0].parent
    this.targetDragEnded = null 
    this.targetDragEndPos = null
    this.cardsOnColumns = null
    this.elapsedDeltaTime = 0
    this.placingCard = false
    this.moveCardsDuration = .1
    this.cardsDraggingList = null
    this.currentCardDraggingParent = null
    this.startDragPos = null

    this.base = Array.from({ length: this.columns.length }, (_, i) => Array(i + 1).fill(i)).reduce((acc, cur) => acc.concat(cur), [])
    const shuffledCards = this.shuffleCards(this.cards)
    this.cardsOnColumns = shuffledCards.splice(0, 28)
    this.preparedCards = shuffledCards

    this.initIndex = 0 
    this.initIndexCount = 0
    this.cardBeDistributed = this.cardsOnColumns[this.initIndex]

    const dragHelper = new pc.ElementDragHelper(this.cardsDragging.element, null)
    if (dragHelper) {
        dragHelper.on('drag:start', this.cardsOnDragStart, this) 
        dragHelper.on('drag:end', this.cardsOnDragEnd, this)
    }

    const tapStartEventType = AppUtils.event.tapStartEventType
    this.rollTap.element.on(tapStartEventType, this.rollRandomThreeCards, this)
    this.reShuffleTap.element.on(tapStartEventType, this.reShuffleCards, this)

    this.on('destroy', function() {
        this.rollTap.element.off(tapStartEventType, this.rollRandomThreeCards, this)
        this.reShuffleCards.element.off(tapStartEventType, this.reShuffleCards, this)
        if (dragHelper) {
            dragHelper.off('drag:start', this.cardsOnDragStart, this)
            dragHelper.off('darg:end', this.cardsOnDragEnd, this)
        }
    }, this)
}

SolitaireGame.prototype.shuffleCards = function(cards) {
    return cards.reduce((acc, cur, i) => {
        const randIndex = Math.floor(Math.random() * (i + 1))
        acc[i] = acc[randIndex]
        acc[randIndex] = cur
        return acc
    }, [])
}

SolitaireGame.prototype.distributeCards = function(dt) {
    this.elapsedDeltaTime += dt
    AppUtils.moveEntity({
        entity: this.cardBeDistributed, 
        targetPos: this.columns[this.base[this.initIndex]].getPosition(), 
        elapsedTime: this.elapsedDeltaTime, 
        duration: this.moveCardsDuration,
        callback: () => {
            EngineIssueUtils.changeParent(this.cardBeDistributed, this.columns[this.base[this.initIndex]], new pc.Vec3(0, -this.initIndexCount * 64, 0))
            if (this.base[this.initIndex + 1] !== this.base[this.initIndex]) {
                this.cardBeDistributed.script.card.setVisible(true)
                this.cardBeDistributed.script.card.setDraggable(true)
                if (this.initIndex === this.base.length - 1) {
                    this.gameManagerScript.setNewState(SOLITAIRE_STATES.waitOnUser)
                    return
                }
                this.initIndexCount = 0
            }
            else ++this.initIndexCount
            this.cardBeDistributed = this.cardsOnColumns[++this.initIndex]
            this.elapsedDeltaTime = 0
        }
    })
}

SolitaireGame.prototype.cardsOnDragStart = function() {
    this.startDragPos = this.cardsDragging.getPosition().clone()
    this.cardsDraggingList = filterChildrenList(this.cardsDragging.children)
}

SolitaireGame.prototype.cardsOnDragEnd = function() {
    this.placingCard = true
    const isDroppedOnFoundation = this.cardsDraggingList.length === 1 && AppUtils.isDragEndOnOther(this.cardsDragging, this.foundationContainer)
    const isDroppedOnColumns = !isDroppedOnFoundation && AppUtils.isDragEndOnOther(this.cardsDragging, this.columnsContainer)

    let temp
    const [ targetDragEnded, targetDragEndPos ] = 
        isDroppedOnFoundation && (temp = this.getFoundationDropped()) && [ temp, temp.getPosition() ] || 
        isDroppedOnColumns && (temp = this.getColumnDropped()) && [ temp, temp.getPosition().sub(new pc.Vec3(0, filterChildrenList(temp.children).length * 0.068, 0)) ] || 
        [ this.currentCardDraggingParent, this.startDragPos ]

    this.targetDragEnded = targetDragEnded
    this.targetDragEndPos = targetDragEndPos
}

SolitaireGame.prototype.placeCards = function(dt) {
    this.elapsedDeltaTime += dt
    AppUtils.moveEntity({
        entity: this.cardsDragging, 
        targetPos: this.targetDragEndPos, 
        elapsedTime: this.elapsedDeltaTime, 
        duration: this.moveCardsDuration, 
        callback: () => {
            const score = this.currentCardDraggingParent.tags.has('waste-pile') && this.targetDragEnded.tags.has('column') && 50 || 
            this.currentCardDraggingParent.tags.has('waste-pile') && this.targetDragEnded.tags.has('foundation') && 100 || 
            this.currentCardDraggingParent.tags.has('column') && this.targetDragEnded.tags.has('foundation') && 100 || 0
            if (score) this.gameManagerScript.setUserScore(this.gameManagerScript.userScore + score)
            this.elapsedDeltaTime = 0
            this.placingCard = false
            const targetDragEnded = this.targetDragEnded
            const foundationContainer = this.foundationContainer
            const columnsContainer = this.columnsContainer
            for (let i = 0; i < this.cardsDraggingList.length; i++) {
                const cardEntity = this.cardsDraggingList[i]
                if (score && i === this.cardsDraggingList.length - 1) cardEntity.script.card.showScore(score)
                const childrenListLength = filterChildrenList(targetDragEnded.children).length
                let targetDragEndLocalPos = this.currentCardDraggingParent === this.blankSuit && 
                (foundationContainer === targetDragEnded.parent ? new pc.Vec3(0, 0, 0) : columnsContainer === targetDragEnded.parent ? new pc.Vec3(0, -childrenListLength * 64, 0) : new pc.Vec3(childrenListLength * 56, 0, 0)) ||
                new pc.Vec3(0, (foundationContainer !== targetDragEnded.parent && -childrenListLength * 64) || 0, 0)
                EngineIssueUtils.changeParent(cardEntity, targetDragEnded, targetDragEndLocalPos)
            }
        }
    })
}

SolitaireGame.prototype.prepareCardsBack = function() {
    const cardsOnQueue = filterChildrenList(this.blankSuit.children)
    if (cardsOnQueue.length > 0) {
        for (let i = 0; i < cardsOnQueue.length; i++) {
            EngineIssueUtils.changeParent(cardsOnQueue[i], this.cardsContainer, new pc.Vec3(0, 0, 0))
        }
    }
}

SolitaireGame.prototype.reShuffleCards = function() {
    this.prepareCardsBack()
    this.preparedCards = this.shuffleCards(this.cardsContainer.children)
    this.reShuffleTap.enabled = false
    this.rollTap.enabled = true
}

SolitaireGame.prototype.rollRandomThreeCards = function() {
    this.prepareCardsBack()
    const cardsOnQueue = this.preparedCards.splice(0, 3)

    if (this.preparedCards.length === 0) {
        this.reShuffleTap.enabled = true
        this.rollTap.enabled = false
    }

    for (let i = 0; i < cardsOnQueue.length; i++) {
        EngineIssueUtils.changeParent(cardsOnQueue[i], this.blankSuit, new pc.Vec3(i * 56, 0, 0))
        cardsOnQueue[i].script.card.setVisible(true)
        if (i === cardsOnQueue.length - 1) cardsOnQueue[i].script.card.setDraggable(true)
    }
}

SolitaireGame.prototype.getFoundationDropped = function() {
    return this.getFoundationSlotOrColumnDropped(this.foundation, true)
}

SolitaireGame.prototype.getColumnDropped = function() {
    return this.getFoundationSlotOrColumnDropped(this.columns, false)
}

SolitaireGame.prototype.getFoundationSlotOrColumnDropped = function(foundationSlotsOrCols, isFoundationSlot) {
    for (let slotOrCol of foundationSlotsOrCols) {
        if (AppUtils.isTwoEntityClose(this.cardsDragging, slotOrCol)) {
            const currentCardDragging = this.cardsDragging.children[0]
            const { suit: currentSuit, rank: currentRank, isRed: currentColor } = currentCardDragging.script.card
            const slotOrColChildList = filterChildrenList(slotOrCol.children)

            if (slotOrColChildList.length === 0) {
                if (currentRank !== (isFoundationSlot ? 1 : 13)) return null
            } else {
                const lastCardInSlotOrCol = slotOrColChildList[slotOrColChildList.length - 1]
                const { suit: lastSuit, rank: lastRank, isRed: lastColor } = lastCardInSlotOrCol.script.card
                if ((isFoundationSlot && lastSuit !== currentSuit) || (!isFoundationSlot && currentColor === lastColor) || currentRank !== lastRank + (isFoundationSlot ? 1 : -1)) return null
            }

            const cardsDraggingParentChild = this.currentCardDraggingParent.children
            const prevCard = cardsDraggingParentChild[cardsDraggingParentChild.length - 1]
            if (prevCard) {
                const score = 50
                this.gameManagerScript.setUserScore(this.gameManagerScript.userScore + score)
                if (this.currentCardDraggingParent.tags.has('column') && slotOrCol.tags.has('foundation') || this.currentCardDraggingParent.tags.has('column') && slotOrCol.tags.has('column')) prevCard.script.card.showScore(score)
                prevCard.script.card.setVisible(true)
                prevCard.script.card.setDraggable(true)
            }
            return slotOrCol
        }
    }
}

SolitaireGame.prototype.update = function(dt) {
    if (this.gameManagerScript.gameState === SOLITAIRE_STATES.start) {
        this.distributeCards(dt)
    }

    if (this.gameManagerScript.gameState === SOLITAIRE_STATES.waitOnUser) {
        if (this.placingCard) this.placeCards(dt)
    }
}
