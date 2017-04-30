/**
 * This implements drag handling for the Slider.
 * It encapsulates everything which is needed to handle detection of dragging
 * direction and state, based on the Events the user interaction created.
 *
 * @author  Dennis Sterzenbach <dennis.sterzenbach@gmail.com>
 */
function StageSliderDragHandler() {
    this.lastMousePositionX = 0;
    this.minimalPixelDistanceToTriggerImageCycling = 15;

    this.isDragging = false;
    this.isMouseDown = false;

    this.beginDragDetectionCallbackFn = undefined;
    this.endDragDetectionCallbackFn = undefined;
    this.dragReactionHandlerFn = undefined;

    this.elementWithEventHandlersAttached = undefined;

    this.passiveEventListenerFeatureDetected = false;
    this.supportsPassiveEventListeners = false;
}

/**
 * This sets flags which tell the internal handling, that the user initiated
 * to drag on the slider. After setting everything up, the registered callback
 * function will be called in order to further process the event (like with
 * preloading).
 *
 * @param  {Event}          event the Event object received from the Client
 */
StageSliderDragHandler.prototype.beginDragDetection = function beginDragDetection(event) {
    this.isDragging = false;
    this.isMouseDown = true;

    // always take the offset, otherwise the user might see the slider rotate
    // to the right although he moved to the right
    this.lastMousePositionX = this.getEventOffsetX(event);

    if (this.beginDragDetectionCallbackFn) {
        this.beginDragDetectionCallbackFn(event);
    }
};

/**
 * This sets flags which tell the internal handling, that the user stopped to
 * drag on the slider or that any new Events should not cause a reaction.
 *
 * @param  {Event}          event the Event object received from the Client
 */
StageSliderDragHandler.prototype.endDragDetection = function endDragDetection(event) {
    this.isMouseDown = false;
    this.isDragging = false;

    if (this.endDragDetectionCallbackFn) {
        this.endDragDetectionCallbackFn(event);
    }
};


/**
 * Detects if the given x offset tells us the user dragged to the right
 *
 * @param  {number}         offsetX the x offset to compare to the stored values
 * @return {Boolean}        true if yes
 */
StageSliderDragHandler.prototype.userDragsToRight = function userDragsToRight(offsetX) {
    return (this.lastMousePositionX + this.minimalPixelDistanceToTriggerImageCycling < offsetX);
};

/**
 * Detects if the given x offset tells us the user dragged to the left
 *
 * @param  {number}         offsetX the x offset to compare to the stored values
 * @return {Boolean}        true if yes
 */
StageSliderDragHandler.prototype.userDragsToLeft = function userDragsToLeft(offsetX) {
    return (this.lastMousePositionX - this.minimalPixelDistanceToTriggerImageCycling > offsetX);
};

/**
 * Detect in which direction the user is dragging. To be sure he is dragging
 * this function first checks if the context is okay. If everything is fine,
 * then the current position mentioned by the given Event will be compared if
 * the user made reasonable movement.
 * After checking the registered drag reaction handler function will be called
 * with: 'right' or 'left'.
 *
 * @param  {Event}          event the Event object received from the Client
 */
