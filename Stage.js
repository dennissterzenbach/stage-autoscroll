function Stage(dragHandler) {
    this.dragHandler = dragHandler;
    this.element = null;
    this.offset = 0;
    this.numSlides = 0;
    this.config = {
        mode: Stage.MODE.ROUNDROBIN,
        autoscroll: {
            enabled: false
        },
        autostart: true
    };
}

Stage.REACTIONS = {
    TOLEFT: 'left',
    TORIGHT: 'right'
};

Stage.MODE = {
    ROUNDROBIN: 'roundrobin',
    DEFAULT: 'default'
}

Stage.prototype.setElement = function setElement(element) {
    this.element = element;
    this.numSlides = element.querySelectorAll('[data-stage-item]').length;

    if (element && element.attributes.hasOwnProperty('data-stage-autoscroll')) {
        console.debug('Stage.setElement enable autoscroll feature?', element.attributes['data-stage-autoscroll'].value);
        this.config.autoscroll.enabled = (element.attributes['data-stage-autoscroll'].value === 'true');
    }
}

Stage.initOn = function initOn(element) {
    var stageDragHandler = new StageSliderDragHandler();
    var stageInst;
    var lastReaction = '';
    var userInteracted = false;

    ///// SETUP HANDLERS FOR USER-SLIDE INTERACTION
    stageDragHandler.beginDragDetectionCallbackFn = function(event) {
        userInteracted = true;
    };

    stageDragHandler.endDragDetectionCallbackFn = function(event) {
        if (!userInteracted) {
            return;
        }

        // console.debug('StageSliderDragHandler. end reaction:', lastReaction);
        if (lastReaction === Stage.REACTIONS.TOLEFT) {
            showNext.call(stageInst);
        } else {
            showPrevious.call(stageInst);
        }

        lastReaction = '';
        userInteracted = false;
    };
    
    stageDragHandler.dragReactionHandlerFn = function(direction, event) {
        // console.debug('StageSliderDragHandler.reaction:', direction);
        lastReaction = direction;
    };

    ///// SETUP STAGE
    stageInst = new Stage(stageDragHandler);
    stageInst.setElement(element);

    addInteractionHandlerElement.call(stageInst);
    addPagers.call(stageInst);

    if (stageInst.config.autostart) {
        autostartSlides.call(stageInst);
    }

    console.debug('Stage.initOn', element);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // INTERNAL FUNCTIONS

    function autostartSlides() {
        console.debug('Stage.autostart');
        window.setTimeout(toggleSlidesVisibilityAndStyle.bind(null, this.element, -1, 0), 0);
    }

    function showPrevious() {
        var oldOffset = this.offset || 0;

        if (--this.offset < 0) {
            this.offset = this.config.mode === Stage.MODE.ROUNDROBIN ? this.numSlides - 1 : 0;
        }

        if (oldOffset !== this.offset) {
            toggleSlidesVisibilityAndStyle(this.element, oldOffset, this.offset);
        }
    }

    function showNext() {
        var oldOffset = this.offset || 0;

        if (++this.offset >= this.numSlides) {
            this.offset = this.config.mode === Stage.MODE.ROUNDROBIN ? 0 : this.numSlides - 1;
        }

        if (oldOffset !== this.offset) {
            toggleSlidesVisibilityAndStyle(this.element, oldOffset, this.offset);
        }
    }

    function toggleSlidesVisibilityAndStyle(element, oldOffset, newOffset) {
        if (oldOffset !== newOffset) {
            // console.debug(this.element, '[data-stage-item="' + oldOffset + '"]');
            if (oldOffset >= 0) {
                var slideElement = element.querySelector('[data-stage-item="' + oldOffset + '"]');
                var pagerElement = element.querySelector('.stage--item-pager[data-stage-item="' + oldOffset + '"]');

                if (slideElement) {
                    slideElement.classList.remove('stage--item__showing');
                }

                if (pagerElement) {
                    pagerElement.classList.remove('stage--item-pager__showing');
                }
            }

            if (newOffset >= 0) {
                var slideElement = element.querySelector('[data-stage-item="' + newOffset + '"]');
                var pagerElement = element.querySelector('.stage--item-pager[data-stage-item="' + newOffset + '"]');

                if (slideElement) {
                    slideElement.classList.add('stage--item__showing');
                }

                if (pagerElement) {
                    pagerElement.classList.add('stage--item-pager__showing');
                }
            }

            // window.pagerNew = pagerNew;
        }
    }

    function addInteractionHandlerElement() {
        var interactionHandlerElement = document.createElement('div');
        interactionHandlerElement.className = 'stage--interaction-handler';
        interactionHandlerElement.attributes['data-drag-handler'] = true;
        this.element.appendChild(interactionHandlerElement);

        this.dragHandler.registerEventHandling(interactionHandlerElement);
    }

    function addPagers() {
        var wrapperElement = document.createElement('div');
        wrapperElement.className = 'stage--item-pagers';

        for (var slNum = 0; slNum < stageInst.numSlides || 0; slNum++) {
            var pagerElement = document.createElement('div');
            var pagerElementInner = document.createElement('div');
            pagerElementInner.className = 'stage--item-pager-inner';
         
            pagerElement.className = 'stage--item-pager';
            pagerElement.setAttribute('data-stage-item', slNum);
            pagerElement.appendChild(pagerElementInner);
            wrapperElement.appendChild(pagerElement);

            pagerElementInner.addEventListener('transitionend', function onTranstionEnded(e) {
                if (e && e.target && e.target.parentElement && e.target.parentElement.classList.contains('stage--item-pager__showing')) {
                    // this is the element we are currently showing as current
                    // and so this transitionend notification now is valid for us
                    console.debug('TRANSITION ENDED', e.target.parentElement.attributes['data-stage-item']);

                    if (stageInst.config.autoscroll.enabled) {
                        showNext.call(stageInst);
                    }
                }
            });
        }
        
        this.element.appendChild(wrapperElement);
    }

    return stageInst;
}
