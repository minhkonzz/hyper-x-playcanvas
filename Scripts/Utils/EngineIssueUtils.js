///<reference path="/home/konz/.vscode/extensions/playcanvas.playcanvas-0.1.5/node_modules/playcanvas/build/playcanvas.d.ts" />;
const EngineIssueUtils = {
    /**
     *  English: Sometimes getting a list of child elements via the children property causes the returned list to be incorrect. and i know this is a playcanvas issue. error can be fixed through the method below.
     *  Korean: 때때로 children 속성을 통해 자식 요소 목록을 가져오면 반환된 목록이 올바르지 않게 됩니다. 이것이 playcanvas 문제라는 것을 알고 있습니다. 아래의 방법으로 오류를 수정할 수 있습니다.
     */
    fixArrayIncorrect: (arr) => Array.from(arr),

    /**
     *  English: When we get all children of entity, sometime GraphNode will be automatically generated in the list by the engine at runtime.
     *  This is a playcanvas issue reported here: https://github.com/playcanvas/engine/issues/4333.
     *  We should filter through the list of children before processing and make sure all elements are pc.Entity.

     *  Korean: 엔터티의 모든 하위 항목을 가져오면 런타임 시 엔진에 의해 목록에 GraphNode가 자동으로 생성되는 경우가 있습니다.
     *  에 보고된 playcanvas 문제입니다: https://github.com/playcanvas/engine/issues/4333.
     *  처리하기 전에 하위 목록을 필터링하고 모든 요소가 pc.Entity인지 확인해야 합니다.
    */
    filterChildrenList: (arr) => arr.filter(e => e instanceof pc.Entity),

    /**
     * 
     * 
     */
    changeParent: function(entity, targetParent, localPos) {
        const targetParentChildren = targetParent.children
        if (targetParentChildren.some(e => e instanceof pc.GraphNode)) {
            targetParent._children = this.filterChildrenList(targetParentChildren)
        }

        entity.reparent(targetParent)
        entity.setLocalPosition(localPos)
    }
}