StageSliderDragHandler.prototype.detectDragMovementDirection = function detectDragMovementDirection(event) {
    var dragReaction = '';
    var newOffsetX = 0;

    // make sure we detect only when the user did drag
    if (!userDidDrag.call(this, event)) {
        return '';
    }

    newOffsetX = this.getEventOffsetX(event);

    if (isMovementInsideBounds(this.elementWithEventHandlersAttached, newOffsetX)) { // user is dragging inside of the container
        // when we receive the event for the first time, we need to simply set
        // the lastMousePositionX to the current offset, so we are able to
        // correctly determine the direction based on that first position.
        if (this.lastMousePositionX <= 0) {
            this.lastMousePositionX = newOffsetX;

        } else
        if (this.userDragsToRight(newOffsetX)) {
            this.lastMousePositionX = newOffsetX;
            dragReaction = 'right';

        } else
        if (this.userDragsToLeft(newOffsetX)) {
            this.lastMousePositionX = newOffsetX;
            dragReaction = 'left';
        }
    }

    if (dragReaction !== '' && this.dragReactionHandlerFn) {
        this.dragReactionHandlerFn(dragReaction, event);
    }
    /**
     * This detects if - in order to the current context and flags - the given Event
     * tells us the user is dragging on the slider or not.
     *
     * @param  {Event}          event the Event object received from the Client
     * @return {Boolean}        true if the user seems to be dragging
     */
    function userDidDrag(event) {
        this.isDragging = true;

        if (this.isMouseDown) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Checks if the user is moving inside the bounds of the given HTML element
     * or not. This is necessary, because the user could drag outside the element
     * but he started his movement inside. This must be handled.
     *
     * @param  {JQueryElement}  sliderElement a jQuery element object for the slider
     * @param  {number}         offsetX the x offset to compare to the stored values
     * @return {Boolean}              true if the user is dragging inside the bounds
     */
    function isMovementInsideBounds(sliderElement, offsetX) {
        // make sure we have a sliderElement
        if (!sliderElement) {
            console.error('StageSliderDragHandler.prototype.isMovementInsideBounds: sliderElement is invalid!', sliderElement);
            return false;
        }

        if (offsetX < sliderElement.offsetLeft) {
            return false;
        }

        if (offsetX > sliderElement.offsetLeft + sliderElement.offsetWidth) {
            return false;
        }

        // return 0;
        return true;
    }
};

/**
 * returns the X offset for the current event.
 * This is depending on the client, Firefox always returns clientX/pageX
 * while Chrome names offsetX instead.
 *
 * @param  {Event} event the event to read value from
 * @return {number} the value received from the Client
 */
StageSliderDragHandler.prototype.getEventOffsetX = function getEventOffsetX(event) {
    var pageX;

    if (event.type && event.type.indexOf('touch') > -1) {
        if (event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length && event.originalEvent.touches[0] && event.originalEvent.touches[0].pageX) {
            pageX = event.originalEvent.touches[0].pageX;
        }
    }

    if (!pageX) {
        pageX = event.pageX;
    }

    return pageX;
};


/**
 * attach the required Event Handlers to the given element, so we can
 * start to handle them
 *
 * @param  {JQueryElement} element a jQuery element object
 */
StageSliderDragHandler.prototype.registerEventHandling = function registerEventHandling(element) {
    // element = element.find('[data-drag-handler]');
    if (!this.passiveEventListenerFeatureDetected) {
        this.supportsPassiveEventListeners = false;

        try {
            var options = Object.defineProperty(
                            {},
                            'passive',
                            {
                                get: function() {
                                    this.supportsPassiveEventListeners = true;
                                }
                            }
                        );

            window.addEventListener('test', null, options);

            window.removeEventListener('test', null, options);
        } catch (e) {
        }

        this.passiveEventListenerFeatureDetected = true;
    }

    element.addEventListener('mousedown', this.beginDragDetection.bind(this));
    element.addEventListener('touchstart', this.beginDragDetection.bind(this), this.supportsPassiveEventListeners ? {passive: true} : false);
    element.addEventListener('mousemove', this.detectDragMovementDirection.bind(this));
    element.addEventListener('touchmove', this.detectDragMovementDirection.bind(this), this.supportsPassiveEventListeners ? {passive: true} : false);
    element.addEventListener('mouseleave', this.endDragDetection.bind(this));
    element.addEventListener('touchend', this.endDragDetection.bind(this));
    element.addEventListener('touchcancel', this.endDragDetection.bind(this));
    element.addEventListener('mouseup', this.endDragDetection.bind(this));

    this.elementWithEventHandlersAttached = element;
};

/**
 * stop handling any of the Events we previously attached an Event Handler for
 *
 * @param  {JQueryElement} element a jQuery element object
 */
StageSliderDragHandler.prototype.unregisterEventHandling = function unregisterEventHandling(element) {
    element = element || this.elementWithEventHandlersAttached;
    // element = element.find('[data-drag-handler]');

    // element.off();
    element.removeEventListener('mousedown', this.beginDragDetection.bind(this));
    element.removeEventListener('touchstart', this.beginDragDetection.bind(this));
    element.removeEventListener('mousemove', this.detectDragMovementDirection.bind(this));
    element.removeEventListener('touchmove', this.detectDragMovementDirection.bind(this));
    element.removeEventListener('mouseleave', this.endDragDetection.bind(this));
    element.removeEventListener('touchend', this.endDragDetection.bind(this));
    element.removeEventListener('touchcancel', this.endDragDetection.bind(this));
    element.removeEventListener('mouseup', this.endDragDetection.bind(this));
};
